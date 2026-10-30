use std::collections::HashMap;
use std::io::ErrorKind;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use anyhow::{bail, Context, Result};
use blake3::Hasher;
use chrono::{DateTime, Utc};
// use helper_db_core::{StorageConfig, StorageEngine};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tempfile::TempDir;
use tokio::fs;
use tokio::sync::Mutex;
use uuid::Uuid;

const FILES_DIR: &str = "files";
const EMBEDDINGS_FILE: &str = "embeddings.json";

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FileRecord {
    pub path: String,
    pub content: String,
    pub checksum: String,
    pub size: usize,
    pub updated_at: DateTime<Utc>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FileSummary {
    pub path: String,
    pub name: String,
    pub checksum: String,
    pub size: usize,
    pub updated_at: DateTime<Utc>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct EmbeddingRecord {
    pub id: Uuid,
    pub vector: Vec<f32>,
    pub metadata: Value,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct EmbeddingSearchResult {
    pub id: Uuid,
    pub score: f32,
    pub metadata: Value,
}

#[derive(Clone)]
pub struct StorageAdapter {
    data_dir: Arc<PathBuf>,
    _cleanup: Option<Arc<TempDir>>,
    files: Arc<Mutex<HashMap<String, FileRecord>>>,
    embeddings: Arc<Mutex<HashMap<Uuid, EmbeddingRecord>>>,
    list_lock: Arc<Mutex<()>>, // prevent concurrent export storms
}

impl StorageAdapter {
    pub async fn new<P: AsRef<Path>>(path: P) -> Result<Self> {
        let dir = path.as_ref().to_path_buf();
        Self::initialize(dir, None).await
    }

    pub async fn new_ephemeral() -> Result<Self> {
        let temp = tempfile::tempdir()?;
        let cleanup = Arc::new(temp);
        let path = cleanup.path().to_path_buf();
        Self::initialize(path, Some(cleanup)).await
    }

    async fn initialize(dir: PathBuf, cleanup: Option<Arc<TempDir>>) -> Result<Self> {
        let files_root = dir.join(FILES_DIR);
        fs::create_dir_all(&files_root).await.with_context(|| {
            format!(
                "failed to create storage directory at {}",
                files_root.display()
            )
        })?;
        let files = load_existing_files(&files_root).await?;
        let embeddings = load_existing_embeddings(&dir).await?;
        Ok(Self {
            data_dir: Arc::new(dir),
            _cleanup: cleanup,
            files: Arc::new(Mutex::new(files)),
            embeddings: Arc::new(Mutex::new(embeddings)),
            list_lock: Arc::new(Mutex::new(())),
        })
    }

    fn files_root(&self) -> PathBuf {
        self.data_dir.join(FILES_DIR)
    }

    fn embeddings_path(&self) -> PathBuf {
        self.data_dir.join(EMBEDDINGS_FILE)
    }

    pub async fn list_files(&self, prefix: Option<&str>) -> Result<Vec<FileSummary>> {
        let _guard = self.list_lock.lock().await;
        let files = self.files.lock().await;
        let mut summaries = Vec::new();
        for record in files.values() {
            if let Some(prefix) = prefix {
                if !record.path.starts_with(prefix) {
                    continue;
                }
            }
            summaries.push(FileSummary {
                path: record.path.clone(),
                name: Path::new(&record.path)
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string(),
                checksum: record.checksum.clone(),
                size: record.size,
                updated_at: record.updated_at,
            });
        }
        Ok(summaries)
    }

    pub async fn get_file(&self, path: &str) -> Result<Option<FileRecord>> {
        let files = self.files.lock().await;
        Ok(files.get(path).cloned())
    }

    pub async fn upsert_file(&self, path: &str, content: &str) -> Result<FileRecord> {
        let checksum = checksum(content);
        let size = content.len();
        let updated_at = Utc::now();
        let record = FileRecord {
            path: path.to_owned(),
            content: content.to_owned(),
            checksum,
            size,
            updated_at,
        };
        let mut files = self.files.lock().await;
        files.insert(path.to_owned(), record.clone());
        drop(files);
        self.persist_file(&record).await?;
        Ok(record)
    }

    pub async fn delete_file(&self, path: &str) -> Result<bool> {
        let removed = {
            let mut files = self.files.lock().await;
            files.remove(path)
        };
        if removed.is_some() {
            self.remove_file_from_disk(path).await?;
            Ok(true)
        } else {
            Ok(false)
        }
    }

    pub async fn rename_file(&self, from: &str, to: &str) -> Result<Option<FileRecord>> {
        let record = {
            let files = self.files.lock().await;
            files.get(from).cloned()
        };
        let Some(record) = record else {
            return Ok(None);
        };

        let mut renamed_record = record.clone();
        renamed_record.path = to.to_owned();
        renamed_record.updated_at = Utc::now();

        self.rename_file_on_disk(from, &renamed_record).await?;

        {
            let mut files = self.files.lock().await;
            files.remove(from);
            files.insert(to.to_owned(), renamed_record.clone());
        }
        Ok(Some(renamed_record))
    }

    pub async fn upsert_embedding(
        &self,
        vector: Vec<f32>,
        metadata: Value,
    ) -> Result<EmbeddingRecord> {
        ensure_finite(&vector)?;
        let record = EmbeddingRecord {
            id: Uuid::new_v4(),
            vector,
            metadata,
        };
        let mut embeddings = self.embeddings.lock().await;
        embeddings.insert(record.id, record.clone());
        let snapshot: Vec<EmbeddingRecord> = embeddings.values().cloned().collect();
        drop(embeddings);
        self.persist_embeddings(snapshot).await?;
        Ok(record)
    }

    pub async fn search_embeddings(
        &self,
        vector: &[f32],
        top_k: usize,
    ) -> Result<Vec<EmbeddingSearchResult>> {
        ensure_finite(vector)?;
        let embeddings = self.embeddings.lock().await;
        let mut results: Vec<(Uuid, f32)> = embeddings
            .iter()
            .filter_map(|(id, emb)| {
                cosine_similarity(&emb.vector, vector).map(|score| (*id, score))
            })
            .collect();
        results.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
        let limited = results.into_iter().take(top_k).collect::<Vec<_>>();
        let search_results = limited
            .into_iter()
            .map(|(id, score)| {
                let emb = embeddings.get(&id).unwrap();
                EmbeddingSearchResult {
                    id,
                    score,
                    metadata: emb.metadata.clone(),
                }
            })
            .collect();
        Ok(search_results)
    }

    async fn persist_file(&self, record: &FileRecord) -> Result<()> {
        let full_path = self.files_root().join(&record.path);
        if let Some(parent) = full_path.parent() {
            fs::create_dir_all(parent).await.with_context(|| {
                format!(
                    "failed to create parent directory for {}",
                    full_path.display()
                )
            })?;
        }
        fs::write(&full_path, record.content.as_bytes())
            .await
            .with_context(|| format!("failed to write file {}", full_path.display()))?;
        Ok(())
    }

    async fn remove_file_from_disk(&self, path: &str) -> Result<()> {
        let full_path = self.files_root().join(path);
        match fs::remove_file(&full_path).await {
            Ok(_) => Ok(()),
            Err(err) if err.kind() == ErrorKind::NotFound => Ok(()),
            Err(err) => {
                Err(err).with_context(|| format!("failed to remove file {}", full_path.display()))
            }
        }
    }

    async fn rename_file_on_disk(&self, from: &str, record: &FileRecord) -> Result<()> {
        let current_path = self.files_root().join(from);
        let target_path = self.files_root().join(&record.path);
        if let Some(parent) = target_path.parent() {
            fs::create_dir_all(parent).await.with_context(|| {
                format!(
                    "failed to create parent directory for {}",
                    target_path.display()
                )
            })?;
        }
        match fs::rename(&current_path, &target_path).await {
            Ok(_) => Ok(()),
            Err(err) if err.kind() == ErrorKind::NotFound => {
                // Fallback: write the content to the new location if the old path is missing
                fs::write(&target_path, record.content.as_bytes())
                    .await
                    .with_context(|| format!("failed to write file {}", target_path.display()))?;
                let _ = fs::remove_file(&current_path).await;
                Ok(())
            }
            Err(err) => Err(err).with_context(|| {
                format!(
                    "failed to rename file {} to {}",
                    current_path.display(),
                    target_path.display()
                )
            }),
        }
    }

    async fn persist_embeddings(&self, embeddings: Vec<EmbeddingRecord>) -> Result<()> {
        let path = self.embeddings_path();
        let payload = serde_json::to_vec_pretty(&embeddings)?;
        fs::write(&path, payload)
            .await
            .with_context(|| format!("failed to write embeddings snapshot {}", path.display()))?;
        Ok(())
    }

    pub fn data_dir(&self) -> Arc<PathBuf> {
        self.data_dir.clone()
    }
}

async fn load_existing_files(root: &Path) -> Result<HashMap<String, FileRecord>> {
    let mut records = HashMap::new();
    if !fs::try_exists(root).await? {
        return Ok(records);
    }

    let mut stack = vec![root.to_path_buf()];
    while let Some(dir) = stack.pop() {
        let mut entries = fs::read_dir(&dir).await?;
        while let Some(entry) = entries.next_entry().await? {
            let path = entry.path();
            let metadata = entry.metadata().await?;
            if metadata.is_dir() {
                stack.push(path);
                continue;
            }
            if !metadata.is_file() {
                continue;
            }
            let relative = path
                .strip_prefix(root)
                .with_context(|| format!("failed to strip prefix from {}", path.display()))?;
            let relative_path = relative.to_string_lossy().replace('\\', "/");
            let content = fs::read_to_string(&path).await?;
            let updated_at = metadata
                .modified()
                .map(DateTime::<Utc>::from)
                .unwrap_or_else(|_| Utc::now());
            let record = FileRecord {
                path: relative_path.clone(),
                checksum: checksum(&content),
                size: content.len(),
                content,
                updated_at,
            };
            records.insert(relative_path, record);
        }
    }

    Ok(records)
}

async fn load_existing_embeddings(dir: &Path) -> Result<HashMap<Uuid, EmbeddingRecord>> {
    let path = dir.join(EMBEDDINGS_FILE);
    if !fs::try_exists(&path).await? {
        return Ok(HashMap::new());
    }
    let bytes = fs::read(&path).await?;
    if bytes.is_empty() {
        return Ok(HashMap::new());
    }
    let records: Vec<EmbeddingRecord> = serde_json::from_slice(&bytes)
        .with_context(|| format!("failed to parse embeddings snapshot {}", path.display()))?;
    Ok(records
        .into_iter()
        .map(|record| (record.id, record))
        .collect())
}

fn checksum(content: &str) -> String {
    let mut hasher = Hasher::new();
    hasher.update(content.as_bytes());
    hasher.finalize().to_hex().to_string()
}

fn ensure_finite(values: &[f32]) -> Result<()> {
    for value in values {
        if !value.is_finite() {
            bail!("vector contains non-finite value");
        }
    }
    Ok(())
}

fn cosine_similarity(a: &[f32], b: &[f32]) -> Option<f32> {
    if a.is_empty() || b.is_empty() || a.len() != b.len() {
        return None;
    }
    let dot: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
    let norm_a = (a.iter().map(|v| v * v).sum::<f32>()).sqrt();
    let norm_b = (b.iter().map(|v| v * v).sum::<f32>()).sqrt();
    if norm_a == 0.0 || norm_b == 0.0 {
        return None;
    }
    Some(dot / (norm_a * norm_b))
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::fs;

    #[tokio::test]
    async fn file_roundtrip() -> Result<()> {
        let adapter = StorageAdapter::new_ephemeral().await?;
        let path = "cave/file.rs";
        let content = "fn main() {}";
        let record = adapter.upsert_file(path, content).await?;
        assert_eq!(record.path, path);
        assert_eq!(record.content, content);

        let fetched = adapter.get_file(path).await?.expect("stored file");
        assert_eq!(fetched.checksum, record.checksum);

        let listed = adapter.list_files(Some("cave/")).await?;
        assert_eq!(listed.len(), 1);

        adapter.rename_file(path, "cave/lib.rs").await?;
        assert!(adapter.get_file(path).await?.is_none());
        assert!(adapter.get_file("cave/lib.rs").await?.is_some());

        assert!(adapter.delete_file("cave/lib.rs").await?);
        assert!(adapter.get_file("cave/lib.rs").await?.is_none());
        Ok(())
    }

    #[tokio::test]
    async fn embedding_similarity() -> Result<()> {
        let adapter = StorageAdapter::new_ephemeral().await?;
        adapter
            .upsert_embedding(vec![1.0, 0.0], Value::Null)
            .await?;
        adapter
            .upsert_embedding(vec![0.0, 1.0], Value::Null)
            .await?;

        let results = adapter.search_embeddings(&[1.0, 0.0], 1).await?;
        assert_eq!(results.len(), 1);
        assert!(results[0].score > 0.9);
        Ok(())
    }

    #[tokio::test]
    async fn persists_files_to_disk_between_instances() -> Result<()> {
        let temp = tempfile::tempdir()?;
        let adapter = StorageAdapter::new(temp.path()).await?;
        let relative_path = "persist/notes.txt";
        let content = "persisted content";

        adapter.upsert_file(relative_path, content).await?;
        drop(adapter);

        let disk_path = temp.path().join(FILES_DIR).join(relative_path);
        let from_disk = fs::read_to_string(&disk_path).await?;
        assert_eq!(from_disk, content);

        let reloaded = StorageAdapter::new(temp.path()).await?;
        let record = reloaded
            .get_file(relative_path)
            .await?
            .expect("file should survive restart");
        assert_eq!(record.content, content);
        Ok(())
    }

    #[tokio::test]
    async fn embeddings_snapshot_is_reloaded() -> Result<()> {
        let temp = tempfile::tempdir()?;
        let adapter = StorageAdapter::new(temp.path()).await?;
        adapter
            .upsert_embedding(vec![0.5, 0.25, 0.1], serde_json::json!({"tag": "alpha"}))
            .await?;
        adapter
            .upsert_embedding(vec![0.1, 0.25, 0.5], serde_json::json!({"tag": "beta"}))
            .await?;
        drop(adapter);

        let snapshot = temp.path().join(EMBEDDINGS_FILE);
        assert!(fs::try_exists(&snapshot).await?);

        let reloaded = StorageAdapter::new(temp.path()).await?;
        let results = reloaded.search_embeddings(&[0.5, 0.25, 0.1], 2).await?;
        assert_eq!(results.len(), 2);
        Ok(())
    }
}

-- Database initialization for Ghost-Coding-Cave v0.2a
-- Run on first startup to set up extensions and indexes

-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable PGML for machine learning operations
CREATE EXTENSION IF NOT EXISTS pgml;

-- Create basic schema for storage (if not exists)
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    checksum TEXT NOT NULL,
    size BIGINT NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vector VECTOR(1536) NOT NULL,  -- OpenAI embedding dimension
    metadata JSONB NOT NULL,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_path ON files (path);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_user ON files (user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_embeddings_vector ON embeddings USING ivfflat (vector vector_cosine_ops) WITH (lists = 100);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_embeddings_user ON embeddings (user_id);

-- Row-level security (basic)
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

-- Policy for users to access own data
CREATE POLICY user_files_policy ON files
    FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);

CREATE POLICY user_embeddings_policy ON embeddings
    FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);

-- Admin policy (bypass RLS for superuser)
CREATE POLICY admin_bypass ON files FOR ALL USING (current_user = 'postgres');
CREATE POLICY admin_bypass ON embeddings FOR ALL USING (current_user = 'postgres');

-- Vacuum and analyze for performance
VACUUM ANALYZE files;
VACUUM ANALYZE embeddings;

-- Set maintenance parameters
ALTER SYSTEM SET shared_preload_libraries = 'vector,pgml';
ALTER SYSTEM SET max_parallel_workers_per_gather = 2;
ALTER SYSTEM SET work_mem = '4MB';

# 🔌 API Reference — Ghost-Coding-Cave v0.2a

> **Repository:** [eyshoit-commits/ghost-coding-cave](https://github.com/eyshoit-commits/ghost-coding-cave)  
> **Version:** `v0.2a`  
> **Base URL:** `https://gateway.your-domain.com` (or `http://localhost:4729` for local)  
> **Last updated:** 2025-10-29  
> **Maintainer:** `@eyshoit`

---

## 🔐 Authentication

All endpoints require **JWT Bearer Token** + **API Key** authentication.

### Headers
```
Authorization: Bearer <jwt_token>
X-API-Key: <api_key>
Content-Type: application/json
```

### JWT Token Lifecycle
1. **Login:** `POST /auth/login` (handled by Node Backend at `api.your-domain.com`)
   - Request: `{ "username": "user", "password": "pass" }`
   - Response: `{ "access_token": "...", "refresh_token": "...", "expires_in": 3600 }`

2. **Token Refresh:** `POST /auth/refresh` (Node Backend)
   - Request: `{ "refresh_token": "..." }`
   - Response: New access token

3. **Roles:** JWT claims include `role` (admin, user, ghost)
   - **Admin:** Full access
   - **User:** Personal caves only
   - **Ghost:** Read-only analysis

### API Key
- Generated via Node Backend admin panel
- Used for server-to-server communication
- Example: `ghost-prod-api-v0.2a-abc123def456`

### Error Responses
```json
{
  "error": "Unauthorized: Invalid JWT token",
  "code": 401
}
```

---

## 🏠 Health Check

### GET /health
**Description:** Service health status.

**Authentication:** None (public)

**Response:** `200 OK`
```json
{
  "service": "ghost-gateway",
  "version": "0.2.0",
  "status": "ok"
}
```

**Example:**
```bash
curl -X GET "https://gateway.your-domain.com/health"
```

---

## 📁 Storage API

### GET /api/storage/files
**Description:** List files in storage (supports prefix filtering).

**Query Parameters:**
- `prefix` (optional, string): Filter files by path prefix.

**Authentication:** JWT (user role)

**Response:** `200 OK`
```json
{
  "files": [
    {
      "path": "/src/main.rs",
      "size": 1024,
      "checksum": "sha256:abc123...",
      "created_at": "2025-10-29T10:00:00Z",
      "updated_at": "2025-10-29T10:00:00Z"
    }
  ]
}
```

**Errors:**
- `401 Unauthorized`
- `500 Internal Server Error`

**Example:**
```bash
curl -X GET "https://gateway.your-domain.com/api/storage/files?prefix=/src" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "X-API-Key: <api_key>"
```

### GET /api/storage/file
**Description:** Retrieve file content by path.

**Query Parameters:**
- `path` (required, string): File path.

**Authentication:** JWT (user role)

**Response:** `200 OK`
```json
{
  "path": "/src/main.rs",
  "content": "use std::... // full file content",
  "size": 1024,
  "checksum": "sha256:abc123...",
  "created_at": "2025-10-29T10:00:00Z",
  "updated_at": "2025-10-29T10:00:00Z"
}
```

**Errors:**
- `400 Bad Request`: Invalid path (empty or traversal)
- `404 Not Found`: File does not exist
- `401 Unauthorized`

**Example:**
```bash
curl -X GET "https://gateway.your-domain.com/api/storage/file?path=/src/main.rs" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "X-API-Key: <api_key>"
```

### PUT /api/storage/file
**Description:** Create or update file content.

**Body:** JSON
```json
{
  "path": "/src/main.rs",
  "content": "use std::net::SocketAddr;\n\nfn main() { ... }"
}
```

**Authentication:** JWT (user role)

**Response:** `200 OK`
```json
{
  "file": {
    "path": "/src/main.rs",
    "content": "...",
    "size": 1024,
    "checksum": "sha256:def456...",
    "created_at": "2025-10-29T10:05:00Z",
    "updated_at": "2025-10-29T10:05:00Z"
  }
}
```

**Errors:**
- `400 Bad Request`: Invalid path or empty content
- `401 Unauthorized`
- `500 Internal Server Error`

**Example:**
```bash
curl -X PUT "https://gateway.your-domain.com/api/storage/file" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "X-API-Key: <api_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "/src/main.rs",
    "content": "fn main() { println!(\"Hello, World!\"); }"
  }'
```

### DELETE /api/storage/file
**Description:** Delete file by path.

**Query Parameters:**
- `path` (required, string): File path.

**Authentication:** JWT (user role)

**Response:** `204 No Content` (on success)

**Errors:**
- `400 Bad Request`: Invalid path
- `404 Not Found`: File does not exist
- `401 Unauthorized`

**Example:**
```bash
curl -X DELETE "https://gateway.your-domain.com/api/storage/file?path=/src/main.rs" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "X-API-Key: <api_key>"
```

### POST /api/storage/file/rename
**Description:** Rename or move a file.

**Body:** JSON
```json
{
  "from": "/src/old.rs",
  "to": "/src/new.rs"
}
```

**Authentication:** JWT (user role)

**Response:** `200 OK` (returns updated file record)

**Errors:**
- `400 Bad Request`: Invalid paths or from == to
- `404 Not Found`: Source file does not exist
- `401 Unauthorized`

**Example:**
```bash
curl -X POST "https://gateway.your-domain.com/api/storage/file/rename" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "X-API-Key: <api_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "/src/old.rs",
    "to": "/src/new.rs"
  }'
```

---

## 🔍 Embeddings API

### POST /api/storage/embeddings/index
**Description:** Index a new embedding vector.

**Body:** JSON
```json
{
  "vector": [0.1, 0.2, 0.3, ...],
  "metadata": {
    "file_path": "/src/main.rs",
    "language": "rust",
    "user_id": "user123"
  }
}
```

**Authentication:** JWT (user role)

**Response:** `200 OK`
```json
{
  "embedding": {
    "id": "uuid-1234-5678",
    "vector": [0.1, 0.2, 0.3, ...],
    "metadata": { ... },
    "created_at": "2025-10-29T10:00:00Z"
  }
}
```

**Errors:**
- `400 Bad Request`: Empty vector
- `401 Unauthorized`
- `500 Internal Server Error`

**Example:**
```bash
curl -X POST "https://gateway.your-domain.com/api/storage/embeddings/index" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "X-API-Key: <api_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "vector": [0.1, 0.2, 0.3],
    "metadata": {
      "file_path": "/src/main.rs",
      "language": "rust"
    }
  }'
```

### POST /api/storage/embeddings/search
**Description:** Search similar embeddings using cosine similarity.

**Body:** JSON
```json
{
  "vector": [0.1, 0.2, 0.3, ...],
  "top_k": 5
}
```

**Authentication:** JWT (user role)

**Response:** `200 OK`
```json
{
  "results": [
    {
      "id": "uuid-1234-5678",
      "score": 0.95,
      "metadata": {
        "file_path": "/src/main.rs",
        "language": "rust"
      }
    }
  ]
}
```

**Errors:**
- `400 Bad Request`: Empty vector or invalid top_k (1-32)
- `401 Unauthorized`
- `500 Internal Server Error`

**Example:**
```bash
curl -X POST "https://gateway.your-domain.com/api/storage/embeddings/search" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "X-API-Key: <api_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "vector": [0.1, 0.2, 0.3],
    "top_k": 5
  }'
```

---

## 🧠 Semantic Analysis API

### POST /api/semantic/analyze
**Description:** Analyze code for symbols, imports, TODOs, and metrics.

**Body:** JSON (SemanticRequest)
```json
{
  "content": "use std::net::SocketAddr;\n\nfn main() { ... }",
  "language": "rust",
  "path": "/src/main.rs"
}
```

**Authentication:** JWT (user/ghost role)

**Response:** `200 OK` (SemanticSummary)
```json
{
  "language": "rust",
  "lines": 42,
  "imports": ["std::net::SocketAddr"],
  "functions": [
    {
      "name": "main",
      "signature": "fn main()",
      "line": 3,
      "params": []
    }
  ],
  "todos": [
    {
      "line": 15,
      "text": "TODO: Add error handling"
    }
  ],
  "metrics": {
    "complexity": 5,
    "coverage": 0.0
  }
}
```

**Errors:**
- `400 Bad Request`: Empty content
- `401 Unauthorized`
- `500 Internal Server Error`

**Example:**
```bash
curl -X POST "https://gateway.your-domain.com/api/semantic/analyze" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "X-API-Key: <api_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "fn main() { println!(\"Hello\"); }",
    "language": "rust",
    "path": "/src/main.rs"
  }'
```

---

## 🔌 WebSocket API

### GET /ws/semantic
**Description:** Real-time semantic analysis over WebSocket.

**Authentication:** JWT (via query param or header during upgrade)

**Connection URL:** `wss://gateway.your-domain.com/ws/semantic?token=<jwt_token>&api_key=<api_key>`

**Message Flow:**
1. **Client Connects** → Server sends `{"event": "ready", "service": "ghost-gateway", "version": "0.2.0"}`
2. **Client Sends Analysis Request:**
   ```json
   {
     "content": "fn main() { ... }",
     "language": "rust",
     "path": "/src/main.rs"
   }
   ```
3. **Server Responds:** `{"event": "analyzing", "language": "rust"}`
4. **Server Sends Result:**
   ```json
   {
     "event": "analysis",
     "summary": { ... SemanticSummary ... }
   }
   ```
5. **Error:** `{"event": "error", "error": "Invalid payload"}`

**Supported Message Types:**
- `Text`: JSON requests/responses
- `Ping/Pong`: Keep-alive
- `Close`: Graceful disconnect

**Errors:**
- `Binary messages not supported`
- `Connection error`

**Example (JavaScript):**
```javascript
const ws = new WebSocket('wss://gateway.your-domain.com/ws/semantic?token=' + jwtToken + '&api_key=' + apiKey);

ws.onopen = () => {
  console.log('Connected to semantic WS');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.event === 'analysis') {
    console.log('Analysis complete:', data.summary);
  }
};

ws.send(JSON.stringify({
  content: 'fn main() { ... }',
  language: 'rust',
  path: '/src/main.rs'
}));
```

---

## 📊 Rate Limits & Quotas

| Endpoint | Rate Limit | Burst | Notes |
|----------|------------|-------|-------|
| `/health` | 100/min | 10 | Public |
| `/api/storage/*` | 100/min | 20 | Per user |
| `/api/embeddings/*` | 50/min | 10 | Vector ops |
| `/api/semantic/*` | 30/min | 5 | Analysis |
| `/ws/semantic` | 10 connections/min | 2 | Per IP |

**Exceeded Response:** `429 Too Many Requests`
```json
{
  "error": "Rate limit exceeded. Retry after 60s",
  "retry_after": 60
}
```

---

## 🛡️ Error Codes

| Code | Description | Example |
|------|-------------|---------|
| 400 | Bad Request | Invalid path, empty vector |
| 401 | Unauthorized | Missing/invalid JWT or API key |
| 403 | Forbidden | Insufficient role permissions |
| 404 | Not Found | File or embedding not found |
| 429 | Rate Limited | Too many requests |
| 500 | Internal Server Error | Storage or analysis failure |

---

## 🔗 Cross-References

- **Admin Role:** Full access to all endpoints (see AGENTS.md A-3 Security Agent)
- **User Role:** Limited to personal caves and files
- **Ghost Role:** Read-only semantic analysis (A-4 Semantic Agent)
- **Storage Backend:** helper-db integration (A-5 Storage Agent)
- **Node Bridge:** Routes to NestJS API for auth/chat (A-7 Chat Agent)

For full schema definitions, see Rust crate documentation:
- `storage_adapter::FileRecord`
- `storage_adapter::EmbeddingRecord`
- `semantic_adapter::SemanticSummary`

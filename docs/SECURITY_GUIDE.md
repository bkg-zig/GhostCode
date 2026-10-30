# 🔒 Security Guide — Ghost-Coding-Cave v0.2a

> **Repository:** [eyshoit-commits/ghost-coding-cave](https://github.com/eyshoit-commits/ghost-coding-cave)  
> **Version:** `v0.2a`  
> **Last updated:** 2025-10-29  
> **Maintainer:** `@eyshoit`

---

## 🛡️ Security Model Overview

Ghost-Coding-Cave v0.2a implements a **defense-in-depth** security architecture with multiple layers of protection:

1. **Authentication Layer:** JWT + API Key dual-authentication
2. **Authorization Layer:** Role-Based Access Control (RBAC)
3. **Network Layer:** TLS termination and rate limiting
4. **Application Layer:** Input validation and sandboxing
5. **Data Layer:** Encryption at rest and secure secrets management

---

## 🔐 Authentication System

### JWT + API Key Dual Authentication

**Why Dual Auth?**
- JWT provides user identity and session management
- API Key enables server-to-server communication
- Both required for all API calls (except health checks)

**JWT Configuration:**
```rust
// crates/gateway/src/main.rs
use jsonwebtoken::{encode, decode, Validation, Algorithm};

struct Claims {
    sub: String,        // User ID
    role: String,       // admin, user, ghost
    exp: usize,         // Expiration timestamp
    iat: usize,         // Issued at
    iss: String,        // Issuer (gateway.your-domain.com)
}
```

**Token Lifecycle:**
1. **Login:** User authenticates via Node Backend (`api.your-domain.com/auth/login`)
2. **JWT Issued:** 1-hour expiration, refresh token for renewal
3. **Validation:** Every request validates JWT signature and claims
4. **Refresh:** Automatic renewal via refresh token (24-hour validity)

**API Key Management:**
- Generated via admin panel (`api.your-domain.com/admin/api-keys`)
- Stored as bcrypt hash in database
- Rotated quarterly via automated process
- Example: `ghost-prod-v0.2a-abc123def456`

### Session Management

**Secure Cookies:**
```javascript
// Frontend sets secure cookies
document.cookie = `access_token=${token}; Secure; HttpOnly; SameSite=Strict; Max-Age=3600`;
document.cookie = `refresh_token=${refresh}; Secure; HttpOnly; SameSite=Strict; Max-Age=86400`;
```

**Session Storage:**
- Redis stores session data with TTL
- Automatic cleanup of expired sessions
- Session invalidation on logout/password change

---

## 👥 Role-Based Access Control (RBAC)

### User Roles

| Role | Permissions | Description |
|------|-------------|-------------|
| **Admin** | Full access | System administration, user management, all caves |
| **User** | Personal caves | CRUD operations on owned caves, limited API access |
| **Ghost** | Read-only analysis | Semantic analysis only, no data modification |

### Permission Matrix

| Endpoint | Admin | User | Ghost |
|----------|-------|------|-------|
| `GET /health` | ✅ | ✅ | ✅ |
| `GET /api/storage/files` | ✅ | ✅ (own caves) | ❌ |
| `PUT /api/storage/file` | ✅ | ✅ (own caves) | ❌ |
| `POST /api/semantic/analyze` | ✅ | ✅ | ✅ |
| `POST /api/storage/embeddings/*` | ✅ | ✅ (own data) | ❌ |
| Admin endpoints | ✅ | ❌ | ❌ |

### Cave Isolation

**Multi-tenancy Model:**
- Each user has isolated cave storage
- Path-based access control: `/users/{user_id}/caves/{cave_id}/`
- Database row-level security (RLS) policies
- File system permissions enforced at OS level

**Example Policy:**
```sql
-- PostgreSQL RLS policy
CREATE POLICY user_cave_access ON files
FOR ALL USING (user_id = current_user_id());
```

---

## 🌐 Network Security

### TLS Configuration

**Certificate Management:**
```bash
# Let's Encrypt with certbot
sudo certbot certonly --nginx \
  -d your-domain.com \
  -d api.your-domain.com \
  -d gateway.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

**Nginx SSL Configuration:**
```nginx
server {
    listen 443 ssl http2;
    server_name gateway.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;
}
```

### Rate Limiting

**Nginx Rate Limits:**
```nginx
# /etc/nginx/nginx.conf
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=gateway:10m rate=20r/s;
    limit_req_zone $binary_remote_addr zone=ws:10m rate=5r/s;
}
```

**Application-Level Limits:**
```rust
// crates/gateway/src/main.rs
use tower::limit::{ConcurrencyLimit, RateLimit};
use tower::load_shed::LoadShed;

let rate_limited = ConcurrencyLimit::new(
    RateLimit::new(
        service,
        RateLimitLayer::new(100, Duration::from_secs(60))
    ),
    10
);
```

### Firewall Configuration

**UFW Rules:**
```bash
# Allow only necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
```

**Docker Network Security:**
```yaml
# docker-compose.yml
networks:
  ghost-internal:
    driver: bridge
    internal: true  # No external access
  ghost-public:
    driver: bridge
```

---

## 🏗️ Application Security

### Input Validation

**Path Traversal Protection:**
```rust
// crates/gateway/src/main.rs
fn normalize_path(raw: &str) -> AppResult<String> {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return Err(AppError::bad_request("path must not be empty"));
    }
    if trimmed.contains("..") {
        return Err(AppError::bad_request("path traversal is not allowed"));
    }
    Ok(trimmed.replace('\\', "/"))
}
```

**Content Validation:**
```rust
// File size limits
const MAX_FILE_SIZE: usize = 10 * 1024 * 1024; // 10MB

// Content type validation
fn validate_content(content: &str) -> AppResult<()> {
    if content.len() > MAX_FILE_SIZE {
        return Err(AppError::bad_request("file too large"));
    }
    // Additional validation logic...
    Ok(())
}
```

### CSRF Protection

**Double Submit Cookie Pattern:**
```javascript
// Frontend includes CSRF token in requests
const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf_token='))
    ?.split('=')[1];

fetch('/api/storage/file', {
    method: 'POST',
    headers: {
        'X-CSRF-Token': csrfToken,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
});
```

**Backend Verification:**
```rust
// crates/gateway/src/main.rs
async fn verify_csrf(token: &str, session_id: &str) -> AppResult<()> {
    let stored_token = redis.get(&format!("csrf:{}", session_id)).await?;
    if !constant_time_eq(token.as_bytes(), stored_token.as_bytes()) {
        return Err(AppError::forbidden("CSRF token mismatch"));
    }
    Ok(())
}
```

### Sandboxing

**Code Execution Isolation:**
- All code runs in isolated containers via Ghost Server
- Resource limits: CPU, memory, disk I/O
- Network restrictions: No internet access during execution
- Timeout enforcement: Maximum 30-second execution time

**Container Security:**
```yaml
# Ghost Server container config
services:
  ghost-server:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp:rw,noexec,nosuid,size=100m
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

---

## 💾 Data Security

### Encryption at Rest

**Database Encryption:**
```sql
-- PostgreSQL encryption
CREATE EXTENSION pgcrypto;

-- Encrypted columns
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT,
    password_hash TEXT,
    encrypted_data BYTEA
);

-- Encryption functions
SELECT encrypt('sensitive data', 'encryption_key', 'aes');
```

**File Storage Encryption:**
```rust
// crates/storage-adapter/src/lib.rs
use aes_gcm::{Aes256Gcm, Key, Nonce};
use aes_gcm::aead::{Aead, NewAead};

fn encrypt_data(data: &[u8], key: &[u8]) -> Result<Vec<u8>> {
    let cipher = Aes256Gcm::new(Key::from_slice(key));
    let nonce = Nonce::from_slice(b"unique nonce"); // In practice, random
    let ciphertext = cipher.encrypt(nonce, data)?;
    Ok(ciphertext)
}
```

### Secrets Management

**Environment Variables:**
```bash
# .env.production (not committed)
JWT_SECRET=your_256_bit_jwt_secret_here
API_KEY_SECRET=your_api_key_salt_here
DB_PASSWORD=your_database_password_here
REDIS_PASSWORD=your_redis_password_here
ENCRYPTION_KEY=your_256_bit_encryption_key_here
```

**Secret Rotation:**
```bash
# Automated rotation script
#!/bin/bash
# Generate new secrets
NEW_JWT_SECRET=$(openssl rand -hex 32)
NEW_API_KEY=$(openssl rand -hex 16)

# Update environment
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$NEW_JWT_SECRET/" .env.production

# Restart services
docker-compose restart gateway api

# Log rotation event
echo "$(date): Secrets rotated" >> /var/log/ghost/rotation.log
```

---

## 📊 Monitoring & Auditing

### Security Event Logging

**Structured Logging:**
```rust
// crates/gateway/src/main.rs
use tracing::{error, warn, info};

#[derive(Debug)]
struct SecurityEvent {
    event_type: String,
    user_id: Option<String>,
    ip_address: String,
    user_agent: String,
    timestamp: DateTime<Utc>,
    details: serde_json::Value,
}

async fn log_security_event(event: SecurityEvent) {
    info!(
        event_type = %event.event_type,
        user_id = ?event.user_id,
        ip = %event.ip_address,
        user_agent = %event.user_agent,
        timestamp = %event.timestamp,
        details = ?event.details,
        "Security event"
    );
}
```

**Audit Trail:**
```sql
-- Audit table
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID,
    action VARCHAR(50),
    resource_type VARCHAR(50),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    details JSONB
);

-- Audit trigger
CREATE OR REPLACE FUNCTION audit_trigger() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (user_id, action, resource_type, resource_id, details)
    VALUES (NEW.user_id, TG_OP, TG_TABLE_NAME, NEW.id, row_to_json(NEW));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Intrusion Detection

**Fail2Ban Integration:**
```ini
# /etc/fail2ban/jail.local
[ghost-gateway]
enabled = true
port = 443
filter = ghost-gateway
logpath = /var/log/nginx/access.log
maxretry = 5
bantime = 3600
```

**Log Analysis:**
```bash
# Monitor for suspicious patterns
tail -f /var/log/ghost/gateway.log | grep -E "(401|403|429)" | \
while read line; do
    # Send alert to security team
    curl -X POST https://security-webhook.com/alert \
        -H "Content-Type: application/json" \
        -d "{\"message\": \"$line\"}"
done
```

---

## 🚨 Incident Response

### Security Incident Process

1. **Detection:** Monitoring alerts or user reports
2. **Assessment:** Security team evaluates impact
3. **Containment:** Isolate affected systems
4. **Eradication:** Remove malicious components
5. **Recovery:** Restore from clean backups
6. **Lessons Learned:** Update security measures

### Emergency Contacts

**Security Team:** security@your-company.com
**Infrastructure:** infra@your-company.com
**Legal:** legal@your-company.com

### Breach Notification

**Timeline:**
- **24 hours:** Critical security breaches
- **72 hours:** Confirmed data breaches
- **30 days:** General security incidents

---

## 🔧 Security Checklist

### Pre-Deployment
- [ ] SSL certificates installed and valid
- [ ] Secrets generated with sufficient entropy
- [ ] Firewall rules configured
- [ ] Rate limiting active
- [ ] Security headers enabled

### Ongoing Maintenance
- [ ] Regular security updates applied
- [ ] Secrets rotated quarterly
- [ ] Security audits conducted monthly
- [ ] Log monitoring active
- [ ] Backup encryption verified

### Development Security
- [ ] Input validation implemented
- [ ] CSRF protection active
- [ ] SQL injection prevention
- [ ] XSS protection enabled
- [ ] Secure coding practices followed

---

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [JWT Security Best Practices](https://tools.ietf.org/html/rfc8725)
- [Docker Security Best Practices](https://docs.docker.com/develop/dev-best-practices/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

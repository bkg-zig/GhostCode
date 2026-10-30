# 🚀 Deployment Guide — Ghost-Coding-Cave v0.2a

> **Repository:** [eyshoit-commits/ghost-coding-cave](https://github.com/eyshoit-commits/ghost-coding-cave)  
> **Version:** `v0.2a`  
> **Last updated:** 2025-10-29  
> **Maintainer:** `@eyshoit`

---

## 📋 Overview

This guide provides step-by-step instructions for deploying Ghost-Coding-Cave v0.2a in production environments. The system consists of:

- **Rust Gateway** (port 4729): REST/WS API layer with storage and semantic analysis
- **Node Backend** (port 4003): NestJS API with authentication and chat
- **PostgreSQL + pgvector** (port 4000): Vector database for embeddings
- **Redis** (port 4001): Caching and session storage
- **Ollama** (port 4002): Local LLM runtime
- **Ghost Server** (port 4005): Sandbox execution environment

---

## 🏗️ Prerequisites

### System Requirements
- **OS:** Ubuntu 22.04 LTS or RHEL 9+
- **CPU:** 4+ cores (8+ recommended)
- **RAM:** 8GB minimum (16GB+ recommended)
- **Storage:** 50GB SSD minimum
- **Network:** Static IP, firewall configured

### Software Dependencies
```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install certbot for TLS
sudo apt update && sudo apt install -y certbot nginx
```

### Domain Configuration
- **Domain:** `your-domain.com`
- **DNS Records:**
  - `A your-domain.com` → `YOUR_SERVER_IP`
  - `A api.your-domain.com` → `YOUR_SERVER_IP`
  - `A gateway.your-domain.com` → `YOUR_SERVER_IP`

---

## 🔧 Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/eyshoit-commits/ghost-coding-cave.git
cd ghost-coding-cave/v0.2a
```

### 2. Create Environment File
```bash
cp .env.example .env.production
```

Edit `.env.production`:
```bash
# Database
POSTGRES_USER=ghost_prod
POSTGRES_PASSWORD=your_secure_db_password_here
POSTGRES_DB=ghost_prod

# JWT & API Keys
JWT_SECRET=your_256_bit_jwt_secret_here
GHOST_API_KEY=your_production_api_key_here

# Redis
REDIS_PASSWORD=your_redis_password_here

# Ollama
OLLAMA_HOST=http://ollama:11434

# Gateway
GHOST_GATEWAY_HOST=0.0.0.0
GHOST_GATEWAY_PORT=4729
GHOST_STORAGE_DIR=/data/ghost-storage

# Domain
DOMAIN=your-domain.com
```

### 3. Generate Secure Secrets
```bash
# Generate JWT secret (256-bit)
openssl rand -hex 32

# Generate API key
openssl rand -hex 16

# Generate Redis password
openssl rand -hex 16
```

---

## 🐳 Docker Compose Deployment

### 1. Update docker-compose.yml
```yaml
version: '3.8'

services:
  # PostgreSQL + pgvector
  db:
    image: pgvector/pgvector:pg15
    container_name: ghost-db-prod
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "127.0.0.1:4000:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - ghost-internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # Redis
  redis:
    image: redis:7-alpine
    container_name: ghost-redis-prod
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "127.0.0.1:4001:6379"
    networks:
      - ghost-internal
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    restart: unless-stopped

  # Ollama
  ollama:
    image: ollama/ollama:latest
    container_name: ghost-ollama-prod
    ports:
      - "127.0.0.1:4002:11434"
    volumes:
      - ollama_models:/root/.ollama
    networks:
      - ghost-internal
    environment:
      - OLLAMA_HOST=0.0.0.0
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    restart: unless-stopped

  # Rust Gateway
  gateway:
    build:
      context: ./rust-core
      dockerfile: Dockerfile
    container_name: ghost-gateway-prod
    environment:
      - GHOST_GATEWAY_HOST=0.0.0.0
      - GHOST_GATEWAY_PORT=4729
      - GHOST_STORAGE_DIR=/data/storage
      - RUST_LOG=ghost_gateway=info,tower_http=info
    ports:
      - "127.0.0.1:4729:4729"
    volumes:
      - gateway_storage:/data/storage
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - ghost-internal
      - ghost-public
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4729/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # Node Backend (NestJS)
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    container_name: ghost-api-prod
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      - JWT_SECRET=${JWT_SECRET}
      - API_PORT=4003
      - REDIS_HOST=redis
      - REDIS_PASSWORD=${REDIS_PASSWORD}
      - OLLAMA_HOST=http://ollama:11434
      - GHOST_SERVER_URL=http://gateway:4729
      - GHOST_LOG_WS_URL=ws://gateway:4729/ws/semantic
      - GHOST_SERVER_API_KEY=${GHOST_API_KEY}
    ports:
      - "127.0.0.1:4003:4003"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
      gateway:
        condition: service_healthy
    networks:
      - ghost-internal
      - ghost-public
    restart: unless-stopped

  # Dashboard (Next.js)
  dashboard:
    build:
      context: .
      dockerfile: apps/dashboard/Dockerfile
    container_name: ghost-dashboard-prod
    environment:
      - NEXT_PUBLIC_API_URL=https://api.${DOMAIN}
      - NEXT_PUBLIC_GHOST_LOG_WS_URL=wss://gateway.${DOMAIN}/ws/semantic
    ports:
      - "127.0.0.1:4004:4004"
    depends_on:
      - api
    networks:
      - ghost-public
    restart: unless-stopped

volumes:
  pgdata:
    driver: local
  ollama_models:
    driver: local
  gateway_storage:
    driver: local

networks:
  ghost-internal:
    driver: bridge
    internal: true
  ghost-public:
    driver: bridge
```

### 2. Create Database Initialization Script
```sql
-- init.sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgml;

-- Create indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_embeddings_vector
ON embeddings USING ivfflat (vector vector_cosine_ops)
WITH (lists = 100);
```

### 3. Deploy Services
```bash
# Load environment variables
set -a
source .env.production
set +a

# Start services
docker-compose up -d

# Wait for health checks
sleep 60

# Check service status
docker-compose ps
```

---

## 🌐 TLS & Reverse Proxy Setup

### 1. Install Nginx
```bash
sudo apt install -y nginx
```

### 2. Create Nginx Configuration
```nginx
# /etc/nginx/sites-available/ghost-coding-cave
server {
    listen 80;
    server_name your-domain.com api.your-domain.com gateway.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:4004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # API backend
    location / {
        proxy_pass http://127.0.0.1:4003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }
}

server {
    listen 443 ssl http2;
    server_name gateway.your-domain.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Gateway
    location / {
        proxy_pass http://127.0.0.1:4729;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Rate limiting
        limit_req zone=gateway burst=50 nodelay;
    }
}
```

### 3. Enable Rate Limiting
```nginx
# /etc/nginx/nginx.conf
http {
    # Rate limiting zones
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=gateway:10m rate=20r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=100r/m;

    # ... rest of config
}
```

### 4. Obtain SSL Certificate
```bash
sudo certbot certonly --nginx -d your-domain.com -d api.your-domain.com -d gateway.your-domain.com
```

### 5. Enable Site and Reload
```bash
sudo ln -s /etc/nginx/sites-available/ghost-coding-cave /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔍 Monitoring & Logging

### 1. Install Monitoring Stack
```bash
# Install Prometheus + Grafana
docker run -d --name prometheus -p 9090:9090 prom/prometheus
docker run -d --name grafana -p 3000:3000 grafana/grafana
```

### 2. Configure Structured Logging
```bash
# View logs
docker-compose logs -f gateway
docker-compose logs -f api

# Log rotation (add to cron)
0 2 * * * /usr/sbin/logrotate /etc/logrotate.d/docker
```

### 3. Health Check Endpoints
```bash
# Gateway health
curl https://gateway.your-domain.com/health

# API health
curl https://api.your-domain.com/health

# Database connectivity
docker-compose exec db pg_isready -U ghost_prod
```

---

## 🔄 Backup & Recovery

### 1. Database Backup
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T db pg_dump -U ghost_prod ghost_prod > backup_$DATE.sql
gzip backup_$DATE.sql
```

### 2. Storage Backup
```bash
# Backup gateway storage
tar -czf gateway_backup_$(date +%Y%m%d).tar.gz /var/lib/docker/volumes/v0.2a_gateway_storage/_data/
```

### 3. Automated Backups (Cron)
```bash
# Add to crontab
0 2 * * * /path/to/backup-script.sh
```

---

## 🚨 Troubleshooting

### Common Issues

**Services won't start:**
```bash
# Check logs
docker-compose logs

# Check resource usage
docker stats

# Restart specific service
docker-compose restart gateway
```

**Database connection issues:**
```bash
# Test connection
docker-compose exec db psql -U ghost_prod -d ghost_prod -c "SELECT version();"

# Reset database
docker-compose down -v
docker-compose up -d db
```

**TLS certificate issues:**
```bash
# Renew certificates
sudo certbot renew

# Check certificate validity
openssl s_client -connect your-domain.com:443 -servername your-domain.com < /dev/null | openssl x509 -noout -dates
```

---

## 📊 Performance Tuning

### Database Optimization
```sql
-- Performance tuning queries
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
```

### Gateway Configuration
```bash
# Environment variables for performance
GHOST_GATEWAY_WORKERS=4
RUST_LOG=ghost_gateway=warn,tower_http=warn
```

### Monitoring Queries
```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🔐 Security Checklist

- [ ] SSL/TLS certificates installed and valid
- [ ] Firewall configured (only expose necessary ports)
- [ ] Database passwords rotated regularly
- [ ] API keys regenerated periodically
- [ ] Rate limiting active
- [ ] Security headers configured
- [ ] Regular security updates applied
- [ ] Log monitoring alerts configured
- [ ] Backup encryption enabled

---

## 📞 Support

For deployment issues:
1. Check logs: `docker-compose logs -f [service]`
2. Verify environment variables
3. Test individual service health endpoints
4. Review firewall and network configuration
5. Check system resources (CPU, memory, disk)

**Emergency contacts:**
- Infrastructure: [your-infra-team@company.com]
- Security: [security@company.com]
- Development: [dev-team@company.com]

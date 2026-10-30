# 📋 Operations Checklist — Ghost-Coding-Cave v0.2a

> **Repository:** [eyshoit-commits/ghost-coding-cave](https://github.com/eyshoit-commits/ghost-coding-cave)  
> **Version:** `v0.2a`  
> **Last updated:** 2025-10-29  
> **Maintainer:** `@eyshoit`

---

## 🚀 Pre-Deployment Validation

### ✅ Environment Setup
- [ ] **Domain Configuration**
  - DNS A records created for `your-domain.com`, `api.your-domain.com`, `gateway.your-domain.com`
  - SSL certificates obtained via Let's Encrypt
  - Nginx configuration validated (`sudo nginx -t`)

- [ ] **Secrets Generation**
  - JWT secret: 256-bit hex (`openssl rand -hex 32`)
  - API key: 128-bit hex (`openssl rand -hex 16`)
  - Database password: Strong random string
  - Redis password: Strong random string
  - Encryption key: 256-bit for data at rest

- [ ] **System Resources**
  - CPU: 4+ cores available
  - RAM: 8GB+ free memory
  - Storage: 50GB+ available disk space
  - Network: Static IP, firewall configured

### ✅ Dependencies Check
- [ ] **Docker & Docker Compose**
  ```bash
  docker --version          # 24.0+
  docker-compose --version  # 2.24+
  ```

- [ ] **SSL/TLS Tools**
  ```bash
  certbot --version         # 2.0+
  openssl version           # 3.0+
  ```

- [ ] **System Packages**
  ```bash
  sudo apt update && sudo apt install -y nginx certbot curl
  ```

### ✅ Configuration Files
- [ ] **`.env.production`** created with all required variables
- [ ] **`docker-compose.yml`** updated with production services
- [ ] **`nginx.conf`** configured for all subdomains
- [ ] **Database init script** (`init.sql`) ready

---

## 🔧 Deployment Steps

### 1️⃣ Infrastructure Setup
```bash
# 1. Clone repository
git clone https://github.com/eyshoit-commits/ghost-coding-cave.git
cd ghost-coding-cave/v0.2a

# 2. Load environment
set -a
source .env.production
set +a

# 3. Create required directories
sudo mkdir -p /var/log/ghost
sudo mkdir -p /var/backups/ghost
sudo chown -R $USER:$USER /var/log/ghost /var/backups/ghost

# 4. Initialize Docker networks
docker network create ghost-internal --internal
docker network create ghost-public
```

### 2️⃣ Database Initialization
```bash
# Start only database service
docker-compose up -d db

# Wait for healthy state
docker-compose ps db
# Should show: ghost-db-prod | Up (healthy)

# Run initialization
docker-compose exec -T db psql -U $POSTGRES_USER -d $POSTGRES_DB < init.sql

# Verify extensions
docker-compose exec db psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT * FROM pg_extension;"
# Should show: vector, pgml
```

### 3️⃣ Service Deployment
```bash
# Start all services
docker-compose up -d

# Monitor startup logs
docker-compose logs -f | head -50

# Check service health
curl -f https://gateway.your-domain.com/health
curl -f https://api.your-domain.com/health
```

### 4️⃣ TLS Configuration
```bash
# Obtain certificates
sudo certbot certonly --nginx \
  -d your-domain.com \
  -d api.your-domain.com \
  -d gateway.your-domain.com

# Test certificate renewal
sudo certbot renew --dry-run

# Reload nginx
sudo nginx -t && sudo systemctl reload nginx
```

---

## 🔍 Post-Deployment Checks

### ✅ Service Health
```bash
# Gateway health
curl -w "@curl-format.txt" -o /dev/null -s https://gateway.your-domain.com/health
# Expected: HTTP/2 200, time < 100ms

# API health
curl -w "@curl-format.txt" -o /dev/null -s https://api.your-domain.com/health
# Expected: HTTP/2 200, time < 200ms

# Database connectivity
docker-compose exec db pg_isready -U $POSTGRES_USER -h localhost
# Expected: /var/run/postgresql:5432 - accepting connections

# Redis connectivity
docker-compose exec redis redis-cli -a $REDIS_PASSWORD ping
# Expected: PONG
```

### ✅ Security Validation
```bash
# SSL certificate check
openssl s_client -connect your-domain.com:443 -servername your-domain.com < /dev/null | \
openssl x509 -noout -dates -subject
# Should show valid dates and correct subject

# Security headers check
curl -I https://gateway.your-domain.com/health | grep -E "(Strict-Transport-Security|X-Frame-Options|X-Content-Type-Options)"
# Should show all security headers present

# Rate limiting test
for i in {1..15}; do
  curl -s https://gateway.your-domain.com/health > /dev/null &
done
wait
# Should see some 429 responses in logs
```

### ✅ API Functionality
```bash
# Test unauthenticated access (should fail)
curl -s https://gateway.your-domain.com/api/storage/files
# Expected: 401 Unauthorized

# Test authenticated access (requires valid tokens)
curl -H "Authorization: Bearer $JWT_TOKEN" \
     -H "X-API-Key: $API_KEY" \
     https://gateway.your-domain.com/api/storage/files
# Expected: 200 OK with empty file list

# Test semantic analysis
curl -X POST https://gateway.your-domain.com/api/semantic/analyze \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -H "X-API-Key: $API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"content": "fn main() {}", "language": "rust"}'
# Expected: 200 OK with analysis result
```

### ✅ Performance Benchmarks
```bash
# Load testing (requires apache-bench or similar)
ab -n 1000 -c 10 https://gateway.your-domain.com/health
# Expected: < 50ms average response time, 0 failed requests

# Memory usage check
docker stats --no-stream
# Should show reasonable memory usage (< 2GB total)

# Disk usage check
df -h /var/lib/docker
# Should have > 20GB free space
```

---

## 📊 Monitoring Setup

### 1️⃣ Log Aggregation
```bash
# Create log directories
sudo mkdir -p /var/log/ghost/{gateway,api,database}

# Configure log rotation
sudo tee /etc/logrotate.d/ghost << EOF
/var/log/ghost/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 www-data www-data
    postrotate
        docker-compose restart gateway api
    endscript
}
EOF
```

### 2️⃣ Metrics Collection
```bash
# Install Prometheus + Grafana
docker run -d --name prometheus \
  -p 9090:9090 \
  -v /etc/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

docker run -d --name grafana \
  -p 3000:3000 \
  -e "GF_SECURITY_ADMIN_PASSWORD=secure_password" \
  grafana/grafana
```

### 3️⃣ Alert Configuration
```yaml
# Prometheus alerting rules
groups:
  - name: ghost.rules
    rules:
      - alert: GatewayDown
        expr: up{job="gateway"} == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Gateway service is down"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
```

---

## 🔄 Maintenance Procedures

### Daily Checks
- [ ] **Service Health:** All containers running and healthy
- [ ] **SSL Certificates:** Check expiration dates
- [ ] **Disk Usage:** Monitor storage growth
- [ ] **Error Logs:** Review application logs for anomalies
- [ ] **Performance:** Check response times and resource usage

### Weekly Tasks
- [ ] **Security Updates:** Apply Docker image updates
- [ ] **Log Rotation:** Verify log files are rotating properly
- [ ] **Backup Verification:** Test backup restoration
- [ ] **Performance Review:** Analyze metrics trends

### Monthly Tasks
- [ ] **Full Security Audit:** Run vulnerability scans
- [ ] **Performance Tuning:** Optimize database queries
- [ ] **Capacity Planning:** Review resource utilization
- [ ] **Documentation Update:** Update runbooks as needed

---

## 🚨 Rollback Procedures

### Quick Rollback (Last Working Version)
```bash
# Stop current deployment
docker-compose down

# Restore previous docker-compose.yml
git checkout HEAD~1 docker-compose.yml

# Restart with previous configuration
docker-compose up -d

# Verify services are healthy
docker-compose ps
curl -f https://gateway.your-domain.com/health
```

### Database Rollback
```bash
# Stop application services
docker-compose stop gateway api dashboard

# Restore from backup
docker-compose exec -T db pg_restore -U $POSTGRES_USER -d $POSTGRES_DB < /var/backups/ghost/latest.dump

# Restart services
docker-compose start gateway api dashboard
```

### Full System Restore
```bash
# Emergency restore from backup
cd /var/backups/ghost
tar -xzf full_backup_$(date +%Y%m%d).tar.gz -C /

# Reinitialize Docker services
docker-compose down
docker-compose up -d

# Verify all systems operational
./health-check.sh
```

---

## 📈 Scaling Procedures

### Horizontal Scaling (Multiple Instances)
```yaml
# docker-compose.scale.yml
version: '3.8'
services:
  gateway:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
    depends_on:
      - loadbalancer

  loadbalancer:
    image: nginx:alpine
    ports:
      - "4729:4729"
    volumes:
      - ./nginx.lb.conf:/etc/nginx/nginx.conf
```

### Database Scaling
```bash
# Add read replicas
docker-compose exec db pg_basebackup -U $POSTGRES_USER -D /var/lib/postgresql/replica

# Configure streaming replication
# (Detailed PostgreSQL replication setup required)
```

---

## 🔧 Troubleshooting Guide

### Service Startup Issues
```bash
# Check service logs
docker-compose logs [service_name]

# Check resource constraints
docker stats

# Verify environment variables
docker-compose exec [service] env | grep -E "(JWT|API|DB)"

# Test network connectivity
docker-compose exec gateway ping api
```

### Performance Issues
```bash
# Profile application performance
docker-compose exec gateway /usr/local/bin/perf record -F 99 -p $(pidof ghost-gateway) -g -- sleep 30

# Check database slow queries
docker-compose exec db psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"

# Monitor network I/O
docker run --net=container:gateway nicolaka/netshoot tcpdump -i any port 4729
```

### Security Incidents
```bash
# Isolate affected service
docker-compose stop [compromised_service]

# Collect forensic data
docker logs [compromised_service] > incident_$(date +%s).log

# Rotate all secrets
./rotate-secrets.sh

# Restore from clean backup
./emergency-restore.sh
```

---

## 📞 Emergency Contacts

**Primary On-Call:** +1-555-0123 (DevOps Lead)
**Secondary:** +1-555-0124 (Infrastructure Engineer)
**Security Incidents:** security@your-company.com
**Customer Support:** support@your-domain.com

**Escalation Path:**
1. **L1:** On-call engineer (15-minute response)
2. **L2:** DevOps team lead (1-hour response)
3. **L3:** Engineering director (4-hour response)
4. **L4:** Executive team (24-hour response)

---

## ✅ Final Validation Checklist

### Deployment Complete
- [ ] All services healthy and responding
- [ ] SSL certificates valid and configured
- [ ] Authentication working correctly
- [ ] API endpoints functional
- [ ] Monitoring and alerting active
- [ ] Backups scheduled and tested
- [ ] Documentation updated with production URLs

### Go-Live Ready
- [ ] Load testing completed successfully
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Rollback procedures documented
- [ ] Support team trained
- [ ] Incident response plan activated

---

## 📚 Additional Resources

- [Deployment Guide](./DEPLOYMENT.md) — Detailed setup instructions
- [API Reference](./API_REFERENCE.md) — Complete endpoint documentation
- [Security Guide](./SECURITY_GUIDE.md) — Security architecture details
- [AGENTS.md](../AGENTS.md) — Agent coordination and responsibilities
- [Monitoring Dashboard](https://grafana.your-domain.com) — Live metrics
- [Status Page](https://status.your-domain.com) — Service availability

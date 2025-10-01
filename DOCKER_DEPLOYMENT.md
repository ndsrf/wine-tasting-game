# Docker Deployment Guide

This guide explains how to deploy the Wine Tasting Game using Docker containers to Proxmox LXC or any Docker-compatible environment.

## Table of Contents
- [Overview](#overview)
- [Environment Variables Security](#environment-variables-security)
- [GitHub Container Registry Setup](#github-container-registry-setup)
- [Deployment Options](#deployment-options)
- [Proxmox LXC Deployment](#proxmox-lxc-deployment)

---

## Overview

The application is containerized using Docker and automatically built via GitHub Actions. Each push to the `main` branch creates a new Docker image published to GitHub Container Registry (GHCR).

**Key Components:**
- **Application Container**: Next.js app with Socket.io server
- **PostgreSQL Container**: Database
- **Redis Container**: Caching and session management

---

## Environment Variables Security

### ⚠️ IMPORTANT: Never commit `.env` files to Git!

The `.env` file contains sensitive credentials and should **NEVER** be committed to your repository.

### Best Practices

1. **Use `.env.example` as a template**
   ```bash
   cp .env.example .env
   ```

2. **Generate secure secrets**
   ```bash
   # Generate NEXTAUTH_SECRET
   openssl rand -hex 32

   # Generate JWT_SECRET
   openssl rand -hex 32
   ```

3. **Store `.env` securely on your server**
   - Keep it in your deployment directory (e.g., `/opt/wine-tasting/.env`)
   - Set proper permissions: `chmod 600 .env`
   - Owner only: `chown root:root .env` (or your deploy user)

4. **For production secrets management**, consider:
   - **Docker Secrets** (Swarm mode)
   - **HashiCorp Vault**
   - **AWS Secrets Manager** / **Azure Key Vault**
   - **Kubernetes Secrets** (if using K8s)

---

## GitHub Container Registry Setup

### Step 1: Enable GitHub Packages

1. Go to your repository on GitHub
2. Click **Settings** → **Actions** → **General**
3. Under "Workflow permissions", ensure:
   - ✅ Read and write permissions
   - ✅ Allow GitHub Actions to create and approve pull requests

### Step 2: Automatic Builds

The workflow `.github/workflows/docker-build.yml` automatically:
- ✅ Builds Docker images on push to `main` branch
- ✅ Publishes to `ghcr.io/ndsrf/wine-tasting-game`
- ✅ Tags images with: `latest`, `main`, `sha-<commit>`
- ✅ Supports both AMD64 and ARM64 architectures

### Step 3: Make Container Public (Optional)

By default, GHCR packages are private. To make them public:

1. Go to your GitHub profile → **Packages**
2. Find `wine-tasting-game`
3. Click **Package settings**
4. Scroll to "Danger Zone" → **Change visibility** → **Public**

Alternatively, authenticate Docker to pull private images:

```bash
# Create a GitHub Personal Access Token (PAT)
# Settings → Developer settings → Personal access tokens → Tokens (classic)
# Required scope: read:packages

# Login to GHCR
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

---

## Deployment Options

### Option A: Docker Compose (Recommended)

Includes PostgreSQL and Redis containers managed together.

### Option B: Standalone Docker

Use existing PostgreSQL and Redis instances.

---

## Proxmox LXC Deployment

### Prerequisites

1. **Create Ubuntu LXC Container** in Proxmox:
   - Template: Ubuntu 22.04 or newer
   - Features: **Enable "Nesting"** (for Docker support)
   - Resources: 2+ CPU cores, 4GB+ RAM, 20GB+ storage

2. **Install Docker in LXC**:
   ```bash
   # SSH into your LXC
   ssh root@<lxc-ip>

   # Update system
   apt update && apt upgrade -y

   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh

   # Install Docker Compose
   apt install docker-compose -y

   # Verify installation
   docker --version
   docker-compose --version
   ```

### Deployment Steps

#### 1. Create deployment directory

```bash
mkdir -p /opt/wine-tasting
cd /opt/wine-tasting
```

#### 2. Create `.env` file

```bash
# Copy from your secure location or create new
nano .env
```

**Example `.env` content:**

```bash
# Database
DATABASE_URL="postgresql://wineuser:CHANGE_ME_STRONG_PASSWORD@postgres:5432/wine_tasting_db"
POSTGRES_USER="wineuser"
POSTGRES_PASSWORD="CHANGE_ME_STRONG_PASSWORD"
POSTGRES_DB="wine_tasting_db"
POSTGRES_PORT="5432"

# Authentication (generate with: openssl rand -hex 32)
NEXTAUTH_SECRET="your-generated-secret-here"
JWT_SECRET="your-generated-jwt-secret-here"
NEXTAUTH_URL="http://YOUR_SERVER_IP:3000"

# OpenAI
OPENAI_API_KEY="sk-your-real-api-key"

# Redis
REDIS_URL="redis://:CHANGE_ME_REDIS_PASSWORD@redis:6379"
REDIS_PASSWORD="CHANGE_ME_REDIS_PASSWORD"

# Application
NODE_ENV="production"
APP_PORT="3000"

# GitHub Container Registry
GITHUB_REPOSITORY="ndsrf/wine-tasting-game"
```

**Secure the file:**
```bash
chmod 600 .env
```

#### 3. Download `docker-compose.yml`

```bash
# Download from your repository
wget https://raw.githubusercontent.com/ndsrf/wine-tasting-game/main/docker-compose.yml

# Or create manually
nano docker-compose.yml
# (paste the docker-compose.yml content)
```

#### 4. Pull and start containers

```bash
# Pull latest image from GHCR
docker-compose pull

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f app
```

#### 5. Initialize database

```bash
# Run Prisma migrations
docker-compose exec app npx prisma db push

# Verify database connection
docker-compose exec app npx prisma db pull
```

#### 6. Verify deployment

```bash
# Check running containers
docker-compose ps

# Test application
curl http://localhost:3000

# View logs
docker-compose logs -f
```

### Access the Application

- **Local**: http://localhost:3000
- **Network**: http://YOUR_LXC_IP:3000

### Managing the Deployment

```bash
# Stop containers
docker-compose down

# Stop and remove volumes (⚠️ deletes database!)
docker-compose down -v

# Restart containers
docker-compose restart

# Update to latest image
docker-compose pull
docker-compose up -d

# View logs
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f redis

# Execute commands in container
docker-compose exec app sh
docker-compose exec postgres psql -U wineuser -d wine_tasting_db
```

---

## Updating the Application

### Method 1: Pull Latest Image

```bash
cd /opt/wine-tasting
docker-compose pull app
docker-compose up -d app
```

### Method 2: Automatic Updates with Watchtower

```bash
# Add to docker-compose.yml
services:
  watchtower:
    image: containrrr/watchtower
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    command: --interval 300 --cleanup
```

---

## Backup and Restore

### Backup Database

```bash
# Backup
docker-compose exec postgres pg_dump -U wineuser wine_tasting_db > backup-$(date +%Y%m%d).sql

# Restore
docker-compose exec -T postgres psql -U wineuser wine_tasting_db < backup-20250101.sql
```

### Backup Volumes

```bash
# Backup all data
docker run --rm \
  -v wine-tasting_postgres-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres-backup.tar.gz /data
```

---

## Reverse Proxy Setup (Optional)

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name wine.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support for Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

### Enable SSL with Certbot

```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d wine.yourdomain.com

# Update NEXTAUTH_URL in .env
NEXTAUTH_URL="https://wine.yourdomain.com"
```

---

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs app

# Check environment variables
docker-compose config

# Rebuild without cache
docker-compose build --no-cache app
```

### Database connection issues

```bash
# Verify database is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres pg_isready -U wineuser
```

### Can't pull image from GHCR

```bash
# Login to GitHub Container Registry
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Or make package public in GitHub settings
```

---

## Security Checklist

- [ ] `.env` file has `chmod 600` permissions
- [ ] Strong passwords for PostgreSQL and Redis
- [ ] `NEXTAUTH_SECRET` and `JWT_SECRET` generated with `openssl rand -hex 32`
- [ ] OpenAI API key is valid and has usage limits set
- [ ] Firewall configured (only ports 80, 443, 22 exposed externally)
- [ ] Regular backups scheduled
- [ ] Docker containers set to auto-restart (`restart: unless-stopped`)
- [ ] Monitoring/logging configured
- [ ] SSL certificate installed for production

---

## Support

- **Issues**: https://github.com/ndsrf/wine-tasting-game/issues
- **Documentation**: Check README.md
- **Docker Logs**: `docker-compose logs -f`

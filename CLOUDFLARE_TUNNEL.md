# Cloudflare Zero Trust Tunnel Deployment Guide

This guide explains how to deploy the Wine Tasting Game using Cloudflare Zero Trust Tunnels (formerly Argo Tunnel) with Docker in a Proxmox LXC container.

## Table of Contents
- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Cloudflare Zero Trust Setup](#cloudflare-zero-trust-setup)
- [Application Configuration](#application-configuration)
- [Tunnel Configuration](#tunnel-configuration)
- [Deployment Steps](#deployment-steps)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

---

## Overview

Cloudflare Zero Trust Tunnels provide secure access to your application without exposing ports or configuring firewall rules. The tunnel:
- ✅ Provides automatic HTTPS with Cloudflare certificates
- ✅ Protects against DDoS attacks
- ✅ Supports WebSocket connections (required for Socket.io)
- ✅ No inbound firewall rules needed
- ✅ Free for personal use

**Socket.io Compatibility**: This application has been configured to work seamlessly with Cloudflare tunnels by enabling proper WebSocket transport and CORS settings.

---

## Prerequisites

### 1. Cloudflare Account
- Free Cloudflare account
- Domain added to Cloudflare (with nameservers pointed to Cloudflare)

### 2. Proxmox LXC with Docker
- Ubuntu 22.04+ LXC container with Docker installed
- Follow [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) for LXC and Docker setup
- Application running on port 3000

### 3. System Requirements
- 2+ CPU cores
- 4GB+ RAM
- 20GB+ storage

---

## Cloudflare Zero Trust Setup

### Step 1: Access Zero Trust Dashboard

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **Zero Trust** (or navigate to `https://one.dash.cloudflare.com/`)
3. If first time, complete the Zero Trust setup wizard

### Step 2: Create a Tunnel

1. In Zero Trust Dashboard, go to **Networks** → **Tunnels**
2. Click **Create a tunnel**
3. Select **Cloudflared** as the connector type
4. Name your tunnel (e.g., `wine-tasting-app`)
5. Click **Save tunnel**

### Step 3: Install Cloudflared in LXC

Cloudflare will provide installation commands. SSH into your LXC and run:

```bash
# SSH into your LXC container
ssh root@<lxc-ip>

# Download and install cloudflared (for Debian/Ubuntu)
# Method 1: Using Cloudflare's repository (recommended)
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/cloudflared.list
apt update
apt install cloudflared -y

# Verify installation
cloudflared --version
```

### Step 4: Authenticate Cloudflared

Run the authentication command provided by Cloudflare:

```bash
cloudflared tunnel login
```

This opens a browser window. Select your domain and authorize the tunnel.

---

## Application Configuration

### Update Environment Variables

Edit your `.env` file in `/opt/wine-tasting/.env`:

```bash
cd /opt/wine-tasting
nano .env
```

Add or update these variables:

```bash
# Your Cloudflare tunnel URL
NEXTAUTH_URL="https://wine.yourdomain.com"

# Allowed origins for CORS (use your tunnel domain)
ALLOWED_ORIGINS="https://wine.yourdomain.com"

# Keep your other variables
DATABASE_URL="postgresql://wineuser:STRONG_PASSWORD@postgres:5432/wine_tasting_db"
POSTGRES_USER="wineuser"
POSTGRES_PASSWORD="STRONG_PASSWORD"
POSTGRES_DB="wine_tasting_db"
NEXTAUTH_SECRET="your-generated-secret"
JWT_SECRET="your-generated-jwt-secret"

# LLM Provider Configuration
# Choose LLM provider: "openai" (default), "gemini", or "anthropic"
LLM_PROVIDER="openai"

# OpenAI Configuration
OPENAI_API_KEY="sk-your-openai-api-key-here"
OPENAI_MODEL="gpt-4"

# Google Gemini Configuration (only needed if LLM_PROVIDER="gemini")
GEMINI_API_KEY="your-gemini-api-key-here"
GEMINI_MODEL="gemini-2.5-pro"

# Anthropic Configuration (only needed if LLM_PROVIDER="anthropic")
ANTHROPIC_API_KEY="sk-ant-your-anthropic-api-key-here"
ANTHROPIC_MODEL="claude-3-5-sonnet-20241022"

REDIS_URL="redis://:REDIS_PASSWORD@redis:6379"
REDIS_PASSWORD="REDIS_PASSWORD"
NODE_ENV="production"
APP_PORT="3000"
GITHUB_REPOSITORY="ndsrf/wine-tasting-game"
```

**Important**: Replace `wine.yourdomain.com` with your actual domain.

---

## Tunnel Configuration

### Create Tunnel Configuration File

Create a configuration file for cloudflared:

```bash
mkdir -p /etc/cloudflared
nano /etc/cloudflared/config.yml
```

Add the following configuration:

```yaml
tunnel: <YOUR_TUNNEL_ID>
credentials-file: /root/.cloudflared/<YOUR_TUNNEL_ID>.json

# Ingress rules
ingress:
  # Route for your domain
  - hostname: wine.yourdomain.com
    service: http://localhost:3000
    originRequest:
      # Enable WebSocket support for Socket.io
      noTLSVerify: false
      connectTimeout: 30s
      # Important: Disable chunked encoding for WebSockets
      disableChunkedEncoding: true
      # HTTP2 origin support
      http2Origin: false

  # Catch-all rule (required)
  - service: http_status:404
```

**Replace**:
- `<YOUR_TUNNEL_ID>` with your actual tunnel ID from Cloudflare dashboard
- `wine.yourdomain.com` with your domain

### Understanding the Configuration

- **`tunnel`**: Your tunnel ID from Cloudflare
- **`credentials-file`**: Path to the tunnel credentials (auto-generated during setup)
- **`service: http://localhost:3000`**: Points to your Docker container
- **`disableChunkedEncoding: true`**: Critical for WebSocket/Socket.io compatibility
- **`http2Origin: false`**: Uses HTTP/1.1 for better Socket.io compatibility

---

## Deployment Steps

### Step 1: Deploy Application with Docker

Follow the standard Docker deployment:

```bash
cd /opt/wine-tasting

# Pull latest image
docker-compose pull

# Start containers
docker-compose up -d

# Initialize database
docker-compose exec app npx prisma db push

# Verify application is running
curl http://localhost:3000
```

### Step 2: Configure DNS in Cloudflare

1. Go to Cloudflare Dashboard → Zero Trust → Networks → Tunnels
2. Select your tunnel → **Public Hostname**
3. Click **Add a public hostname**
4. Configure:
   - **Subdomain**: `wine` (or your choice)
   - **Domain**: `yourdomain.com`
   - **Service Type**: `HTTP`
   - **URL**: `localhost:3000`
5. Expand **Additional application settings**:
   - Enable **WebSocket**
   - Set **Connect Timeout**: `30s`
   - Enable **No TLS Verify** (if using self-signed certs, otherwise leave off)
6. Click **Save hostname**

### Step 3: Start Cloudflared Service

Install and start cloudflared as a system service:

```bash
# Install the tunnel as a service
cloudflared service install

# Start the service
systemctl start cloudflared

# Enable auto-start on boot
systemctl enable cloudflared

# Check status
systemctl status cloudflared
```

### Step 4: Restart Application

Restart the Docker containers to apply the new environment variables:

```bash
cd /opt/wine-tasting
docker-compose restart app
```

---

## Verification

### Check Tunnel Status

```bash
# Check cloudflared service
systemctl status cloudflared

# View cloudflared logs
journalctl -u cloudflared -f

# Test tunnel connectivity
cloudflared tunnel info <YOUR_TUNNEL_ID>
```

### Test Application Access

1. **DNS Propagation**: Wait 1-2 minutes for DNS to propagate
2. **Access your application**: `https://wine.yourdomain.com`
3. **Check HTTPS**: Should show valid Cloudflare certificate
4. **Test Socket.io**:
   - Create a game as director
   - Join as a player in another browser/incognito window
   - Verify real-time updates work (player list updates, phase changes, etc.)

### Browser Console Tests

Open browser console (F12) on the game page:

```javascript
// Check Socket.io connection
// Should see: "🔌 User connected: <socket-id>" in console
```

Look for these in the Network tab:
- ✅ `socket.io/?EIO=4&transport=websocket` - WebSocket connection established
- ✅ Status code: `101 Switching Protocols`

---

## Troubleshooting

### Socket.io Connection Issues

**Problem**: Socket.io fails to connect or falls back to polling only

**Solution**:
```bash
# 1. Verify WebSocket is enabled in tunnel config
cat /etc/cloudflared/config.yml | grep -A5 originRequest

# Should see:
#   disableChunkedEncoding: true

# 2. Check cloudflared logs
journalctl -u cloudflared -f | grep -i websocket

# 3. Restart cloudflared
systemctl restart cloudflared

# 4. Restart application
cd /opt/wine-tasting && docker-compose restart app
```

### CORS Errors

**Problem**: Browser console shows CORS errors

**Solution**:
```bash
# 1. Verify ALLOWED_ORIGINS in .env
cat /opt/wine-tasting/.env | grep ALLOWED_ORIGINS

# Should be:
# ALLOWED_ORIGINS="https://wine.yourdomain.com"

# 2. Restart application
cd /opt/wine-tasting && docker-compose restart app
```

### Tunnel Disconnects

**Problem**: Tunnel shows as "Down" in Cloudflare dashboard

**Solution**:
```bash
# 1. Check cloudflared status
systemctl status cloudflared

# 2. View recent errors
journalctl -u cloudflared -n 50

# 3. Restart cloudflared
systemctl restart cloudflared

# 4. Verify network connectivity
ping 1.1.1.1
curl https://cloudflare.com
```

### Application Not Accessible

**Problem**: Cannot access `https://wine.yourdomain.com`

**Checklist**:
```bash
# 1. Verify application is running
docker-compose ps
curl http://localhost:3000

# 2. Check DNS configuration in Cloudflare
# Go to Cloudflare Dashboard → DNS → Records
# Should see CNAME record: wine.yourdomain.com → <tunnel-id>.cfargotunnel.com

# 3. Verify tunnel is running
systemctl status cloudflared
cloudflared tunnel list

# 4. Check cloudflared logs
journalctl -u cloudflared -f
```

### Real-time Features Not Working

**Problem**: Players don't see updates in real-time

**Debug Steps**:
```bash
# 1. Check Socket.io connection in browser console
# Should see WebSocket connection, not polling

# 2. Verify WebSocket settings in Cloudflare dashboard
# Go to tunnel → Public hostname → Edit
# Ensure WebSocket is ENABLED

# 3. Test with multiple browsers
# Open director panel in one browser
# Open player join in another (or incognito)
# Start game and verify player sees updates

# 4. Check application logs
docker-compose logs -f app | grep -i socket
```

### Environment Variables Not Applied

**Problem**: Application doesn't reflect new ALLOWED_ORIGINS setting

**Solution**:
```bash
# 1. Verify .env file
cat /opt/wine-tasting/.env

# 2. Verify docker-compose reads .env
cd /opt/wine-tasting
docker-compose config | grep ALLOWED_ORIGINS

# 3. Recreate containers (not just restart)
docker-compose down
docker-compose up -d

# 4. Verify inside container
docker-compose exec app printenv | grep ALLOWED_ORIGINS
```

---

## Advanced Configuration

### Multiple Domains

To support multiple domains (staging, production):

**.env**:
```bash
ALLOWED_ORIGINS="https://wine.yourdomain.com,https://wine-staging.yourdomain.com"
```

**/etc/cloudflared/config.yml**:
```yaml
ingress:
  - hostname: wine.yourdomain.com
    service: http://localhost:3000
    originRequest:
      disableChunkedEncoding: true

  - hostname: wine-staging.yourdomain.com
    service: http://localhost:3000
    originRequest:
      disableChunkedEncoding: true

  - service: http_status:404
```

### Access Policies (Optional)

Add authentication before accessing your app:

1. Cloudflare Dashboard → Zero Trust → Access → Applications
2. **Add an application**
3. Select **Self-hosted**
4. Configure:
   - **Application name**: Wine Tasting Game
   - **Session Duration**: 24 hours
   - **Application domain**: `wine.yourdomain.com`
5. Add an **Access Policy**:
   - **Policy name**: Allow specific emails
   - **Action**: Allow
   - **Include**: Emails → `you@example.com`
6. Save

Now users must authenticate via email before accessing the app.

### Monitoring

Monitor tunnel health:

```bash
# Install monitoring script
cat > /usr/local/bin/check-tunnel.sh << 'EOF'
#!/bin/bash
if ! systemctl is-active --quiet cloudflared; then
    echo "Cloudflared is down! Restarting..."
    systemctl restart cloudflared
fi
EOF

chmod +x /usr/local/bin/check-tunnel.sh

# Add to crontab (check every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/check-tunnel.sh") | crontab -
```

---

## Performance Optimization

### Cloudflare Settings

1. **Cloudflare Dashboard** → Your domain → **Speed**
2. Enable:
   - ✅ Auto Minify (JavaScript, CSS, HTML)
   - ✅ Brotli compression
   - ✅ HTTP/2 to Origin
3. **Caching** → **Configuration**:
   - Cache Level: **Standard**
   - Browser Cache TTL: **4 hours**

### Application Optimization

```bash
# Add Redis memory limit to docker-compose.yml
# Edit /opt/wine-tasting/docker-compose.yml
nano /opt/wine-tasting/docker-compose.yml

# Under redis service, add:
#   deploy:
#     resources:
#       limits:
#         memory: 512M

# Restart containers
docker-compose up -d
```

---

## Backup Configuration

### Backup Tunnel Credentials

```bash
# Backup tunnel credentials
mkdir -p ~/backups
cp /root/.cloudflared/*.json ~/backups/
cp /etc/cloudflared/config.yml ~/backups/

# Secure permissions
chmod 600 ~/backups/*.json
```

### Restore Tunnel

If you need to restore on a new LXC:

```bash
# 1. Install cloudflared
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/cloudflared.list
apt update && apt install cloudflared -y

# 2. Restore credentials
mkdir -p /root/.cloudflared
cp ~/backups/*.json /root/.cloudflared/

# 3. Restore config
mkdir -p /etc/cloudflared
cp ~/backups/config.yml /etc/cloudflared/

# 4. Install and start service
cloudflared service install
systemctl start cloudflared
systemctl enable cloudflared
```

---

## Security Best Practices

- ✅ Use strong passwords for database and Redis
- ✅ Keep cloudflared updated: `apt update && apt upgrade cloudflared`
- ✅ Enable Cloudflare WAF (Web Application Firewall) rules
- ✅ Use Cloudflare Access policies to restrict who can access the app
- ✅ Regular backups of database and tunnel configuration
- ✅ Monitor tunnel logs for suspicious activity
- ✅ Set `ALLOWED_ORIGINS` to specific domains (not wildcard)
- ✅ Keep Docker containers updated

---

## Support

- **Cloudflare Tunnels Documentation**: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- **Socket.io with Cloudflare**: https://socket.io/docs/v4/cloudflare/
- **Application Issues**: https://github.com/ndsrf/wine-tasting-game/issues
- **Cloudflare Community**: https://community.cloudflare.com/

---

## Summary Checklist

- [ ] Cloudflare account created and domain added
- [ ] Zero Trust tunnel created in Cloudflare dashboard
- [ ] Cloudflared installed in LXC container
- [ ] Tunnel configuration file created with WebSocket settings
- [ ] `.env` file updated with `NEXTAUTH_URL` and `ALLOWED_ORIGINS`
- [ ] Docker containers deployed and running
- [ ] Cloudflared service installed and running
- [ ] DNS configured in Cloudflare (CNAME record)
- [ ] Application accessible via `https://wine.yourdomain.com`
- [ ] Socket.io WebSocket connection verified in browser console
- [ ] Real-time features tested (director + player interaction)
- [ ] Tunnel credentials backed up
- [ ] Monitoring/health checks configured

**🎉 Congratulations!** Your Wine Tasting Game is now securely deployed with Cloudflare Zero Trust Tunnels!

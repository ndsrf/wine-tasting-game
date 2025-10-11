# Quick Fix: Watchtower DNS Issue

## Problem
Watchtower shows error:
```
Unable to update container: dial tcp: lookup ghcr.io on 192.168.1.2:53: read udp: i/o timeout
```

## Root Cause
LXC container's DNS server (192.168.1.2) is not responding or blocking DNS queries from Docker containers.

## Solution (Choose One)

### Option 1: Update docker-compose.yml (Recommended)

1. **Download the updated docker-compose.yml** from this repo to your LXC:
   ```bash
   ssh root@<lxc-ip>
   cd /opt/wine-tasting

   # Backup current file
   cp docker-compose.yml docker-compose.yml.backup

   # Download updated version
   wget -O docker-compose.yml https://raw.githubusercontent.com/ndsrf/wine-tasting-game/main/docker-compose.yml
   ```

2. **Recreate containers with new DNS settings:**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

3. **Verify Watchtower can now access GHCR:**
   ```bash
   # Check Watchtower logs
   docker-compose logs -f watchtower

   # Should see successful checks, not DNS errors
   ```

### Option 2: Configure Docker Daemon (System-wide)

1. **SSH into your LXC:**
   ```bash
   ssh root@<lxc-ip>
   ```

2. **Create/edit Docker daemon configuration:**
   ```bash
   nano /etc/docker/daemon.json
   ```

3. **Add DNS configuration:**
   ```json
   {
     "dns": ["1.1.1.1", "8.8.8.8"]
   }
   ```

4. **Restart Docker:**
   ```bash
   systemctl restart docker

   # Restart your containers
   cd /opt/wine-tasting
   docker-compose restart
   ```

## Verification

Test DNS resolution inside containers:

```bash
# Test from app container
docker-compose exec app nslookup ghcr.io

# Test from Watchtower
docker exec wine-tasting-watchtower nslookup ghcr.io

# Should return IP addresses, not errors
```

## Check Watchtower is Working

```bash
# View Watchtower logs
docker-compose logs -f watchtower

# You should see logs like:
# level=info msg="Checking image for app"
# level=info msg="Found new version for app"
# (or "Image is up to date" if no updates)
```

## What Changed

The updated `docker-compose.yml` includes:

1. **DNS settings for app container:**
   ```yaml
   app:
     dns:
       - 1.1.1.1  # Cloudflare DNS
       - 8.8.8.8  # Google DNS
   ```

2. **DNS settings for Watchtower:**
   ```yaml
   watchtower:
     dns:
       - 1.1.1.1
       - 8.8.8.8
   ```

3. **Watchtower configuration:**
   ```yaml
   environment:
     - WATCHTOWER_CLEANUP=true
     - WATCHTOWER_POLL_INTERVAL=300  # Check every 5 minutes
   ```

## Understanding DNS Settings

- **1.1.1.1** - Cloudflare DNS (fast, privacy-focused)
- **8.8.8.8** - Google DNS (reliable fallback)

These public DNS servers replace your LXC's local DNS (192.168.1.2) which was timing out.

## Why This Happens in LXC

LXC containers often inherit the host's DNS settings, which may:
- Not allow Docker bridge network queries
- Have firewall rules blocking Docker containers
- Be unreachable from the Docker network namespace

Using public DNS servers bypasses these issues.

## Alternative: Use Your Router's DNS

If you prefer to use your local DNS, you can replace the IPs:

```yaml
dns:
  - 192.168.1.1  # Your router IP
  - 1.1.1.1      # Fallback
```

But ensure your router/DNS server accepts queries from the Docker network (usually 172.x.x.x).

## Still Not Working?

### Debug Steps:

1. **Check if containers can reach the internet:**
   ```bash
   docker-compose exec app ping -c 3 1.1.1.1
   ```

2. **Check if DNS resolution works:**
   ```bash
   docker-compose exec app nslookup google.com
   ```

3. **Check LXC networking:**
   ```bash
   # On LXC host (Proxmox)
   pct config <container-id> | grep net

   # Ensure network is not restricted
   ```

4. **Check Docker network:**
   ```bash
   docker network inspect wine-tasting_wine-tasting-network
   ```

5. **Restart everything:**
   ```bash
   cd /opt/wine-tasting
   docker-compose down
   systemctl restart docker
   docker-compose up -d
   ```

## Success Indicators

After applying the fix, you should see:

✅ Watchtower logs show successful image checks
✅ No "lookup ghcr.io: i/o timeout" errors
✅ `docker-compose pull` works without errors
✅ Watchtower automatically updates containers when new images are available

## Manual Update (If Watchtower Still Fails)

You can always manually update:

```bash
cd /opt/wine-tasting
docker-compose pull app
docker-compose up -d app
```

This uses your LXC's DNS directly, not Docker's internal DNS.

# Deployment Guide - Using Pre-built Artifacts

This guide shows how to deploy the application using pre-built JAR and frontend bundle **without compilation** in the target environment.

## Prerequisites

- **Java 17+** installed (`java -version`)
- **Web server** (Nginx, Apache, or simple HTTP server)
- Pre-built artifacts:
  - `backend/target/cassandra-browser-api-1.0.0.jar`
  - `frontend/dist/` folder

---

## Step 1: Run Backend (Using JAR)

### Copy JAR to server
```bash
# Copy JAR file to your server
scp backend/target/cassandra-browser-api-1.0.0.jar user@your-server:/opt/odp360/
```

### Run Backend
```bash
cd /opt/odp360
java -jar cassandra-browser-api-1.0.0.jar
```

**Or run in background:**
```bash
nohup java -jar cassandra-browser-api-1.0.0.jar > backend.log 2>&1 &
```

**Or as a service (systemd):**
```bash
# Create service file: /etc/systemd/system/odp360-backend.service
[Unit]
Description=ODP360 Backend API
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/opt/odp360
ExecStart=/usr/bin/java -jar /opt/odp360/cassandra-browser-api-1.0.0.jar
Restart=always

[Install]
WantedBy=multi-user.target

# Enable and start
sudo systemctl enable odp360-backend
sudo systemctl start odp360-backend
```

Backend runs on: `http://localhost:8080`

---

## Step 2: Validate Backend

```bash
curl http://localhost:8080/api/clusters
```

**Expected response:**
```json
[]
```

If you see `[]` (empty array), backend is working correctly.

**Check if running:**
```bash
curl http://localhost:8080/api/clusters
# OR
ps aux | grep cassandra-browser-api
# OR
netstat -tuln | grep 8080
```

---

## Step 3: Deploy Frontend (Using Pre-built Bundle)

### Option A: Using Nginx (Recommended)

**Copy frontend files:**
```bash
# Copy dist folder to server
scp -r frontend/dist/* user@your-server:/var/www/odp360/
```

**Configure Nginx:**
```bash
# Create: /etc/nginx/sites-available/odp360
server {
    listen 80;
    server_name your-hostname.com;  # or localhost
    
    root /var/www/odp360;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Enable and start:**
```bash
sudo ln -s /etc/nginx/sites-available/odp360 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option B: Using Docker (Easiest)

**Copy dist folder:**
```bash
scp -r frontend/dist user@your-server:/opt/odp360/frontend-dist
```

**Run with Docker:**
```bash
docker run -d \
  -p 80:80 \
  -v /opt/odp360/frontend-dist:/usr/share/nginx/html:ro \
  --name odp360-frontend \
  nginx:alpine
```

### Option C: Using Simple HTTP Server (Testing)

```bash
# Copy dist folder
scp -r frontend/dist user@your-server:/opt/odp360/frontend-dist

# Run Python HTTP server
cd /opt/odp360/frontend-dist
python3 -m http.server 8000
```

### Option D: Using Apache

**Copy files:**
```bash
scp -r frontend/dist/* user@your-server:/var/www/html/odp360/
```

**Configure Apache:**
```bash
# Create: /etc/apache2/sites-available/odp360.conf
<VirtualHost *:80>
    ServerName your-hostname.com
    DocumentRoot /var/www/html/odp360
    
    <Directory /var/www/html/odp360>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    ProxyPass /api http://localhost:8080/api
    ProxyPassReverse /api http://localhost:8080/api
</VirtualHost>
```

**Enable:**
```bash
sudo a2ensite odp360
sudo systemctl restart apache2
```

---

## Step 4: Validate Frontend

1. Open browser: `http://your-server` (or `http://localhost:8000` if using Python server)
2. You should see:
   - "Online Data Platform" header with logo
   - Tabs: "Data Catalog", "C* Query", "YB Query", "Deployment"
   - "C* Query" tab shows the Cassandra browser interface

**Quick test:**
```bash
curl http://localhost  # or http://localhost:8000
# Should return HTML content
```

---

## Complete Deployment Checklist

- [ ] Copy JAR file to server: `backend/target/cassandra-browser-api-1.0.0.jar`
- [ ] Copy frontend dist folder: `frontend/dist/*`
- [ ] Install Java 17+ on server
- [ ] Run backend JAR: `java -jar cassandra-browser-api-1.0.0.jar`
- [ ] Validate backend: `curl http://localhost:8080/api/clusters`
- [ ] Configure web server (Nginx/Apache/Docker)
- [ ] Deploy frontend files
- [ ] Validate frontend: Open browser and verify UI loads
- [ ] Configure API URL if needed (see below)

---

## Configure API URL (If Backend is on Different Server)

If backend and frontend are on different servers, you need to set the API URL:

**Option 1: Build-time (before copying dist/)**
```bash
cd frontend
VITE_API_BASE_URL=http://your-backend-server:8080/api npm run build
# Then copy the new dist/ folder
```

**Option 2: Runtime configuration**
Create `dist/config.js`:
```javascript
window.APP_CONFIG = {
  API_BASE_URL: 'http://your-backend-server:8080/api'
}
```

Update `frontend/src/services/cassandraApi.js` to read from `window.APP_CONFIG`.

---

## File Structure on Server

```
/opt/odp360/
├── cassandra-browser-api-1.0.0.jar  # Backend JAR
└── backend.log                      # Backend logs (if using nohup)

/var/www/odp360/  (or /opt/odp360/frontend-dist/)
├── index.html
└── assets/
    ├── index-*.js
    ├── index-*.css
    └── logo-*.png
```

---

## Quick Start Commands

```bash
# 1. Start Backend
java -jar /opt/odp360/cassandra-browser-api-1.0.0.jar

# 2. Validate Backend
curl http://localhost:8080/api/clusters

# 3. Frontend is served by Nginx/Apache (already running)

# 4. Validate Frontend
curl http://localhost
# OR open browser: http://your-server
```

---

## Troubleshooting

**Backend not starting?**
- Check Java version: `java -version` (needs 17+)
- Check port 8080 is available: `netstat -tuln | grep 8080`
- Check logs: `tail -f backend.log` or `journalctl -u odp360-backend`

**Frontend not loading?**
- Check web server is running: `sudo systemctl status nginx`
- Check files exist: `ls -la /var/www/odp360/`
- Check permissions: `sudo chown -R www-data:www-data /var/www/odp360/`

**API calls failing?**
- Verify backend is running: `curl http://localhost:8080/api/clusters`
- Check CORS configuration (see DEPLOYMENT_CONFIG.md)
- Check API URL in frontend configuration

---

## Using Tar Archive (Optional)

If you want to package everything:

**Create tar:**
```bash
# On build machine
tar -czf odp360-backend.tar.gz backend/target/cassandra-browser-api-1.0.0.jar
tar -czf odp360-frontend.tar.gz -C frontend dist
```

**Extract on server:**
```bash
# On target server
tar -xzf odp360-backend.tar.gz
tar -xzf odp360-frontend.tar.gz
```

Then follow steps above.


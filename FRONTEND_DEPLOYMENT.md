# Frontend Deployment Guide

The frontend can be deployed as a **static build** that doesn't require Node.js or compilation in the target environment.

## Production Build

### Build the Frontend

```bash
cd frontend
npm install  # First time only
npm run build
```

This creates a `dist/` directory with all static files (HTML, CSS, JS, assets).

**Build Output:**
- Location: `frontend/dist/`
- Size: ~2.1 MB (includes logo and all assets)
- Contents: Static HTML, CSS, JavaScript bundles

---

## Deployment Options

### Option 1: Nginx (Recommended for Production)

**Step 1: Copy build files to server**
```bash
# On your VM/server
scp -r frontend/dist/* user@your-server:/var/www/odp360/
```

**Step 2: Configure Nginx**

Create `/etc/nginx/sites-available/odp360`:
```nginx
server {
    listen 80;
    server_name odp360.example.com;  # Your domain/hostname
    
    root /var/www/odp360;
    index index.html;
    
    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**Step 3: Enable and restart Nginx**
```bash
sudo ln -s /etc/nginx/sites-available/odp360 /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

---

### Option 2: Docker (Easiest - Self-contained)

**Step 1: Build Docker image**
```bash
cd frontend
docker build -t odp360-frontend .
```

**Step 2: Run container**
```bash
docker run -d \
  -p 80:80 \
  -e VITE_API_BASE_URL=http://your-backend-host:8080/api \
  --name odp360-frontend \
  odp360-frontend
```

**Or use docker-compose:**
```yaml
frontend:
  build: ./frontend
  ports:
    - "80:80"
  environment:
    - VITE_API_BASE_URL=http://backend-host:8080/api
```

---

### Option 3: Simple HTTP Server (For Testing)

**Using Python:**
```bash
cd frontend/dist
python3 -m http.server 8000
# Access at http://localhost:8000
```

**Using Node.js serve:**
```bash
npm install -g serve
cd frontend/dist
serve -s . -l 8000
```

**Using PHP:**
```bash
cd frontend/dist
php -S localhost:8000
```

---

### Option 4: Apache HTTP Server

**Step 1: Copy files**
```bash
sudo cp -r frontend/dist/* /var/www/html/odp360/
```

**Step 2: Configure Apache**

Create `/etc/apache2/sites-available/odp360.conf`:
```apache
<VirtualHost *:80>
    ServerName odp360.example.com
    DocumentRoot /var/www/html/odp360
    
    <Directory /var/www/html/odp360>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    # Proxy API to backend
    ProxyPass /api http://localhost:8080/api
    ProxyPassReverse /api http://localhost:8080/api
</VirtualHost>
```

**Step 3: Enable and restart**
```bash
sudo a2ensite odp360
sudo systemctl restart apache2
```

---

## Environment Variables

The frontend uses `VITE_API_BASE_URL` to connect to the backend.

### For Static Deployment (Nginx/Apache)

**Option A: Build with environment variable**
```bash
# Set API URL during build
VITE_API_BASE_URL=http://your-backend:8080/api npm run build
```

**Option B: Use runtime configuration**
Create `dist/config.js`:
```javascript
window.APP_CONFIG = {
  API_BASE_URL: 'http://your-backend:8080/api'
}
```

Then update `frontend/src/services/cassandraApi.js` to use:
```javascript
const API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
```

### For Docker

Set via environment variable (build-time):
```bash
docker build --build-arg VITE_API_BASE_URL=http://backend:8080/api -t odp360-frontend .
```

Or use `.env.production`:
```bash
# frontend/.env.production
VITE_API_BASE_URL=http://your-backend:8080/api
```

---

## Quick Deployment Checklist

- [ ] Build frontend: `npm run build`
- [ ] Copy `dist/` folder to server
- [ ] Configure web server (Nginx/Apache)
- [ ] Set API base URL (environment variable or config)
- [ ] Configure CORS on backend (see DEPLOYMENT_CONFIG.md)
- [ ] Test: Open browser and verify API calls work
- [ ] Set up SSL/HTTPS (recommended for production)

---

## File Structure After Build

```
frontend/dist/
├── index.html          # Main HTML file
├── assets/
│   ├── index-*.js      # JavaScript bundles
│   ├── index-*.css     # CSS files
│   └── logo-*.png      # Images/assets
└── (other static files)
```

**Total size:** ~2.1 MB (compressed, ready to deploy)

---

## Advantages of Static Build

✅ **No Node.js required** on production server  
✅ **Fast loading** - optimized and minified  
✅ **Easy to deploy** - just copy files  
✅ **Works with any web server** (Nginx, Apache, etc.)  
✅ **CDN-friendly** - can be served from CDN  
✅ **Secure** - no server-side code execution  

---

## Troubleshooting

**API calls failing?**
- Check `VITE_API_BASE_URL` is set correctly
- Verify backend CORS allows your frontend domain
- Check browser console for errors

**404 errors on routes?**
- Ensure web server is configured to serve `index.html` for all routes (SPA routing)
- Check Nginx/Apache configuration has `try_files` or `RewriteRule`

**Assets not loading?**
- Verify all files in `dist/` are copied correctly
- Check file permissions on server
- Verify web server can access the files

---

## Production Best Practices

1. **Use HTTPS** - Set up SSL certificate (Let's Encrypt)
2. **Enable Gzip** - Nginx/Apache compression
3. **Set Cache Headers** - Cache static assets
4. **CDN** - Use CDN for faster global access
5. **Monitoring** - Set up error tracking and monitoring


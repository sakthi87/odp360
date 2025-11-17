# Deployment Configuration Guide

**✅ UPDATED: The application now automatically detects hostnames!**

Both frontend and backend automatically work with any VM hostname without manual configuration changes.

---

## Automatic Hostname Detection

### Frontend (UI)
- **Automatically detects** the server hostname from `window.location`
- Works with hostname, IP address, or localhost
- No configuration needed!

### Backend (API)
- **CORS is set to wildcard (`*`)** by default
- Accepts requests from any hostname/IP
- No configuration needed!

---

## Optional: Manual Configuration (If Needed)

If you want to restrict CORS to specific origins instead of allowing all:

### Backend CORS Configuration

**File: `backend/src/main/resources/application.properties`**
```properties
# Default (allows all origins):
spring.web.cors.allowed-origins=*

# Or specify specific origins:
spring.web.cors.allowed-origins=http://odp360.example.com,https://odp360.example.com
```

### Frontend API URL (Optional Override)

**File: `frontend/.env.production`** (if you want to override auto-detection)
```bash
VITE_API_BASE_URL=http://odp360.example.com:8080/api
```

**Note:** The frontend will auto-detect the hostname, so this is usually not needed.

---

## 3. Nginx Configuration (If using Docker)

### File: `frontend/nginx.conf`
**Line 3:**
```nginx
# Change from:
server_name localhost;

# To:
server_name odp360.example.com;
```

**Line 12:**
```nginx
# If backend is on same VM, keep as is (uses Docker service name):
proxy_pass http://backend:8080;

# If backend is on different server:
proxy_pass http://odp360.example.com:8080;
```

---

## 4. Docker Compose Configuration

### File: `docker-compose.yml`

**Frontend Port Mapping (Line 16):**
```yaml
# If you want to change the external port:
ports:
  - "80:80"  # Standard HTTP port
  # OR
  - "443:80"  # If using reverse proxy for HTTPS
```

**Backend Port Mapping (Line 7):**
```yaml
# If you want to change backend port:
ports:
  - "8080:8080"  # Keep as is, or change to your preferred port
```

---

## 5. Backend Server Port (Optional)

### File: `backend/src/main/resources/application.properties`
**Line 2:**
```properties
# Change if you want different port:
server.port=8080
# OR
server.port=9090
```

---

## Quick Setup Checklist

### For VM Deployment (No Configuration Needed!):

- [x] ✅ Frontend auto-detects hostname - **No changes needed**
- [x] ✅ Backend accepts all origins - **No changes needed**
- [ ] Deploy backend JAR
- [ ] Rebuild frontend: `cd frontend && npm run build`
- [ ] Deploy frontend `dist/` folder
- [ ] Access from any hostname - it works automatically!

**That's it!** The application automatically adapts to your VM hostname.

---

## Environment-Specific Configuration

### Development (Local)
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- API URL: `http://localhost:8080/api`

### Production (VM)
- Frontend: `http://odp360.example.com` (or `https://`)
- Backend: `http://odp360.example.com:8080` (or internal IP)
- API URL: `http://odp360.example.com:8080/api`

---

## Using Environment Variables (Best Practice)

### Backend: Use Spring Profiles

Create `backend/src/main/resources/application-prod.properties`:
```properties
server.port=8080
spring.web.cors.allowed-origins=http://odp360.example.com,https://odp360.example.com
```

Run with: `java -jar app.jar --spring.profiles.active=prod`

### Frontend: Use Build-time Environment Variables

Create `frontend/.env.production`:
```bash
VITE_API_BASE_URL=https://odp360.example.com/api
```

Build: `npm run build -- --mode production`

---

## Testing After Changes

1. **Test CORS:** Open browser console, check for CORS errors
2. **Test API:** Verify API calls work from frontend
3. **Test Connection:** Try adding a new Cassandra connection
4. **Test Query:** Execute a test query

---

## Common Issues

### CORS Error
- **Symptom:** `Access-Control-Allow-Origin` error in browser console
- **Fix:** Ensure backend CORS config includes your frontend URL

### API Connection Failed
- **Symptom:** Network error when calling API
- **Fix:** Check `VITE_API_BASE_URL` is correct and backend is accessible

### Mixed Content (HTTP/HTTPS)
- **Symptom:** HTTPS page trying to call HTTP API
- **Fix:** Use HTTPS for both frontend and backend, or configure reverse proxy


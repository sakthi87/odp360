# Deployment Configuration Guide

This guide shows all places where you need to change hostname/URLs when deploying to a VM or different environment.

## Example: Deploying to VM with hostname `odp360.example.com`

---

## 1. Backend CORS Configuration

### File: `backend/src/main/java/com/cassandra/browser/config/CorsConfig.java`
**Line 16:**
```java
// Change from:
.allowedOrigins("http://localhost:5173", "http://localhost:3000")

// To:
.allowedOrigins("http://odp360.example.com", "https://odp360.example.com")
```

### File: `backend/src/main/java/com/cassandra/browser/controller/ConnectionController.java`
**Line 17:**
```java
// Change from:
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})

// To:
@CrossOrigin(origins = {"http://odp360.example.com", "https://odp360.example.com"})
```

### File: `backend/src/main/java/com/cassandra/browser/controller/QueryController.java`
**Line 13:**
```java
// Change from:
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})

// To:
@CrossOrigin(origins = {"http://odp360.example.com", "https://odp360.example.com"})
```

### File: `backend/src/main/resources/application.properties`
**Line 5:**
```properties
# Change from:
spring.web.cors.allowed-origins=http://localhost:5173

# To:
spring.web.cors.allowed-origins=http://odp360.example.com,https://odp360.example.com
```

---

## 2. Frontend API Base URL

### Option A: Environment Variable (Recommended for Production)

Create file: `frontend/.env.production`
```bash
VITE_API_BASE_URL=http://odp360.example.com:8080/api
# OR if using HTTPS:
VITE_API_BASE_URL=https://odp360.example.com/api
```

**Note:** For production builds, set this before running `npm run build`

### Option B: Docker Environment Variable

**File: `docker-compose.yml`**
**Line 20:**
```yaml
# Change from:
- VITE_API_BASE_URL=http://localhost:8080/api

# To:
- VITE_API_BASE_URL=http://odp360.example.com:8080/api
# OR if backend is on same VM but different port:
- VITE_API_BASE_URL=http://odp360.example.com:8080/api
```

### File: `frontend/src/services/cassandraApi.js`
**Line 4:**
```javascript
// This already uses environment variable, so no code change needed
// Just ensure VITE_API_BASE_URL is set correctly
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'
```

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

### For VM Deployment with hostname `odp360.example.com`:

- [ ] Update `CorsConfig.java` - allowedOrigins
- [ ] Update `ConnectionController.java` - @CrossOrigin
- [ ] Update `QueryController.java` - @CrossOrigin  
- [ ] Update `application.properties` - spring.web.cors.allowed-origins
- [ ] Create `frontend/.env.production` with `VITE_API_BASE_URL`
- [ ] Update `docker-compose.yml` - VITE_API_BASE_URL (if using Docker)
- [ ] Update `nginx.conf` - server_name (if using Docker)
- [ ] Rebuild frontend: `cd frontend && npm run build`
- [ ] Restart backend service
- [ ] Test: Open `http://odp360.example.com` in browser

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


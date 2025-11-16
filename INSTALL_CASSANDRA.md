# Installing Cassandra for Local Testing

## ✅ Available Options

Both **Docker** and **Homebrew** are installed on your system!

- ✅ Docker: Installed (v28.3.3) - but daemon not running
- ✅ Homebrew: Installed (v4.6.18)

## Recommendation: Docker (Best Option)

**Why Docker is better:**
- ✅ Isolated environment (doesn't affect your system)
- ✅ Easy to start/stop/remove
- ✅ No system-wide installation
- ✅ Consistent across different machines
- ✅ Easy cleanup (just remove container)

**Steps:**
1. Start Docker Desktop application
2. Wait for it to fully start (whale icon in menu bar)
3. Run: `docker run --name cassandra-test -p 9042:9042 -d cassandra:latest`
4. Wait 30 seconds
5. Done!

---

## Alternative: Homebrew (If you prefer)

**Why Homebrew:**
- ✅ Permanent installation
- ✅ System service (starts automatically)
- ✅ Good for long-term development

**Steps:**
```bash
# Install Cassandra
brew install cassandra

# Start Cassandra
brew services start cassandra

# Or run manually
cassandra -f
```

**Note:** Homebrew installs Cassandra permanently on your system.

---

## Quick Comparison

| Feature | Docker | Homebrew |
|---------|--------|----------|
| Installation | Container (isolated) | System-wide |
| Startup | Manual (docker run) | Service (auto-start) |
| Cleanup | Easy (docker rm) | Requires uninstall |
| Resource Usage | Isolated | Shared with system |
| Best For | Testing/Development | Long-term use |

---

## My Recommendation

**Use Docker** because:
1. It's already installed
2. You just need to start Docker Desktop
3. Easier to manage (start/stop/remove)
4. Won't clutter your system
5. Perfect for testing

**To start Docker:**
1. Open Docker Desktop app (Applications folder)
2. Wait for it to start (whale icon appears)
3. Then run the docker command

Would you like me to help you start Cassandra with Docker once Docker Desktop is running?


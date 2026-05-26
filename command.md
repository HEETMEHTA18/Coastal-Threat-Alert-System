# 🌊 Coastal Guardian - Commands Guide

This file provides reference commands to rebuild the project and launch all components locally (AI models, Node.js backend, and React frontend).

---

## 🛠️ Rebuild the Project from Scratch

To clean up and rebuild all project dependencies using the correct Node.js version (`v20.19.0`) pre-bundled in `.tooling/`, run:

```bash
# 1. Add the correct Node.js v20.19.0 to PATH (Required for compatibility)
export PATH="$(pwd)/.tooling/node-official-20.19.0/node-v20.19.0-linux-x64/bin:$PATH"

# 2. Rebuild the Node.js Express backend (includes installing Prisma CLI locally)
cd backend
npm install
cd ..

# 3. Rebuild the React/Vite frontend
cd frontend
npm install
cd ..

# 4. Verify Python virtual environment dependencies
./.venv/bin/pip install -r ai-models/requirements.txt
```

---

## 🚀 Make All Services Live in One Go (Recommended)

To start all services concurrently in a single terminal with color-coded logs, simply run the launcher script from the project root:

```bash
./start_all.sh
```

### What this script does:
- Checks if ports `5173`, `3001`, and `8000` are free and automatically cleans them if they are occupied.
- Exports the Node.js `v20.19.0` binary path to avoid version mismatches.
- Launches the **AI Models FastAPI Service** on port `8000` (pre-configured to run the real models using `.venv/bin/uvicorn`, or falling back to `mock_server.py`).
- Launches the **Node.js Express Backend** on port `3001`.
- Launches the **React/Vite Frontend dev server** on port `5173`.
- Merges and prefixes all logs in real-time (`[AI]`, `[Backend]`, `[Frontend]`).
- Cleanly stops all services and releases ports on Ctrl+C.

---

## 🌐 Endpoint Details

Once live, the services can be accessed at:

| Service | Local URL | Port | Health Check |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | [http://localhost:5173](http://localhost:5173) | `5173` | Browser load |
| **Backend REST API** | [http://localhost:3001/api](http://localhost:3001/api) | `3001` | [http://localhost:3001/api/health](http://localhost:3001/api/health) |
| **AI Models Service** | [http://localhost:8000](http://localhost:8000) | `8000` | [http://localhost:8000/health](http://localhost:8000/health) |

---

## 🛑 Stopping and Port Cleanup

If any process gets orphaned or remains bound to a port:

```bash
# Release ports manually
fuser -k 5173/tcp  # Stop frontend
fuser -k 3001/tcp  # Stop backend
fuser -k 8000/tcp  # Stop AI models
```

# Multi-stage Dockerfile for single-service deployment
# Runs both Node.js backend and Python AI models

# Stage 1: Build Python dependencies
FROM python:3.11-slim as python-builder
WORKDIR /app/ai-models
COPY ai-models/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Final image with Node.js and Python
FROM node:20-slim

# Install Python
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Python dependencies from builder
COPY --from=python-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages

# Copy AI models
COPY ai-models /app/ai-models

# Copy backend
COPY backend/package*.json /app/backend/
WORKDIR /app/backend
RUN npm ci --production

COPY backend /app/backend

# Create startup script
WORKDIR /app
RUN echo '#!/bin/bash\n\
set -e\n\
PORT=${PORT:-10000}\n\
echo "🚀 Starting CTAS Combined Service on port $PORT"\n\
\n\
# Start AI models on port 8000 in background\n\
echo "📍 Starting AI Models API on port 8000..."\n\
cd /app/ai-models && python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 &\n\
AI_PID=$!\n\
\n\
# Wait for AI to be ready\n\
echo "⏳ Waiting for AI API to be ready..."\n\
sleep 5\n\
\n\
# Start backend on $PORT (foreground)\n\
echo "📍 Starting Backend on port $PORT..."\n\
cd /app/backend && PORT=$PORT node src/server.js &\n\
BACKEND_PID=$!\n\
\n\
# Forward signals\n\
trap "kill $AI_PID $BACKEND_PID 2>/dev/null" EXIT\n\
\n\
# Wait for backend (main process)\n\
wait $BACKEND_PID\n\
' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 10000

CMD ["/app/start.sh"]

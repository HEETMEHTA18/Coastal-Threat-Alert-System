#!/bin/bash
# Startup script for AI Models API on Render
# Ensures PORT environment variable is properly used

# Get PORT from environment or default to 10000
PORT=${PORT:-10000}

echo "🚀 Starting CTAS AI Models API on port $PORT"
echo "📝 Environment PORT variable: $PORT"

# Start uvicorn with the correct port
exec uvicorn api.main:app --host 0.0.0.0 --port $PORT# Start uvicorn with explicit port
cmd = [
    "uvicorn",
    "api.main:app",
    "--host", "0.0.0.0",
    "--port", str(port),
    "--workers", "1"
]

print(f"🔧 Running command: {' '.join(cmd)}")

# Execute uvicorn
sys.exit(subprocess.call(cmd))

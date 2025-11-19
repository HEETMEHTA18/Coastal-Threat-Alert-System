#!/usr/bin/env python3
"""
Startup script for AI Models API on Render
Ensures PORT environment variable is properly used
"""
import os
import subprocess
import sys

# Get PORT from environment or default to 10000 (Render expects this)
port = os.getenv("PORT", "10000")

print(f"🚀 Starting CTAS AI Models API on port {port}")
print(f"📝 Environment PORT variable: {os.getenv('PORT', 'NOT SET')}")

# Start uvicorn with explicit port
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

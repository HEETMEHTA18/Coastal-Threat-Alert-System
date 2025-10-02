#!/usr/bin/env python3
import urllib.request
import urllib.error
import json
import sys

import os

# Allow overriding the test target via environment variable, e.g.
# SMOKE_TARGET=http://localhost:8001
target = os.environ.get('SMOKE_TARGET', 'http://localhost:8000')
# Ensure the path is present
if target.endswith('/'):
    target = target[:-1]
url = f"{target}/api/predict_alerts"
body = {"latitude": 19.0760, "longitude": 72.8777}

data = json.dumps(body).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})

try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        raw = resp.read()
        try:
            obj = json.loads(raw)
        except Exception:
            print("Invalid JSON response:\n", raw.decode(errors='replace'))
            sys.exit(2)

        # Basic shape checks
        required = ['structured_alerts', '_model_meta']
        missing = [k for k in required if k not in obj]
        if missing:
            print(f"SMOKE FAIL - missing keys: {missing}")
            print(json.dumps(obj, indent=2))
            sys.exit(3)

        print("SMOKE PASS")
        print(json.dumps(obj, indent=2))
        sys.exit(0)
except urllib.error.HTTPError as he:
    body = he.read().decode(errors='replace')
    print(f"HTTP ERROR {he.code}: {body}")
    sys.exit(4)
except Exception as e:
    print("EXCEPTION:", str(e))
    sys.exit(5)

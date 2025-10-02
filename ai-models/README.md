Live weather helper
===================

This folder contains a small optional live-weather integration that fetches current conditions from Open-Meteo and caches responses briefly to avoid excessive calls.

Usage
-----
- Set environment variable `USE_LIVE_WEATHER=true` to enable live fetches when `create_feature_vector` cannot find recent/current values in local CSVs.
- The helper `live_weather.py` uses Open-Meteo (no API key required). Responses are cached for 5 minutes and rounded to ~1km keys.

Notes
-----
- If the environment or network blocks outbound HTTP calls, leave `USE_LIVE_WEATHER` unset or `false` to keep CSV-only behavior.
- The integration is intentionally conservative: failures or timeouts simply fall back to CSV-derived values.
 
OpenWeather support
-------------------
If you prefer OpenWeather instead of Open‑Meteo, set the `OPENWEATHER_API_KEY` environment variable. When present, the live-weather helper will use OpenWeather's current weather API (metric units). Example (PowerShell):

```powershell
$env:OPENWEATHER_API_KEY = 'your_api_key_here'
$env:USE_LIVE_WEATHER = 'true'
# then start uvicorn in the same shell
& .\.venv\Scripts\python.exe -m uvicorn ai-models.predict_weather_api:app --port 8001 --reload
```


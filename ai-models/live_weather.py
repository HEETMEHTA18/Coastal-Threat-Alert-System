import os
import requests
import time
from urllib.parse import urlencode

# Simple in-memory TTL cache
_CACHE = {}
_TTL = 300  # seconds

def _cache_key(lat, lon):
    # coarse rounding to reduce unique keys (approx ~1km precision)
    return f"{round(lat,3)}:{round(lon,3)}"

def _fetch_open_meteo(lat, lon):
    params = {
        'latitude': lat,
        'longitude': lon,
        'current_weather': 'true',
        'hourly': 'relativehumidity_2m,precipitation',
        'timezone': 'UTC'
    }
    url = f"https://api.open-meteo.com/v1/forecast?{urlencode(params)}"
    r = requests.get(url, timeout=10)
    r.raise_for_status()
    data = r.json()
    result = {
        'temperature': None,
        'humidity': None,
        'wind_speed': None,
        'rainfall': None,
        'fetched_at': None
    }
    if 'current_weather' in data:
        cw = data['current_weather']
        result['temperature'] = cw.get('temperature')
        ws = cw.get('windspeed')
        if ws is not None:
            try:
                result['wind_speed'] = float(ws) / 3.6
            except Exception:
                result['wind_speed'] = None
    if 'hourly' in data:
        hourly = data['hourly']
        times = hourly.get('time') or []
        if times:
            last_idx = len(times) - 1
            rh = hourly.get('relativehumidity_2m')
            if rh and len(rh) > last_idx:
                result['humidity'] = rh[last_idx]
            pr = hourly.get('precipitation')
            if pr and len(pr) > last_idx:
                result['rainfall'] = pr[last_idx]
    result['fetched_at'] = data.get('generationtime_ms', None)
    return result

def _fetch_openweather(lat, lon, api_key):
    # OpenWeather current weather endpoint (metric units)
    url = 'https://api.openweathermap.org/data/2.5/weather'
    params = {
        'lat': lat,
        'lon': lon,
        'appid': api_key,
        'units': 'metric'
    }
    r = requests.get(url, params=params, timeout=10)
    r.raise_for_status()
    data = r.json()
    result = {
        'temperature': None,
        'humidity': None,
        'wind_speed': None,
        'rainfall': None,
        'fetched_at': None
    }
    main = data.get('main', {})
    wind = data.get('wind', {})
    result['temperature'] = main.get('temp')  # Celsius
    result['humidity'] = main.get('humidity')
    ws = wind.get('speed')
    if ws is not None:
        try:
            result['wind_speed'] = float(ws)
        except Exception:
            result['wind_speed'] = None
    # precipitation may be in 'rain' or 'snow' keys with '1h' or '3h'
    rain = data.get('rain', {})
    if isinstance(rain, dict):
        result['rainfall'] = rain.get('1h') or rain.get('3h') or 0.0
    result['fetched_at'] = data.get('dt', None)
    return result

def fetch_current_conditions(lat, lon):
    """Fetch current conditions from OpenWeather (if API key provided) or fallback to Open-Meteo.
    Returns dict: { 'temperature': C, 'humidity': %, 'wind_speed': m/s, 'rainfall': mm }
    Uses a small TTL cache to avoid excessive external calls.
    """
    key = _cache_key(lat, lon)
    now = time.time()
    if key in _CACHE:
        ts, val = _CACHE[key]
        if now - ts < _TTL:
            return val

    api_key = os.environ.get('OPENWEATHER_API_KEY')
    try:
        if api_key:
            val = _fetch_openweather(lat, lon, api_key)
        else:
            val = _fetch_open_meteo(lat, lon)
        _CACHE[key] = (now, val)
        return val
    except Exception:
        return None

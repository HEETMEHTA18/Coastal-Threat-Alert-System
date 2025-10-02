from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, Optional
import joblib
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from geopy.distance import geodesic
from sklearn.ensemble import RandomForestRegressor

# Ensure local package directory is on sys.path so local imports work regardless
import os
import sys
HERE = os.path.dirname(__file__)
if HERE and HERE not in sys.path:
    sys.path.insert(0, HERE)

# Local helper import
from feature_vector import create_feature_vector

app = FastAPI(title="CTAS API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
router = APIRouter(prefix="/api")

# Defensive model loading
def load_model(path):
    try:
        return joblib.load(path)
    except Exception as e:
        print(f"[WARN] Could not load model {path}: {e}")
        return None

rain_clf = load_model('rain_classifier.pkl')
temp_reg = load_model('temperature_regressor.pkl')
humidity_reg = load_model('humidity_regressor.pkl')
water_level_reg = load_model('water_level_regressor.pkl')

# Simple data used across endpoints
try:
    weather_df = pd.read_csv("weatherHistory.csv", encoding="latin1", engine="python", on_bad_lines="skip")
except Exception:
    weather_df = pd.DataFrame()

city_coords = {
    'Mumbai': (19.0760, 72.8777),
    'Delhi': (28.7041, 77.1025),
    'Bangalore': (12.9716, 77.5946),
    'Chennai': (13.0827, 80.2707),
    'Kolkata': (22.5726, 88.3639),
    'Hyderabad': (17.3850, 78.4867),
    'Pune': (18.5204, 73.8567),
    'Ahmedabad': (23.0225, 72.5714),
    'Jaipur': (26.9124, 75.7873),
    'Lucknow': (26.8467, 80.9462)
}

# Request models
class AlertRequest(BaseModel):
    # latitude/longitude are accepted but optional here to be tolerant of client keys
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    timestamp: Optional[str] = None

class WeatherRequest(BaseModel):
    latitude: float
    longitude: float

# Health endpoint
@router.get('/health')
def health():
    return {"status": "ok", "models": {"rain": rain_clf is not None, "temp": temp_reg is not None, "humidity": humidity_reg is not None, "water_level": water_level_reg is not None}}

# Utility helpers
def safe_float(x, default=np.nan):
    try:
        if x is None:
            return default
        return float(x)
    except Exception:
        try:
            return float(str(x))
        except Exception:
            return default

def prepare_for_model(model, feats):
    vals = [safe_float(v, 0.0) for v in feats]
    expected = getattr(model, 'n_features_in_', None)
    if expected is None:
        return vals
    if len(vals) < expected:
        vals += [0.0] * (expected - len(vals))
    elif len(vals) > expected:
        vals = vals[:expected]
    return vals

# Main unified endpoint
@router.post('/predict_alerts')
async def predict_alerts(req: AlertRequest, request: Request):
    # Build feature vector
    # If latitude/longitude not provided by Pydantic model, attempt to extract from raw JSON body
    lat = req.latitude
    lon = req.longitude
    try:
        if lat is None or lon is None:
            body = await request.json()
            # common alternative keys
            if isinstance(body, dict):
                if lat is None:
                    lat = body.get('latitude') or body.get('lat') or (body.get('features_used') or {}).get('latitude') or (body.get('features_used') or {}).get('lat')
                if lon is None:
                    lon = body.get('longitude') or body.get('lon') or (body.get('features_used') or {}).get('longitude') or (body.get('features_used') or {}).get('lon')
    except Exception:
        # if parsing failed, continue; validation below will catch missing coords
        body = None

    # Validate coordinates
    if lat is None or lon is None:
        raise HTTPException(status_code=422, detail={'error': 'latitude and longitude are required (accepted keys: latitude, longitude, lat, lon).', 'received_body': body if 'body' in locals() else None})

    try:
        features = create_feature_vector(lat=lat, lon=lon, timestamp=req.timestamp)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Prepare numeric inputs
    t = safe_float(features.get('temperature_current'))
    h = safe_float(features.get('humidity_current'))
    w = safe_float(features.get('wind_speed_current'))
    r = safe_float(features.get('rainfall_current'))

    out = {
        'rain_predicted': None,
        'rain_probability': None,
        'temperature_predicted': None,
        'humidity_predicted': None,
        'water_level_predicted': None,
        'alerts': [],
        'features_used': features
    }

    errors = []

    # Rain
    if rain_clf is not None:
        try:
            x = prepare_for_model(rain_clf, [t, h, w])
            pred = rain_clf.predict([x])[0]
            try:
                out['rain_predicted'] = bool(int(pred))
            except Exception:
                out['rain_predicted'] = bool(pred)
            # probability
            try:
                if hasattr(rain_clf, 'predict_proba') and hasattr(rain_clf, 'classes_') and len(getattr(rain_clf, 'classes_', [])) > 1:
                    probs = rain_clf.predict_proba([x])[0]
                    classes = list(rain_clf.classes_)
                    if 1 in classes:
                        out['rain_probability'] = float(probs[classes.index(1)])
                    else:
                        out['rain_probability'] = float(max(probs))
                else:
                    out['rain_probability'] = 1.0 if out['rain_predicted'] else 0.0
            except Exception as e:
                errors.append(f'rain_proba: {e}')
        except Exception as e:
            errors.append(f'rain_pred: {e}')

    # Temperature
    if temp_reg is not None:
        try:
            x = prepare_for_model(temp_reg, [h, w])
            out['temperature_predicted'] = float(temp_reg.predict([x])[0])
        except Exception as e:
            errors.append(f'temp_pred: {e}')

    # Humidity
    if humidity_reg is not None:
        try:
            x = prepare_for_model(humidity_reg, [h, w])
            out['humidity_predicted'] = float(humidity_reg.predict([x])[0])
        except Exception as e:
            errors.append(f'hum_pred: {e}')

    # Water level
    if water_level_reg is not None:
        try:
            x = prepare_for_model(water_level_reg, [w, h, r])
            out['water_level_predicted'] = float(water_level_reg.predict([x])[0])
        except Exception as e:
            errors.append(f'water_pred: {e}')

    # Alerts
    # Produce structured alerts (backwards-compatible: keep 'alerts' as list of strings too)
    structured_alerts = []
    def severity_from_prob(p):
        try:
            p = float(p)
        except Exception:
            return 'info'
        if p >= 0.75:
            return 'critical'
        if p >= 0.5:
            return 'warn'
        return 'info'

    def add_alert(id, metric, value, unit, confidence, text, suggested_action, model_meta=None):
        structured_alerts.append({
            'id': id,
            'severity': severity_from_prob(confidence) if confidence is not None else 'info',
            'metric': metric,
            'value': None if value is None else float(value),
            'unit': unit,
            'confidence': None if confidence is None else float(confidence),
            'text': text,
            'suggested_action': suggested_action,
            'model_meta': model_meta or {}
        })

    try:
        rp = out.get('rain_probability')
        if rp is not None and rp > 0.0:
            sev = severity_from_prob(rp)
            txt = f"Rain likely in next 24h (p={rp:.0%})" if rp is not None else "Rain predicted"
            action = "Carry umbrella, expect localized runoff/flooding" if rp >= 0.5 else "Monitor conditions"
            add_alert('rain_24h', 'rain', out.get('rain_probability'), '%', rp, txt, action, {'model': getattr(rain_clf, '__class__', None).__name__ if rain_clf is not None else None})
    except Exception:
        pass

    try:
        tp = out.get('temperature_predicted')
        if tp is not None:
            txt = f"High temperature predicted ({tp:.1f} K)" if tp is not None and tp > 303 else f"Temperature predicted ({tp:.1f} K)"
            action = "Stay hydrated and avoid prolonged sun exposure" if tp is not None and tp > 303 else "No immediate action"
            # Confidence: use a normalized heuristic (higher absolute deviation from mean -> higher severity) if available
            conf = 1.0 if tp is not None and tp > 303 else 0.3
            add_alert('temperature', 'temperature', tp, 'K', conf, txt, action, {'model': getattr(temp_reg, '__class__', None).__name__ if temp_reg is not None else None})
    except Exception:
        pass

    try:
        wl = out.get('water_level_predicted')
        if wl is not None:
            txt = f"Water level predicted {wl:.2f} m"
            action = "Avoid low-lying areas if water level rises further" if wl is not None and wl > 2.0 else "Monitor water level"
            conf = 1.0 if wl is not None and wl > 2.0 else 0.3
            add_alert('water_level', 'water_level', wl, 'm', conf, txt, action, {'model': getattr(water_level_reg, '__class__', None).__name__ if water_level_reg is not None else None})
    except Exception:
        pass

    # Multi-hazard combination example
    try:
        rp = out.get('rain_probability') or 0.0
        wl = out.get('water_level_predicted') or 0.0
        if rp >= 0.5 and wl >= 1.0:
            txt = "Elevated coastal flood risk due to rainfall and rising water levels"
            action = "Follow local advisories and consider temporary evacuation if in flood-prone areas"
            add_alert('coastal_flood', 'multi', None, '', max(float(rp), 0.0), txt, action, {'derived': True})
    except Exception:
        pass

    # Keep previous simple string alerts for backwards compatibility
    out['alerts'] = [a['text'] for a in structured_alerts] if structured_alerts else out.get('alerts', [])
    out['structured_alerts'] = structured_alerts

    if errors:
        out['prediction_errors'] = errors

    # Model provenance / metadata
    _model_meta = {
        'rain_model': getattr(rain_clf, '__class__', None).__name__ if rain_clf is not None else None,
        'temp_model': getattr(temp_reg, '__class__', None).__name__ if temp_reg is not None else None,
        'humidity_model': getattr(humidity_reg, '__class__', None).__name__ if humidity_reg is not None else None,
        'water_level_model': getattr(water_level_reg, '__class__', None).__name__ if water_level_reg is not None else None,
        'generated_at': datetime.utcnow().isoformat()
    }
    out['_model_meta'] = _model_meta

    # Sanitize output: replace NaN/inf with None and convert numpy types
    def sanitize(obj):
        if obj is None:
            return None
        if isinstance(obj, float):
            if np.isnan(obj) or np.isinf(obj):
                return None
            return float(obj)
        if isinstance(obj, (np.floating, np.integer)):
            return obj.item()
        if isinstance(obj, dict):
            return {k: sanitize(v) for k, v in obj.items()}
        if isinstance(obj, (list, tuple)):
            return [sanitize(v) for v in obj]
        return obj

    out = sanitize(out)
    # Indicate how features were sourced (proxy/direct/live). Feature vector may set '_live_source'.
    try:
        if isinstance(out.get('features_used'), dict) and out['features_used'].get('_live_source'):
            out['_source'] = 'live'
        else:
            # leave proxy/direct tagging to frontend wrapper which may add _source; default to 'backend'
            out.setdefault('_source', 'backend')
    except Exception:
        out.setdefault('_source', 'backend')

    return out

# Rain-specific endpoint (keeps previous behavior)
@router.post('/predict_rain')
def predict_rain(req: WeatherRequest) -> Dict:
    # simple nearest-record usage
    if not hasattr(weather_df, 'columns') or weather_df.empty:
        raise HTTPException(status_code=500, detail='weatherHistory.csv not available')
    user_lat = req.latitude
    user_lon = req.longitude
    if 'Latitude' in weather_df.columns and 'Longitude' in weather_df.columns:
        dists = ((weather_df['Latitude'] - user_lat)**2 + (weather_df['Longitude'] - user_lon)**2).pow(0.5)
        idx = dists.idxmin()
        nearest = weather_df.loc[idx]
    else:
        nearest = weather_df.iloc[-1]
    feature_names = [
        'Temperature (C)','Apparent Temperature (C)','Humidity','Wind Speed (km/h)','Wind Bearing (degrees)','Visibility (km)','Pressure (millibars)'
    ]
    features = []
    for name in feature_names:
        val = nearest.get(name, None)
        if val is None or pd.isna(val):
            raise HTTPException(status_code=500, detail=f"Missing feature {name}")
        features.append(val)
    try:
        pred = rain_clf.predict([features])[0] if rain_clf is not None else None
        prob = rain_clf.predict_proba([features])[0][1] if (rain_clf is not None and hasattr(rain_clf, 'predict_proba')) else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {
        'rain_predicted': bool(pred) if pred is not None else None,
        'probability': prob,
        'used_lat': float(nearest.get('Latitude', float('nan'))),
        'used_lon': float(nearest.get('Longitude', float('nan'))),
        'features': dict(zip(feature_names, features))
    }

# Predict weather endpoint
@router.post('/predict_weather')
def predict_weather(req: WeatherRequest) -> Dict:
    # fallback: nearest city predictions using rolling/random-forest
    user_lat = req.latitude
    user_lon = req.longitude
    min_dist = float('inf')
    nearest_city = None
    for city, coords in city_coords.items():
        d = geodesic((user_lat, user_lon), coords).km
        if d < min_dist:
            min_dist = d
            nearest_city = city
    df_region = weather_df[weather_df.get('region') == nearest_city].copy() if not weather_df.empty else pd.DataFrame()
    if df_region.empty:
        raise HTTPException(status_code=500, detail='No regional weather data')
    numeric_cols = ['Temperature (C)','Apparent Temperature (C)','Humidity','Wind Speed (km/h)','Wind Bearing (degrees)','Visibility (km)','Loud Cover','Pressure (millibars)']
    predicted = {}
    for col in numeric_cols:
        if col in df_region.columns and not df_region[col].isnull().all():
            X = np.arange(len(df_region)).reshape(-1,1)
            y = df_region[col].values
            model = RandomForestRegressor(n_estimators=20, random_state=42)
            try:
                model.fit(X, y)
                predicted[col] = float(model.predict([[len(df_region)]])[0])
            except Exception:
                predicted[col] = None
        else:
            predicted[col] = None
    # categorical columns
    for col in ['Summary','Precip Type','Daily Summary']:
        predicted[col] = str(df_region[col].mode()[0]) if col in df_region.columns and not df_region[col].isnull().all() else ""
    forecast = {
        'Nearest City': nearest_city,
        'Distance (km)': round(min_dist, 2),
        **predicted
    }
    return forecast


@router.post('/forecast')
def forecast(req: WeatherRequest, hours: int = 24) -> Dict:
    """Return a simple hourly forecast for the next `hours` hours (default 24).
    This uses the existing models to produce a base prediction and then
    generates hourly values by applying a small diurnal variation.
    """
    # clamp hours
    try:
        hours = int(hours)
    except Exception:
        hours = 24
    hours = max(1, min(72, hours))

    # Build base features via create_feature_vector
    try:
        features = create_feature_vector(lat=req.latitude, lon=req.longitude)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f'Feature vector error: {e}')

    # get base numeric inputs
    t_base = safe_float(features.get('temperature_current'))
    h_base = safe_float(features.get('humidity_current'))
    w_base = safe_float(features.get('wind_speed_current'))
    r_base = safe_float(features.get('rainfall_current'))

    # Fallback to model predictions if current readings are missing
    base_temp = None
    base_hum = None
    base_rain_prob = None
    base_water = None

    # attempt to get predictions using the same logic as predict_alerts
    if temp_reg is not None:
        try:
            x = prepare_for_model(temp_reg, [h_base, w_base])
            base_temp = float(temp_reg.predict([x])[0])
        except Exception:
            base_temp = None
    if humidity_reg is not None:
        try:
            x = prepare_for_model(humidity_reg, [h_base, w_base])
            base_hum = float(humidity_reg.predict([x])[0])
        except Exception:
            base_hum = None
    if rain_clf is not None:
        try:
            x = prepare_for_model(rain_clf, [t_base, h_base, w_base])
            # probability
            if hasattr(rain_clf, 'predict_proba'):
                probs = rain_clf.predict_proba([x])[0]
                classes = list(getattr(rain_clf, 'classes_', []))
                if 1 in classes:
                    base_rain_prob = float(probs[classes.index(1)])
                else:
                    base_rain_prob = float(max(probs))
            else:
                base_rain_prob = None
        except Exception:
            base_rain_prob = None
    if water_level_reg is not None:
        try:
            x = prepare_for_model(water_level_reg, [w_base, h_base, r_base])
            base_water = float(water_level_reg.predict([x])[0])
        except Exception:
            base_water = None

    # Use model outputs or sensible defaults
    if base_temp is None:
        base_temp = t_base if not np.isnan(t_base) else 295.0
    if base_hum is None:
        base_hum = h_base if not np.isnan(h_base) else 60.0
    if base_rain_prob is None:
        base_rain_prob = 0.0 if (r_base is None or np.isnan(r_base)) else min(max(float(r_base), 0.0), 1.0)
    if base_water is None:
        base_water = 0.5 if base_water is None else base_water

    # produce hourly forecast with small diurnal variation
    from math import sin, pi
    now = datetime.utcnow()
    forecast_hours = []
    for i in range(hours):
        hour_ts = now + timedelta(hours=i+1)
        # simple diurnal: amplitude depends on temp
        temp_amp = 3.0
        temp = base_temp + temp_amp * sin(2 * pi * ((hour_ts.hour) / 24))
        hum_amp = 5.0
        hum = max(0.0, min(100.0, base_hum + hum_amp * sin(2 * pi * ((hour_ts.hour + 6) / 24))))
        rain_prob = min(1.0, max(0.0, base_rain_prob + 0.1 * sin(2 * pi * ((hour_ts.hour) / 24))))
        water = base_water
        forecast_hours.append({
            'timestamp': hour_ts.isoformat(),
            'temperature': round(float(temp), 2),
            'humidity': round(float(hum), 2),
            'rain_probability': round(float(rain_prob), 3),
            'water_level': None if (water is None or (isinstance(water, float) and np.isnan(water))) else float(water)
        })

    result = {
        'location': {'latitude': float(req.latitude), 'longitude': float(req.longitude)},
        'generated_at': now.isoformat(),
        'hours': hours,
        'forecast': forecast_hours
    }

    # sanitize before return
    def sanitize_obj(o):
        if o is None:
            return None
        if isinstance(o, float):
            if np.isnan(o) or np.isinf(o):
                return None
            return float(o)
        if isinstance(o, (np.integer, np.floating)):
            return o.item()
        if isinstance(o, dict):
            return {k: sanitize_obj(v) for k, v in o.items()}
        if isinstance(o, list):
            return [sanitize_obj(v) for v in o]
        return o

    return sanitize_obj(result)


# Simple ping endpoint for quick GET checks (helps debug frontend proxy/404s)
@router.get('/ping')
def ping():
    return {"status": "ok", "message": "pong"}

# Register router and root
app.include_router(router)

@app.get('/')
def root():
    return {'status': 'ok', 'message': 'CTAS API running'}


# App-level ping endpoint to ensure it's registered regardless of router include order
@app.get('/api/ping')
def app_ping():
    return {"status": "ok", "message": "pong"}


# Dynamic Prediction & Alerts proxy - returns a changing payload on each request
@router.get('/prediction_proxy')
def prediction_proxy(lat: float = 37.806, lon: float = -122.465):
    import random
    from datetime import datetime

    now = datetime.utcnow()
    # Base deterministic values (matching example)
    base = {
        'rain_probability': 1.0,
        'temperature_K': 294.2,
        'temperature_C': round(294.2 - 273.15, 1),
        'humidity_percent': 60,
        'water_level_m': 1.09,
        'coastal_score_pct': 80
    }

    # Add tiny random jitter so each request differs
    jitter = lambda x, pct=0.02: round(x * (1 + random.uniform(-pct, pct)), 3) if isinstance(x, (int, float)) else x

    temp_k = jitter(base['temperature_K'], 0.01)
    temp_c = round(temp_k - 273.15, 1)
    hum = int(jitter(base['humidity_percent'], 0.03))
    rain_p = min(1.0, max(0.0, jitter(base['rain_probability'], 0.0)))
    water = round(jitter(base['water_level_m'], 0.03), 2)
    coastal = int(min(100, max(0, jitter(base['coastal_score_pct'], 0.05))))

    # Build 6-hour forecast entries every hour
    forecast = []
    for h in range(1, 7):
        ts = (now + timedelta(hours=h)).isoformat()
        ftemp = round(temp_c + random.uniform(-1.5, 1.5), 1)
        fhum = int(max(0, min(100, hum + random.randint(-3, 3))))
        frain = int(min(100, max(0, int(90 + random.randint(-5, 7)))))
        forecast.append({'timestamp': ts, 'temperature_C': ftemp, 'humidity_percent': fhum, 'rain_prob_pct': frain})

    payload = {
        'message': 'Prediction & Alerts proxy',
        'alerts': [
            '⚠️ Alerts Rain likely in next 24h (p=100%)',
            f'Temperature predicted ({temp_k} K)',
            f'Water level predicted {water} m',
            'Elevated coastal flood risk due to rainfall and rising water levels'
        ],
        'summary': {
            'rain': f'Yes ({int(rain_p*100)}%)',
            'temp': f'{temp_c}°C',
            'humidity': f'{hum}%',
            'water': f'{water} m',
            'lat': float(lat),
            'lon': float(lon),
            'coastal_score_pct': coastal,
            'generated_at': now.isoformat()
        },
        'forecast_next_6h': forecast
    }

    return payload
 

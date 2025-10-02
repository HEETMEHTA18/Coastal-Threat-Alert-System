import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
try:
    # prefer package-style relative import when run as a package
    from .live_weather import fetch_current_conditions
except Exception:
    # fallback to absolute import when module is run directly (uvicorn often imports by module path)
    try:
        from live_weather import fetch_current_conditions
    except Exception:
        # final fallback: define a noop fetcher that returns None
        def fetch_current_conditions(lat, lon):
            return None

# --- CONFIG ---
CURRENT_WEATHER_PATH = 'weather_data_with_rainfall.csv'
HISTORICAL_WEATHER_PATH = 'final_training_dataset.csv'

# --- MAIN FUNCTION ---
def create_feature_vector(city=None, lat=None, lon=None, timestamp=None, days_history=7):
    """
    Build a feature vector for a given city or lat/lon and timestamp.
    Combines current and recent historical data (rolling averages, trends, etc).
    """
    # Load data
    current_df = pd.read_csv(CURRENT_WEATHER_PATH)
    hist_df = pd.read_csv(HISTORICAL_WEATHER_PATH)

    # Parse timestamp
    if timestamp is None:
        timestamp = datetime.utcnow()
    elif isinstance(timestamp, str):
        timestamp = pd.to_datetime(timestamp)

    # Find current data for city
    def safe_lower(val):
        return val.lower() if isinstance(val, str) else str(val).lower() if val is not None else ''

    # Ensure timestamp column is parsed for proper sorting if present
    if 'timestamp' in current_df.columns:
        try:
            current_df['timestamp'] = pd.to_datetime(current_df['timestamp'], errors='coerce')
        except Exception:
            pass

    if city:
        curr = current_df[current_df['city'].astype(str).str.lower() == safe_lower(city)].sort_values('timestamp', ascending=False)
    elif lat is not None and lon is not None:
        # Try to find nearest station in hist_df first to get a city name
        if 'latitude' in hist_df.columns and 'longitude' in hist_df.columns:
            station = hist_df.iloc[((hist_df['latitude'] - lat) ** 2 + (hist_df['longitude'] - lon) ** 2).idxmin()]
            city = station.get('city', None)
            curr = current_df[current_df['city'].astype(str).str.lower() == safe_lower(city)].sort_values('timestamp', ascending=False)
        else:
            curr = pd.DataFrame()
    else:
        raise ValueError('Must provide city or lat/lon')

    # If we didn't find a matching current row, prefer a recent station nearest to lat/lon
    curr_row = None
    if curr.empty:
        # Prefer nearest in current_df first (most up-to-date observations)
        if 'latitude' in current_df.columns and 'longitude' in current_df.columns and lat is not None and lon is not None and not current_df.empty:
            # If timestamp exists, prefer rows within the last hour (or latest if none match)
            cand = current_df.copy()
            if 'timestamp' in cand.columns:
                try:
                    cand['timestamp'] = pd.to_datetime(cand['timestamp'], errors='coerce')
                    recent_cut = timestamp - timedelta(hours=2)
                    recent_cand = cand[cand['timestamp'] >= recent_cut]
                    if not recent_cand.empty:
                        cand = recent_cand
                except Exception:
                    pass
            dists = ((cand['latitude'] - lat) ** 2 + (cand['longitude'] - lon) ** 2).pow(0.5)
            idx = dists.idxmin()
            curr_row = cand.loc[idx]
            city = city or curr_row.get('city', None)
        else:
            # Try to find by city in hist_df and then map to current_df
            if 'latitude' in hist_df.columns and 'longitude' in hist_df.columns and lat is not None and lon is not None and not hist_df.empty:
                station = hist_df.iloc[((hist_df['latitude'] - lat) ** 2 + (hist_df['longitude'] - lon) ** 2).idxmin()]
                city = station.get('city', None)
                curr = current_df[current_df['city'].astype(str).str.lower() == safe_lower(city)].sort_values('timestamp', ascending=False)
                if not curr.empty:
                    curr_row = curr.iloc[0]
                else:
                    curr_row = station
            else:
                # As a last resort, use the latest available row in current_df
                if not current_df.empty:
                    curr_sorted = current_df.sort_values('timestamp', ascending=False) if 'timestamp' in current_df.columns else current_df
                    curr_row = curr_sorted.iloc[0]
                    city = city or curr_row.get('city', None)
                else:
                    raise ValueError('No current data found for location and no fallback available')
    else:
        curr_row = curr.iloc[0]

    # Get recent historical data for location
    if city:
        hist = hist_df[hist_df['city'].astype(str).str.lower() == safe_lower(city)]
    else:
        hist = hist_df[(np.isclose(hist_df['latitude'], lat, atol=0.1)) & (np.isclose(hist_df['longitude'], lon, atol=0.1))]
    hist['date'] = pd.to_datetime(hist['date'], errors='coerce')
    recent_hist = hist[hist['date'] >= (timestamp - timedelta(days=days_history))]

    # Rolling features
    features = {}
    features['city'] = city
    features['timestamp'] = timestamp

    # Helper to find a column among candidates
    def find_col(df, candidates):
        for c in candidates:
            if c in df.columns:
                return c
        return None

    # Candidate names for common fields (tolerate different datasets)
    temp_col = find_col(current_df, ['temperature', 'temp', 'Temperature (C)', 'temperature_x'])
    hum_col = find_col(current_df, ['humidity', 'Humidity', 'humidity_x'])
    wind_col = find_col(current_df, ['wind_speed', 'Wind Speed (km/h)', 'wind_speed_x'])
    rain_col = find_col(current_df, ['rainfall', 'precipitation', 'rain', 'rainfall_x'])

    # Safely extract current values
    def safe_row_get(row, col):
        # Robustly get a value from a pandas Series or dict-like row; return np.nan for missing/None/NaN
        try:
            if hasattr(row, 'get') and not hasattr(row, 'index'):
                val = row.get(col, np.nan)
            else:
                # pandas Series-like
                val = row[col] if (col in getattr(row, 'index', [])) else (row.get(col, np.nan) if hasattr(row, 'get') else np.nan)
        except Exception:
            try:
                val = row.get(col, np.nan)
            except Exception:
                val = np.nan
        if val is None or (isinstance(val, float) and np.isnan(val)) or (isinstance(val, (str, bytes)) and str(val).strip().lower() in ['nan', 'none', '']):
            return np.nan
        return val

    def to_float_safe(val):
        try:
            if val is None:
                return np.nan
            return float(val)
        except Exception:
            try:
                return float(str(val))
            except Exception:
                return np.nan

    features['temperature_current'] = to_float_safe(safe_row_get(curr_row, temp_col)) if temp_col else np.nan
    features['humidity_current'] = to_float_safe(safe_row_get(curr_row, hum_col)) if hum_col else np.nan
    features['wind_speed_current'] = to_float_safe(safe_row_get(curr_row, wind_col)) if wind_col else np.nan
    features['rainfall_current'] = to_float_safe(safe_row_get(curr_row, rain_col)) if rain_col else np.nan

    # If core current measurements are missing or null, optionally fetch live weather
    use_live = os.environ.get('USE_LIVE_WEATHER', 'false').lower() in ['1', 'true', 'yes']
    if use_live:
        missing = any([pd.isna(features.get('temperature_current')), pd.isna(features.get('humidity_current')), pd.isna(features.get('wind_speed_current'))])
        # Also allow forcing live fetch if values are present but stale (timestamp older than 30 minutes)
        stale = False
        try:
            if 'timestamp' in features and isinstance(features['timestamp'], (datetime,)):
                stale = (datetime.utcnow() - features['timestamp']).total_seconds() > 1800
        except Exception:
            stale = False
        if missing or stale:
            try:
                lat_for_fetch = features.get('latitude') if not pd.isna(features.get('latitude')) else lat
                lon_for_fetch = features.get('longitude') if not pd.isna(features.get('longitude')) else lon
                if lat_for_fetch is not None and lon_for_fetch is not None:
                    live = fetch_current_conditions(float(lat_for_fetch), float(lon_for_fetch))
                    if live:
                        if features.get('temperature_current') is None or pd.isna(features.get('temperature_current')):
                            features['temperature_current'] = float(live.get('temperature')) if live.get('temperature') is not None else features['temperature_current']
                        if features.get('humidity_current') is None or pd.isna(features.get('humidity_current')):
                            features['humidity_current'] = float(live.get('humidity')) if live.get('humidity') is not None else features['humidity_current']
                        if features.get('wind_speed_current') is None or pd.isna(features.get('wind_speed_current')):
                            features['wind_speed_current'] = float(live.get('wind_speed')) if live.get('wind_speed') is not None else features['wind_speed_current']
                        if features.get('rainfall_current') is None or pd.isna(features.get('rainfall_current')):
                            features['rainfall_current'] = float(live.get('rainfall')) if live.get('rainfall') is not None else features['rainfall_current']
                        # mark that live data was used to help upstream callers
                        features['_live_source'] = True
            except Exception:
                # ignore live fetch failures and fall back to CSV-derived values
                pass

    # Rolling means and std devs for matching historical columns (use normalized names)
    hist_candidates = {
        'temperature': ['temperature', 'temp', 'Temperature (C)', 'temperature_x'],
        'humidity': ['humidity', 'Humidity', 'humidity_x'],
        'wind_speed': ['wind_speed', 'Wind Speed (km/h)', 'wind_speed_x'],
        'rainfall': ['rainfall', 'precipitation', 'rain', 'rainfall_x']
    }
    for short, cands in hist_candidates.items():
        c = find_col(recent_hist, cands)
        if c is not None and not recent_hist[c].dropna().empty:
            recent_vals = pd.to_numeric(recent_hist[c], errors='coerce').dropna()
            if not recent_vals.empty:
                features[f'{short}_mean_{days_history}d'] = float(recent_vals.mean())
                features[f'{short}_std_{days_history}d'] = float(recent_vals.std())
                if len(recent_vals) > 1:
                    features[f'{short}_trend_{days_history}d'] = float(recent_vals.iloc[-1] - recent_vals.iloc[0])
    # Time features
    features['hour'] = timestamp.hour
    features['dayofweek'] = timestamp.weekday()
    features['month'] = timestamp.month
    # Location features
    # Latitude/longitude: prefer current row values, otherwise use provided lat/lon
    lat_val = safe_row_get(curr_row, 'latitude') if (hasattr(curr_row, 'index') and 'latitude' in curr_row.index) or (not hasattr(curr_row, 'index') and hasattr(curr_row, 'get')) else np.nan
    lon_val = safe_row_get(curr_row, 'longitude') if (hasattr(curr_row, 'index') and 'longitude' in curr_row.index) or (not hasattr(curr_row, 'index') and hasattr(curr_row, 'get')) else np.nan
    features['latitude'] = to_float_safe(lat_val if not pd.isna(lat_val) else lat)
    features['longitude'] = to_float_safe(lon_val if not pd.isna(lon_val) else lon)
    return features

# Example usage:
if __name__ == '__main__':
    vec = create_feature_vector(city='London')
    print(vec)

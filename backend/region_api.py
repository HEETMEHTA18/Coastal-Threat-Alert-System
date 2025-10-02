from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import shapely.geometry
import shapely.wkt
import json

app = Flask(__name__)
CORS(app)

# Load datasets once at startup
weather_df = pd.read_csv('weather_data_with_rainfall.csv')
try:
    current_df = pd.read_csv('final_training_dataset.csv')
except Exception:
    current_df = None

def point_in_polygon(lon, lat, polygon):
    try:
        point = shapely.geometry.Point(float(lon), float(lat))
        return polygon.contains(point)
    except Exception:
        return False

@app.route('/get-region-data', methods=['POST'])
def get_region_data():
    data = request.get_json(force=True)
    geojson = data.get('geojson')
    if not geojson:
        return jsonify({'error': 'geojson required'}), 400

    # Parse GeoJSON polygon
    try:
        polygon = shapely.geometry.shape(geojson['features'][0]['geometry'])
    except Exception as e:
        return jsonify({'error': f'Invalid GeoJSON: {e}'}), 400

    # Filter weather data for points inside polygon using lat/lon columns if available
    results = []
    for _, row in weather_df.iterrows():
        # Try to get lat/lon from row
        lat = row.get('latitude') or row.get('Latitude') or row.get('lat')
        lon = row.get('longitude') or row.get('Longitude') or row.get('lon')
        # If not present, try to infer from city (fallback)
        if (lat is None or lon is None) and 'city' in row:
            city = row.get('city')
            city_coords = {
                'Delhi': (28.6139, 77.2090),
                'Mumbai': (19.0760, 72.8777),
                'Chennai': (13.0878, 80.2785),
                'Kolkata': (22.5726, 88.3639),
                'Bangalore': (12.9716, 77.5946)
            }
            if city in city_coords:
                lat, lon = city_coords[city]
        if lat is not None and lon is not None:
            if point_in_polygon(lon, lat, polygon):
                results.append(row.to_dict())

    # Optionally, filter current_df for water/current data (if available)
    current_results = []
    if current_df is not None:
        for _, row in current_df.iterrows():
            lat = row.get('latitude') or row.get('Latitude') or row.get('lat')
            lon = row.get('longitude') or row.get('Longitude') or row.get('lon')
            if lat is not None and lon is not None:
                if point_in_polygon(lon, lat, polygon):
                    current_results.append(row.to_dict())

    import math
    import numpy as np
    def clean_nans(obj):
        if isinstance(obj, dict):
            return {k: clean_nans(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [clean_nans(x) for x in obj]
        elif isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
            return None
        else:
            return obj

    # --- Compute summary stats ---
    weather_clean = clean_nans(results)
    current_clean = clean_nans(current_results)

    def safe_mean(values):
        arr = np.array([v for v in values if v is not None])
        return float(np.mean(arr)) if arr.size > 0 else None

    summary = {
        'weather_count': len(weather_clean),
        'current_count': len(current_clean),
        'avg_temperature': safe_mean([row.get('temperature') for row in weather_clean]),
        'avg_humidity': safe_mean([row.get('humidity') for row in weather_clean]),
        'avg_wind_speed': safe_mean([row.get('wind_speed') for row in weather_clean]),
        'avg_rainfall': safe_mean([row.get('rainfall') for row in weather_clean]),
    }

    return jsonify({
        'summary': summary,
        'weather': weather_clean,
        'current': current_clean
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

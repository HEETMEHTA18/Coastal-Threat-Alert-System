import pandas as pd
import pandas as pd
import requests
import datetime
import os
from dotenv import load_dotenv
# 1. Load historical data
historical_df = pd.read_csv('weatherHistory.csv')
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
API_KEY = os.environ.get('OPENWEATHER_API_KEY', '').strip()
if not API_KEY or len(API_KEY) < 10:
    print("[ERROR] OPENWEATHER_API_KEY not loaded or too short!")
else:
    print(f"[DEBUG] Loaded API key: {API_KEY[:4]}***{API_KEY[-4:]}")
location = 'Ahmedabad,IN'  # <-- Change as needed
# 2. Clean & transform historical data
if 'Formatted Date' in historical_df.columns:
    historical_df['date'] = pd.to_datetime(historical_df['Formatted Date'])
else:
    historical_df['date'] = pd.to_datetime(historical_df['date'], errors='coerce')
historical_df = historical_df.dropna(subset=['date'])

# 3. Fetch current weather data from OpenWeatherMap API
API_KEY = 'YOUR_OPENWEATHERMAP_API_KEY'  # <-- Replace with your API key
location = 'Ahmedabad,IN'                # <-- Change as needed

url = f'http://api.openweathermap.org/data/2.5/weather?q={location}&appid={API_KEY}&units=metric'
response = requests.get(url)
if response.status_code == 200:
    current = response.json()
    current_data = {
        'date': datetime.datetime.now(),
        'Temperature (C)': current['main']['temp'],
        'Apparent Temperature (C)': current['main'].get('feels_like', current['main']['temp']),
        'Humidity': current['main']['humidity'] / 100.0,
        'Wind Speed (km/h)': current['wind']['speed'] * 3.6,  # m/s to km/h
        'Wind Bearing (degrees)': current['wind'].get('deg', 0),
        'Visibility (km)': current.get('visibility', 10000) / 1000.0,
        'Loud Cover': 0,  # Not available from API
        'Pressure (millibars)': current['main']['pressure'],
        'Summary': current['weather'][0]['main'],
        'Precip Type': 'rain' if 'rain' in current else 'none',
        'Daily Summary': current['weather'][0]['description'],
        'region': location.split(',')[0]
    }
    current_df = pd.DataFrame([current_data])
else:
    print("Failed to fetch current weather:", response.text)
    current_df = pd.DataFrame()

# 4. Align columns and combine
common_cols = [col for col in historical_df.columns if col in current_df.columns]
combined_df = pd.concat([historical_df[common_cols], current_df[common_cols]], ignore_index=True)

# 5. Save combined data
combined_df.to_csv('combined_weather_data.csv', index=False)
print("Combined data saved as combined_weather_data.csv")

# 6. (Optional) Print sample
print(combined_df.tail())

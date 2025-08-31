"""
Comprehensive Dataset Collection Guide for Coastal Monitoring AI Models

This guide provides step-by-step instructions for acquiring and integrating
real-world datasets for training the coastal monitoring AI models.
"""

import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import os
from typing import Dict, List, Optional

class DatasetCollector:
    """Centralized dataset collection for all coastal monitoring models"""
    
    def __init__(self):
        self.api_keys = {
            'nasa_earthdata': 'YOUR_NASA_EARTHDATA_TOKEN',
            'noaa_api': 'YOUR_NOAA_API_KEY',
            'openweather': 'YOUR_OPENWEATHER_API_KEY',
            'copernicus': 'YOUR_COPERNICUS_API_KEY'
        }
        
        self.base_urls = {
            'noaa_tides': 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter',
            'noaa_weather': 'https://api.weather.gov',
            'nasa_earthdata': 'https://earthdata.nasa.gov/api/eosdis',
            'epa_water_quality': 'https://www.waterqualitydata.us/data',
            'hurdat2': 'https://www.nhc.noaa.gov/data/hurdat'
        }

    def collect_sea_level_data(self, station_id: str, start_date: str, end_date: str) -> pd.DataFrame:
        """
        Collect sea level data from NOAA Tides & Currents
        
        Args:
            station_id: NOAA station ID (e.g., '8518750' for The Battery, NY)
            start_date: Start date in 'YYYYMMDD' format
            end_date: End date in 'YYYYMMDD' format
        """
        url = self.base_urls['noaa_tides']
        
        params = {
            'product': 'water_level',
            'application': 'NOS.COOPS.TAC.WL',
            'begin_date': start_date,
            'end_date': end_date,
            'station': station_id,
            'datum': 'MLLW',
            'units': 'metric',
            'time_zone': 'GMT',
            'format': 'json'
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            if 'data' in data:
                df = pd.DataFrame(data['data'])
                df['t'] = pd.to_datetime(df['t'])
                df['v'] = pd.to_numeric(df['v'], errors='coerce')
                df = df.rename(columns={'t': 'timestamp', 'v': 'water_level'})
                return df
            else:
                print(f"No data found for station {station_id}")
                return pd.DataFrame()
                
        except requests.exceptions.RequestException as e:
            print(f"Error fetching sea level data: {e}")
            return pd.DataFrame()

    def collect_water_quality_data(self, bbox: tuple, start_date: str, end_date: str) -> pd.DataFrame:
        """
        Collect water quality data from EPA Water Quality Portal
        
        Args:
            bbox: Bounding box (min_lat, min_lon, max_lat, max_lon)
            start_date: Start date in 'MM-DD-YYYY' format
            end_date: End date in 'MM-DD-YYYY' format
        """
        url = self.base_urls['epa_water_quality']
        
        params = {
            'bBox': f"{bbox[1]},{bbox[0]},{bbox[3]},{bbox[2]}",  # lon,lat,lon,lat
            'startDateLo': start_date,
            'startDateHi': end_date,
            'mimeType': 'csv',
            'zip': 'no'
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            # Parse CSV response
            from io import StringIO
            df = pd.read_csv(StringIO(response.text))
            
            # Clean and standardize column names
            df.columns = df.columns.str.lower().str.replace(' ', '_')
            
            return df
            
        except requests.exceptions.RequestException as e:
            print(f"Error fetching water quality data: {e}")
            return pd.DataFrame()

    def collect_hurricane_data(self, basin: str = 'AL', year_start: int = 2000, year_end: int = 2023) -> pd.DataFrame:
        """
        Collect hurricane track data from HURDAT2 database
        
        Args:
            basin: Hurricane basin ('AL' for Atlantic, 'EP' for Eastern Pacific)
            year_start: Starting year
            year_end: Ending year
        """
        url = f"{self.base_urls['hurdat2']}/hurdat2-{basin.lower()}.txt"
        
        try:
            response = requests.get(url)
            response.raise_for_status()
            
            # Parse HURDAT2 format
            lines = response.text.strip().split('\n')
            hurricane_data = []
            current_storm = None
            
            for line in lines:
                if line.startswith(basin):
                    # Header line with storm info
                    parts = line.split(',')
                    current_storm = {
                        'storm_id': parts[0].strip(),
                        'name': parts[1].strip(),
                        'entries': int(parts[2].strip())
                    }
                else:
                    # Data line with track point
                    if current_storm:
                        parts = [p.strip() for p in line.split(',')]
                        if len(parts) >= 7:
                            track_point = {
                                'storm_id': current_storm['storm_id'],
                                'storm_name': current_storm['name'],
                                'date': parts[0],
                                'time': parts[1],
                                'status': parts[2],
                                'latitude': self.parse_coordinate(parts[3]),
                                'longitude': self.parse_coordinate(parts[4]),
                                'max_wind': int(parts[5]) if parts[5].isdigit() else None,
                                'min_pressure': int(parts[6]) if parts[6].isdigit() else None
                            }
                            
                            # Filter by year
                            year = int(parts[0][:4])
                            if year_start <= year <= year_end:
                                hurricane_data.append(track_point)
            
            return pd.DataFrame(hurricane_data)
            
        except requests.exceptions.RequestException as e:
            print(f"Error fetching hurricane data: {e}")
            return pd.DataFrame()

    def parse_coordinate(self, coord_str: str) -> float:
        """Parse HURDAT2 coordinate format (e.g., '25.4N' or '80.1W')"""
        if not coord_str or len(coord_str) < 2:
            return None
        
        direction = coord_str[-1]
        value = float(coord_str[:-1])
        
        if direction in ['S', 'W']:
            value = -value
        
        return value

    def collect_satellite_chlorophyll_data(self, bbox: tuple, start_date: str, end_date: str) -> pd.DataFrame:
        """
        Collect chlorophyll-a data from NASA Ocean Color
        
        Note: This requires NASA Earthdata authentication
        """
        # This is a simplified example - actual implementation would use NASA's API
        print("Satellite chlorophyll data collection requires NASA Earthdata authentication")
        print("Visit: https://oceancolor.gsfc.nasa.gov/ for data access")
        
        # Return example structure
        return pd.DataFrame(columns=[
            'timestamp', 'latitude', 'longitude', 'chlorophyll_a',
            'sst', 'turbidity', 'cloud_fraction'
        ])

    def collect_weather_data(self, lat: float, lon: float, start_date: str, end_date: str) -> pd.DataFrame:
        """
        Collect meteorological data for a location
        
        Args:
            lat: Latitude
            lon: Longitude
            start_date: Start date in 'YYYY-MM-DD' format
            end_date: End date in 'YYYY-MM-DD' format
        """
        # Using OpenWeatherMap historical data API (requires subscription for historical data)
        api_key = self.api_keys['openweather']
        
        if not api_key or api_key == 'YOUR_OPENWEATHER_API_KEY':
            print("OpenWeatherMap API key required for weather data")
            return pd.DataFrame()
        
        # For historical data, you'd need to make multiple API calls
        # This is a simplified example for current weather
        url = f"https://api.openweathermap.org/data/2.5/weather"
        
        params = {
            'lat': lat,
            'lon': lon,
            'appid': api_key,
            'units': 'metric'
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            weather_data = {
                'timestamp': datetime.now(),
                'temperature': data['main']['temp'],
                'humidity': data['main']['humidity'],
                'pressure': data['main']['pressure'],
                'wind_speed': data['wind']['speed'],
                'wind_direction': data['wind'].get('deg', 0),
                'visibility': data.get('visibility', 10000) / 1000,  # Convert to km
                'cloud_cover': data['clouds']['all']
            }
            
            return pd.DataFrame([weather_data])
            
        except requests.exceptions.RequestException as e:
            print(f"Error fetching weather data: {e}")
            return pd.DataFrame()

    def setup_data_collection_pipeline(self, config: Dict) -> Dict:
        """
        Set up automated data collection pipeline
        
        Args:
            config: Configuration dictionary with collection parameters
        """
        pipeline_config = {
            'sea_level_stations': config.get('sea_level_stations', ['8518750', '8570283']),
            'water_quality_regions': config.get('water_quality_regions', [
                (25.0, -81.0, 26.0, -80.0)  # South Florida example
            ]),
            'hurricane_basins': config.get('hurricane_basins', ['AL', 'EP']),
            'collection_frequency': config.get('collection_frequency', 'daily'),
            'data_retention_days': config.get('data_retention_days', 365)
        }
        
        print("Data Collection Pipeline Configuration:")
        for key, value in pipeline_config.items():
            print(f"  {key}: {value}")
        
        return pipeline_config

    def export_collected_data(self, data: pd.DataFrame, model_type: str, export_format: str = 'csv'):
        """
        Export collected data in format suitable for model training
        
        Args:
            data: Collected data DataFrame
            model_type: Type of model ('sea_level', 'algal_bloom', etc.)
            export_format: Export format ('csv', 'json', 'parquet')
        """
        if data.empty:
            print(f"No data to export for {model_type}")
            return
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{model_type}_data_{timestamp}"
        
        if export_format == 'csv':
            filepath = f"{filename}.csv"
            data.to_csv(filepath, index=False)
        elif export_format == 'json':
            filepath = f"{filename}.json"
            data.to_json(filepath, orient='records', date_format='iso')
        elif export_format == 'parquet':
            filepath = f"{filename}.parquet"
            data.to_parquet(filepath, index=False)
        
        print(f"Data exported to {filepath}")
        return filepath

# Example usage and data collection guide
def main():
    """Example of how to collect data for each model"""
    
    collector = DatasetCollector()
    
    # 1. Sea Level Anomaly Detection Data
    print("=== Collecting Sea Level Data ===")
    sea_level_data = collector.collect_sea_level_data(
        station_id='8518750',  # The Battery, NY
        start_date='20230101',
        end_date='20231231'
    )
    print(f"Collected {len(sea_level_data)} sea level records")
    
    # 2. Water Quality Data for Algal Bloom Prediction
    print("\n=== Collecting Water Quality Data ===")
    water_quality_data = collector.collect_water_quality_data(
        bbox=(25.0, -81.0, 26.0, -80.0),  # South Florida
        start_date='01-01-2023',
        end_date='12-31-2023'
    )
    print(f"Collected {len(water_quality_data)} water quality records")
    
    # 3. Hurricane Track Data
    print("\n=== Collecting Hurricane Data ===")
    hurricane_data = collector.collect_hurricane_data(
        basin='AL',
        year_start=2020,
        year_end=2023
    )
    print(f"Collected {len(hurricane_data)} hurricane track points")
    
    # 4. Weather Data
    print("\n=== Collecting Weather Data ===")
    weather_data = collector.collect_weather_data(
        lat=25.7617,  # Miami coordinates
        lon=-80.1918,
        start_date='2023-01-01',
        end_date='2023-12-31'
    )
    print(f"Collected {len(weather_data)} weather records")
    
    # Export data for model training
    if not sea_level_data.empty:
        collector.export_collected_data(sea_level_data, 'sea_level_anomaly')
    
    if not water_quality_data.empty:
        collector.export_collected_data(water_quality_data, 'algal_bloom')
    
    if not hurricane_data.empty:
        collector.export_collected_data(hurricane_data, 'cyclone_trajectory')
    
    print("\n=== Data Collection Complete ===")
    print("Next steps:")
    print("1. Review collected data quality")
    print("2. Preprocess data for model training")
    print("3. Split data into training/validation/test sets")
    print("4. Train models using the AI model scripts")

if __name__ == "__main__":
    main()

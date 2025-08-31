"""
NOAA Real-Time Current Data Parser for CTAS
Parses XML current data from NOAA buoys and integrates with coastal monitoring system
"""

import xml.etree.ElementTree as ET
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import requests
import json
from typing import Dict, List, Optional

class NOAACurrentDataParser:
    def __init__(self):
        self.base_url = "https://tidesandcurrents.noaa.gov/api/datagetter"
        self.current_stations = {
            'cb0102': {'name': 'Cape Henry LB 2CH', 'lat': 36.9594, 'lon': -76.0128},
            'cb0201': {'name': 'Chesapeake Bay Bridge Tunnel', 'lat': 36.9667, 'lon': -76.1167},
            'cb1001': {'name': 'Patapsco River', 'lat': 39.2167, 'lon': -76.5833},
            'lb0201': {'name': 'Long Bay', 'lat': 33.8400, 'lon': -78.4850},
            'sf0101': {'name': 'San Francisco Bay', 'lat': 37.8063, 'lon': -122.4659}
        }
        
    def parse_xml_current_data(self, xml_data: str) -> pd.DataFrame:
        """Parse XML current data from NOAA buoys"""
        try:
            root = ET.fromstring(xml_data)
            
            # Extract metadata
            metadata = root.find('metadata')
            station_id = metadata.get('id')
            station_name = metadata.get('name')
            lat = float(metadata.get('lat'))
            lon = float(metadata.get('lon'))
            
            # Extract observations
            observations = []
            obs_element = root.find('observations')
            
            for cu_element in obs_element.findall('cu'):
                observation = {
                    'station_id': station_id,
                    'station_name': station_name,
                    'latitude': lat,
                    'longitude': lon,
                    'timestamp': pd.to_datetime(cu_element.get('t')),
                    'current_speed_knots': float(cu_element.get('s')),
                    'current_direction_degrees': float(cu_element.get('d')),
                    'bin_depth': int(cu_element.get('b'))
                }
                observations.append(observation)
            
            df = pd.DataFrame(observations)
            
            # Convert speed from knots to m/s for standardization
            df['current_speed_ms'] = df['current_speed_knots'] * 0.514444
            
            # Calculate current components (u, v)
            df['current_u'] = df['current_speed_ms'] * np.sin(np.radians(df['current_direction_degrees']))
            df['current_v'] = df['current_speed_ms'] * np.cos(np.radians(df['current_direction_degrees']))
            
            return df
            
        except Exception as e:
            print(f"Error parsing XML data: {e}")
            return pd.DataFrame()
    
    def fetch_current_data(self, station_id: str, hours_back: int = 24) -> pd.DataFrame:
        """Fetch current data from NOAA API"""
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=hours_back)
        
        params = {
            'product': 'currents',
            'application': 'CTAS',
            'begin_date': start_time.strftime('%Y%m%d %H:%M'),
            'end_date': end_time.strftime('%Y%m%d %H:%M'),
            'station': station_id,
            'time_zone': 'GMT',
            'units': 'metric',
            'format': 'xml'
        }
        
        try:
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            
            return self.parse_xml_current_data(response.text)
            
        except requests.RequestException as e:
            print(f"Error fetching data from NOAA: {e}")
            return pd.DataFrame()
    
    def analyze_current_patterns(self, df: pd.DataFrame) -> Dict:
        """Analyze current patterns for coastal threat assessment"""
        if df.empty:
            return {}
        
        analysis = {
            'station_info': {
                'station_id': df['station_id'].iloc[0],
                'station_name': df['station_name'].iloc[0],
                'latitude': df['latitude'].iloc[0],
                'longitude': df['longitude'].iloc[0]
            },
            'time_range': {
                'start': df['timestamp'].min().isoformat(),
                'end': df['timestamp'].max().isoformat(),
                'duration_hours': (df['timestamp'].max() - df['timestamp'].min()).total_seconds() / 3600
            },
            'current_statistics': {
                'mean_speed_ms': float(df['current_speed_ms'].mean()),
                'max_speed_ms': float(df['current_speed_ms'].max()),
                'min_speed_ms': float(df['current_speed_ms'].min()),
                'std_speed_ms': float(df['current_speed_ms'].std()),
                'mean_direction': float(df['current_direction_degrees'].mean()),
                'direction_variability': float(df['current_direction_degrees'].std())
            },
            'tidal_analysis': self.analyze_tidal_currents(df),
            'anomaly_detection': self.detect_current_anomalies(df),
            'threat_indicators': self.assess_current_threats(df)
        }
        
        return analysis
    
    def analyze_tidal_currents(self, df: pd.DataFrame) -> Dict:
        """Analyze tidal current patterns"""
        # Simple tidal analysis - in practice, you'd use harmonic analysis
        df_sorted = df.sort_values('timestamp')
        
        # Calculate speed trends over time
        speed_trend = np.polyfit(range(len(df_sorted)), df_sorted['current_speed_ms'], 1)[0]
        
        # Find flood and ebb patterns (simplified)
        direction_changes = np.diff(df_sorted['current_direction_degrees'])
        direction_changes = np.where(direction_changes > 180, direction_changes - 360, direction_changes)
        direction_changes = np.where(direction_changes < -180, direction_changes + 360, direction_changes)
        
        return {
            'speed_trend_ms_per_hour': float(speed_trend * len(df)),
            'mean_flood_speed': float(df_sorted[df_sorted['current_speed_ms'] > df_sorted['current_speed_ms'].median()]['current_speed_ms'].mean()),
            'mean_ebb_speed': float(df_sorted[df_sorted['current_speed_ms'] <= df_sorted['current_speed_ms'].median()]['current_speed_ms'].mean()),
            'direction_stability': float(1 / (1 + np.std(direction_changes))),  # Higher = more stable
            'tidal_range_indicator': float(df_sorted['current_speed_ms'].max() - df_sorted['current_speed_ms'].min())
        }
    
    def detect_current_anomalies(self, df: pd.DataFrame) -> Dict:
        """Detect anomalous current conditions"""
        speed_mean = df['current_speed_ms'].mean()
        speed_std = df['current_speed_ms'].std()
        
        # Define anomaly thresholds (2 standard deviations)
        speed_threshold_high = speed_mean + 2 * speed_std
        speed_threshold_low = max(0, speed_mean - 2 * speed_std)
        
        anomalies = df[
            (df['current_speed_ms'] > speed_threshold_high) | 
            (df['current_speed_ms'] < speed_threshold_low)
        ]
        
        return {
            'anomaly_count': len(anomalies),
            'anomaly_percentage': float(len(anomalies) / len(df) * 100),
            'high_speed_anomalies': len(df[df['current_speed_ms'] > speed_threshold_high]),
            'low_speed_anomalies': len(df[df['current_speed_ms'] < speed_threshold_low]),
            'thresholds': {
                'high_speed_ms': float(speed_threshold_high),
                'low_speed_ms': float(speed_threshold_low)
            }
        }
    
    def assess_current_threats(self, df: pd.DataFrame) -> Dict:
        """Assess potential coastal threats based on current data"""
        latest_data = df.iloc[-1]  # Most recent measurement
        
        threats = {
            'rip_current_risk': 'low',
            'erosion_risk': 'low',
            'navigation_hazard': 'low',
            'pollution_transport_risk': 'low'
        }
        
        current_speed = latest_data['current_speed_ms']
        speed_variability = df['current_speed_ms'].std()
        
        # Rip current risk assessment
        if current_speed > 1.0:  # >1 m/s is strong current
            threats['rip_current_risk'] = 'high'
        elif current_speed > 0.5:
            threats['rip_current_risk'] = 'moderate'
        
        # Erosion risk based on persistent strong currents
        strong_current_percentage = len(df[df['current_speed_ms'] > 0.7]) / len(df) * 100
        if strong_current_percentage > 70:
            threats['erosion_risk'] = 'high'
        elif strong_current_percentage > 40:
            threats['erosion_risk'] = 'moderate'
        
        # Navigation hazard
        if current_speed > 1.5 or speed_variability > 0.3:
            threats['navigation_hazard'] = 'high'
        elif current_speed > 1.0 or speed_variability > 0.2:
            threats['navigation_hazard'] = 'moderate'
        
        # Pollution transport risk
        if current_speed > 0.8:  # Strong currents can transport pollutants quickly
            threats['pollution_transport_risk'] = 'high'
        elif current_speed > 0.4:
            threats['pollution_transport_risk'] = 'moderate'
        
        return threats
    
    def generate_current_forecast(self, df: pd.DataFrame, hours_ahead: int = 6) -> Dict:
        """Generate simple current forecast based on tidal patterns"""
        # This is a simplified forecast - real implementation would use harmonic analysis
        
        if len(df) < 24:  # Need at least 24 hours of data for decent prediction
            return {'error': 'Insufficient data for forecasting'}
        
        # Calculate average tidal cycle
        df_sorted = df.sort_values('timestamp')
        speeds = df_sorted['current_speed_ms'].values
        
        # Simple sinusoidal fit for tidal prediction
        time_hours = np.arange(len(speeds))
        
        # Fit a simple harmonic (12.42 hour tidal cycle)
        tidal_period = 12.42  # Semi-diurnal tide period in hours
        frequency = 2 * np.pi / (tidal_period * 6)  # Convert to measurement intervals
        
        try:
            # Fit sinusoidal model
            from scipy.optimize import curve_fit
            
            def tidal_model(t, amp, phase, offset):
                return amp * np.sin(frequency * t + phase) + offset
            
            popt, _ = curve_fit(tidal_model, time_hours, speeds)
            
            # Forecast future values
            future_times = np.arange(len(speeds), len(speeds) + hours_ahead * 6)  # 6 measurements per hour
            forecast_speeds = tidal_model(future_times, *popt)
            
            return {
                'forecast_hours': hours_ahead,
                'predicted_speeds_ms': forecast_speeds.tolist(),
                'model_parameters': {
                    'amplitude': float(popt[0]),
                    'phase': float(popt[1]),
                    'offset': float(popt[2])
                }
            }
            
        except:
            # Fallback to simple trend extrapolation
            trend = np.polyfit(time_hours[-12:], speeds[-12:], 1)  # Last 2 hours trend
            future_speeds = [trend[0] * (len(speeds) + i) + trend[1] for i in range(hours_ahead * 6)]
            
            return {
                'forecast_hours': hours_ahead,
                'predicted_speeds_ms': future_speeds,
                'model_type': 'linear_trend'
            }

def process_cape_henry_data():
    """Process the Cape Henry current data you provided"""
    
    # Your XML data
    xml_data = """<?xml version="1.0" encoding="UTF-8"?>
<data>
<metadata id="cb0102" name="Cape Henry LB 2CH" lat="36.9594" lon="-76.0128"/>
<observations>
<cu t="2025-08-30 00:08" s="0.809" d="99" b="4"/>
<cu t="2025-08-30 00:14" s="0.848" d="104" b="4"/>
<cu t="2025-08-30 00:20" s="0.84" d="118" b="4"/>
<cu t="2025-08-30 00:26" s="0.89" d="98" b="4"/>
<cu t="2025-08-30 00:32" s="0.853" d="115" b="4"/>
<cu t="2025-08-30 00:38" s="0.826" d="110" b="4"/>
<cu t="2025-08-30 00:44" s="0.758" d="116" b="4"/>
<cu t="2025-08-30 00:50" s="0.768" d="115" b="4"/>
<cu t="2025-08-30 01:08" s="0.801" d="105" b="4"/>
<cu t="2025-08-30 01:14" s="0.686" d="120" b="4"/>
<cu t="2025-08-30 01:20" s="0.634" d="97" b="4"/>
<cu t="2025-08-30 01:26" s="0.484" d="102" b="4"/>
<cu t="2025-08-30 01:32" s="0.544" d="108" b="4"/>
<cu t="2025-08-30 01:38" s="0.5" d="104" b="4"/>
<cu t="2025-08-30 01:44" s="0.47" d="105" b="4"/>
<cu t="2025-08-30 01:50" s="0.568" d="119" b="4"/>
<cu t="2025-08-30 01:56" s="0.367" d="109" b="4"/>
<cu t="2025-08-30 02:02" s="0.334" d="102" b="4"/>
<cu t="2025-08-30 02:08" s="0.34" d="108" b="4"/>
<cu t="2025-08-30 02:14" s="0.383" d="105" b="4"/>
<cu t="2025-08-30 02:20" s="0.327" d="118" b="4"/>
<cu t="2025-08-30 02:26" s="0.284" d="121" b="4"/>
<cu t="2025-08-30 02:32" s="0.157" d="137" b="4"/>
<cu t="2025-08-30 02:38" s="0.189" d="139" b="4"/>
<cu t="2025-08-30 02:44" s="0.159" d="209" b="4"/>
</observations>
</data>"""
    
    parser = NOAACurrentDataParser()
    
    # Parse the data
    df = parser.parse_xml_current_data(xml_data)
    
    if not df.empty:
        print("=== CAPE HENRY CURRENT DATA ANALYSIS ===")
        print(f"Station: {df['station_name'].iloc[0]} ({df['station_id'].iloc[0]})")
        print(f"Location: {df['latitude'].iloc[0]:.4f}°N, {df['longitude'].iloc[0]:.4f}°W")
        print(f"Data points: {len(df)}")
        print(f"Time range: {df['timestamp'].min()} to {df['timestamp'].max()}")
        
        # Analyze the data
        analysis = parser.analyze_current_patterns(df)
        
        print("\n=== CURRENT STATISTICS ===")
        stats = analysis['current_statistics']
        print(f"Mean speed: {stats['mean_speed_ms']:.3f} m/s ({stats['mean_speed_ms']*1.944:.3f} knots)")
        print(f"Max speed: {stats['max_speed_ms']:.3f} m/s")
        print(f"Mean direction: {stats['mean_direction']:.1f}°")
        print(f"Direction variability: {stats['direction_variability']:.1f}°")
        
        print("\n=== THREAT ASSESSMENT ===")
        threats = analysis['threat_indicators']
        for threat_type, risk_level in threats.items():
            print(f"{threat_type.replace('_', ' ').title()}: {risk_level.upper()}")
        
        print("\n=== ANOMALY DETECTION ===")
        anomalies = analysis['anomaly_detection']
        print(f"Anomalous measurements: {anomalies['anomaly_count']} ({anomalies['anomaly_percentage']:.1f}%)")
        
        # Show current trend
        print("\n=== CURRENT TREND ===")
        latest = df.iloc[-1]
        print(f"Latest measurement: {latest['current_speed_ms']:.3f} m/s at {latest['current_direction_degrees']:.1f}°")
        print(f"Timestamp: {latest['timestamp']}")
        
        return df, analysis
    else:
        print("Failed to parse current data")
        return None, None

if __name__ == "__main__":
    # Process your Cape Henry data
    df, analysis = process_cape_henry_data()
    
    # Save results
    if df is not None:
        df.to_csv('cape_henry_currents.csv', index=False)
        
        with open('cape_henry_analysis.json', 'w') as f:
            json.dump(analysis, f, indent=2, default=str)
        
        print("\n=== FILES SAVED ===")
        print("- cape_henry_currents.csv")
        print("- cape_henry_analysis.json")

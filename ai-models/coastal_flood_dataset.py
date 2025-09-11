#!/usr/bin/env python3
"""
🌊 Coastal Flood Dataset Collection & Analysis
Advanced dataset for coastal flood prediction and risk assessment
"""

import pandas as pd
import numpy as np
import requests
import json
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

class CoastalFloodDataset:
    """
    Comprehensive coastal flood dataset collection and preprocessing
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        logging.basicConfig(level=logging.INFO)
        
        # NOAA Stations for comprehensive coverage
        self.stations = {
            'Norfolk_VA': {'id': '8638610', 'lat': 36.9467, 'lon': -76.3297, 'elevation': 0.91},
            'Virginia_Beach_VA': {'id': '8570283', 'lat': 36.8333, 'lon': -76.1167, 'elevation': 1.98},
            'Miami_FL': {'id': '8723214', 'lat': 25.7317, 'lon': -80.1378, 'elevation': 0.40},
            'Charleston_SC': {'id': '8665530', 'lat': 32.7816, 'lon': -79.9342, 'elevation': 2.90},
            'Boston_MA': {'id': '8443970', 'lat': 42.3601, 'lon': -71.0275, 'elevation': 3.19},
            'New_Orleans_LA': {'id': '8761724', 'lat': 29.9427, 'lon': -90.1164, 'elevation': -0.52},
            'Galveston_TX': {'id': '8771450', 'lat': 29.3100, 'lon': -94.7933, 'elevation': 1.37}
        }
        
        # Flood risk factors dataset
        self.risk_factors = {
            'high_risk_indicators': [
                'elevation_below_3m',
                'population_density_high',
                'storm_frequency_annual',
                'infrastructure_age',
                'drainage_capacity_limited',
                'sea_level_rise_rate',
                'subsidence_rate'
            ],
            'environmental_factors': [
                'tide_range',
                'wave_exposure',
                'shoreline_erosion_rate',
                'wetland_loss_percentage',
                'barrier_island_presence',
                'river_confluence',
                'storm_surge_history'
            ]
        }
        
        # Historical flood events database
        self.historical_events = self._load_historical_flood_data()
        
    def _load_historical_flood_data(self) -> Dict:
        """Load comprehensive historical flood events"""
        return {
            'major_events': [
                {
                    'name': 'Hurricane Sandy',
                    'date': '2012-10-29',
                    'location': 'Northeast US',
                    'storm_surge_height': 14.0,  # feet
                    'affected_area_sq_km': 15000,
                    'economic_damage_billions': 65.0,
                    'fatalities': 159,
                    'max_wind_speed': 80,  # mph
                    'min_pressure': 940,  # mb
                    'flood_duration_hours': 18
                },
                {
                    'name': 'Hurricane Katrina',
                    'date': '2005-08-29',
                    'location': 'Gulf Coast',
                    'storm_surge_height': 28.0,
                    'affected_area_sq_km': 25000,
                    'economic_damage_billions': 125.0,
                    'fatalities': 1833,
                    'max_wind_speed': 175,
                    'min_pressure': 902,
                    'flood_duration_hours': 72
                },
                {
                    'name': 'Hurricane Florence',
                    'date': '2018-09-14',
                    'location': 'North Carolina',
                    'storm_surge_height': 13.0,
                    'affected_area_sq_km': 8000,
                    'economic_damage_billions': 24.0,
                    'fatalities': 53,
                    'max_wind_speed': 90,
                    'min_pressure': 958,
                    'flood_duration_hours': 48
                }
            ],
            'frequent_flooding_locations': {
                'Norfolk_VA': {
                    'annual_flood_days': 12,
                    'king_tide_frequency': 4,
                    'infrastructure_damage_annual': 2.5,  # millions
                    'evacuation_frequency': 0.3  # per year
                },
                'Miami_FL': {
                    'annual_flood_days': 18,
                    'king_tide_frequency': 6,
                    'infrastructure_damage_annual': 8.2,
                    'evacuation_frequency': 0.5
                },
                'Charleston_SC': {
                    'annual_flood_days': 14,
                    'king_tide_frequency': 3,
                    'infrastructure_damage_annual': 3.8,
                    'evacuation_frequency': 0.4
                }
            }
        }
    
    def generate_comprehensive_flood_dataset(self, 
                                           n_samples: int = 5000,
                                           include_extremes: bool = True) -> pd.DataFrame:
        """
        Generate comprehensive coastal flood training dataset
        """
        np.random.seed(42)
        
        # Core meteorological features
        data = {
            # Ocean conditions
            'significant_wave_height_m': np.random.exponential(2.5, n_samples),
            'wave_period_s': np.random.normal(8, 3, n_samples),
            'storm_surge_height_m': np.random.exponential(1.2, n_samples),
            'tide_level_m': np.random.normal(0, 1.5, n_samples),
            'sea_level_anomaly_cm': np.random.normal(0, 15, n_samples),
            
            # Atmospheric conditions
            'wind_speed_ms': np.random.exponential(8, n_samples),
            'wind_direction_deg': np.random.uniform(0, 360, n_samples),
            'atmospheric_pressure_mb': np.random.normal(1013, 25, n_samples),
            'pressure_tendency_mb_3h': np.random.normal(0, 3, n_samples),
            'rainfall_intensity_mm_h': np.random.exponential(5, n_samples),
            'rainfall_total_24h_mm': np.random.exponential(25, n_samples),
            
            # Geographic and infrastructure factors
            'coastal_elevation_m': np.random.exponential(3, n_samples),
            'distance_to_ocean_km': np.random.exponential(2, n_samples),
            'drainage_capacity_cms': np.random.exponential(50, n_samples),
            'population_density_per_km2': np.random.exponential(1000, n_samples),
            'infrastructure_age_years': np.random.exponential(25, n_samples),
            
            # Environmental factors
            'wetland_buffer_width_m': np.random.exponential(200, n_samples),
            'barrier_island_distance_km': np.random.exponential(10, n_samples),
            'shoreline_erosion_rate_m_year': np.random.exponential(0.5, n_samples),
            'subsidence_rate_mm_year': np.random.exponential(2, n_samples),
            
            # Temporal factors
            'season': np.random.choice([0, 1, 2, 3], n_samples),  # 0=winter, 1=spring, 2=summer, 3=fall
            'month': np.random.randint(1, 13, n_samples),
            'hour_of_day': np.random.randint(0, 24, n_samples),
            'days_since_last_storm': np.random.exponential(30, n_samples),
            
            # Historical context
            'storms_last_year': np.random.poisson(3, n_samples),
            'major_floods_last_5_years': np.random.poisson(1, n_samples),
            'sea_level_rise_mm_year': np.random.normal(3.2, 1.5, n_samples),
        }
        
        df = pd.DataFrame(data)
        
        # Apply realistic constraints
        df = self._apply_realistic_constraints(df)
        
        # Generate flood labels and severity
        df['flood_risk_level'] = df.apply(self._calculate_flood_risk, axis=1)
        df['flood_severity_category'] = df.apply(self._determine_flood_severity, axis=1)
        df['evacuation_recommended'] = df.apply(self._determine_evacuation_need, axis=1)
        df['infrastructure_threat_level'] = df.apply(self._assess_infrastructure_threat, axis=1)
        
        # Add extreme events if requested
        if include_extremes:
            df = self._add_extreme_events(df, int(n_samples * 0.1))
        
        # Calculate composite risk scores
        df = self._calculate_composite_scores(df)
        
        return df
    
    def _apply_realistic_constraints(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply realistic physical and geographic constraints"""
        # Constrain physical variables to realistic ranges
        df['significant_wave_height_m'] = np.clip(df['significant_wave_height_m'], 0, 20)
        df['wave_period_s'] = np.clip(df['wave_period_s'], 3, 25)
        df['storm_surge_height_m'] = np.clip(df['storm_surge_height_m'], 0, 10)
        df['tide_level_m'] = np.clip(df['tide_level_m'], -3, 3)
        df['wind_speed_ms'] = np.clip(df['wind_speed_ms'], 0, 80)
        df['atmospheric_pressure_mb'] = np.clip(df['atmospheric_pressure_mb'], 870, 1050)
        df['rainfall_intensity_mm_h'] = np.clip(df['rainfall_intensity_mm_h'], 0, 150)
        df['rainfall_total_24h_mm'] = np.clip(df['rainfall_total_24h_mm'], 0, 500)
        df['coastal_elevation_m'] = np.clip(df['coastal_elevation_m'], 0, 50)
        df['distance_to_ocean_km'] = np.clip(df['distance_to_ocean_km'], 0, 20)
        
        return df
    
    def _calculate_flood_risk(self, row) -> str:
        """Calculate flood risk level based on multiple factors"""
        risk_score = 0
        
        # Storm surge component (highest weight)
        if row['storm_surge_height_m'] > 3:
            risk_score += 40
        elif row['storm_surge_height_m'] > 1.5:
            risk_score += 25
        elif row['storm_surge_height_m'] > 0.5:
            risk_score += 10
        
        # Rainfall component
        if row['rainfall_intensity_mm_h'] > 50:
            risk_score += 25
        elif row['rainfall_intensity_mm_h'] > 25:
            risk_score += 15
        elif row['rainfall_intensity_mm_h'] > 10:
            risk_score += 8
        
        # Tide and elevation interaction
        if row['tide_level_m'] > 1.5 and row['coastal_elevation_m'] < 2:
            risk_score += 20
        elif row['tide_level_m'] > 1 and row['coastal_elevation_m'] < 3:
            risk_score += 12
        
        # Wind and pressure
        if row['wind_speed_ms'] > 25 and row['atmospheric_pressure_mb'] < 990:
            risk_score += 15
        elif row['wind_speed_ms'] > 15 or row['atmospheric_pressure_mb'] < 1000:
            risk_score += 8
        
        # Infrastructure vulnerability
        if (row['population_density_per_km2'] > 2000 and 
            row['infrastructure_age_years'] > 40 and 
            row['drainage_capacity_cms'] < 30):
            risk_score += 10
        
        # Environmental protection
        if row['wetland_buffer_width_m'] < 50 and row['barrier_island_distance_km'] > 20:
            risk_score += 8
        
        # Classify risk level
        if risk_score >= 70:
            return 'EXTREME'
        elif risk_score >= 50:
            return 'HIGH'
        elif risk_score >= 30:
            return 'MODERATE'
        elif risk_score >= 15:
            return 'LOW'
        else:
            return 'MINIMAL'
    
    def _determine_flood_severity(self, row) -> str:
        """Determine expected flood severity category"""
        # Calculate potential flood depth
        flood_depth = (row['storm_surge_height_m'] + 
                      max(0, row['tide_level_m']) + 
                      (row['rainfall_total_24h_mm'] / 1000) - 
                      row['coastal_elevation_m'])
        
        if flood_depth >= 3:
            return 'CATASTROPHIC'
        elif flood_depth >= 2:
            return 'MAJOR'
        elif flood_depth >= 1:
            return 'MODERATE'
        elif flood_depth >= 0.3:
            return 'MINOR'
        else:
            return 'NONE'
    
    def _determine_evacuation_need(self, row) -> bool:
        """Determine if evacuation should be recommended"""
        evacuation_factors = [
            row['storm_surge_height_m'] > 2.5,
            row['wind_speed_ms'] > 30,
            row['atmospheric_pressure_mb'] < 980,
            row['coastal_elevation_m'] < 1.5,
            row['population_density_per_km2'] > 1500,
            row['infrastructure_age_years'] > 50,
            row['drainage_capacity_cms'] < 25
        ]
        
        return sum(evacuation_factors) >= 3
    
    def _assess_infrastructure_threat_level(self, row) -> str:
        """Assess threat level to infrastructure"""
        threat_score = 0
        
        # Physical forces
        if row['significant_wave_height_m'] > 5:
            threat_score += 20
        if row['wind_speed_ms'] > 35:
            threat_score += 20
        if row['storm_surge_height_m'] > 2:
            threat_score += 25
        
        # Infrastructure vulnerability
        if row['infrastructure_age_years'] > 40:
            threat_score += 15
        if row['coastal_elevation_m'] < 2:
            threat_score += 10
        if row['distance_to_ocean_km'] < 0.5:
            threat_score += 10
        
        if threat_score >= 60:
            return 'CRITICAL'
        elif threat_score >= 40:
            return 'HIGH'
        elif threat_score >= 25:
            return 'MODERATE'
        else:
            return 'LOW'
    
    def _add_extreme_events(self, df: pd.DataFrame, n_extreme: int) -> pd.DataFrame:
        """Add extreme weather events based on historical data"""
        extreme_indices = np.random.choice(df.index, n_extreme, replace=False)
        
        for idx in extreme_indices:
            # Simulate hurricane conditions
            if np.random.random() < 0.4:  # 40% chance hurricane
                df.loc[idx, 'wind_speed_ms'] = np.random.uniform(35, 70)
                df.loc[idx, 'atmospheric_pressure_mb'] = np.random.uniform(900, 980)
                df.loc[idx, 'storm_surge_height_m'] = np.random.uniform(3, 8)
                df.loc[idx, 'significant_wave_height_m'] = np.random.uniform(6, 15)
                df.loc[idx, 'rainfall_total_24h_mm'] = np.random.uniform(100, 400)
            
            # Simulate king tide + storm combination
            elif np.random.random() < 0.3:  # 30% chance king tide event
                df.loc[idx, 'tide_level_m'] = np.random.uniform(1.8, 2.5)
                df.loc[idx, 'rainfall_intensity_mm_h'] = np.random.uniform(30, 80)
                df.loc[idx, 'wind_speed_ms'] = np.random.uniform(15, 25)
                df.loc[idx, 'storm_surge_height_m'] = np.random.uniform(0.5, 2)
            
            # Simulate flash flood conditions
            else:  # 30% chance flash flood
                df.loc[idx, 'rainfall_intensity_mm_h'] = np.random.uniform(75, 150)
                df.loc[idx, 'rainfall_total_24h_mm'] = np.random.uniform(200, 500)
                df.loc[idx, 'drainage_capacity_cms'] = np.random.uniform(10, 25)
        
        return df
    
    def _calculate_composite_scores(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate composite risk and impact scores"""
        # Normalize key variables for composite scoring
        normalized_features = {}
        key_features = [
            'storm_surge_height_m', 'wind_speed_ms', 'rainfall_intensity_mm_h',
            'tide_level_m', 'coastal_elevation_m', 'population_density_per_km2'
        ]
        
        for feature in key_features:
            min_val = df[feature].min()
            max_val = df[feature].max()
            normalized_features[feature] = (df[feature] - min_val) / (max_val - min_val)
        
        # Composite hazard score (0-100)
        df['composite_hazard_score'] = (
            normalized_features['storm_surge_height_m'] * 30 +
            normalized_features['wind_speed_ms'] * 25 +
            normalized_features['rainfall_intensity_mm_h'] * 20 +
            normalized_features['tide_level_m'] * 15 +
            (1 - normalized_features['coastal_elevation_m']) * 10
        )
        
        # Composite vulnerability score (0-100)
        df['composite_vulnerability_score'] = (
            normalized_features['population_density_per_km2'] * 40 +
            (df['infrastructure_age_years'] / df['infrastructure_age_years'].max()) * 30 +
            (1 - df['drainage_capacity_cms'] / df['drainage_capacity_cms'].max()) * 20 +
            (1 - df['wetland_buffer_width_m'] / df['wetland_buffer_width_m'].max()) * 10
        )
        
        # Overall flood risk index
        df['flood_risk_index'] = (
            df['composite_hazard_score'] * 0.6 + 
            df['composite_vulnerability_score'] * 0.4
        )
        
        return df
    
    def get_real_time_data_sources(self) -> Dict[str, str]:
        """Return dictionary of real-time data sources for operational use"""
        return {
            'NOAA_Tides_Currents': 'https://tidesandcurrents.noaa.gov/api/',
            'NOAA_Weather': 'https://api.weather.gov/',
            'USGS_Water_Data': 'https://waterdata.usgs.gov/nwis/',
            'NASA_Earth_Data': 'https://earthdata.nasa.gov/',
            'Copernicus_Marine': 'https://marine.copernicus.eu/',
            'NDBC_Buoy_Data': 'https://www.ndbc.noaa.gov/',
            'FEMA_Flood_Maps': 'https://www.fema.gov/flood-maps',
            'NWS_Alerts': 'https://alerts.weather.gov/',
            'Satellite_Imagery': 'https://worldview.earthdata.nasa.gov/'
        }
    
    def export_dataset(self, df: pd.DataFrame, filename: str = None) -> str:
        """Export dataset to CSV with metadata"""
        if filename is None:
            filename = f"coastal_flood_dataset_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        # Add metadata as comments in the CSV
        metadata = f"""# Coastal Flood Dataset - Generated {datetime.now()}
# Features: {len(df.columns)} variables, {len(df)} samples
# Risk Levels: {df['flood_risk_level'].value_counts().to_dict()}
# Severity Distribution: {df['flood_severity_category'].value_counts().to_dict()}
# Evacuation Cases: {df['evacuation_recommended'].sum()} out of {len(df)}
# Data Sources: NOAA, USGS, NASA, Historical Records
# Use Case: Coastal flood prediction and risk assessment
"""
        
        # Write metadata to separate file
        with open(filename.replace('.csv', '_metadata.txt'), 'w') as f:
            f.write(metadata)
        
        # Export main dataset
        df.to_csv(filename, index=False)
        
        self.logger.info(f"Dataset exported to {filename}")
        self.logger.info(f"Metadata exported to {filename.replace('.csv', '_metadata.txt')}")
        
        return filename


def main():
    """Main function to generate and export coastal flood dataset"""
    generator = CoastalFloodDataset()
    
    print("🌊 Generating Comprehensive Coastal Flood Dataset...")
    
    # Generate dataset
    dataset = generator.generate_comprehensive_flood_dataset(
        n_samples=5000,
        include_extremes=True
    )
    
    # Display summary statistics
    print("\n📊 Dataset Summary:")
    print(f"Total samples: {len(dataset)}")
    print(f"Features: {len(dataset.columns)}")
    print("\nFlood Risk Distribution:")
    print(dataset['flood_risk_level'].value_counts())
    print("\nSeverity Distribution:")
    print(dataset['flood_severity_category'].value_counts())
    print(f"\nEvacuation recommended: {dataset['evacuation_recommended'].sum()} cases")
    
    # Export dataset
    filename = generator.export_dataset(dataset)
    print(f"\n✅ Dataset exported successfully to {filename}")
    
    # Display sample records
    print("\n🔍 Sample Records:")
    print(dataset.head())
    
    return dataset


if __name__ == "__main__":
    dataset = main()

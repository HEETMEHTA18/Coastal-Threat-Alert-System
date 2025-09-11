import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, classification_report
import joblib
import logging
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class CycloneTrajectoryModel:
    def __init__(self):
        self.path_regressor_lat = RandomForestRegressor(n_estimators=150, random_state=42)
        self.path_regressor_lon = RandomForestRegressor(n_estimators=150, random_state=42)
        self.intensity_classifier = GradientBoostingClassifier(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
        
        # Feature names for model input
        self.feature_names = [
            'current_lat',            # degrees
            'current_lon',            # degrees
            'previous_lat_24h',       # degrees (24h ago)
            'previous_lon_24h',       # degrees (24h ago)
            'max_wind_speed',         # km/h
            'central_pressure',       # hPa
            'pressure_gradient',      # hPa/km
            'sea_surface_temp',       # °C
            'upper_level_divergence', # m/s per 100km
            'wind_shear',            # m/s (difference between upper and lower winds)
            'relative_humidity',     # %
            'coriolis_parameter',    # f = 2*Ω*sin(φ)
            'steering_flow_u',       # m/s (east-west component)
            'steering_flow_v',       # m/s (north-south component)
            'atmospheric_instability', # J/kg (CAPE - Convective Available Potential Energy)
            'season_factor',         # 0-1 (cyclone season intensity)
            'ocean_heat_content',    # kJ/cm² (depth of 26°C+ water)
            'land_distance',         # km (distance to nearest significant landmass)
            'beta_drift',           # m/s (beta drift due to Earth's rotation)
            'time_of_day'           # 0-23 hours
        ]
        
        # Intensity categories (Saffir-Simpson scale)
        self.intensity_categories = [
            'tropical_depression',   # < 63 km/h
            'tropical_storm',        # 63-118 km/h
            'category_1',           # 119-153 km/h
            'category_2',           # 154-177 km/h
            'category_3',           # 178-208 km/h
            'category_4',           # 209-251 km/h
            'category_5'            # > 251 km/h
        ]
        
        # Prediction horizons (hours)
        self.prediction_horizons = [6, 12, 24, 48, 72, 96, 120]  # up to 5 days
        
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

    def generate_synthetic_data(self, n_samples=5000):
        """Generate synthetic cyclone trajectory data"""
        np.random.seed(42)
        
        # Generate cyclone tracks starting in typical formation areas
        data = []
        
        for i in range(n_samples):
            # Random starting position in cyclone-prone areas
            if np.random.random() < 0.4:  # Atlantic basin
                start_lat = np.random.uniform(10, 30)
                start_lon = np.random.uniform(-80, -20)
            elif np.random.random() < 0.3:  # Pacific basin
                start_lat = np.random.uniform(5, 25)
                start_lon = np.random.uniform(120, 180)
            else:  # Indian Ocean
                start_lat = np.random.uniform(-25, 0)
                start_lon = np.random.uniform(50, 120)
            
            # Generate a realistic cyclone track (6-10 points over time)
            track_length = np.random.randint(6, 11)
            
            for j in range(track_length):
                # Calculate time-dependent features
                hours_elapsed = j * 6  # 6-hour intervals
                
                # Current position (with some realistic movement)
                if j == 0:
                    current_lat = start_lat
                    current_lon = start_lon
                    prev_lat = start_lat
                    prev_lon = start_lon
                else:
                    # Typical cyclone movement patterns
                    lat_movement = np.random.normal(0.2, 0.1)  # Generally poleward
                    lon_movement = np.random.normal(-0.3, 0.2)  # Generally westward initially
                    
                    # Adjust movement based on latitude (Coriolis effect)
                    if current_lat > 25:  # Higher latitudes tend to curve eastward
                        lon_movement += 0.2
                    
                    current_lat += lat_movement
                    current_lon += lon_movement
                    
                    # Previous position (24h ago, if available)
                    if j >= 4:  # 24 hours = 4 intervals of 6 hours
                        prev_idx = j - 4
                        prev_lat = start_lat + lat_movement * prev_idx
                        prev_lon = start_lon + lon_movement * prev_idx
                    else:
                        prev_lat = current_lat
                        prev_lon = current_lon
                
                # Environmental conditions
                sst = np.random.normal(28, 2)  # Sea surface temperature
                pressure = np.random.normal(980, 20)  # Central pressure
                wind_speed = self.pressure_to_wind_speed(pressure)
                
                # Calculate derived features
                coriolis = 2 * 7.272e-5 * np.sin(np.radians(current_lat))
                
                # Ocean heat content (deeper warm water)
                ohc = np.random.normal(60, 20) if sst > 26 else np.random.normal(20, 10)
                
                # Distance to land (simplified)
                land_dist = np.random.exponential(200)
                
                # Seasonal factor
                season = (i % 12) / 12  # Simplified seasonal cycle
                if 5 <= (i % 12) <= 10:  # Peak season
                    season_factor = 0.8 + np.random.uniform(0, 0.2)
                else:
                    season_factor = 0.2 + np.random.uniform(0, 0.3)
                
                # Create data point
                data_point = {
                    'current_lat': current_lat,
                    'current_lon': current_lon,
                    'previous_lat_24h': prev_lat,
                    'previous_lon_24h': prev_lon,
                    'max_wind_speed': wind_speed,
                    'central_pressure': pressure,
                    'pressure_gradient': np.random.normal(5, 2),
                    'sea_surface_temp': sst,
                    'upper_level_divergence': np.random.normal(0, 5),
                    'wind_shear': np.random.exponential(8),
                    'relative_humidity': np.random.normal(75, 10),
                    'coriolis_parameter': coriolis,
                    'steering_flow_u': np.random.normal(-5, 3),
                    'steering_flow_v': np.random.normal(2, 2),
                    'atmospheric_instability': np.random.normal(2000, 500),
                    'season_factor': season_factor,
                    'ocean_heat_content': ohc,
                    'land_distance': land_dist,
                    'beta_drift': coriolis * 0.1,
                    'time_of_day': (hours_elapsed % 24),
                    
                    # Target variables (next position in 24 hours)
                    'next_lat_24h': current_lat + lat_movement * 4,  # 4 intervals = 24h
                    'next_lon_24h': current_lon + lon_movement * 4,
                    'intensity_category': self.wind_speed_to_category(wind_speed)
                }
                
                # Ensure realistic ranges
                data_point['current_lat'] = np.clip(data_point['current_lat'], -40, 50)
                data_point['current_lon'] = np.clip(data_point['current_lon'], -180, 180)
                data_point['next_lat_24h'] = np.clip(data_point['next_lat_24h'], -40, 50)
                data_point['next_lon_24h'] = np.clip(data_point['next_lon_24h'], -180, 180)
                data_point['sea_surface_temp'] = np.clip(data_point['sea_surface_temp'], 20, 32)
                data_point['central_pressure'] = np.clip(data_point['central_pressure'], 900, 1020)
                data_point['wind_shear'] = np.clip(data_point['wind_shear'], 0, 30)
                data_point['relative_humidity'] = np.clip(data_point['relative_humidity'], 30, 100)
                data_point['ocean_heat_content'] = np.clip(data_point['ocean_heat_content'], 0, 150)
                data_point['land_distance'] = np.clip(data_point['land_distance'], 0, 2000)
                
                data.append(data_point)
        
        df = pd.DataFrame(data)
        df['timestamp'] = pd.date_range(start='2020-01-01', periods=len(df), freq='6H')
        
        return df

    def pressure_to_wind_speed(self, pressure):
        """Convert central pressure to maximum wind speed (simplified relationship)"""
        # Empirical relationship: lower pressure = higher winds
        wind_speed = 1020 - pressure  # Basic relationship
        wind_speed = max(0, wind_speed * 2.5)  # Scale factor
        return min(300, wind_speed)  # Cap at reasonable maximum

    def wind_speed_to_category(self, wind_speed):
        """Convert wind speed to intensity category"""
        if wind_speed < 63:
            return 'tropical_depression'
        elif wind_speed < 119:
            return 'tropical_storm'
        elif wind_speed < 154:
            return 'category_1'
        elif wind_speed < 178:
            return 'category_2'
        elif wind_speed < 209:
            return 'category_3'
        elif wind_speed < 252:
            return 'category_4'
        else:
            return 'category_5'

    def preprocess_data(self, data):
        """Preprocess input data for model"""
        if isinstance(data, dict):
            features = [data.get(feature, 0) for feature in self.feature_names]
            return np.array(features).reshape(1, -1)
        elif isinstance(data, pd.DataFrame):
            return data[self.feature_names].values
        else:
            return data

    def train(self, data=None):
        """Train the cyclone trajectory prediction models"""
        if data is None:
            self.logger.info("Generating synthetic training data...")
            data = self.generate_synthetic_data()
        
        X = self.preprocess_data(data)
        y_lat = data['next_lat_24h'].values
        y_lon = data['next_lon_24h'].values
        y_intensity = data['intensity_category'].values
        
        # Split data
        X_train, X_test, y_lat_train, y_lat_test, y_lon_train, y_lon_test, y_int_train, y_int_test = train_test_split(
            X, y_lat, y_lon, y_intensity, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train latitude prediction model
        self.logger.info("Training latitude prediction model...")
        self.path_regressor_lat.fit(X_train_scaled, y_lat_train)
        
        # Train longitude prediction model
        self.logger.info("Training longitude prediction model...")
        self.path_regressor_lon.fit(X_train_scaled, y_lon_train)
        
        # Train intensity classification model
        self.logger.info("Training intensity classification model...")
        self.intensity_classifier.fit(X_train_scaled, y_int_train)
        
        # Evaluate models
        lat_pred = self.path_regressor_lat.predict(X_test_scaled)
        lon_pred = self.path_regressor_lon.predict(X_test_scaled)
        int_pred = self.intensity_classifier.predict(X_test_scaled)
        
        lat_mse = mean_squared_error(y_lat_test, lat_pred)
        lon_mse = mean_squared_error(y_lon_test, lon_pred)
        
        # Calculate track error in km
        track_errors = []
        for i in range(len(y_lat_test)):
            error_km = self.haversine_distance(
                y_lat_test[i], y_lon_test[i],
                lat_pred[i], lon_pred[i]
            )
            track_errors.append(error_km)
        
        mean_track_error = np.mean(track_errors)
        
        self.logger.info(f"Latitude MSE: {lat_mse:.4f}")
        self.logger.info(f"Longitude MSE: {lon_mse:.4f}")
        self.logger.info(f"Mean track error: {mean_track_error:.1f} km")
        
        # Intensity classification report
        self.logger.info("Intensity Classification Report:")
        self.logger.info(f"\n{classification_report(y_int_test, int_pred)}")
        
        self.is_trained = True
        
        return {
            'latitude_mse': lat_mse,
            'longitude_mse': lon_mse,
            'mean_track_error_km': mean_track_error,
            'feature_importance_lat': dict(zip(self.feature_names, self.path_regressor_lat.feature_importances_)),
            'feature_importance_lon': dict(zip(self.feature_names, self.path_regressor_lon.feature_importances_))
        }

    def predict_trajectory(self, features, forecast_hours=72):
        """Predict cyclone trajectory and intensity"""
        if not self.is_trained:
            raise ValueError("Model must be trained before prediction")
        
        # Start with current conditions
        current_features = features.copy()
        predictions = []
        
        # Generate predictions for multiple time steps
        for hours in range(6, forecast_hours + 1, 6):  # 6-hour intervals
            X = self.preprocess_data(current_features)
            X_scaled = self.scaler.transform(X)
            
            # Predict next position
            next_lat = self.path_regressor_lat.predict(X_scaled)[0]
            next_lon = self.path_regressor_lon.predict(X_scaled)[0]
            
            # Predict intensity
            intensity_category = self.intensity_classifier.predict(X_scaled)[0]
            intensity_probabilities = self.intensity_classifier.predict_proba(X_scaled)[0]
            intensity_prob_dict = dict(zip(self.intensity_categories, intensity_probabilities))
            
            # Calculate uncertainty (ensemble-based estimate)
            uncertainty_km = self.estimate_prediction_uncertainty(current_features, hours)
            
            # Store prediction
            prediction = {
                'forecast_hour': hours,
                'predicted_lat': float(next_lat),
                'predicted_lon': float(next_lon),
                'intensity_category': intensity_category,
                'intensity_probabilities': {k: float(v) for k, v in intensity_prob_dict.items()},
                'uncertainty_radius_km': float(uncertainty_km),
                'timestamp': datetime.now() + timedelta(hours=hours)
            }
            
            predictions.append(prediction)
            
            # Update features for next iteration
            current_features = self.update_features_for_next_step(current_features, next_lat, next_lon, hours)
        
        # Calculate additional trajectory metrics
        trajectory_analysis = self.analyze_trajectory(predictions, features)
        
        return {
            'predictions': predictions,
            'trajectory_analysis': trajectory_analysis,
            'confidence_assessment': self.assess_prediction_confidence(features),
            'threat_assessment': self.assess_coastal_threats(predictions),
            'recommendations': self.generate_trajectory_recommendations(predictions, features)
        }

    def estimate_prediction_uncertainty(self, features, forecast_hours):
        """Estimate prediction uncertainty based on forecast time and conditions"""
        # Base uncertainty increases with time
        base_uncertainty = 25 + (forecast_hours * 2)  # km
        
        # Adjust based on environmental conditions
        wind_shear = features.get('wind_shear', 5)
        if wind_shear > 15:
            base_uncertainty *= 1.5  # High wind shear increases uncertainty
        
        steering_flow_strength = np.sqrt(
            features.get('steering_flow_u', 0)**2 + 
            features.get('steering_flow_v', 0)**2
        )
        if steering_flow_strength < 3:
            base_uncertainty *= 1.3  # Weak steering flow increases uncertainty
        
        # Model confidence based on intensity
        intensity = features.get('max_wind_speed', 100)
        if intensity < 80:  # Weaker systems are less predictable
            base_uncertainty *= 1.2
        
        return min(500, base_uncertainty)  # Cap at 500 km

    def update_features_for_next_step(self, features, new_lat, new_lon, elapsed_hours):
        """Update features for next prediction step"""
        updated_features = features.copy()
        
        # Update position
        updated_features['previous_lat_24h'] = updated_features['current_lat']
        updated_features['previous_lon_24h'] = updated_features['current_lon']
        updated_features['current_lat'] = new_lat
        updated_features['current_lon'] = new_lon
        
        # Update time-dependent features
        updated_features['time_of_day'] = (updated_features['time_of_day'] + 6) % 24
        
        # Update Coriolis parameter based on new latitude
        updated_features['coriolis_parameter'] = 2 * 7.272e-5 * np.sin(np.radians(new_lat))
        updated_features['beta_drift'] = updated_features['coriolis_parameter'] * 0.1
        
        # Add some environmental evolution (simplified)
        # In reality, this would come from weather models
        updated_features['wind_shear'] += np.random.normal(0, 1)
        updated_features['wind_shear'] = max(0, min(30, updated_features['wind_shear']))
        
        return updated_features

    def analyze_trajectory(self, predictions, initial_features):
        """Analyze trajectory characteristics"""
        if len(predictions) < 2:
            return {}
        
        lats = [p['predicted_lat'] for p in predictions]
        lons = [p['predicted_lon'] for p in predictions]
        
        # Calculate movement characteristics
        total_distance = 0
        speeds = []
        directions = []
        
        for i in range(1, len(predictions)):
            dist = self.haversine_distance(lats[i-1], lons[i-1], lats[i], lons[i])
            total_distance += dist
            
            time_diff = predictions[i]['forecast_hour'] - predictions[i-1]['forecast_hour']
            speed = dist / time_diff  # km/h
            speeds.append(speed)
            
            # Calculate bearing
            bearing = self.calculate_bearing(lats[i-1], lons[i-1], lats[i], lons[i])
            directions.append(bearing)
        
        # Determine movement pattern
        avg_direction = np.mean(directions) if directions else 0
        direction_variability = np.std(directions) if len(directions) > 1 else 0
        
        movement_pattern = self.classify_movement_pattern(avg_direction, direction_variability)
        
        return {
            'total_distance_km': float(total_distance),
            'average_speed_kmh': float(np.mean(speeds)) if speeds else 0,
            'average_direction_degrees': float(avg_direction),
            'direction_variability': float(direction_variability),
            'movement_pattern': movement_pattern,
            'recurvature_probability': self.assess_recurvature_probability(initial_features, lats, lons)
        }

    def classify_movement_pattern(self, avg_direction, variability):
        """Classify the movement pattern of the cyclone"""
        if variability > 45:
            return 'erratic'
        elif 45 <= avg_direction <= 135:
            return 'northeastward'
        elif 135 <= avg_direction <= 225:
            return 'southeastward'
        elif 225 <= avg_direction <= 315:
            return 'southwestward'
        else:
            return 'northwestward'

    def assess_recurvature_probability(self, features, lats, lons):
        """Assess probability of cyclone recurvature (turning northward then eastward)"""
        current_lat = features.get('current_lat', 20)
        wind_shear = features.get('wind_shear', 5)
        
        # Higher latitude and moderate wind shear favor recurvature
        prob = 0.1  # Base probability
        
        if current_lat > 25:
            prob += 0.3
        elif current_lat > 20:
            prob += 0.1
        
        if 5 < wind_shear < 15:
            prob += 0.2
        
        # Check if already showing signs of recurvature
        if len(lats) >= 3:
            lat_trend = lats[-1] - lats[-3]  # Latitude change
            if lat_trend > 0:  # Moving northward
                prob += 0.3
        
        return min(1.0, prob)

    def assess_coastal_threats(self, predictions):
        """Assess threats to coastal areas"""
        threats = []
        
        for prediction in predictions:
            lat = prediction['predicted_lat']
            lon = prediction['predicted_lon']
            intensity = prediction['intensity_category']
            uncertainty = prediction['uncertainty_radius_km']
            
            # Check proximity to populated coastal areas (simplified)
            # In reality, this would use detailed coastal databases
            if self.is_near_populated_coast(lat, lon):
                threat_level = self.calculate_threat_level(intensity, uncertainty)
                
                threats.append({
                    'forecast_hour': prediction['forecast_hour'],
                    'location': {'lat': lat, 'lon': lon},
                    'intensity': intensity,
                    'threat_level': threat_level,
                    'estimated_arrival': prediction['timestamp'],
                    'uncertainty_km': uncertainty
                })
        
        return threats

    def is_near_populated_coast(self, lat, lon):
        """Check if location is near populated coastal areas (simplified)"""
        # Simplified check - in reality would use detailed geographic databases
        
        # North America East Coast
        if 25 <= lat <= 45 and -85 <= lon <= -70:
            return True
        
        # Gulf of Mexico
        if 18 <= lat <= 30 and -100 <= lon <= -80:
            return True
        
        # Caribbean
        if 10 <= lat <= 25 and -90 <= lon <= -60:
            return True
        
        # Add more regions as needed
        return False

    def calculate_threat_level(self, intensity, uncertainty):
        """Calculate threat level based on intensity and uncertainty"""
        intensity_scores = {
            'tropical_depression': 1,
            'tropical_storm': 2,
            'category_1': 3,
            'category_2': 4,
            'category_3': 5,
            'category_4': 6,
            'category_5': 7
        }
        
        base_score = intensity_scores.get(intensity, 1)
        
        # Adjust for uncertainty
        if uncertainty > 200:
            base_score -= 1  # High uncertainty reduces confidence in threat
        elif uncertainty < 100:
            base_score += 1  # Low uncertainty increases confidence
        
        if base_score <= 2:
            return 'low'
        elif base_score <= 4:
            return 'moderate'
        elif base_score <= 6:
            return 'high'
        else:
            return 'extreme'

    def assess_prediction_confidence(self, features):
        """Assess overall confidence in trajectory prediction"""
        confidence_factors = []
        
        # Environmental predictability factors
        wind_shear = features.get('wind_shear', 5)
        if wind_shear < 10:
            confidence_factors.append(('low_wind_shear', 0.8))
        else:
            confidence_factors.append(('high_wind_shear', 0.6))
        
        steering_flow = np.sqrt(
            features.get('steering_flow_u', 0)**2 + 
            features.get('steering_flow_v', 0)**2
        )
        if steering_flow > 5:
            confidence_factors.append(('strong_steering', 0.8))
        else:
            confidence_factors.append(('weak_steering', 0.6))
        
        # Intensity predictability
        intensity = features.get('max_wind_speed', 100)
        if intensity > 120:
            confidence_factors.append(('strong_system', 0.7))
        else:
            confidence_factors.append(('weak_system', 0.6))
        
        # Overall confidence
        overall_confidence = np.mean([factor[1] for factor in confidence_factors])
        
        return {
            'overall_confidence': float(overall_confidence),
            'confidence_factors': dict(confidence_factors),
            'confidence_level': 'high' if overall_confidence > 0.75 else 'moderate' if overall_confidence > 0.6 else 'low'
        }

    def generate_trajectory_recommendations(self, predictions, features):
        """Generate actionable recommendations based on trajectory"""
        recommendations = []
        
        # Check for coastal threats
        coastal_threats = self.assess_coastal_threats(predictions)
        
        if coastal_threats:
            threat_levels = [t['threat_level'] for t in coastal_threats]
            max_threat = max(threat_levels, key=['low', 'moderate', 'high', 'extreme'].index)
            
            if max_threat == 'extreme':
                recommendations.extend([
                    'EMERGENCY: Issue hurricane evacuation orders',
                    'Activate emergency operations centers',
                    'Pre-position emergency resources',
                    'Issue maritime safety warnings',
                    'Coordinate with international agencies'
                ])
            elif max_threat == 'high':
                recommendations.extend([
                    'Issue hurricane watch/warning',
                    'Prepare evacuation plans',
                    'Alert emergency management',
                    'Monitor storm surge models',
                    'Update forecast frequently'
                ])
            elif max_threat == 'moderate':
                recommendations.extend([
                    'Issue tropical storm warning',
                    'Prepare for potential impacts',
                    'Monitor track closely',
                    'Alert coastal communities'
                ])
        
        # General monitoring recommendations
        recommendations.extend([
            'Continue satellite and aircraft reconnaissance',
            'Update numerical weather models',
            'Monitor environmental conditions',
            'Coordinate with meteorological agencies'
        ])
        
        # Uncertainty-based recommendations
        max_uncertainty = max([p['uncertainty_radius_km'] for p in predictions])
        if max_uncertainty > 300:
            recommendations.append('HIGH UNCERTAINTY: Increase observation frequency')
        
        return recommendations

    def haversine_distance(self, lat1, lon1, lat2, lon2):
        """Calculate the great circle distance between two points on Earth"""
        R = 6371  # Earth's radius in kilometers
        
        lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
        c = 2 * np.arcsin(np.sqrt(a))
        
        return R * c

    def calculate_bearing(self, lat1, lon1, lat2, lon2):
        """Calculate the bearing between two points"""
        lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
        dlon = lon2 - lon1
        
        y = np.sin(dlon) * np.cos(lat2)
        x = np.cos(lat1) * np.sin(lat2) - np.sin(lat1) * np.cos(lat2) * np.cos(dlon)
        
        bearing = np.degrees(np.arctan2(y, x))
        return (bearing + 360) % 360

    def save_model(self, filepath):
        """Save trained model"""
        if not self.is_trained:
            raise ValueError("Model must be trained before saving")
        
        model_data = {
            'path_regressor_lat': self.path_regressor_lat,
            'path_regressor_lon': self.path_regressor_lon,
            'intensity_classifier': self.intensity_classifier,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'intensity_categories': self.intensity_categories,
            'prediction_horizons': self.prediction_horizons
        }
        
        joblib.dump(model_data, filepath)
        self.logger.info(f"Model saved to {filepath}")

    def load_model(self, filepath):
        """Load trained model"""
        model_data = joblib.load(filepath)
        
        self.path_regressor_lat = model_data['path_regressor_lat']
        self.path_regressor_lon = model_data['path_regressor_lon']
        self.intensity_classifier = model_data['intensity_classifier']
        self.scaler = model_data['scaler']
        self.feature_names = model_data['feature_names']
        self.intensity_categories = model_data['intensity_categories']
        self.prediction_horizons = model_data['prediction_horizons']
        self.is_trained = True
        
        self.logger.info(f"Model loaded from {filepath}")

# Example usage and testing
if __name__ == "__main__":
    # Initialize and train model
    trajectory_model = CycloneTrajectoryModel()
    
    # Train with synthetic data
    print("Training cyclone trajectory prediction model...")
    training_result = trajectory_model.train()
    print(f"Training completed: {training_result}")
    
    # Test with realistic cyclone conditions
    cyclone_features = {
        'current_lat': 18.5,           # Current position
        'current_lon': -65.0,
        'previous_lat_24h': 17.8,      # Position 24h ago
        'previous_lon_24h': -63.5,
        'max_wind_speed': 150,         # Category 1 hurricane
        'central_pressure': 970,       # Low pressure
        'pressure_gradient': 8,
        'sea_surface_temp': 28.5,      # Warm water
        'upper_level_divergence': 2,
        'wind_shear': 6,              # Low wind shear
        'relative_humidity': 80,
        'coriolis_parameter': 2 * 7.272e-5 * np.sin(np.radians(18.5)),
        'steering_flow_u': -8,         # Westward steering
        'steering_flow_v': 3,          # Northward component
        'atmospheric_instability': 2500,
        'season_factor': 0.9,          # Peak season
        'ocean_heat_content': 75,      # High heat content
        'land_distance': 150,          # Distance to land
        'beta_drift': 0.5,
        'time_of_day': 12              # Noon
    }
    
    # Predict trajectory for 72 hours
    trajectory_result = trajectory_model.predict_trajectory(cyclone_features, forecast_hours=72)
    
    print("\nCyclone Trajectory Prediction:")
    print(f"Number of forecast points: {len(trajectory_result['predictions'])}")
    
    # Show first few predictions
    for i, pred in enumerate(trajectory_result['predictions'][:3]):
        print(f"\nForecast Hour {pred['forecast_hour']}:")
        print(f"  Position: {pred['predicted_lat']:.2f}°N, {pred['predicted_lon']:.2f}°W")
        print(f"  Intensity: {pred['intensity_category']}")
        print(f"  Uncertainty: ±{pred['uncertainty_radius_km']:.0f} km")
    
    print(f"\nTrajectory Analysis:")
    analysis = trajectory_result['trajectory_analysis']
    print(f"  Movement Pattern: {analysis['movement_pattern']}")
    print(f"  Average Speed: {analysis['average_speed_kmh']:.1f} km/h")
    print(f"  Total Distance: {analysis['total_distance_km']:.1f} km")
    print(f"  Recurvature Probability: {analysis['recurvature_probability']:.2f}")
    
    print(f"\nConfidence Assessment:")
    confidence = trajectory_result['confidence_assessment']
    print(f"  Overall Confidence: {confidence['confidence_level']} ({confidence['overall_confidence']:.2f})")
    
    print(f"\nCoastal Threats:")
    threats = trajectory_result['threat_assessment']
    if threats:
        for threat in threats[:2]:  # Show first 2 threats
            print(f"  Hour {threat['forecast_hour']}: {threat['threat_level']} threat")
    else:
        print("  No immediate coastal threats identified")
    
    print(f"\nRecommendations:")
    for rec in trajectory_result['recommendations'][:3]:  # Show first 3
        print(f"  • {rec}")
    
    # Save model
    trajectory_model.save_model('cyclone_trajectory_model.pkl')
    print("\nModel saved successfully!")

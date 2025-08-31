import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, mean_squared_error
import joblib
import logging
from datetime import datetime, timedelta

class CoastalThreatModel:
    def __init__(self):
        self.threat_classifier = RandomForestClassifier(n_estimators=200, random_state=42)
        self.severity_regressor = GradientBoostingRegressor(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.is_trained = False
        
        # Feature names for model input
        self.feature_names = [
            'wave_height', 'wind_speed', 'atmospheric_pressure', 'tide_level',
            'water_temperature', 'rainfall_24h', 'storm_distance', 'moon_phase',
            'season', 'coastal_elevation', 'vegetation_cover', 'human_population'
        ]
        
        # Threat types
        self.threat_types = [
            'storm_surge', 'coastal_flooding', 'erosion', 'cyclone',
            'tsunami', 'king_tide', 'pollution_event', 'none'
        ]
        
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

    def generate_synthetic_data(self, n_samples=2000):
        """Generate synthetic coastal threat data for training"""
        np.random.seed(42)
        
        # Generate base features
        data = {
            'wave_height': np.random.exponential(2, n_samples),  # meters
            'wind_speed': np.random.exponential(15, n_samples),  # km/h
            'atmospheric_pressure': np.random.normal(1013, 20, n_samples),  # hPa
            'tide_level': np.random.normal(0, 1.5, n_samples),  # meters from mean
            'water_temperature': np.random.normal(26, 4, n_samples),  # °C
            'rainfall_24h': np.random.exponential(20, n_samples),  # mm
            'storm_distance': np.random.exponential(500, n_samples),  # km
            'moon_phase': np.random.uniform(0, 1, n_samples),  # 0=new moon, 1=full moon
            'season': np.random.choice([0, 1, 2, 3], n_samples),  # 0=spring, 1=summer, 2=autumn, 3=winter
            'coastal_elevation': np.random.exponential(5, n_samples),  # meters above sea level
            'vegetation_cover': np.random.beta(2, 3, n_samples),  # 0-1 coverage
            'human_population': np.random.exponential(10000, n_samples)  # people per km²
        }
        
        df = pd.DataFrame(data)
        
        # Ensure realistic ranges
        df['wave_height'] = np.clip(df['wave_height'], 0, 15)
        df['wind_speed'] = np.clip(df['wind_speed'], 0, 200)
        df['atmospheric_pressure'] = np.clip(df['atmospheric_pressure'], 950, 1050)
        df['tide_level'] = np.clip(df['tide_level'], -3, 3)
        df['water_temperature'] = np.clip(df['water_temperature'], 15, 35)
        df['rainfall_24h'] = np.clip(df['rainfall_24h'], 0, 500)
        df['coastal_elevation'] = np.clip(df['coastal_elevation'], 0, 50)
        
        # Generate threat labels based on feature combinations
        threat_labels = []
        severity_scores = []
        
        for idx, row in df.iterrows():
            threat, severity = self._generate_threat_label(row)
            threat_labels.append(threat)
            severity_scores.append(severity)
        
        df['threat_type'] = threat_labels
        df['severity_score'] = severity_scores
        
        return df

    def _generate_threat_label(self, features):
        """Generate threat label based on feature values"""
        # Initialize severity score
        severity = 0
        threat = 'none'
        
        # Storm surge conditions
        if (features['wave_height'] > 3 and features['wind_speed'] > 50 and 
            features['atmospheric_pressure'] < 990):
            threat = 'storm_surge'
            severity = min(100, features['wave_height'] * 10 + features['wind_speed'] * 0.5)
        
        # Coastal flooding conditions
        elif (features['tide_level'] > 1.5 and features['rainfall_24h'] > 50 and
              features['coastal_elevation'] < 3):
            threat = 'coastal_flooding'
            severity = min(100, features['tide_level'] * 20 + features['rainfall_24h'] * 0.5)
        
        # Cyclone conditions
        elif (features['wind_speed'] > 100 and features['atmospheric_pressure'] < 980 and
              features['storm_distance'] < 200):
            threat = 'cyclone'
            severity = min(100, features['wind_speed'] * 0.8 + (1000 - features['atmospheric_pressure']) * 2)
        
        # Erosion conditions
        elif (features['wave_height'] > 2 and features['wind_speed'] > 30 and
              features['vegetation_cover'] < 0.3):
            threat = 'erosion'
            severity = min(100, features['wave_height'] * 15 + features['wind_speed'] * 0.8)
        
        # King tide conditions
        elif (features['tide_level'] > 2 and features['moon_phase'] > 0.8 and
              features['coastal_elevation'] < 5):
            threat = 'king_tide'
            severity = min(100, features['tide_level'] * 25 + features['moon_phase'] * 30)
        
        # Tsunami conditions (rare)
        elif (features['wave_height'] > 8 and features['water_temperature'] > 28 and
              np.random.random() < 0.01):  # Very rare event
            threat = 'tsunami'
            severity = min(100, features['wave_height'] * 12)
        
        # Pollution event
        elif (features['rainfall_24h'] > 100 and features['human_population'] > 50000 and
              np.random.random() < 0.1):
            threat = 'pollution_event'
            severity = min(100, features['rainfall_24h'] * 0.3 + features['human_population'] * 0.001)
        
        # Add some randomness for no threat cases
        if threat == 'none' and np.random.random() < 0.3:
            severity = np.random.uniform(0, 20)  # Low background risk
        
        return threat, max(0, severity)

    def preprocess_data(self, data):
        """Preprocess input data for model"""
        if isinstance(data, dict):
            # Convert single prediction input
            features = [data.get(feature, 0) for feature in self.feature_names]
            return np.array(features).reshape(1, -1)
        elif isinstance(data, pd.DataFrame):
            # Convert DataFrame
            return data[self.feature_names].values
        else:
            # Assume it's already a numpy array
            return data

    def train(self, data=None):
        """Train the coastal threat prediction models"""
        if data is None:
            self.logger.info("Generating synthetic training data...")
            data = self.generate_synthetic_data()
        
        X = self.preprocess_data(data)
        y_threat = data['threat_type'].values
        y_severity = data['severity_score'].values
        
        # Encode threat labels
        y_threat_encoded = self.label_encoder.fit_transform(y_threat)
        
        # Split data
        X_train, X_test, y_threat_train, y_threat_test, y_severity_train, y_severity_test = train_test_split(
            X, y_threat_encoded, y_severity, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train threat classification model
        self.logger.info("Training threat classification model...")
        self.threat_classifier.fit(X_train_scaled, y_threat_train)
        
        # Train severity regression model
        self.logger.info("Training severity regression model...")
        self.severity_regressor.fit(X_train_scaled, y_severity_train)
        
        # Evaluate models
        threat_score = self.threat_classifier.score(X_test_scaled, y_threat_test)
        severity_pred = self.severity_regressor.predict(X_test_scaled)
        severity_mse = mean_squared_error(y_severity_test, severity_pred)
        
        self.logger.info(f"Threat classification accuracy: {threat_score:.3f}")
        self.logger.info(f"Severity prediction MSE: {severity_mse:.3f}")
        
        self.is_trained = True
        
        return {
            'threat_accuracy': threat_score,
            'severity_mse': severity_mse,
            'feature_importance': dict(zip(self.feature_names, self.threat_classifier.feature_importances_))
        }

    def predict_threat(self, features):
        """Predict coastal threat type and severity"""
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")
        
        X = self.preprocess_data(features)
        X_scaled = self.scaler.transform(X)
        
        # Predict threat type
        threat_proba = self.threat_classifier.predict_proba(X_scaled)[0]
        threat_classes = self.label_encoder.classes_
        threat_predictions = dict(zip(threat_classes, threat_proba))
        
        # Get most likely threat
        most_likely_threat = max(threat_predictions, key=threat_predictions.get)
        threat_confidence = max(threat_proba) * 100
        
        # Predict severity
        severity_score = max(0, min(100, self.severity_regressor.predict(X_scaled)[0]))
        
        # Calculate overall risk level
        risk_level = self.calculate_risk_level(severity_score, threat_confidence)
        
        return {
            'primary_threat': most_likely_threat,
            'threat_confidence': threat_confidence,
            'severity_score': severity_score,
            'risk_level': risk_level,
            'all_threat_probabilities': threat_predictions,
            'timestamp': datetime.now().isoformat(),
            'warnings': self.generate_warnings(most_likely_threat, severity_score)
        }

    def calculate_risk_level(self, severity, confidence):
        """Calculate overall risk level"""
        combined_score = (severity * confidence / 100)
        
        if combined_score >= 80:
            return 'critical'
        elif combined_score >= 60:
            return 'high'
        elif combined_score >= 30:
            return 'medium'
        else:
            return 'low'

    def generate_warnings(self, threat_type, severity):
        """Generate specific warnings based on threat type and severity"""
        warnings = []
        
        if threat_type == 'storm_surge':
            if severity > 70:
                warnings.append('CRITICAL: Immediate evacuation of low-lying coastal areas required')
                warnings.append('Storm surge may reach 3+ meters above normal tide')
            elif severity > 40:
                warnings.append('HIGH: Prepare for significant storm surge flooding')
                warnings.append('Move to higher ground and secure property')
            else:
                warnings.append('MODERATE: Monitor storm surge conditions closely')
        
        elif threat_type == 'coastal_flooding':
            if severity > 70:
                warnings.append('CRITICAL: Severe coastal flooding imminent')
                warnings.append('Avoid travel in coastal areas')
            elif severity > 40:
                warnings.append('HIGH: Significant coastal flooding expected')
                warnings.append('Prepare flood defenses and emergency supplies')
            else:
                warnings.append('MODERATE: Minor coastal flooding possible')
        
        elif threat_type == 'cyclone':
            if severity > 70:
                warnings.append('CRITICAL: Major cyclone approaching')
                warnings.append('Complete all emergency preparations immediately')
            elif severity > 40:
                warnings.append('HIGH: Cyclone threat increasing')
                warnings.append('Secure property and prepare emergency kit')
            else:
                warnings.append('MODERATE: Monitor cyclone development')
        
        elif threat_type == 'erosion':
            if severity > 50:
                warnings.append('HIGH: Severe coastal erosion conditions')
                warnings.append('Avoid cliff edges and unstable coastal areas')
            else:
                warnings.append('MODERATE: Increased erosion activity possible')
        
        elif threat_type == 'tsunami':
            warnings.append('CRITICAL: TSUNAMI WARNING - Move to high ground immediately')
            warnings.append('Do not return to coastal areas until all-clear given')
        
        elif threat_type == 'king_tide':
            if severity > 40:
                warnings.append('HIGH: Extreme high tide flooding possible')
                warnings.append('Expect road closures in low-lying areas')
            else:
                warnings.append('MODERATE: Higher than normal tides expected')
        
        elif threat_type == 'pollution_event':
            warnings.append('Potential water pollution event detected')
            warnings.append('Avoid contact with coastal waters')
        
        return warnings

    def forecast_threat(self, features, hours_ahead=24):
        """Forecast threat development over time"""
        forecasts = []
        
        for hour in range(1, hours_ahead + 1):
            # Simulate temporal evolution of features
            evolved_features = self.evolve_features(features, hour)
            prediction = self.predict_threat(evolved_features)
            
            forecasts.append({
                'hours_ahead': hour,
                'threat': prediction['primary_threat'],
                'severity': prediction['severity_score'],
                'confidence': prediction['threat_confidence'],
                'risk_level': prediction['risk_level']
            })
        
        return {
            'forecasts': forecasts,
            'trend_analysis': self.analyze_trend(forecasts),
            'peak_risk_time': self.find_peak_risk_time(forecasts)
        }

    def evolve_features(self, features, hours_ahead):
        """Simulate how features might evolve over time"""
        evolved = features.copy() if isinstance(features, dict) else dict(zip(self.feature_names, features))
        
        # Simple temporal evolution model
        time_factor = hours_ahead / 24.0  # Normalize to days
        
        # Weather features tend to change more rapidly
        evolved['wind_speed'] = max(0, evolved.get('wind_speed', 0) + np.random.normal(0, 5 * time_factor))
        evolved['atmospheric_pressure'] = evolved.get('atmospheric_pressure', 1013) + np.random.normal(0, 10 * time_factor)
        evolved['wave_height'] = max(0, evolved.get('wave_height', 0) + np.random.normal(0, 0.5 * time_factor))
        
        # Tidal features follow predictable patterns
        evolved['tide_level'] = evolved.get('tide_level', 0) + 2 * np.sin(2 * np.pi * hours_ahead / 12.42)  # Tidal cycle
        
        return evolved

    def analyze_trend(self, forecasts):
        """Analyze the trend in forecast data"""
        severities = [f['severity'] for f in forecasts]
        
        if len(severities) < 2:
            return 'insufficient_data'
        
        # Simple trend analysis
        early_avg = np.mean(severities[:len(severities)//2])
        late_avg = np.mean(severities[len(severities)//2:])
        
        if late_avg > early_avg + 10:
            return 'increasing'
        elif late_avg < early_avg - 10:
            return 'decreasing'
        else:
            return 'stable'

    def find_peak_risk_time(self, forecasts):
        """Find the time of peak risk in the forecast"""
        if not forecasts:
            return None
        
        peak_forecast = max(forecasts, key=lambda x: x['severity'])
        return {
            'hours_ahead': peak_forecast['hours_ahead'],
            'peak_severity': peak_forecast['severity'],
            'peak_threat': peak_forecast['threat']
        }

    def save_model(self, filepath):
        """Save trained model to file"""
        if not self.is_trained:
            raise ValueError("Model must be trained before saving")
        
        model_data = {
            'threat_classifier': self.threat_classifier,
            'severity_regressor': self.severity_regressor,
            'scaler': self.scaler,
            'label_encoder': self.label_encoder,
            'feature_names': self.feature_names,
            'threat_types': self.threat_types,
            'is_trained': self.is_trained
        }
        
        joblib.dump(model_data, filepath)
        self.logger.info(f"Model saved to {filepath}")

    def load_model(self, filepath):
        """Load trained model from file"""
        model_data = joblib.load(filepath)
        
        self.threat_classifier = model_data['threat_classifier']
        self.severity_regressor = model_data['severity_regressor']
        self.scaler = model_data['scaler']
        self.label_encoder = model_data['label_encoder']
        self.feature_names = model_data['feature_names']
        self.threat_types = model_data['threat_types']
        self.is_trained = model_data['is_trained']
        
        self.logger.info(f"Model loaded from {filepath}")

# Example usage
if __name__ == "__main__":
    # Initialize and train model
    model = CoastalThreatModel()
    training_results = model.train()
    
    print("Training Results:", training_results)
    
    # Example prediction
    sample_features = {
        'wave_height': 4.2,
        'wind_speed': 65.0,
        'atmospheric_pressure': 985.0,
        'tide_level': 1.8,
        'water_temperature': 28.5,
        'rainfall_24h': 75.0,
        'storm_distance': 150.0,
        'moon_phase': 0.9,
        'season': 2,  # Autumn
        'coastal_elevation': 2.5,
        'vegetation_cover': 0.4,
        'human_population': 25000
    }
    
    prediction = model.predict_threat(sample_features)
    forecast = model.forecast_threat(sample_features, 12)
    
    print("\nPrediction:", prediction)
    print("\nForecast:", forecast)

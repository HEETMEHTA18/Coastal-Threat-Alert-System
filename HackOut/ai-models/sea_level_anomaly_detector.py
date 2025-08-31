import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
import logging
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class SeaLevelAnomalyDetector:
    def __init__(self):
        self.anomaly_detector = IsolationForest(
            contamination=0.05,  # 5% expected anomalies
            random_state=42,
            n_estimators=200
        )
        self.scaler = StandardScaler()
        self.is_trained = False
        
        # Feature names for model input
        self.feature_names = [
            'sea_level_height',        # mm above mean sea level
            'atmospheric_pressure',    # hPa
            'wind_speed',             # m/s
            'wind_direction',         # degrees
            'air_temperature',        # °C
            'water_temperature',      # °C
            'tidal_residual',         # mm (observed - predicted tide)
            'significant_wave_height', # m
            'storm_surge_component',   # mm
            'rainfall_24h',           # mm
            'moon_phase',             # 0-1 (new moon to full moon)
            'seasonal_component',     # 0-3 (season index)
            'el_nino_index',         # El Niño Southern Oscillation index
            'pressure_trend_3h',     # hPa/3h pressure change
            'temperature_gradient'    # °C difference air-water
        ]
        
        # Anomaly thresholds
        self.thresholds = {
            'minor': 0.3,      # Minor anomaly threshold
            'moderate': 0.1,   # Moderate anomaly threshold  
            'severe': 0.05,    # Severe anomaly threshold
            'extreme': 0.01    # Extreme anomaly threshold
        }
        
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

    def generate_synthetic_data(self, n_samples=5000):
        """Generate synthetic sea level data with anomalies"""
        np.random.seed(42)
        
        # Generate normal sea level patterns
        data = {
            'sea_level_height': np.random.normal(0, 150, n_samples),  # mm
            'atmospheric_pressure': np.random.normal(1013, 15, n_samples),  # hPa
            'wind_speed': np.random.exponential(8, n_samples),  # m/s
            'wind_direction': np.random.uniform(0, 360, n_samples),  # degrees
            'air_temperature': np.random.normal(25, 5, n_samples),  # °C
            'water_temperature': np.random.normal(24, 3, n_samples),  # °C
            'tidal_residual': np.random.normal(0, 50, n_samples),  # mm
            'significant_wave_height': np.random.exponential(1.5, n_samples),  # m
            'storm_surge_component': np.random.normal(0, 30, n_samples),  # mm
            'rainfall_24h': np.random.exponential(10, n_samples),  # mm
            'moon_phase': np.random.uniform(0, 1, n_samples),  # 0-1
            'seasonal_component': np.random.choice([0, 1, 2, 3], n_samples),  # seasons
            'el_nino_index': np.random.normal(0, 1, n_samples),  # standardized
            'pressure_trend_3h': np.random.normal(0, 2, n_samples),  # hPa/3h
            'temperature_gradient': np.random.normal(1, 2, n_samples)  # °C
        }
        
        df = pd.DataFrame(data)
        
        # Ensure realistic ranges
        df['sea_level_height'] = np.clip(df['sea_level_height'], -500, 1000)
        df['atmospheric_pressure'] = np.clip(df['atmospheric_pressure'], 950, 1050)
        df['wind_speed'] = np.clip(df['wind_speed'], 0, 50)
        df['air_temperature'] = np.clip(df['air_temperature'], 10, 45)
        df['water_temperature'] = np.clip(df['water_temperature'], 15, 35)
        df['significant_wave_height'] = np.clip(df['significant_wave_height'], 0, 15)
        df['rainfall_24h'] = np.clip(df['rainfall_24h'], 0, 200)
        
        # Create anomalous conditions (5% of data)
        n_anomalies = int(0.05 * n_samples)
        anomaly_indices = np.random.choice(n_samples, n_anomalies, replace=False)
        
        # Add different types of anomalies
        for i, idx in enumerate(anomaly_indices):
            anomaly_type = i % 4
            
            if anomaly_type == 0:  # Storm surge anomaly
                df.at[idx, 'sea_level_height'] += np.random.uniform(300, 800)
                df.at[idx, 'atmospheric_pressure'] -= np.random.uniform(20, 50)
                df.at[idx, 'wind_speed'] += np.random.uniform(15, 35)
                df.at[idx, 'significant_wave_height'] += np.random.uniform(3, 8)
                
            elif anomaly_type == 1:  # King tide anomaly
                df.at[idx, 'sea_level_height'] += np.random.uniform(200, 400)
                df.at[idx, 'moon_phase'] = np.random.uniform(0.8, 1.0)
                df.at[idx, 'tidal_residual'] += np.random.uniform(100, 200)
                
            elif anomaly_type == 2:  # Low pressure system
                df.at[idx, 'atmospheric_pressure'] -= np.random.uniform(25, 45)
                df.at[idx, 'sea_level_height'] += np.random.uniform(150, 300)
                df.at[idx, 'pressure_trend_3h'] -= np.random.uniform(5, 10)
                
            elif anomaly_type == 3:  # Climate oscillation anomaly
                df.at[idx, 'el_nino_index'] = np.random.choice([-2.5, 2.5])
                df.at[idx, 'sea_level_height'] += np.random.uniform(-200, 400)
                df.at[idx, 'water_temperature'] += np.random.uniform(-3, 5)
        
        # Add labels (1 for anomaly, 0 for normal)
        df['is_anomaly'] = 0
        df.loc[anomaly_indices, 'is_anomaly'] = 1
        
        # Add timestamp
        df['timestamp'] = pd.date_range(start='2020-01-01', periods=n_samples, freq='H')
        
        return df

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
        """Train the sea level anomaly detection model"""
        if data is None:
            self.logger.info("Generating synthetic training data...")
            data = self.generate_synthetic_data()
        
        X = self.preprocess_data(data)
        y_true = data['is_anomaly'].values if 'is_anomaly' in data.columns else None
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train anomaly detector
        self.logger.info("Training anomaly detection model...")
        self.anomaly_detector.fit(X_scaled)
        
        # Evaluate if we have true labels
        if y_true is not None:
            y_pred = self.anomaly_detector.predict(X_scaled)
            y_pred = (y_pred == -1).astype(int)  # Convert to binary (1 for anomaly)
            
            self.logger.info("Classification Report:")
            self.logger.info(f"\n{classification_report(y_true, y_pred)}")
        
        self.is_trained = True
        return {'status': 'trained', 'feature_count': len(self.feature_names)}

    def detect_anomaly(self, features):
        """Detect sea level anomalies"""
        if not self.is_trained:
            raise ValueError("Model must be trained before detection")
        
        X = self.preprocess_data(features)
        X_scaled = self.scaler.transform(X)
        
        # Get anomaly prediction and score
        anomaly_prediction = self.anomaly_detector.predict(X_scaled)[0]
        anomaly_score = self.anomaly_detector.decision_function(X_scaled)[0]
        
        # Determine severity level
        severity = self.determine_severity(anomaly_score)
        
        # Calculate confidence (inverse of anomaly score)
        confidence = max(0, min(1, (anomaly_score + 0.5) / 1.0))
        
        return {
            'is_anomaly': anomaly_prediction == -1,
            'anomaly_score': float(anomaly_score),
            'severity': severity,
            'confidence': float(confidence),
            'risk_level': self.assess_risk_level(features, anomaly_prediction == -1),
            'recommendations': self.generate_recommendations(severity, features)
        }

    def determine_severity(self, anomaly_score):
        """Determine anomaly severity based on score"""
        if anomaly_score > -0.1:
            return 'normal'
        elif anomaly_score > -0.2:
            return 'minor'
        elif anomaly_score > -0.3:
            return 'moderate'
        elif anomaly_score > -0.4:
            return 'severe'
        else:
            return 'extreme'

    def assess_risk_level(self, features, is_anomaly):
        """Assess overall risk level"""
        if not is_anomaly:
            return 'low'
        
        # Check multiple risk factors
        sea_level = features.get('sea_level_height', 0)
        pressure = features.get('atmospheric_pressure', 1013)
        wind_speed = features.get('wind_speed', 0)
        wave_height = features.get('significant_wave_height', 0)
        
        risk_score = 0
        
        # Sea level contribution
        if sea_level > 300:
            risk_score += 3
        elif sea_level > 200:
            risk_score += 2
        elif sea_level > 100:
            risk_score += 1
        
        # Pressure contribution
        if pressure < 980:
            risk_score += 3
        elif pressure < 1000:
            risk_score += 2
        elif pressure < 1010:
            risk_score += 1
        
        # Wind contribution
        if wind_speed > 25:
            risk_score += 2
        elif wind_speed > 15:
            risk_score += 1
        
        # Wave contribution
        if wave_height > 5:
            risk_score += 2
        elif wave_height > 3:
            risk_score += 1
        
        # Determine risk level
        if risk_score >= 7:
            return 'extreme'
        elif risk_score >= 5:
            return 'high'
        elif risk_score >= 3:
            return 'moderate'
        else:
            return 'low'

    def generate_recommendations(self, severity, features):
        """Generate actionable recommendations"""
        recommendations = []
        
        if severity in ['severe', 'extreme']:
            recommendations.extend([
                'Issue immediate coastal flood warning',
                'Activate emergency response protocols',
                'Evacuate low-lying coastal areas',
                'Close coastal roads and ports',
                'Deploy emergency barriers if available'
            ])
        elif severity == 'moderate':
            recommendations.extend([
                'Issue coastal flood watch',
                'Monitor conditions closely',
                'Prepare emergency equipment',
                'Advise public to avoid coastal areas',
                'Check drainage systems'
            ])
        elif severity == 'minor':
            recommendations.extend([
                'Continue monitoring',
                'Issue public advisory',
                'Check tide gauge calibration',
                'Review weather forecasts'
            ])
        
        # Specific recommendations based on conditions
        sea_level = features.get('sea_level_height', 0)
        if sea_level > 400:
            recommendations.append('Extreme sea level - consider infrastructure protection')
        
        pressure = features.get('atmospheric_pressure', 1013)
        if pressure < 990:
            recommendations.append('Very low pressure - storm surge likely')
        
        return recommendations

    def save_model(self, filepath):
        """Save trained model"""
        if not self.is_trained:
            raise ValueError("Model must be trained before saving")
        
        model_data = {
            'anomaly_detector': self.anomaly_detector,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'thresholds': self.thresholds
        }
        
        joblib.dump(model_data, filepath)
        self.logger.info(f"Model saved to {filepath}")

    def load_model(self, filepath):
        """Load trained model"""
        model_data = joblib.load(filepath)
        
        self.anomaly_detector = model_data['anomaly_detector']
        self.scaler = model_data['scaler']
        self.feature_names = model_data['feature_names']
        self.thresholds = model_data['thresholds']
        self.is_trained = True
        
        self.logger.info(f"Model loaded from {filepath}")

# Example usage and testing
if __name__ == "__main__":
    # Initialize and train model
    detector = SeaLevelAnomalyDetector()
    
    # Train with synthetic data
    print("Training sea level anomaly detection model...")
    training_result = detector.train()
    print(f"Training completed: {training_result}")
    
    # Test with normal conditions
    normal_features = {
        'sea_level_height': 50,
        'atmospheric_pressure': 1015,
        'wind_speed': 8,
        'wind_direction': 180,
        'air_temperature': 25,
        'water_temperature': 24,
        'tidal_residual': 10,
        'significant_wave_height': 1.2,
        'storm_surge_component': 5,
        'rainfall_24h': 2,
        'moon_phase': 0.3,
        'seasonal_component': 1,
        'el_nino_index': 0.1,
        'pressure_trend_3h': 0.5,
        'temperature_gradient': 1.0
    }
    
    # Test with anomalous conditions (storm surge)
    anomalous_features = {
        'sea_level_height': 450,  # Very high sea level
        'atmospheric_pressure': 975,  # Low pressure
        'wind_speed': 28,  # High wind
        'wind_direction': 180,
        'air_temperature': 25,
        'water_temperature': 24,
        'tidal_residual': 150,  # High tidal residual
        'significant_wave_height': 6.5,  # High waves
        'storm_surge_component': 200,  # High storm surge
        'rainfall_24h': 50,
        'moon_phase': 0.9,  # Near full moon
        'seasonal_component': 2,
        'el_nino_index': 1.5,
        'pressure_trend_3h': -8,  # Rapid pressure drop
        'temperature_gradient': 3.0
    }
    
    # Test predictions
    normal_result = detector.detect_anomaly(normal_features)
    anomaly_result = detector.detect_anomaly(anomalous_features)
    
    print("\nNormal Conditions Result:")
    print(f"Is Anomaly: {normal_result['is_anomaly']}")
    print(f"Severity: {normal_result['severity']}")
    print(f"Risk Level: {normal_result['risk_level']}")
    print(f"Confidence: {normal_result['confidence']:.3f}")
    
    print("\nAnomalous Conditions Result:")
    print(f"Is Anomaly: {anomaly_result['is_anomaly']}")
    print(f"Severity: {anomaly_result['severity']}")
    print(f"Risk Level: {anomaly_result['risk_level']}")
    print(f"Confidence: {anomaly_result['confidence']:.3f}")
    print(f"Recommendations: {anomaly_result['recommendations']}")
    
    # Save model
    detector.save_model('sea_level_anomaly_model.pkl')
    print("\nModel saved successfully!")
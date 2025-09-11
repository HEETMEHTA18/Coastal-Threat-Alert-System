import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import joblib
import logging
from datetime import datetime, timedelta

class MangroveHealthModel:
    def __init__(self):
        self.health_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.anomaly_detector = IsolationForest(contamination=0.1, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
        
        # Feature names for model input
        self.feature_names = [
            'ndvi', 'chlorophyll', 'water_temp', 'salinity', 'turbidity',
            'rainfall', 'tidal_range', 'distance_to_shore', 'human_activity_index'
        ]
        
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

    def generate_synthetic_data(self, n_samples=1000):
        """Generate synthetic mangrove health data for training"""
        np.random.seed(42)
        
        # Generate features
        data = {
            'ndvi': np.random.normal(0.7, 0.15, n_samples),  # Vegetation index
            'chlorophyll': np.random.exponential(15, n_samples),  # Water chlorophyll
            'water_temp': np.random.normal(28, 3, n_samples),  # Water temperature
            'salinity': np.random.normal(35, 5, n_samples),  # Water salinity
            'turbidity': np.random.exponential(10, n_samples),  # Water turbidity
            'rainfall': np.random.exponential(100, n_samples),  # Monthly rainfall
            'tidal_range': np.random.normal(1.5, 0.5, n_samples),  # Tidal range
            'distance_to_shore': np.random.exponential(2, n_samples),  # Distance to shore (km)
            'human_activity_index': np.random.uniform(0, 100, n_samples)  # Human activity intensity
        }
        
        df = pd.DataFrame(data)
        
        # Ensure realistic ranges
        df['ndvi'] = np.clip(df['ndvi'], 0, 1)
        df['water_temp'] = np.clip(df['water_temp'], 20, 35)
        df['salinity'] = np.clip(df['salinity'], 20, 50)
        df['tidal_range'] = np.clip(df['tidal_range'], 0.5, 3.0)
        df['distance_to_shore'] = np.clip(df['distance_to_shore'], 0, 10)
        
        # Calculate health score based on feature relationships
        health_score = (
            df['ndvi'] * 40 +  # Vegetation health is primary factor
            (1 / (1 + df['turbidity'] / 10)) * 20 +  # Lower turbidity is better
            (1 / (1 + df['human_activity_index'] / 100)) * 15 +  # Lower human activity is better
            np.clip(df['rainfall'] / 200, 0, 1) * 10 +  # Moderate rainfall is good
            (1 - abs(df['water_temp'] - 27) / 10) * 10 +  # Optimal temperature around 27°C
            np.random.normal(0, 5, n_samples)  # Add some noise
        )
        
        df['health_score'] = np.clip(health_score, 0, 100)
        
        return df

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
        """Train the mangrove health prediction model"""
        if data is None:
            self.logger.info("Generating synthetic training data...")
            data = self.generate_synthetic_data()
        
        X = self.preprocess_data(data)
        y = data['health_score'].values
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train health prediction model
        self.logger.info("Training health prediction model...")
        self.health_model.fit(X_train_scaled, y_train)
        
        # Train anomaly detector
        self.logger.info("Training anomaly detection model...")
        self.anomaly_detector.fit(X_train_scaled)
        
        # Evaluate
        train_score = self.health_model.score(X_train_scaled, y_train)
        test_score = self.health_model.score(X_test_scaled, y_test)
        
        self.logger.info(f"Training R² score: {train_score:.3f}")
        self.logger.info(f"Testing R² score: {test_score:.3f}")
        
        self.is_trained = True
        return {
            'train_score': train_score,
            'test_score': test_score,
            'feature_importance': dict(zip(self.feature_names, self.health_model.feature_importances_))
        }

    def predict_health(self, features):
        """Predict mangrove health score"""
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")
        
        X = self.preprocess_data(features)
        X_scaled = self.scaler.transform(X)
        
        health_score = self.health_model.predict(X_scaled)[0]
        is_anomaly = self.anomaly_detector.predict(X_scaled)[0] == -1
        
        # Calculate confidence based on feature values
        confidence = self.calculate_confidence(features)
        
        return {
            'health_score': max(0, min(100, health_score)),
            'health_category': self.categorize_health(health_score),
            'is_anomaly': bool(is_anomaly),
            'confidence': confidence,
            'timestamp': datetime.now().isoformat()
        }

    def categorize_health(self, score):
        """Categorize health score into levels"""
        if score >= 80:
            return 'excellent'
        elif score >= 60:
            return 'good'
        elif score >= 40:
            return 'fair'
        elif score >= 20:
            return 'poor'
        else:
            return 'critical'

    def calculate_confidence(self, features):
        """Calculate prediction confidence based on feature quality"""
        if isinstance(features, dict):
            # Check if we have all required features
            missing_features = len([f for f in self.feature_names if f not in features])
            feature_completeness = 1 - (missing_features / len(self.feature_names))
            
            # Check if features are in reasonable ranges
            range_checks = 0
            total_checks = 0
            
            if 'ndvi' in features:
                total_checks += 1
                if 0 <= features['ndvi'] <= 1:
                    range_checks += 1
            
            if 'water_temp' in features:
                total_checks += 1
                if 20 <= features['water_temp'] <= 35:
                    range_checks += 1
            
            if 'salinity' in features:
                total_checks += 1
                if 20 <= features['salinity'] <= 50:
                    range_checks += 1
            
            range_quality = range_checks / max(1, total_checks)
            
            return min(100, (feature_completeness * 0.6 + range_quality * 0.4) * 100)
        
        return 75  # Default confidence

    def assess_threats(self, features, health_score=None):
        """Assess potential threats to mangrove health"""
        if health_score is None:
            prediction = self.predict_health(features)
            health_score = prediction['health_score']
        
        threats = []
        
        if isinstance(features, dict):
            # Check various threat indicators
            if features.get('ndvi', 0) < 0.5:
                threats.append({
                    'type': 'vegetation_stress',
                    'severity': 'high' if features['ndvi'] < 0.3 else 'medium',
                    'description': 'Low vegetation index indicates plant stress'
                })
            
            if features.get('turbidity', 0) > 20:
                threats.append({
                    'type': 'water_pollution',
                    'severity': 'high' if features['turbidity'] > 40 else 'medium',
                    'description': 'High water turbidity indicates pollution'
                })
            
            if features.get('human_activity_index', 0) > 70:
                threats.append({
                    'type': 'human_pressure',
                    'severity': 'high' if features['human_activity_index'] > 85 else 'medium',
                    'description': 'High human activity pressure'
                })
            
            temp = features.get('water_temp', 27)
            if temp < 22 or temp > 32:
                threats.append({
                    'type': 'temperature_stress',
                    'severity': 'high' if temp < 20 or temp > 34 else 'medium',
                    'description': 'Water temperature outside optimal range'
                })
        
        return {
            'threats': threats,
            'overall_threat_level': self.calculate_overall_threat_level(threats),
            'recommendations': self.generate_recommendations(threats, health_score)
        }

    def calculate_overall_threat_level(self, threats):
        """Calculate overall threat level"""
        if not threats:
            return 'low'
        
        high_threats = len([t for t in threats if t['severity'] == 'high'])
        medium_threats = len([t for t in threats if t['severity'] == 'medium'])
        
        if high_threats > 1:
            return 'critical'
        elif high_threats > 0 or medium_threats > 2:
            return 'high'
        elif medium_threats > 0:
            return 'medium'
        else:
            return 'low'

    def generate_recommendations(self, threats, health_score):
        """Generate management recommendations"""
        recommendations = []
        
        for threat in threats:
            if threat['type'] == 'vegetation_stress':
                recommendations.append('Investigate causes of vegetation stress')
                recommendations.append('Consider replanting in degraded areas')
            elif threat['type'] == 'water_pollution':
                recommendations.append('Identify and control pollution sources')
                recommendations.append('Implement water quality monitoring')
            elif threat['type'] == 'human_pressure':
                recommendations.append('Enhance protected area enforcement')
                recommendations.append('Engage local communities in conservation')
            elif threat['type'] == 'temperature_stress':
                recommendations.append('Monitor climate conditions closely')
                recommendations.append('Consider adaptive management strategies')
        
        if health_score < 40:
            recommendations.append('Implement immediate conservation intervention')
            recommendations.append('Conduct detailed field assessment')
        
        return list(set(recommendations))  # Remove duplicates

    def save_model(self, filepath):
        """Save trained model to file"""
        if not self.is_trained:
            raise ValueError("Model must be trained before saving")
        
        model_data = {
            'health_model': self.health_model,
            'anomaly_detector': self.anomaly_detector,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'is_trained': self.is_trained
        }
        
        joblib.dump(model_data, filepath)
        self.logger.info(f"Model saved to {filepath}")

    def load_model(self, filepath):
        """Load trained model from file"""
        model_data = joblib.load(filepath)
        
        self.health_model = model_data['health_model']
        self.anomaly_detector = model_data['anomaly_detector']
        self.scaler = model_data['scaler']
        self.feature_names = model_data['feature_names']
        self.is_trained = model_data['is_trained']
        
        self.logger.info(f"Model loaded from {filepath}")

# Example usage
if __name__ == "__main__":
    # Initialize and train model
    model = MangroveHealthModel()
    training_results = model.train()
    
    print("Training Results:", training_results)
    
    # Example prediction
    sample_features = {
        'ndvi': 0.75,
        'chlorophyll': 12.5,
        'water_temp': 27.5,
        'salinity': 34.0,
        'turbidity': 8.2,
        'rainfall': 150.0,
        'tidal_range': 1.8,
        'distance_to_shore': 0.5,
        'human_activity_index': 25.0
    }
    
    prediction = model.predict_health(sample_features)
    threats = model.assess_threats(sample_features, prediction['health_score'])
    
    print("\nPrediction:", prediction)
    print("\nThreat Assessment:", threats)

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
    def preprocess_data(self, data):
        """Preprocess input data for training or prediction."""
        if data is None:
            raise ValueError("Input data for preprocessing is None.")
        # Accepts either a DataFrame or a dict
        if isinstance(data, dict):
            df = pd.DataFrame([data])
        else:
            if not hasattr(data, 'copy'):
                raise ValueError(f"Input data must be a dict or DataFrame, got {type(data)}")
            df = data.copy()
        # Ensure all feature columns are present
        for col in self.feature_names:
            if col not in df:
                df[col] = 0.0
        return df[self.feature_names]

    def train(self, data=None):
        """Train the threat classifier and severity regressor."""
        if data is None:
            data = self.generate_synthetic_data(2000)
        if data is None:
            raise ValueError("No data provided for training and failed to generate synthetic data.")
        # Preprocess features
        X = self.preprocess_data(data)
        y_threat = data['threat_type']
        y_severity = data['severity_score']
        # Fit scaler and label encoder
        X_scaled = self.scaler.fit_transform(X)
        y_encoded = self.label_encoder.fit_transform(y_threat)
        # Train classifier and regressor
        self.threat_classifier.fit(X_scaled, y_encoded)
        self.severity_regressor.fit(X_scaled, y_severity)
        self.is_trained = True
        self.logger.info("CoastalThreatModel trained successfully.")
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
            # ...existing code...
        }
        # ...existing code...

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib
import logging
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class AlgalBloomPredictor:
    def __init__(self):
        self.bloom_classifier = RandomForestClassifier(n_estimators=150, random_state=42)
        self.severity_regressor = GradientBoostingRegressor(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.is_trained = False
        
        # Feature names for model input
        self.feature_names = [
            'water_temperature',      # °C
            'chlorophyll_a',         # μg/L
            'dissolved_oxygen',      # mg/L
            'ph_level',             # pH units
            'turbidity',            # NTU
            'nitrate_nitrogen',     # mg/L
            'phosphate_phosphorus', # mg/L
            'salinity',            # ppt
            'solar_radiation',     # W/m²
            'wind_speed',          # m/s
            'rainfall_7d',         # mm (7-day total)
            'water_depth',         # m
            'current_velocity',    # m/s
            'upwelling_index',     # standardized index
            'sea_surface_height',  # m
            'human_activity_index' # 0-100 (pollution/runoff indicator)
        ]
        
        # Bloom types
        self.bloom_types = [
            'no_bloom',
            'diatom_bloom',      # Generally harmless
            'dinoflagellate_bloom', # Can be toxic (red tide)
            'cyanobacteria_bloom',  # Blue-green algae (toxic)
            'mixed_bloom'        # Multiple species
        ]
        
        # Risk thresholds
        self.risk_thresholds = {
            'chlorophyll_a': {'low': 5, 'moderate': 15, 'high': 30, 'extreme': 50},
            'dissolved_oxygen': {'hypoxic': 3, 'low': 5, 'normal': 8},
            'ph_level': {'acidic': 7.5, 'normal_low': 8.0, 'normal_high': 8.3, 'alkaline': 8.5}
        }
        
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

    def generate_synthetic_data(self, n_samples=3000):
        """Generate synthetic algal bloom data"""
        np.random.seed(42)
        
        # Generate base environmental conditions
        data = {
            'water_temperature': np.random.normal(22, 4, n_samples),  # °C
            'chlorophyll_a': np.random.exponential(8, n_samples),    # μg/L
            'dissolved_oxygen': np.random.normal(7, 2, n_samples),   # mg/L
            'ph_level': np.random.normal(8.1, 0.3, n_samples),      # pH
            'turbidity': np.random.exponential(5, n_samples),       # NTU
            'nitrate_nitrogen': np.random.exponential(2, n_samples), # mg/L
            'phosphate_phosphorus': np.random.exponential(0.5, n_samples), # mg/L
            'salinity': np.random.normal(35, 3, n_samples),         # ppt
            'solar_radiation': np.random.normal(300, 100, n_samples), # W/m²
            'wind_speed': np.random.exponential(8, n_samples),      # m/s
            'rainfall_7d': np.random.exponential(15, n_samples),    # mm
            'water_depth': np.random.uniform(5, 200, n_samples),    # m
            'current_velocity': np.random.exponential(0.3, n_samples), # m/s
            'upwelling_index': np.random.normal(0, 1, n_samples),   # standardized
            'sea_surface_height': np.random.normal(0, 0.2, n_samples), # m
            'human_activity_index': np.random.uniform(0, 100, n_samples) # 0-100
        }
        
        df = pd.DataFrame(data)
        
        # Ensure realistic ranges
        df['water_temperature'] = np.clip(df['water_temperature'], 10, 35)
        df['chlorophyll_a'] = np.clip(df['chlorophyll_a'], 0.1, 100)
        df['dissolved_oxygen'] = np.clip(df['dissolved_oxygen'], 0, 15)
        df['ph_level'] = np.clip(df['ph_level'], 6.5, 9.0)
        df['turbidity'] = np.clip(df['turbidity'], 0, 50)
        df['nitrate_nitrogen'] = np.clip(df['nitrate_nitrogen'], 0, 20)
        df['phosphate_phosphorus'] = np.clip(df['phosphate_phosphorus'], 0, 5)
        df['salinity'] = np.clip(df['salinity'], 20, 40)
        df['solar_radiation'] = np.clip(df['solar_radiation'], 50, 600)
        df['wind_speed'] = np.clip(df['wind_speed'], 0, 30)
        df['rainfall_7d'] = np.clip(df['rainfall_7d'], 0, 200)
        df['current_velocity'] = np.clip(df['current_velocity'], 0, 2)
        
        # Generate bloom conditions based on environmental factors
        bloom_type = []
        bloom_severity = []
        
        for i in range(n_samples):
            conditions = df.iloc[i]
            
            # Calculate bloom probability based on conditions
            bloom_prob = self.calculate_bloom_probability(conditions)
            bloom_type_pred, severity = self.determine_bloom_type_and_severity(conditions, bloom_prob)
            
            bloom_type.append(bloom_type_pred)
            bloom_severity.append(severity)
        
        df['bloom_type'] = bloom_type
        df['bloom_severity'] = bloom_severity
        
        # Add timestamp
        df['timestamp'] = pd.date_range(start='2020-01-01', periods=n_samples, freq='D')
        
        return df

    def calculate_bloom_probability(self, conditions):
        """Calculate probability of bloom based on environmental conditions"""
        prob = 0.1  # Base probability
        
        # Temperature factor (higher temp increases bloom risk)
        if conditions['water_temperature'] > 25:
            prob += 0.3
        elif conditions['water_temperature'] > 20:
            prob += 0.1
        
        # Nutrient factors (high nutrients increase bloom risk)
        if conditions['nitrate_nitrogen'] > 5:
            prob += 0.4
        elif conditions['nitrate_nitrogen'] > 2:
            prob += 0.2
        
        if conditions['phosphate_phosphorus'] > 1:
            prob += 0.3
        elif conditions['phosphate_phosphorus'] > 0.5:
            prob += 0.1
        
        # Solar radiation factor
        if conditions['solar_radiation'] > 400:
            prob += 0.2
        
        # Low dissolved oxygen (can indicate ongoing bloom)
        if conditions['dissolved_oxygen'] < 5:
            prob += 0.3
        
        # Wind factor (low wind can lead to stratification)
        if conditions['wind_speed'] < 3:
            prob += 0.2
        
        # Human activity factor
        if conditions['human_activity_index'] > 70:
            prob += 0.2
        
        # Upwelling factor (can bring nutrients)
        if conditions['upwelling_index'] > 1:
            prob += 0.1
        
        return min(1.0, prob)

    def determine_bloom_type_and_severity(self, conditions, bloom_prob):
        """Determine bloom type and severity"""
        if np.random.random() > bloom_prob:
            return 'no_bloom', 0
        
        # Determine bloom type based on conditions
        temp = conditions['water_temperature']
        salinity = conditions['salinity']
        nutrients = conditions['nitrate_nitrogen'] + conditions['phosphate_phosphorus']
        
        if temp > 28 and salinity > 30:
            # Hot, salty conditions favor dinoflagellates (red tide)
            bloom_type = 'dinoflagellate_bloom'
            base_severity = 60
        elif temp > 25 and salinity < 25:
            # Warm, brackish conditions favor cyanobacteria
            bloom_type = 'cyanobacteria_bloom'
            base_severity = 70
        elif temp < 18 and nutrients > 3:
            # Cool, nutrient-rich conditions favor diatoms
            bloom_type = 'diatom_bloom'
            base_severity = 30
        elif np.random.random() < 0.2:
            # Mixed bloom conditions
            bloom_type = 'mixed_bloom'
            base_severity = 50
        else:
            # Default to diatom bloom (most common)
            bloom_type = 'diatom_bloom'
            base_severity = 35
        
        # Adjust severity based on conditions
        severity = base_severity
        
        # Chlorophyll-a affects severity
        if conditions['chlorophyll_a'] > 30:
            severity += 30
        elif conditions['chlorophyll_a'] > 15:
            severity += 15
        elif conditions['chlorophyll_a'] > 5:
            severity += 5
        
        # Dissolved oxygen affects severity
        if conditions['dissolved_oxygen'] < 3:
            severity += 25
        elif conditions['dissolved_oxygen'] < 5:
            severity += 10
        
        # Add some randomness
        severity += np.random.normal(0, 10)
        
        return bloom_type, max(0, min(100, severity))

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
        """Train the algal bloom prediction models"""
        if data is None:
            self.logger.info("Generating synthetic training data...")
            data = self.generate_synthetic_data()
        
        X = self.preprocess_data(data)
        y_type = data['bloom_type'].values
        y_severity = data['bloom_severity'].values
        
        # Encode bloom types
        y_type_encoded = self.label_encoder.fit_transform(y_type)
        
        # Split data
        X_train, X_test, y_type_train, y_type_test, y_sev_train, y_sev_test = train_test_split(
            X, y_type_encoded, y_severity, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train bloom type classifier
        self.logger.info("Training bloom type classifier...")
        self.bloom_classifier.fit(X_train_scaled, y_type_train)
        
        # Train severity regressor (only on bloom samples)
        bloom_mask_train = y_type_train != self.label_encoder.transform(['no_bloom'])[0]
        bloom_mask_test = y_type_test != self.label_encoder.transform(['no_bloom'])[0]
        
        if np.sum(bloom_mask_train) > 0:
            self.logger.info("Training bloom severity regressor...")
            self.severity_regressor.fit(X_train_scaled[bloom_mask_train], y_sev_train[bloom_mask_train])
            
            # Evaluate severity model
            if np.sum(bloom_mask_test) > 0:
                sev_pred = self.severity_regressor.predict(X_test_scaled[bloom_mask_test])
                sev_mae = np.mean(np.abs(sev_pred - y_sev_test[bloom_mask_test]))
                self.logger.info(f"Severity prediction MAE: {sev_mae:.2f}")
        
        # Evaluate bloom type classifier
        type_pred = self.bloom_classifier.predict(X_test_scaled)
        type_accuracy = accuracy_score(y_type_test, type_pred)
        
        self.logger.info(f"Bloom type classification accuracy: {type_accuracy:.3f}")
        
        # Print detailed classification report
        type_names = self.label_encoder.classes_
        self.logger.info("Classification Report:")
        self.logger.info(f"\n{classification_report(y_type_test, type_pred, target_names=type_names)}")
        
        self.is_trained = True
        
        return {
            'type_accuracy': type_accuracy,
            'feature_importance': dict(zip(self.feature_names, self.bloom_classifier.feature_importances_))
        }

    def predict_bloom(self, features):
        """Predict algal bloom type and severity"""
        if not self.is_trained:
            raise ValueError("Model must be trained before prediction")
        
        X = self.preprocess_data(features)
        X_scaled = self.scaler.transform(X)
        
        # Predict bloom type
        bloom_type_encoded = self.bloom_classifier.predict(X_scaled)[0]
        bloom_type = self.label_encoder.inverse_transform([bloom_type_encoded])[0]
        
        # Get probability for each bloom type
        bloom_probabilities = self.bloom_classifier.predict_proba(X_scaled)[0]
        bloom_prob_dict = dict(zip(self.label_encoder.classes_, bloom_probabilities))
        
        # Predict severity if bloom is predicted
        bloom_severity = 0
        if bloom_type != 'no_bloom':
            bloom_severity = max(0, min(100, self.severity_regressor.predict(X_scaled)[0]))
        
        # Assess environmental risk factors
        risk_assessment = self.assess_environmental_risks(features)
        
        return {
            'bloom_type': bloom_type,
            'bloom_severity': float(bloom_severity),
            'bloom_probabilities': {k: float(v) for k, v in bloom_prob_dict.items()},
            'risk_level': self.determine_risk_level(bloom_type, bloom_severity),
            'environmental_risks': risk_assessment,
            'recommendations': self.generate_recommendations(bloom_type, bloom_severity, features),
            'monitoring_priority': self.determine_monitoring_priority(bloom_type, bloom_severity)
        }

    def assess_environmental_risks(self, features):
        """Assess environmental risk factors"""
        risks = {}
        
        # Chlorophyll-a assessment
        chl_a = features.get('chlorophyll_a', 0)
        if chl_a > self.risk_thresholds['chlorophyll_a']['extreme']:
            risks['chlorophyll_a'] = 'extreme'
        elif chl_a > self.risk_thresholds['chlorophyll_a']['high']:
            risks['chlorophyll_a'] = 'high'
        elif chl_a > self.risk_thresholds['chlorophyll_a']['moderate']:
            risks['chlorophyll_a'] = 'moderate'
        elif chl_a > self.risk_thresholds['chlorophyll_a']['low']:
            risks['chlorophyll_a'] = 'low'
        else:
            risks['chlorophyll_a'] = 'normal'
        
        # Dissolved oxygen assessment
        do = features.get('dissolved_oxygen', 8)
        if do < self.risk_thresholds['dissolved_oxygen']['hypoxic']:
            risks['dissolved_oxygen'] = 'hypoxic'
        elif do < self.risk_thresholds['dissolved_oxygen']['low']:
            risks['dissolved_oxygen'] = 'low'
        else:
            risks['dissolved_oxygen'] = 'normal'
        
        # pH assessment
        ph = features.get('ph_level', 8.1)
        if ph < self.risk_thresholds['ph_level']['acidic']:
            risks['ph_level'] = 'acidic'
        elif ph > self.risk_thresholds['ph_level']['alkaline']:
            risks['ph_level'] = 'alkaline'
        else:
            risks['ph_level'] = 'normal'
        
        # Nutrient assessment
        nutrients = features.get('nitrate_nitrogen', 0) + features.get('phosphate_phosphorus', 0)
        if nutrients > 8:
            risks['nutrients'] = 'very_high'
        elif nutrients > 5:
            risks['nutrients'] = 'high'
        elif nutrients > 2:
            risks['nutrients'] = 'moderate'
        else:
            risks['nutrients'] = 'low'
        
        return risks

    def determine_risk_level(self, bloom_type, severity):
        """Determine overall risk level"""
        if bloom_type == 'no_bloom':
            return 'low'
        
        # Toxic bloom types are higher risk
        if bloom_type in ['dinoflagellate_bloom', 'cyanobacteria_bloom']:
            if severity > 70:
                return 'extreme'
            elif severity > 50:
                return 'high'
            elif severity > 30:
                return 'moderate'
            else:
                return 'low'
        else:
            # Non-toxic blooms
            if severity > 80:
                return 'high'
            elif severity > 60:
                return 'moderate'
            else:
                return 'low'

    def determine_monitoring_priority(self, bloom_type, severity):
        """Determine monitoring priority"""
        if bloom_type == 'no_bloom':
            return 'routine'
        elif bloom_type in ['dinoflagellate_bloom', 'cyanobacteria_bloom']:
            if severity > 60:
                return 'critical'
            elif severity > 40:
                return 'high'
            else:
                return 'elevated'
        else:
            if severity > 70:
                return 'high'
            elif severity > 50:
                return 'elevated'
            else:
                return 'routine'

    def generate_recommendations(self, bloom_type, severity, features):
        """Generate actionable recommendations"""
        recommendations = []
        
        if bloom_type == 'no_bloom':
            recommendations.append('Continue routine monitoring')
            
            # Check for conditions that could lead to blooms
            if features.get('nitrate_nitrogen', 0) > 3:
                recommendations.append('Monitor nutrient levels - elevated nitrogen detected')
            if features.get('water_temperature', 20) > 26:
                recommendations.append('Monitor for bloom development - favorable temperature')
            
        elif bloom_type == 'dinoflagellate_bloom':
            recommendations.extend([
                'TOXIC BLOOM ALERT - Issue public health warning',
                'Close affected beaches and recreational areas',
                'Monitor seafood safety - test for biotoxins',
                'Increase water quality monitoring frequency',
                'Alert fishing and aquaculture operations'
            ])
            
        elif bloom_type == 'cyanobacteria_bloom':
            recommendations.extend([
                'TOXIC BLOOM ALERT - Issue drinking water advisory',
                'Close affected recreational areas',
                'Monitor for microcystin and other cyanotoxins',
                'Alert water treatment facilities',
                'Increase monitoring in upstream areas'
            ])
            
        elif bloom_type == 'diatom_bloom':
            if severity > 60:
                recommendations.extend([
                    'Monitor oxygen levels closely',
                    'Watch for fish kills',
                    'Increase water circulation if possible'
                ])
            else:
                recommendations.extend([
                    'Continue monitoring',
                    'Document bloom extent and duration'
                ])
        
        # Environmental factor recommendations
        if features.get('dissolved_oxygen', 8) < 4:
            recommendations.append('CRITICAL: Deploy emergency aeration if available')
        
        if features.get('ph_level', 8.1) > 8.5:
            recommendations.append('Monitor pH levels - may indicate intense photosynthesis')
        
        return recommendations

    def save_model(self, filepath):
        """Save trained model"""
        if not self.is_trained:
            raise ValueError("Model must be trained before saving")
        
        model_data = {
            'bloom_classifier': self.bloom_classifier,
            'severity_regressor': self.severity_regressor,
            'scaler': self.scaler,
            'label_encoder': self.label_encoder,
            'feature_names': self.feature_names,
            'bloom_types': self.bloom_types,
            'risk_thresholds': self.risk_thresholds
        }
        
        joblib.dump(model_data, filepath)
        self.logger.info(f"Model saved to {filepath}")

    def load_model(self, filepath):
        """Load trained model"""
        model_data = joblib.load(filepath)
        
        self.bloom_classifier = model_data['bloom_classifier']
        self.severity_regressor = model_data['severity_regressor']
        self.scaler = model_data['scaler']
        self.label_encoder = model_data['label_encoder']
        self.feature_names = model_data['feature_names']
        self.bloom_types = model_data['bloom_types']
        self.risk_thresholds = model_data['risk_thresholds']
        self.is_trained = True
        
        self.logger.info(f"Model loaded from {filepath}")

# Example usage and testing
if __name__ == "__main__":
    # Initialize and train model
    predictor = AlgalBloomPredictor()
    
    # Train with synthetic data
    print("Training algal bloom prediction model...")
    training_result = predictor.train()
    print(f"Training completed: {training_result}")
    
    # Test with normal conditions
    normal_features = {
        'water_temperature': 22,
        'chlorophyll_a': 3,
        'dissolved_oxygen': 8,
        'ph_level': 8.1,
        'turbidity': 2,
        'nitrate_nitrogen': 1,
        'phosphate_phosphorus': 0.2,
        'salinity': 35,
        'solar_radiation': 300,
        'wind_speed': 10,
        'rainfall_7d': 5,
        'water_depth': 50,
        'current_velocity': 0.5,
        'upwelling_index': 0,
        'sea_surface_height': 0,
        'human_activity_index': 30
    }
    
    # Test with bloom-favorable conditions
    bloom_features = {
        'water_temperature': 28,      # High temperature
        'chlorophyll_a': 25,          # High chlorophyll
        'dissolved_oxygen': 4,        # Low oxygen
        'ph_level': 8.6,             # High pH
        'turbidity': 15,             # High turbidity
        'nitrate_nitrogen': 8,        # High nitrogen
        'phosphate_phosphorus': 2,    # High phosphorus
        'salinity': 32,              # Moderate salinity
        'solar_radiation': 450,       # High solar radiation
        'wind_speed': 2,             # Low wind (stratification)
        'rainfall_7d': 50,           # Recent rainfall (runoff)
        'water_depth': 20,           # Shallow water
        'current_velocity': 0.1,     # Low current
        'upwelling_index': 1.5,      # Upwelling event
        'sea_surface_height': 0.3,   # Elevated sea level
        'human_activity_index': 80    # High human impact
    }
    
    # Test predictions
    normal_result = predictor.predict_bloom(normal_features)
    bloom_result = predictor.predict_bloom(bloom_features)
    
    print("\nNormal Conditions Result:")
    print(f"Bloom Type: {normal_result['bloom_type']}")
    print(f"Severity: {normal_result['bloom_severity']:.1f}")
    print(f"Risk Level: {normal_result['risk_level']}")
    print(f"Monitoring Priority: {normal_result['monitoring_priority']}")
    
    print("\nBloom-Favorable Conditions Result:")
    print(f"Bloom Type: {bloom_result['bloom_type']}")
    print(f"Severity: {bloom_result['bloom_severity']:.1f}")
    print(f"Risk Level: {bloom_result['risk_level']}")
    print(f"Monitoring Priority: {bloom_result['monitoring_priority']}")
    print(f"Environmental Risks: {bloom_result['environmental_risks']}")
    print(f"Recommendations: {bloom_result['recommendations'][:3]}")  # Show first 3
    
    # Save model
    predictor.save_model('algal_bloom_model.pkl')
    print("\nModel saved successfully!")

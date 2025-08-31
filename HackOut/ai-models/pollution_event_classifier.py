import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib
import logging
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class PollutionEventClassifier:
    def __init__(self):
        self.pollution_classifier = RandomForestClassifier(n_estimators=200, random_state=42)
        self.anomaly_detector = IsolationForest(contamination=0.1, random_state=42)
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.is_trained = False
        
        # Feature names for model input
        self.feature_names = [
            'water_temperature',       # °C
            'dissolved_oxygen',        # mg/L
            'ph_level',               # pH units
            'turbidity',              # NTU
            'conductivity',           # μS/cm
            'oil_film_thickness',     # μm (0 if no oil)
            'plastic_debris_count',   # pieces per m²
            'chemical_oxygen_demand', # mg/L
            'ammonia_nitrogen',       # mg/L
            'phosphate_phosphorus',   # mg/L
            'heavy_metals_index',     # 0-100 (combined heavy metals)
            'bacterial_count',        # CFU/100mL (log scale)
            'foam_presence',          # 0-1 (binary indicator)
            'odor_intensity',         # 0-10 scale
            'water_color_anomaly',    # 0-1 (color deviation from normal)
            'vessel_traffic_density', # ships per km² per hour
            'industrial_discharge',   # 0-1 (known discharge events)
            'rainfall_24h',          # mm
            'wind_speed',            # m/s
            'current_velocity',      # m/s
            'distance_to_shore',     # km
            'population_density'     # people per km²
        ]
        
        # Pollution event types
        self.pollution_types = [
            'no_pollution',
            'oil_spill',
            'chemical_discharge',
            'sewage_overflow',
            'industrial_runoff',
            'plastic_pollution',
            'agricultural_runoff',
            'illegal_dumping',
            'mixed_pollution'
        ]
        
        # Severity thresholds
        self.severity_thresholds = {
            'oil_film_thickness': {'minor': 1, 'moderate': 10, 'major': 50, 'severe': 200},
            'dissolved_oxygen': {'severe': 2, 'major': 4, 'moderate': 6},
            'bacterial_count': {'moderate': 4, 'major': 5, 'severe': 6},  # log scale
            'heavy_metals_index': {'minor': 20, 'moderate': 40, 'major': 70, 'severe': 90}
        }
        
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

    def generate_synthetic_data(self, n_samples=4000):
        """Generate synthetic pollution event data"""
        np.random.seed(42)
        
        # Generate base environmental conditions
        data = {
            'water_temperature': np.random.normal(24, 4, n_samples),     # °C
            'dissolved_oxygen': np.random.normal(7, 1.5, n_samples),    # mg/L
            'ph_level': np.random.normal(8.0, 0.4, n_samples),         # pH
            'turbidity': np.random.exponential(3, n_samples),          # NTU
            'conductivity': np.random.normal(50000, 5000, n_samples),   # μS/cm
            'oil_film_thickness': np.random.exponential(0.1, n_samples), # μm
            'plastic_debris_count': np.random.exponential(2, n_samples), # pieces/m²
            'chemical_oxygen_demand': np.random.exponential(5, n_samples), # mg/L
            'ammonia_nitrogen': np.random.exponential(0.5, n_samples),  # mg/L
            'phosphate_phosphorus': np.random.exponential(0.3, n_samples), # mg/L
            'heavy_metals_index': np.random.exponential(10, n_samples), # 0-100
            'bacterial_count': np.random.normal(2, 0.5, n_samples),     # log CFU/100mL
            'foam_presence': np.random.binomial(1, 0.1, n_samples),     # binary
            'odor_intensity': np.random.exponential(1, n_samples),      # 0-10
            'water_color_anomaly': np.random.exponential(0.1, n_samples), # 0-1
            'vessel_traffic_density': np.random.exponential(3, n_samples), # ships/km²/h
            'industrial_discharge': np.random.binomial(1, 0.05, n_samples), # binary
            'rainfall_24h': np.random.exponential(8, n_samples),        # mm
            'wind_speed': np.random.exponential(8, n_samples),          # m/s
            'current_velocity': np.random.exponential(0.3, n_samples),  # m/s
            'distance_to_shore': np.random.uniform(0.1, 50, n_samples), # km
            'population_density': np.random.exponential(1000, n_samples) # people/km²
        }
        
        df = pd.DataFrame(data)
        
        # Ensure realistic ranges
        df['water_temperature'] = np.clip(df['water_temperature'], 10, 35)
        df['dissolved_oxygen'] = np.clip(df['dissolved_oxygen'], 0, 15)
        df['ph_level'] = np.clip(df['ph_level'], 6.0, 9.5)
        df['turbidity'] = np.clip(df['turbidity'], 0, 100)
        df['conductivity'] = np.clip(df['conductivity'], 10000, 100000)
        df['oil_film_thickness'] = np.clip(df['oil_film_thickness'], 0, 500)
        df['plastic_debris_count'] = np.clip(df['plastic_debris_count'], 0, 100)
        df['chemical_oxygen_demand'] = np.clip(df['chemical_oxygen_demand'], 0, 100)
        df['ammonia_nitrogen'] = np.clip(df['ammonia_nitrogen'], 0, 20)
        df['phosphate_phosphorus'] = np.clip(df['phosphate_phosphorus'], 0, 10)
        df['heavy_metals_index'] = np.clip(df['heavy_metals_index'], 0, 100)
        df['bacterial_count'] = np.clip(df['bacterial_count'], 0, 7)
        df['odor_intensity'] = np.clip(df['odor_intensity'], 0, 10)
        df['water_color_anomaly'] = np.clip(df['water_color_anomaly'], 0, 1)
        df['vessel_traffic_density'] = np.clip(df['vessel_traffic_density'], 0, 50)
        df['rainfall_24h'] = np.clip(df['rainfall_24h'], 0, 200)
        df['wind_speed'] = np.clip(df['wind_speed'], 0, 30)
        df['current_velocity'] = np.clip(df['current_velocity'], 0, 3)
        df['population_density'] = np.clip(df['population_density'], 0, 20000)
        
        # Generate pollution events based on environmental factors
        pollution_type = []
        pollution_severity = []
        
        for i in range(n_samples):
            conditions = df.iloc[i]
            event_type, severity = self.determine_pollution_event(conditions)
            pollution_type.append(event_type)
            pollution_severity.append(severity)
        
        df['pollution_type'] = pollution_type
        df['pollution_severity'] = pollution_severity
        
        # Add timestamp
        df['timestamp'] = pd.date_range(start='2020-01-01', periods=n_samples, freq='H')
        
        return df

    def determine_pollution_event(self, conditions):
        """Determine pollution event type and severity based on conditions"""
        # Base probability of pollution event
        base_prob = 0.15
        
        # Check for specific pollution indicators
        oil_thickness = conditions['oil_film_thickness']
        plastic_count = conditions['plastic_debris_count']
        bacterial_count = conditions['bacterial_count']
        heavy_metals = conditions['heavy_metals_index']
        foam = conditions['foam_presence']
        odor = conditions['odor_intensity']
        color_anomaly = conditions['water_color_anomaly']
        vessel_traffic = conditions['vessel_traffic_density']
        industrial = conditions['industrial_discharge']
        rainfall = conditions['rainfall_24h']
        population = conditions['population_density']
        
        # Determine event type based on dominant indicators
        event_scores = {
            'oil_spill': 0,
            'chemical_discharge': 0,
            'sewage_overflow': 0,
            'industrial_runoff': 0,
            'plastic_pollution': 0,
            'agricultural_runoff': 0,
            'illegal_dumping': 0,
            'mixed_pollution': 0
        }
        
        # Oil spill indicators
        if oil_thickness > 5:
            event_scores['oil_spill'] += 50
        if vessel_traffic > 10:
            event_scores['oil_spill'] += 20
        if foam and odor > 3:
            event_scores['oil_spill'] += 15
        
        # Chemical discharge indicators
        if conditions['ph_level'] < 6.5 or conditions['ph_level'] > 8.8:
            event_scores['chemical_discharge'] += 30
        if conditions['dissolved_oxygen'] < 4:
            event_scores['chemical_discharge'] += 25
        if heavy_metals > 50:
            event_scores['chemical_discharge'] += 35
        if industrial:
            event_scores['chemical_discharge'] += 40
        
        # Sewage overflow indicators
        if bacterial_count > 4:
            event_scores['sewage_overflow'] += 50
        if conditions['ammonia_nitrogen'] > 2:
            event_scores['sewage_overflow'] += 30
        if population > 5000 and rainfall > 30:
            event_scores['sewage_overflow'] += 25
        if odor > 5:
            event_scores['sewage_overflow'] += 20
        
        # Industrial runoff indicators
        if conditions['chemical_oxygen_demand'] > 20:
            event_scores['industrial_runoff'] += 40
        if heavy_metals > 30:
            event_scores['industrial_runoff'] += 30
        if conditions['conductivity'] > 70000:
            event_scores['industrial_runoff'] += 25
        if industrial:
            event_scores['industrial_runoff'] += 35
        
        # Plastic pollution indicators
        if plastic_count > 10:
            event_scores['plastic_pollution'] += 60
        if population > 3000:
            event_scores['plastic_pollution'] += 20
        if vessel_traffic > 5:
            event_scores['plastic_pollution'] += 15
        
        # Agricultural runoff indicators
        if conditions['phosphate_phosphorus'] > 1:
            event_scores['agricultural_runoff'] += 40
        if conditions['ammonia_nitrogen'] > 1:
            event_scores['agricultural_runoff'] += 30
        if rainfall > 20:
            event_scores['agricultural_runoff'] += 25
        
        # Illegal dumping indicators
        if color_anomaly > 0.5:
            event_scores['illegal_dumping'] += 40
        if odor > 6:
            event_scores['illegal_dumping'] += 30
        if conditions['turbidity'] > 20:
            event_scores['illegal_dumping'] += 25
        
        # Mixed pollution (multiple indicators)
        indicator_count = sum([
            oil_thickness > 1,
            plastic_count > 5,
            bacterial_count > 3,
            heavy_metals > 20,
            conditions['ph_level'] < 7 or conditions['ph_level'] > 8.5,
            conditions['dissolved_oxygen'] < 5
        ])
        
        if indicator_count >= 3:
            event_scores['mixed_pollution'] = max(event_scores.values()) * 0.8
        
        # Determine dominant event type
        max_score = max(event_scores.values())
        
        # If no significant indicators, no pollution
        if max_score < 20:
            return 'no_pollution', 0
        
        # Get event type with highest score
        event_type = max(event_scores, key=event_scores.get)
        
        # Calculate severity based on indicators
        severity = min(100, max_score + np.random.normal(0, 10))
        
        return event_type, max(0, severity)

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
        """Train the pollution event classification model"""
        if data is None:
            self.logger.info("Generating synthetic training data...")
            data = self.generate_synthetic_data()
        
        X = self.preprocess_data(data)
        y = data['pollution_type'].values
        
        # Encode pollution types
        y_encoded = self.label_encoder.fit_transform(y)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_encoded, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train pollution classifier
        self.logger.info("Training pollution event classifier...")
        self.pollution_classifier.fit(X_train_scaled, y_train)
        
        # Train anomaly detector for unusual pollution patterns
        self.logger.info("Training anomaly detector...")
        self.anomaly_detector.fit(X_train_scaled)
        
        # Evaluate classifier
        y_pred = self.pollution_classifier.predict(X_test_scaled)
        accuracy = accuracy_score(y_test, y_pred)
        
        self.logger.info(f"Pollution classification accuracy: {accuracy:.3f}")
        
        # Print detailed classification report
        class_names = self.label_encoder.classes_
        self.logger.info("Classification Report:")
        self.logger.info(f"\n{classification_report(y_test, y_pred, target_names=class_names)}")
        
        self.is_trained = True
        
        return {
            'accuracy': accuracy,
            'feature_importance': dict(zip(self.feature_names, self.pollution_classifier.feature_importances_))
        }

    def classify_pollution(self, features):
        """Classify pollution event type and assess severity"""
        if not self.is_trained:
            raise ValueError("Model must be trained before classification")
        
        X = self.preprocess_data(features)
        X_scaled = self.scaler.transform(X)
        
        # Predict pollution type
        pollution_type_encoded = self.pollution_classifier.predict(X_scaled)[0]
        pollution_type = self.label_encoder.inverse_transform([pollution_type_encoded])[0]
        
        # Get probabilities for each type
        pollution_probabilities = self.pollution_classifier.predict_proba(X_scaled)[0]
        pollution_prob_dict = dict(zip(self.label_encoder.classes_, pollution_probabilities))
        
        # Check for anomalous patterns
        anomaly_score = self.anomaly_detector.decision_function(X_scaled)[0]
        is_anomalous = self.anomaly_detector.predict(X_scaled)[0] == -1
        
        # Calculate severity based on indicators
        severity = self.calculate_pollution_severity(features, pollution_type)
        
        # Assess environmental impact
        impact_assessment = self.assess_environmental_impact(features, pollution_type, severity)
        
        return {
            'pollution_type': pollution_type,
            'pollution_severity': float(severity),
            'pollution_probabilities': {k: float(v) for k, v in pollution_prob_dict.items()},
            'is_anomalous_pattern': is_anomalous,
            'anomaly_score': float(anomaly_score),
            'risk_level': self.determine_risk_level(pollution_type, severity),
            'environmental_impact': impact_assessment,
            'recommendations': self.generate_recommendations(pollution_type, severity, features),
            'response_priority': self.determine_response_priority(pollution_type, severity)
        }

    def calculate_pollution_severity(self, features, pollution_type):
        """Calculate pollution severity based on specific indicators"""
        severity = 0
        
        if pollution_type == 'oil_spill':
            oil_thickness = features.get('oil_film_thickness', 0)
            if oil_thickness > 200:
                severity = 90
            elif oil_thickness > 50:
                severity = 70
            elif oil_thickness > 10:
                severity = 50
            elif oil_thickness > 1:
                severity = 30
            else:
                severity = 10
                
        elif pollution_type == 'chemical_discharge':
            heavy_metals = features.get('heavy_metals_index', 0)
            do = features.get('dissolved_oxygen', 8)
            ph = features.get('ph_level', 8)
            
            severity += min(50, heavy_metals * 0.5)
            if do < 2:
                severity += 40
            elif do < 4:
                severity += 25
            elif do < 6:
                severity += 10
            
            if ph < 6 or ph > 9:
                severity += 30
            elif ph < 6.5 or ph > 8.5:
                severity += 15
                
        elif pollution_type == 'sewage_overflow':
            bacterial = features.get('bacterial_count', 2)
            ammonia = features.get('ammonia_nitrogen', 0.5)
            
            severity += min(60, (bacterial - 2) * 15)
            severity += min(30, ammonia * 10)
            
        elif pollution_type == 'plastic_pollution':
            plastic_count = features.get('plastic_debris_count', 0)
            severity = min(80, plastic_count * 2)
            
        # Add general water quality degradation
        turbidity = features.get('turbidity', 3)
        if turbidity > 50:
            severity += 20
        elif turbidity > 20:
            severity += 10
        elif turbidity > 10:
            severity += 5
        
        return min(100, max(0, severity))

    def assess_environmental_impact(self, features, pollution_type, severity):
        """Assess environmental impact of pollution"""
        impact = {
            'marine_life': 'low',
            'water_quality': 'low',
            'human_health': 'low',
            'ecosystem': 'low'
        }
        
        # Adjust based on pollution type and severity
        if pollution_type == 'oil_spill':
            if severity > 70:
                impact['marine_life'] = 'severe'
                impact['ecosystem'] = 'severe'
            elif severity > 50:
                impact['marine_life'] = 'high'
                impact['ecosystem'] = 'high'
            elif severity > 30:
                impact['marine_life'] = 'moderate'
                impact['ecosystem'] = 'moderate'
                
        elif pollution_type in ['chemical_discharge', 'illegal_dumping']:
            if severity > 70:
                impact['water_quality'] = 'severe'
                impact['human_health'] = 'high'
                impact['marine_life'] = 'severe'
            elif severity > 50:
                impact['water_quality'] = 'high'
                impact['human_health'] = 'moderate'
                impact['marine_life'] = 'high'
                
        elif pollution_type == 'sewage_overflow':
            if severity > 70:
                impact['human_health'] = 'severe'
                impact['water_quality'] = 'severe'
            elif severity > 50:
                impact['human_health'] = 'high'
                impact['water_quality'] = 'high'
        
        # Distance to shore affects impact
        distance = features.get('distance_to_shore', 10)
        if distance < 1:  # Very close to shore
            if impact['human_health'] == 'moderate':
                impact['human_health'] = 'high'
            elif impact['human_health'] == 'low':
                impact['human_health'] = 'moderate'
        
        return impact

    def determine_risk_level(self, pollution_type, severity):
        """Determine overall risk level"""
        if pollution_type == 'no_pollution':
            return 'low'
        
        # High-risk pollution types
        high_risk_types = ['oil_spill', 'chemical_discharge', 'sewage_overflow']
        
        if pollution_type in high_risk_types:
            if severity > 80:
                return 'extreme'
            elif severity > 60:
                return 'high'
            elif severity > 40:
                return 'moderate'
            else:
                return 'low'
        else:
            # Lower risk pollution types
            if severity > 90:
                return 'high'
            elif severity > 70:
                return 'moderate'
            else:
                return 'low'

    def determine_response_priority(self, pollution_type, severity):
        """Determine response priority"""
        if pollution_type == 'no_pollution':
            return 'routine'
        
        critical_types = ['oil_spill', 'chemical_discharge']
        urgent_types = ['sewage_overflow', 'illegal_dumping']
        
        if pollution_type in critical_types and severity > 60:
            return 'emergency'
        elif pollution_type in critical_types and severity > 40:
            return 'urgent'
        elif pollution_type in urgent_types and severity > 70:
            return 'urgent'
        elif severity > 80:
            return 'urgent'
        elif severity > 50:
            return 'high'
        else:
            return 'routine'

    def generate_recommendations(self, pollution_type, severity, features):
        """Generate actionable recommendations"""
        recommendations = []
        
        if pollution_type == 'no_pollution':
            recommendations.append('Continue routine monitoring')
            return recommendations
        
        # General high-severity recommendations
        if severity > 80:
            recommendations.extend([
                'EMERGENCY RESPONSE: Activate pollution response team',
                'Issue immediate public health advisory',
                'Close affected areas to public access',
                'Contact environmental authorities',
                'Begin water quality monitoring'
            ])
        
        # Type-specific recommendations
        if pollution_type == 'oil_spill':
            recommendations.extend([
                'Deploy oil containment booms',
                'Alert maritime authorities',
                'Identify and stop pollution source',
                'Monitor wildlife impact',
                'Prepare cleanup equipment'
            ])
            
        elif pollution_type == 'chemical_discharge':
            recommendations.extend([
                'Identify chemical source immediately',
                'Test water for specific contaminants',
                'Alert drinking water facilities',
                'Monitor atmospheric conditions',
                'Establish safety perimeter'
            ])
            
        elif pollution_type == 'sewage_overflow':
            recommendations.extend([
                'Close recreational areas',
                'Issue swimming/fishing advisory',
                'Test for pathogens',
                'Locate overflow source',
                'Monitor bacterial levels'
            ])
            
        elif pollution_type == 'plastic_pollution':
            recommendations.extend([
                'Organize cleanup operations',
                'Document debris types and sources',
                'Check for microplastics',
                'Educate local communities'
            ])
        
        # Distance-based recommendations
        distance = features.get('distance_to_shore', 10)
        if distance < 2:
            recommendations.append('PRIORITY: Near-shore pollution - immediate public health concern')
        
        return recommendations

    def save_model(self, filepath):
        """Save trained model"""
        if not self.is_trained:
            raise ValueError("Model must be trained before saving")
        
        model_data = {
            'pollution_classifier': self.pollution_classifier,
            'anomaly_detector': self.anomaly_detector,
            'scaler': self.scaler,
            'label_encoder': self.label_encoder,
            'feature_names': self.feature_names,
            'pollution_types': self.pollution_types,
            'severity_thresholds': self.severity_thresholds
        }
        
        joblib.dump(model_data, filepath)
        self.logger.info(f"Model saved to {filepath}")

    def load_model(self, filepath):
        """Load trained model"""
        model_data = joblib.load(filepath)
        
        self.pollution_classifier = model_data['pollution_classifier']
        self.anomaly_detector = model_data['anomaly_detector']
        self.scaler = model_data['scaler']
        self.label_encoder = model_data['label_encoder']
        self.feature_names = model_data['feature_names']
        self.pollution_types = model_data['pollution_types']
        self.severity_thresholds = model_data['severity_thresholds']
        self.is_trained = True
        
        self.logger.info(f"Model loaded from {filepath}")

# Example usage and testing
if __name__ == "__main__":
    # Initialize and train model
    classifier = PollutionEventClassifier()
    
    # Train with synthetic data
    print("Training pollution event classification model...")
    training_result = classifier.train()
    print(f"Training completed: {training_result}")
    
    # Test with normal conditions
    normal_features = {
        'water_temperature': 24,
        'dissolved_oxygen': 7.5,
        'ph_level': 8.0,
        'turbidity': 3,
        'conductivity': 50000,
        'oil_film_thickness': 0,
        'plastic_debris_count': 1,
        'chemical_oxygen_demand': 3,
        'ammonia_nitrogen': 0.3,
        'phosphate_phosphorus': 0.2,
        'heavy_metals_index': 5,
        'bacterial_count': 2,
        'foam_presence': 0,
        'odor_intensity': 0,
        'water_color_anomaly': 0,
        'vessel_traffic_density': 2,
        'industrial_discharge': 0,
        'rainfall_24h': 5,
        'wind_speed': 8,
        'current_velocity': 0.5,
        'distance_to_shore': 10,
        'population_density': 1000
    }
    
    # Test with oil spill conditions
    oil_spill_features = {
        'water_temperature': 25,
        'dissolved_oxygen': 6,          # Slightly reduced
        'ph_level': 7.8,               # Slightly altered
        'turbidity': 15,               # Increased
        'conductivity': 52000,
        'oil_film_thickness': 75,       # HIGH - oil present
        'plastic_debris_count': 3,
        'chemical_oxygen_demand': 12,   # Increased
        'ammonia_nitrogen': 0.4,
        'phosphate_phosphorus': 0.3,
        'heavy_metals_index': 15,
        'bacterial_count': 2.5,
        'foam_presence': 1,            # Foam present
        'odor_intensity': 6,           # Strong odor
        'water_color_anomaly': 0.7,    # Color change
        'vessel_traffic_density': 15,   # High vessel traffic
        'industrial_discharge': 0,
        'rainfall_24h': 2,
        'wind_speed': 5,               # Low wind (oil spreads)
        'current_velocity': 0.2,       # Low current
        'distance_to_shore': 3,        # Close to shore
        'population_density': 3000
    }
    
    # Test predictions
    normal_result = classifier.classify_pollution(normal_features)
    oil_result = classifier.classify_pollution(oil_spill_features)
    
    print("\nNormal Conditions Result:")
    print(f"Pollution Type: {normal_result['pollution_type']}")
    print(f"Severity: {normal_result['pollution_severity']:.1f}")
    print(f"Risk Level: {normal_result['risk_level']}")
    print(f"Response Priority: {normal_result['response_priority']}")
    
    print("\nOil Spill Conditions Result:")
    print(f"Pollution Type: {oil_result['pollution_type']}")
    print(f"Severity: {oil_result['pollution_severity']:.1f}")
    print(f"Risk Level: {oil_result['risk_level']}")
    print(f"Response Priority: {oil_result['response_priority']}")
    print(f"Environmental Impact: {oil_result['environmental_impact']}")
    print(f"Recommendations: {oil_result['recommendations'][:3]}")  # Show first 3
    
    # Save model
    classifier.save_model('pollution_event_model.pkl')
    print("\nModel saved successfully!")

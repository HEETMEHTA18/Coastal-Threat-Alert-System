import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import logging
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

class BlueCarbonHealthMonitor:
    def __init__(self):
        self.health_regressor = RandomForestRegressor(n_estimators=200, random_state=42)
        self.carbon_regressor = RandomForestRegressor(n_estimators=150, random_state=42)
        self.anomaly_detector = IsolationForest(contamination=0.08, random_state=42)
        self.scaler = StandardScaler()
        self.is_trained = False
        
        # Feature names for model input
        self.feature_names = [
            # Vegetation indices
            'ndvi',                    # Normalized Difference Vegetation Index
            'evi',                     # Enhanced Vegetation Index
            'lai',                     # Leaf Area Index
            'canopy_cover_percent',    # Percentage canopy coverage
            
            # Water quality parameters
            'water_temperature',       # °C
            'salinity',               # ppt
            'dissolved_oxygen',       # mg/L
            'ph_level',               # pH units
            'turbidity',              # NTU
            'nutrient_nitrogen',      # mg/L
            'nutrient_phosphorus',    # mg/L
            
            # Physical environment
            'tidal_range',            # m
            'wave_energy',            # kJ/m²
            'sediment_accretion_rate', # mm/year
            'water_depth_mean',       # m
            'current_velocity',       # m/s
            
            # Climate factors
            'air_temperature',        # °C
            'rainfall_annual',        # mm/year
            'humidity',              # %
            'solar_radiation',       # W/m²
            'wind_speed',            # m/s
            
            # Human impact indicators
            'coastal_development_index', # 0-100
            'boat_traffic_density',     # boats/km²/day
            'pollution_index',          # 0-100
            'fishing_pressure',         # 0-100
            'tourism_pressure',         # visitors/km²/year
            
            # Ecosystem characteristics
            'species_diversity_index',  # Shannon diversity
            'biomass_density',         # kg/m²
            'root_depth_average',      # cm
            'pneumatophore_density',   # count/m²
            'epiphyte_coverage',       # %
            
            # Disturbance indicators
            'storm_frequency',         # events/year
            'disease_incidence',       # 0-1
            'herbivory_pressure',      # 0-100
            'invasive_species_presence' # 0-1
        ]
        
        # Ecosystem types
        self.ecosystem_types = [
            'mangrove_forest',
            'seagrass_meadow',
            'salt_marsh',
            'blue_carbon_mixed'
        ]
        
        # Health status categories
        self.health_categories = {
            'excellent': (90, 100),
            'good': (75, 90),
            'fair': (60, 75),
            'poor': (40, 60),
            'critical': (0, 40)
        }
        
        # Carbon storage benchmarks (tonnes C/hectare)
        self.carbon_benchmarks = {
            'mangrove_forest': {'min': 150, 'avg': 300, 'max': 500},
            'seagrass_meadow': {'min': 50, 'avg': 150, 'max': 300},
            'salt_marsh': {'min': 100, 'avg': 250, 'max': 400},
            'blue_carbon_mixed': {'min': 80, 'avg': 200, 'max': 350}
        }
        
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)

    def generate_synthetic_data(self, n_samples=3000):
        """Generate synthetic blue carbon ecosystem data"""
        np.random.seed(42)
        
        data = []
        
        for i in range(n_samples):
            # Randomly select ecosystem type
            ecosystem_type = np.random.choice(self.ecosystem_types)
            
            # Generate base conditions based on ecosystem type
            if ecosystem_type == 'mangrove_forest':
                base_data = self.generate_mangrove_data()
            elif ecosystem_type == 'seagrass_meadow':
                base_data = self.generate_seagrass_data()
            elif ecosystem_type == 'salt_marsh':
                base_data = self.generate_salt_marsh_data()
            else:  # mixed ecosystem
                base_data = self.generate_mixed_ecosystem_data()
            
            # Add human impacts and disturbances
            base_data = self.add_anthropogenic_impacts(base_data)
            
            # Calculate derived metrics
            health_score = self.calculate_health_score(base_data, ecosystem_type)
            carbon_storage = self.calculate_carbon_storage(base_data, ecosystem_type)
            
            base_data.update({
                'ecosystem_type': ecosystem_type,
                'health_score': health_score,
                'carbon_storage_tonnes_per_ha': carbon_storage,
                'timestamp': pd.Timestamp('2020-01-01') + pd.Timedelta(days=i)
            })
            
            data.append(base_data)
        
        return pd.DataFrame(data)

    def generate_mangrove_data(self):
        """Generate mangrove-specific data"""
        return {
            'ndvi': np.random.normal(0.75, 0.12),
            'evi': np.random.normal(0.65, 0.10),
            'lai': np.random.normal(4.5, 1.0),
            'canopy_cover_percent': np.random.normal(85, 10),
            'water_temperature': np.random.normal(27, 2),
            'salinity': np.random.normal(25, 8),  # Brackish water
            'dissolved_oxygen': np.random.normal(6, 1.5),
            'ph_level': np.random.normal(7.8, 0.3),
            'turbidity': np.random.exponential(8),
            'nutrient_nitrogen': np.random.exponential(1.5),
            'nutrient_phosphorus': np.random.exponential(0.3),
            'tidal_range': np.random.normal(1.8, 0.5),
            'wave_energy': np.random.exponential(15),
            'sediment_accretion_rate': np.random.normal(8, 3),
            'water_depth_mean': np.random.normal(2.5, 1.0),
            'current_velocity': np.random.exponential(0.4),
            'air_temperature': np.random.normal(28, 3),
            'rainfall_annual': np.random.normal(1500, 400),
            'humidity': np.random.normal(80, 8),
            'solar_radiation': np.random.normal(350, 50),
            'wind_speed': np.random.exponential(12),
            'species_diversity_index': np.random.normal(2.5, 0.5),
            'biomass_density': np.random.normal(25, 8),
            'root_depth_average': np.random.normal(150, 30),
            'pneumatophore_density': np.random.normal(200, 50),
            'epiphyte_coverage': np.random.normal(15, 8),
            'storm_frequency': np.random.poisson(0.8),
            'disease_incidence': np.random.beta(2, 8),
            'herbivory_pressure': np.random.normal(20, 10),
            'invasive_species_presence': np.random.binomial(1, 0.15)
        }

    def generate_seagrass_data(self):
        """Generate seagrass meadow-specific data"""
        return {
            'ndvi': np.random.normal(0.65, 0.15),
            'evi': np.random.normal(0.55, 0.12),
            'lai': np.random.normal(2.8, 0.8),
            'canopy_cover_percent': np.random.normal(70, 15),
            'water_temperature': np.random.normal(23, 3),
            'salinity': np.random.normal(35, 3),  # Marine
            'dissolved_oxygen': np.random.normal(8, 1.2),
            'ph_level': np.random.normal(8.1, 0.2),
            'turbidity': np.random.exponential(5),
            'nutrient_nitrogen': np.random.exponential(0.8),
            'nutrient_phosphorus': np.random.exponential(0.15),
            'tidal_range': np.random.normal(1.2, 0.4),
            'wave_energy': np.random.exponential(25),
            'sediment_accretion_rate': np.random.normal(3, 1.5),
            'water_depth_mean': np.random.normal(4, 2),
            'current_velocity': np.random.exponential(0.6),
            'air_temperature': np.random.normal(25, 4),
            'rainfall_annual': np.random.normal(800, 300),
            'humidity': np.random.normal(75, 10),
            'solar_radiation': np.random.normal(380, 60),
            'wind_speed': np.random.exponential(15),
            'species_diversity_index': np.random.normal(1.8, 0.4),
            'biomass_density': np.random.normal(8, 3),
            'root_depth_average': np.random.normal(40, 15),
            'pneumatophore_density': 0,  # Seagrass doesn't have pneumatophores
            'epiphyte_coverage': np.random.normal(25, 12),
            'storm_frequency': np.random.poisson(1.2),
            'disease_incidence': np.random.beta(3, 7),
            'herbivory_pressure': np.random.normal(35, 15),
            'invasive_species_presence': np.random.binomial(1, 0.20)
        }

    def generate_salt_marsh_data(self):
        """Generate salt marsh-specific data"""
        return {
            'ndvi': np.random.normal(0.70, 0.10),
            'evi': np.random.normal(0.60, 0.08),
            'lai': np.random.normal(3.2, 0.9),
            'canopy_cover_percent': np.random.normal(80, 12),
            'water_temperature': np.random.normal(20, 4),
            'salinity': np.random.normal(20, 10),  # Variable salinity
            'dissolved_oxygen': np.random.normal(7.5, 1.8),
            'ph_level': np.random.normal(7.5, 0.4),
            'turbidity': np.random.exponential(6),
            'nutrient_nitrogen': np.random.exponential(2),
            'nutrient_phosphorus': np.random.exponential(0.4),
            'tidal_range': np.random.normal(2.2, 0.6),
            'wave_energy': np.random.exponential(10),
            'sediment_accretion_rate': np.random.normal(12, 4),
            'water_depth_mean': np.random.normal(1.5, 0.8),
            'current_velocity': np.random.exponential(0.3),
            'air_temperature': np.random.normal(22, 5),
            'rainfall_annual': np.random.normal(1200, 500),
            'humidity': np.random.normal(78, 12),
            'solar_radiation': np.random.normal(320, 70),
            'wind_speed': np.random.exponential(18),
            'species_diversity_index': np.random.normal(2.2, 0.6),
            'biomass_density': np.random.normal(15, 5),
            'root_depth_average': np.random.normal(80, 25),
            'pneumatophore_density': 0,  # Salt marsh doesn't have pneumatophores
            'epiphyte_coverage': np.random.normal(10, 6),
            'storm_frequency': np.random.poisson(1.5),
            'disease_incidence': np.random.beta(2, 8),
            'herbivory_pressure': np.random.normal(25, 12),
            'invasive_species_presence': np.random.binomial(1, 0.25)
        }

    def generate_mixed_ecosystem_data(self):
        """Generate mixed ecosystem data (combination of above)"""
        # Average of the three ecosystem types with more variation
        mangrove = self.generate_mangrove_data()
        seagrass = self.generate_seagrass_data()
        salt_marsh = self.generate_salt_marsh_data()
        
        mixed_data = {}
        for key in mangrove.keys():
            # Average with additional variation
            avg_value = (mangrove[key] + seagrass[key] + salt_marsh[key]) / 3
            variation = np.random.normal(0, abs(avg_value) * 0.2)
            mixed_data[key] = avg_value + variation
        
        return mixed_data

    def add_anthropogenic_impacts(self, data):
        """Add human impact factors to the data"""
        # Generate human impact indices
        data['coastal_development_index'] = np.random.exponential(30)
        data['boat_traffic_density'] = np.random.exponential(5)
        data['pollution_index'] = np.random.exponential(25)
        data['fishing_pressure'] = np.random.exponential(40)
        data['tourism_pressure'] = np.random.exponential(1000)
        
        # Clip to reasonable ranges
        data['coastal_development_index'] = min(100, data['coastal_development_index'])
        data['boat_traffic_density'] = min(50, data['boat_traffic_density'])
        data['pollution_index'] = min(100, data['pollution_index'])
        data['fishing_pressure'] = min(100, data['fishing_pressure'])
        data['tourism_pressure'] = min(10000, data['tourism_pressure'])
        
        # Human impacts affect environmental conditions
        if data['pollution_index'] > 50:
            data['dissolved_oxygen'] *= 0.8  # Pollution reduces oxygen
            data['turbidity'] *= 1.5  # Pollution increases turbidity
        
        if data['coastal_development_index'] > 60:
            data['sediment_accretion_rate'] *= 0.7  # Development reduces sediment
            data['nutrient_nitrogen'] *= 1.3  # Runoff increases nutrients
        
        return data

    def calculate_health_score(self, data, ecosystem_type):
        """Calculate ecosystem health score based on multiple indicators"""
        health_score = 50  # Base score
        
        # Vegetation health indicators
        if data['ndvi'] > 0.7:
            health_score += 15
        elif data['ndvi'] > 0.5:
            health_score += 8
        elif data['ndvi'] < 0.3:
            health_score -= 15
        
        if data['canopy_cover_percent'] > 80:
            health_score += 10
        elif data['canopy_cover_percent'] < 50:
            health_score -= 15
        
        # Water quality indicators
        if 6 < data['dissolved_oxygen'] < 10:
            health_score += 8
        elif data['dissolved_oxygen'] < 4:
            health_score -= 20
        
        if 7.5 < data['ph_level'] < 8.5:
            health_score += 5
        elif data['ph_level'] < 7 or data['ph_level'] > 9:
            health_score -= 10
        
        # Biodiversity indicators
        if data['species_diversity_index'] > 2:
            health_score += 12
        elif data['species_diversity_index'] < 1:
            health_score -= 10
        
        # Human impact penalties
        if data['pollution_index'] > 70:
            health_score -= 25
        elif data['pollution_index'] > 40:
            health_score -= 10
        
        if data['coastal_development_index'] > 80:
            health_score -= 20
        elif data['coastal_development_index'] > 50:
            health_score -= 8
        
        # Disturbance factors
        if data['disease_incidence'] > 0.3:
            health_score -= 15
        
        if data['invasive_species_presence']:
            health_score -= 12
        
        if data['storm_frequency'] > 2:
            health_score -= 8
        
        # Add some randomness for natural variation
        health_score += np.random.normal(0, 5)
        
        return max(0, min(100, health_score))

    def calculate_carbon_storage(self, data, ecosystem_type):
        """Calculate carbon storage based on ecosystem characteristics"""
        benchmark = self.carbon_benchmarks[ecosystem_type]
        base_carbon = benchmark['avg']
        
        # Adjust based on biomass and vegetation indices
        biomass_factor = data['biomass_density'] / 15  # Normalize to typical biomass
        vegetation_factor = (data['ndvi'] + data['evi']) / 1.4  # Normalize vegetation indices
        
        # Calculate carbon storage
        carbon_storage = base_carbon * biomass_factor * vegetation_factor
        
        # Environmental modifiers
        if data['sediment_accretion_rate'] > 10:
            carbon_storage *= 1.2  # Higher accretion = more carbon burial
        elif data['sediment_accretion_rate'] < 3:
            carbon_storage *= 0.8
        
        # Root system contribution (especially for mangroves)
        if ecosystem_type == 'mangrove_forest':
            root_factor = data['root_depth_average'] / 150
            carbon_storage *= (0.7 + 0.3 * root_factor)
        
        # Human impact reductions
        if data['coastal_development_index'] > 60:
            carbon_storage *= 0.7
        
        if data['pollution_index'] > 50:
            carbon_storage *= 0.8
        
        # Add natural variation
        carbon_storage += np.random.normal(0, carbon_storage * 0.1)
        
        return max(0, carbon_storage)

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
        """Train the blue carbon health monitoring models"""
        if data is None:
            self.logger.info("Generating synthetic training data...")
            data = self.generate_synthetic_data()
        
        X = self.preprocess_data(data)
        y_health = data['health_score'].values
        y_carbon = data['carbon_storage_tonnes_per_ha'].values
        
        # Split data
        X_train, X_test, y_h_train, y_h_test, y_c_train, y_c_test = train_test_split(
            X, y_health, y_carbon, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train health prediction model
        self.logger.info("Training ecosystem health model...")
        self.health_regressor.fit(X_train_scaled, y_h_train)
        
        # Train carbon storage model
        self.logger.info("Training carbon storage model...")
        self.carbon_regressor.fit(X_train_scaled, y_c_train)
        
        # Train anomaly detector
        self.logger.info("Training anomaly detector...")
        self.anomaly_detector.fit(X_train_scaled)
        
        # Evaluate models
        health_pred = self.health_regressor.predict(X_test_scaled)
        carbon_pred = self.carbon_regressor.predict(X_test_scaled)
        
        health_r2 = r2_score(y_h_test, health_pred)
        health_mse = mean_squared_error(y_h_test, health_pred)
        carbon_r2 = r2_score(y_c_test, carbon_pred)
        carbon_mse = mean_squared_error(y_c_test, carbon_pred)
        
        self.logger.info(f"Health prediction R²: {health_r2:.3f}, MSE: {health_mse:.2f}")
        self.logger.info(f"Carbon storage R²: {carbon_r2:.3f}, MSE: {carbon_mse:.2f}")
        
        self.is_trained = True
        
        return {
            'health_r2': health_r2,
            'health_mse': health_mse,
            'carbon_r2': carbon_r2,
            'carbon_mse': carbon_mse,
            'health_feature_importance': dict(zip(self.feature_names, self.health_regressor.feature_importances_)),
            'carbon_feature_importance': dict(zip(self.feature_names, self.carbon_regressor.feature_importances_))
        }

    def assess_ecosystem_health(self, features):
        """Assess blue carbon ecosystem health and carbon storage"""
        if not self.is_trained:
            raise ValueError("Model must be trained before assessment")
        
        X = self.preprocess_data(features)
        X_scaled = self.scaler.transform(X)
        
        # Predict health score and carbon storage
        health_score = self.health_regressor.predict(X_scaled)[0]
        carbon_storage = self.carbon_regressor.predict(X_scaled)[0]
        
        # Detect anomalies
        anomaly_score = self.anomaly_detector.decision_function(X_scaled)[0]
        is_anomalous = self.anomaly_detector.predict(X_scaled)[0] == -1
        
        # Determine health category
        health_category = self.determine_health_category(health_score)
        
        # Assess threats and stressors
        threat_assessment = self.assess_threats(features)
        
        # Calculate carbon sequestration potential
        sequestration_potential = self.assess_sequestration_potential(features, health_score)
        
        return {
            'health_score': float(health_score),
            'health_category': health_category,
            'carbon_storage_tonnes_per_ha': float(carbon_storage),
            'carbon_sequestration_potential': sequestration_potential,
            'is_anomalous': is_anomalous,
            'anomaly_score': float(anomaly_score),
            'threat_assessment': threat_assessment,
            'conservation_priority': self.determine_conservation_priority(health_score, carbon_storage, threat_assessment),
            'recommendations': self.generate_conservation_recommendations(health_score, threat_assessment, features),
            'monitoring_indicators': self.identify_key_monitoring_indicators(features, health_score)
        }

    def determine_health_category(self, health_score):
        """Determine health category based on score"""
        for category, (min_score, max_score) in self.health_categories.items():
            if min_score <= health_score <= max_score:
                return category
        return 'unknown'

    def assess_threats(self, features):
        """Assess current threats to the ecosystem"""
        threats = {}
        
        # Pollution threats
        pollution_index = features.get('pollution_index', 0)
        if pollution_index > 70:
            threats['pollution'] = 'severe'
        elif pollution_index > 40:
            threats['pollution'] = 'moderate'
        else:
            threats['pollution'] = 'low'
        
        # Development pressure
        development = features.get('coastal_development_index', 0)
        if development > 80:
            threats['development_pressure'] = 'severe'
        elif development > 50:
            threats['development_pressure'] = 'moderate'
        else:
            threats['development_pressure'] = 'low'
        
        # Climate change indicators
        water_temp = features.get('water_temperature', 25)
        if water_temp > 30:
            threats['climate_stress'] = 'high'
        elif water_temp > 28:
            threats['climate_stress'] = 'moderate'
        else:
            threats['climate_stress'] = 'low'
        
        # Sea level rise (inferred from storm frequency)
        storm_freq = features.get('storm_frequency', 1)
        if storm_freq > 2:
            threats['extreme_weather'] = 'high'
        elif storm_freq > 1:
            threats['extreme_weather'] = 'moderate'
        else:
            threats['extreme_weather'] = 'low'
        
        # Human activities
        fishing = features.get('fishing_pressure', 0)
        tourism = features.get('tourism_pressure', 0)
        boat_traffic = features.get('boat_traffic_density', 0)
        
        human_pressure = (fishing + tourism/100 + boat_traffic*10) / 3
        if human_pressure > 60:
            threats['human_activities'] = 'high'
        elif human_pressure > 30:
            threats['human_activities'] = 'moderate'
        else:
            threats['human_activities'] = 'low'
        
        # Invasive species
        if features.get('invasive_species_presence', 0):
            threats['invasive_species'] = 'present'
        else:
            threats['invasive_species'] = 'absent'
        
        return threats

    def assess_sequestration_potential(self, features, health_score):
        """Assess carbon sequestration potential"""
        base_potential = health_score / 100  # Base on ecosystem health
        
        # Environmental factors that enhance sequestration
        sediment_rate = features.get('sediment_accretion_rate', 5)
        if sediment_rate > 10:
            base_potential *= 1.3
        elif sediment_rate > 5:
            base_potential *= 1.1
        else:
            base_potential *= 0.8
        
        # Vegetation productivity factors
        ndvi = features.get('ndvi', 0.6)
        if ndvi > 0.7:
            base_potential *= 1.2
        elif ndvi < 0.4:
            base_potential *= 0.7
        
        # Human impact reductions
        development = features.get('coastal_development_index', 0)
        pollution = features.get('pollution_index', 0)
        
        impact_factor = 1 - (development + pollution) / 200
        base_potential *= max(0.3, impact_factor)
        
        return {
            'potential_rating': 'high' if base_potential > 0.7 else 'moderate' if base_potential > 0.4 else 'low',
            'potential_score': float(base_potential),
            'limiting_factors': self.identify_limiting_factors(features)
        }

    def identify_limiting_factors(self, features):
        """Identify factors limiting carbon sequestration"""
        limiting_factors = []
        
        if features.get('sediment_accretion_rate', 5) < 3:
            limiting_factors.append('low_sediment_accretion')
        
        if features.get('dissolved_oxygen', 7) < 5:
            limiting_factors.append('low_oxygen_levels')
        
        if features.get('pollution_index', 0) > 50:
            limiting_factors.append('pollution_stress')
        
        if features.get('coastal_development_index', 0) > 60:
            limiting_factors.append('habitat_fragmentation')
        
        if features.get('disease_incidence', 0) > 0.3:
            limiting_factors.append('disease_pressure')
        
        if features.get('invasive_species_presence', 0):
            limiting_factors.append('invasive_species_competition')
        
        return limiting_factors

    def determine_conservation_priority(self, health_score, carbon_storage, threats):
        """Determine conservation priority level"""
        priority_score = 0
        
        # Health-based priority
        if health_score < 40:
            priority_score += 40  # Critical systems need immediate attention
        elif health_score < 60:
            priority_score += 25
        elif health_score > 80:
            priority_score += 15  # Protect high-quality systems
        
        # Carbon storage value
        if carbon_storage > 300:
            priority_score += 20  # High carbon value
        elif carbon_storage > 200:
            priority_score += 10
        
        # Threat level
        severe_threats = sum(1 for threat in threats.values() if threat in ['severe', 'high', 'present'])
        priority_score += severe_threats * 10
        
        # Determine priority category
        if priority_score >= 60:
            return 'critical'
        elif priority_score >= 40:
            return 'high'
        elif priority_score >= 25:
            return 'moderate'
        else:
            return 'low'

    def generate_conservation_recommendations(self, health_score, threats, features):
        """Generate conservation and management recommendations"""
        recommendations = []
        
        # Health-based recommendations
        if health_score < 40:
            recommendations.extend([
                'URGENT: Implement emergency ecosystem restoration',
                'Conduct detailed health assessment',
                'Identify and eliminate immediate stressors',
                'Consider ecosystem rehabilitation programs'
            ])
        elif health_score < 60:
            recommendations.extend([
                'Implement targeted restoration activities',
                'Monitor ecosystem recovery',
                'Reduce human pressures'
            ])
        
        # Threat-specific recommendations
        if threats.get('pollution', 'low') in ['severe', 'moderate']:
            recommendations.extend([
                'Implement pollution control measures',
                'Monitor water quality regularly',
                'Identify and control pollution sources'
            ])
        
        if threats.get('development_pressure', 'low') in ['severe', 'moderate']:
            recommendations.extend([
                'Establish protective zoning',
                'Implement coastal development restrictions',
                'Create buffer zones around critical habitats'
            ])
        
        if threats.get('invasive_species') == 'present':
            recommendations.extend([
                'Implement invasive species control program',
                'Monitor for new invasive species',
                'Restore native species populations'
            ])
        
        # Carbon-specific recommendations
        if features.get('sediment_accretion_rate', 5) < 3:
            recommendations.append('Enhance sediment supply through coastal management')
        
        # General management recommendations
        recommendations.extend([
            'Establish long-term monitoring program',
            'Engage local communities in conservation',
            'Develop adaptive management strategies',
            'Consider blue carbon credit opportunities'
        ])
        
        return recommendations

    def identify_key_monitoring_indicators(self, features, health_score):
        """Identify key indicators for ongoing monitoring"""
        indicators = {
            'critical': [],
            'important': [],
            'supplementary': []
        }
        
        # Always critical indicators
        indicators['critical'].extend([
            'ndvi', 'canopy_cover_percent', 'dissolved_oxygen', 'pollution_index'
        ])
        
        # Health-dependent indicators
        if health_score < 60:
            indicators['critical'].extend([
                'disease_incidence', 'invasive_species_presence'
            ])
        
        # Threat-dependent indicators
        if features.get('coastal_development_index', 0) > 50:
            indicators['important'].append('coastal_development_index')
        
        if features.get('storm_frequency', 1) > 1:
            indicators['important'].append('storm_frequency')
        
        # Carbon-related indicators
        indicators['important'].extend([
            'biomass_density', 'sediment_accretion_rate', 'species_diversity_index'
        ])
        
        # Supplementary indicators
        indicators['supplementary'].extend([
            'ph_level', 'turbidity', 'nutrient_nitrogen', 'wind_speed'
        ])
        
        return indicators

    def save_model(self, filepath):
        """Save trained model"""
        if not self.is_trained:
            raise ValueError("Model must be trained before saving")
        
        model_data = {
            'health_regressor': self.health_regressor,
            'carbon_regressor': self.carbon_regressor,
            'anomaly_detector': self.anomaly_detector,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'ecosystem_types': self.ecosystem_types,
            'health_categories': self.health_categories,
            'carbon_benchmarks': self.carbon_benchmarks
        }
        
        joblib.dump(model_data, filepath)
        self.logger.info(f"Model saved to {filepath}")

    def load_model(self, filepath):
        """Load trained model"""
        model_data = joblib.load(filepath)
        
        self.health_regressor = model_data['health_regressor']
        self.carbon_regressor = model_data['carbon_regressor']
        self.anomaly_detector = model_data['anomaly_detector']
        self.scaler = model_data['scaler']
        self.feature_names = model_data['feature_names']
        self.ecosystem_types = model_data['ecosystem_types']
        self.health_categories = model_data['health_categories']
        self.carbon_benchmarks = model_data['carbon_benchmarks']
        self.is_trained = True
        
        self.logger.info(f"Model loaded from {filepath}")

# Example usage and testing
if __name__ == "__main__":
    # Initialize and train model
    monitor = BlueCarbonHealthMonitor()
    
    # Train with synthetic data
    print("Training blue carbon health monitoring model...")
    training_result = monitor.train()
    print(f"Training completed: {training_result}")
    
    # Test with healthy mangrove ecosystem
    healthy_mangrove = {
        'ndvi': 0.8,
        'evi': 0.7,
        'lai': 5.0,
        'canopy_cover_percent': 90,
        'water_temperature': 27,
        'salinity': 25,
        'dissolved_oxygen': 7.5,
        'ph_level': 7.8,
        'turbidity': 5,
        'nutrient_nitrogen': 1.0,
        'nutrient_phosphorus': 0.2,
        'tidal_range': 2.0,
        'wave_energy': 10,
        'sediment_accretion_rate': 10,
        'water_depth_mean': 2.5,
        'current_velocity': 0.3,
        'air_temperature': 28,
        'rainfall_annual': 1500,
        'humidity': 80,
        'solar_radiation': 350,
        'wind_speed': 10,
        'coastal_development_index': 20,
        'boat_traffic_density': 2,
        'pollution_index': 15,
        'fishing_pressure': 25,
        'tourism_pressure': 500,
        'species_diversity_index': 2.8,
        'biomass_density': 30,
        'root_depth_average': 160,
        'pneumatophore_density': 220,
        'epiphyte_coverage': 12,
        'storm_frequency': 0.5,
        'disease_incidence': 0.1,
        'herbivory_pressure': 15,
        'invasive_species_presence': 0
    }
    
    # Test with degraded ecosystem
    degraded_ecosystem = {
        'ndvi': 0.45,                   # Low vegetation index
        'evi': 0.35,
        'lai': 2.0,                     # Low leaf area
        'canopy_cover_percent': 45,     # Sparse canopy
        'water_temperature': 30,        # High temperature stress
        'salinity': 35,
        'dissolved_oxygen': 4.5,        # Low oxygen
        'ph_level': 7.2,               # Acidic conditions
        'turbidity': 25,               # High turbidity
        'nutrient_nitrogen': 5.0,       # High nutrients (pollution)
        'nutrient_phosphorus': 1.5,
        'tidal_range': 1.8,
        'wave_energy': 35,             # High wave energy
        'sediment_accretion_rate': 2,   # Low sediment accretion
        'water_depth_mean': 3.0,
        'current_velocity': 0.8,
        'air_temperature': 32,         # High air temperature
        'rainfall_annual': 800,        # Low rainfall
        'humidity': 65,                # Low humidity
        'solar_radiation': 420,        # High solar stress
        'wind_speed': 20,              # High wind stress
        'coastal_development_index': 85, # High development pressure
        'boat_traffic_density': 25,     # High boat traffic
        'pollution_index': 75,          # High pollution
        'fishing_pressure': 80,         # High fishing pressure
        'tourism_pressure': 5000,       # High tourism pressure
        'species_diversity_index': 1.2, # Low diversity
        'biomass_density': 8,           # Low biomass
        'root_depth_average': 80,       # Shallow roots
        'pneumatophore_density': 100,   # Reduced pneumatophores
        'epiphyte_coverage': 5,         # Low epiphyte coverage
        'storm_frequency': 3,           # High storm frequency
        'disease_incidence': 0.4,       # High disease incidence
        'herbivory_pressure': 45,       # High herbivory
        'invasive_species_presence': 1  # Invasive species present
    }
    
    # Test assessments
    healthy_result = monitor.assess_ecosystem_health(healthy_mangrove)
    degraded_result = monitor.assess_ecosystem_health(degraded_ecosystem)
    
    print("\nHealthy Mangrove Assessment:")
    print(f"Health Score: {healthy_result['health_score']:.1f} ({healthy_result['health_category']})")
    print(f"Carbon Storage: {healthy_result['carbon_storage_tonnes_per_ha']:.1f} tonnes C/ha")
    print(f"Conservation Priority: {healthy_result['conservation_priority']}")
    print(f"Sequestration Potential: {healthy_result['carbon_sequestration_potential']['potential_rating']}")
    
    print("\nDegraded Ecosystem Assessment:")
    print(f"Health Score: {degraded_result['health_score']:.1f} ({degraded_result['health_category']})")
    print(f"Carbon Storage: {degraded_result['carbon_storage_tonnes_per_ha']:.1f} tonnes C/ha")
    print(f"Conservation Priority: {degraded_result['conservation_priority']}")
    print(f"Is Anomalous: {degraded_result['is_anomalous']}")
    print(f"Threat Assessment: {degraded_result['threat_assessment']}")
    print(f"Key Recommendations: {degraded_result['recommendations'][:3]}")
    
    # Save model
    monitor.save_model('blue_carbon_health_model.pkl')
    print("\nModel saved successfully!")

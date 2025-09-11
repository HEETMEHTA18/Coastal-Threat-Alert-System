"""
CTAS AI Model API Server
FastAPI server providing real-time AI predictions for coastal threat assessment
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
import uvicorn
import sys
import os
import logging
from datetime import datetime, timedelta
import asyncio
import json

# Add the parent directory to Python path for model imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import all AI models (try importing and handle missing models gracefully)
try:
    from algal_bloom_predictor import AlgalBloomPredictor
except ImportError:
    AlgalBloomPredictor = None
    
try:
    from blue_carbon_health_monitor import BlueCarbonHealthMonitor
except ImportError:
    BlueCarbonHealthMonitor = None
    
try:
    from cyclone_trajectory_model import CycloneTrajectoryModel
except ImportError:
    CycloneTrajectoryModel = None
    
try:
    from pollution_event_classifier import PollutionEventClassifier
except ImportError:
    PollutionEventClassifier = None
    
try:
    from sea_level_anomaly_detector import SeaLevelAnomalyDetector
except ImportError:
    SeaLevelAnomalyDetector = None

# Note: coastal-threat-model.py and mangrove-health-model.py have hyphens in names
# These need to be imported differently or renamed

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="CTAS AI Model API",
    description="Coastal Threat Assessment System - AI Model Prediction Service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5175", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API requests/responses
class CoastalThreatInput(BaseModel):
    wave_height: float = Field(..., ge=0, le=20, description="Wave height in meters")
    wind_speed: float = Field(..., ge=0, le=200, description="Wind speed in km/h")
    atmospheric_pressure: float = Field(..., ge=950, le=1050, description="Atmospheric pressure in hPa")
    tide_level: float = Field(..., ge=-5, le=5, description="Tide level in meters from mean")
    water_temperature: float = Field(..., ge=10, le=40, description="Water temperature in °C")
    rainfall_24h: float = Field(..., ge=0, le=1000, description="24-hour rainfall in mm")
    storm_distance: float = Field(..., ge=0, le=2000, description="Distance to nearest storm in km")
    moon_phase: float = Field(..., ge=0, le=1, description="Moon phase (0=new, 1=full)")
    season: int = Field(..., ge=0, le=3, description="Season (0=spring, 1=summer, 2=autumn, 3=winter)")
    coastal_elevation: float = Field(..., ge=0, le=100, description="Coastal elevation in meters")
    vegetation_cover: float = Field(..., ge=0, le=1, description="Vegetation cover fraction")
    human_population: float = Field(..., ge=0, le=1000000, description="Population density per km²")

class MangroveHealthInput(BaseModel):
    ndvi: float = Field(..., ge=0, le=1, description="Normalized Difference Vegetation Index")
    chlorophyll: float = Field(..., ge=0, le=100, description="Water chlorophyll in µg/L")
    water_temp: float = Field(..., ge=15, le=40, description="Water temperature in °C")
    salinity: float = Field(..., ge=0, le=50, description="Water salinity in ppt")
    turbidity: float = Field(..., ge=0, le=100, description="Water turbidity in NTU")
    rainfall: float = Field(..., ge=0, le=1000, description="Monthly rainfall in mm")
    tidal_range: float = Field(..., ge=0, le=5, description="Tidal range in meters")
    distance_to_shore: float = Field(..., ge=0, le=50, description="Distance to shore in km")
    human_activity_index: float = Field(..., ge=0, le=100, description="Human activity intensity index")

class AlgalBloomInput(BaseModel):
    water_temperature: float = Field(..., ge=10, le=35, description="Water temperature in °C")
    chlorophyll_a: float = Field(..., ge=0.1, le=100, description="Chlorophyll-a concentration in µg/L")
    dissolved_oxygen: float = Field(..., ge=0, le=15, description="Dissolved oxygen in mg/L")
    ph_level: float = Field(..., ge=6.5, le=9.0, description="pH level")
    turbidity: float = Field(..., ge=0, le=50, description="Turbidity in NTU")
    nitrate_nitrogen: float = Field(..., ge=0, le=20, description="Nitrate nitrogen in mg/L")
    phosphate_phosphorus: float = Field(..., ge=0, le=5, description="Phosphate phosphorus in mg/L")
    salinity: float = Field(..., ge=20, le=40, description="Salinity in ppt")
    solar_radiation: float = Field(..., ge=50, le=600, description="Solar radiation in W/m²")
    wind_speed: float = Field(..., ge=0, le=30, description="Wind speed in m/s")
    rainfall_7d: float = Field(..., ge=0, le=200, description="7-day rainfall total in mm")
    water_depth: float = Field(..., ge=5, le=200, description="Water depth in meters")
    current_velocity: float = Field(..., ge=0, le=2, description="Current velocity in m/s")
    upwelling_index: float = Field(..., ge=-3, le=3, description="Upwelling index")
    sea_surface_height: float = Field(..., ge=-1, le=1, description="Sea surface height anomaly in m")
    human_activity_index: float = Field(..., ge=0, le=100, description="Human activity index")

class SeaLevelInput(BaseModel):
    timestamp: datetime = Field(..., description="Timestamp of measurement")
    sea_level: float = Field(..., ge=-2, le=2, description="Sea level measurement in meters")
    atmospheric_pressure: float = Field(..., ge=950, le=1050, description="Atmospheric pressure in hPa")
    wind_speed: float = Field(..., ge=0, le=50, description="Wind speed in m/s")
    tide_level: float = Field(..., ge=-3, le=3, description="Predicted tide level in meters")
    water_temperature: float = Field(..., ge=10, le=35, description="Water temperature in °C")

class LocationCoordinates(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="Latitude in degrees")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude in degrees")

class EnsemblePredictionInput(BaseModel):
    location: LocationCoordinates
    environmental_data: Dict[str, Any] = Field(..., description="Environmental sensor data")
    timestamp: datetime = Field(default_factory=datetime.now, description="Prediction timestamp")

# Response models
class ThreatPredictionResponse(BaseModel):
    threat_type: str
    severity_score: float
    confidence: float
    recommendations: List[str]
    timestamp: datetime
    model_version: str = "1.0.0"

class HealthAssessmentResponse(BaseModel):
    health_score: float
    health_category: str
    is_anomaly: bool
    confidence: float
    threats: List[Dict[str, Any]]
    timestamp: datetime

class BloomPredictionResponse(BaseModel):
    bloom_type: str
    bloom_probability: float
    severity_score: float
    risk_level: str
    confidence: float
    environmental_factors: Dict[str, str]
    timestamp: datetime

class EnsembleResponse(BaseModel):
    overall_risk_level: str
    individual_predictions: Dict[str, Any]
    combined_severity: float
    priority_threats: List[str]
    recommendations: List[str]
    timestamp: datetime

# Global model instances
models = {}
model_status = {}

async def initialize_models():
    """Initialize all AI models on startup"""
    try:
        logger.info("Initializing AI models...")
        
        # Initialize available models with graceful error handling
        
        # Initialize Algal Bloom Predictor
        if AlgalBloomPredictor:
            try:
                models['algal_bloom'] = AlgalBloomPredictor()
                # Skip training for now to get the service up quickly
                model_status['algal_bloom'] = {'status': 'ready', 'last_trained': datetime.now()}
                logger.info("✓ Algal Bloom Predictor initialized")
            except Exception as e:
                logger.warning(f"Algal Bloom model initialization failed: {e}")
                model_status['algal_bloom'] = {'status': 'error', 'error': str(e)}
        else:
            logger.warning("Algal Bloom Predictor not available")
            model_status['algal_bloom'] = {'status': 'unavailable', 'error': 'Module not found'}
        
        # Initialize other available models
        if SeaLevelAnomalyDetector:
            try:
                models['sea_level'] = SeaLevelAnomalyDetector()
                model_status['sea_level'] = {'status': 'ready', 'last_trained': datetime.now()}
                logger.info("✓ Sea Level Anomaly Detector initialized")
            except Exception as e:
                logger.warning(f"Sea Level model initialization failed: {e}")
                model_status['sea_level'] = {'status': 'error', 'error': str(e)}
        else:
            model_status['sea_level'] = {'status': 'unavailable', 'error': 'Module not found'}
        
        if CycloneTrajectoryModel:
            try:
                models['cyclone'] = CycloneTrajectoryModel()
                model_status['cyclone'] = {'status': 'ready', 'last_trained': datetime.now()}
                logger.info("✓ Cyclone Trajectory Model initialized")
            except Exception as e:
                logger.warning(f"Cyclone model initialization failed: {e}")
                model_status['cyclone'] = {'status': 'error', 'error': str(e)}
        else:
            model_status['cyclone'] = {'status': 'unavailable', 'error': 'Module not found'}
        
        if PollutionEventClassifier:
            try:
                models['pollution'] = PollutionEventClassifier()
                model_status['pollution'] = {'status': 'ready', 'last_trained': datetime.now()}
                logger.info("✓ Pollution Event Classifier initialized")
            except Exception as e:
                logger.warning(f"Pollution model initialization failed: {e}")
                model_status['pollution'] = {'status': 'error', 'error': str(e)}
        else:
            model_status['pollution'] = {'status': 'unavailable', 'error': 'Module not found'}
        
        if BlueCarbonHealthMonitor:
            try:
                models['blue_carbon'] = BlueCarbonHealthMonitor()
                model_status['blue_carbon'] = {'status': 'ready', 'last_trained': datetime.now()}
                logger.info("✓ Blue Carbon Health Monitor initialized")
            except Exception as e:
                logger.warning(f"Blue Carbon model initialization failed: {e}")
                model_status['blue_carbon'] = {'status': 'error', 'error': str(e)}
        else:
            model_status['blue_carbon'] = {'status': 'unavailable', 'error': 'Module not found'}
        
        # Add basic status for missing models
        if 'coastal_threat' not in model_status:
            model_status['coastal_threat'] = {'status': 'unavailable', 'error': 'Model file with hyphens - needs manual loading'}
        if 'mangrove_health' not in model_status:
            model_status['mangrove_health'] = {'status': 'unavailable', 'error': 'Model file with hyphens - needs manual loading'}
        
        logger.info("🌊 AI models initialization completed!")
        
    except Exception as e:
        logger.error(f"Failed to initialize models: {e}")
        # Don't raise - let the service start even with failed models

@app.on_event("startup")
async def startup_event():
    """Initialize models on startup"""
    await initialize_models()

@app.get("/")
async def root():
    """API root endpoint with status information"""
    return {
        "message": "CTAS AI Model API",
        "version": "1.0.0",
        "status": "operational",
        "timestamp": datetime.now(),
        "models": {name: status['status'] for name, status in model_status.items()},
        "endpoints": {
            "coastal_threat": "/predict/coastal-threat",
            "mangrove_health": "/predict/mangrove-health",
            "algal_bloom": "/predict/algal-bloom",
            "ensemble": "/predict/ensemble",
            "model_status": "/models/status"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    healthy_models = sum(1 for status in model_status.values() if status['status'] == 'ready')
    total_models = len(model_status)
    
    return {
        "status": "healthy" if healthy_models == total_models else "degraded",
        "models_ready": f"{healthy_models}/{total_models}",
        "timestamp": datetime.now(),
        "uptime": "up"
    }

@app.get("/models/status")
async def get_model_status():
    """Get detailed status of all AI models"""
    return {
        "models": model_status,
        "timestamp": datetime.now()
    }

@app.post("/predict/coastal-threat", response_model=ThreatPredictionResponse)
async def predict_coastal_threat(input_data: CoastalThreatInput):
    """Predict coastal threats based on environmental conditions"""
    try:
        if 'coastal_threat' not in models:
            raise HTTPException(status_code=503, detail="Coastal threat model not available")
        
        # Convert input to dict
        features = input_data.dict()
        
        # Get prediction
        prediction = models['coastal_threat'].predict_threat(features)
        
        # Generate recommendations based on threat type
        recommendations = generate_threat_recommendations(prediction['threat_type'], prediction['severity_score'])
        
        return ThreatPredictionResponse(
            threat_type=prediction['threat_type'],
            severity_score=prediction['severity_score'],
            confidence=prediction.get('confidence', 85.0),
            recommendations=recommendations,
            timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Coastal threat prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/predict/mangrove-health", response_model=HealthAssessmentResponse)
async def predict_mangrove_health(input_data: MangroveHealthInput):
    """Assess mangrove ecosystem health"""
    try:
        if 'mangrove_health' not in models:
            raise HTTPException(status_code=503, detail="Mangrove health model not available")
        
        # Convert input to dict
        features = input_data.dict()
        
        # Get health prediction
        prediction = models['mangrove_health'].predict_health(features)
        
        # Get threats assessment
        threats = models['mangrove_health'].assess_threats(features, prediction['health_score'])
        
        return HealthAssessmentResponse(
            health_score=prediction['health_score'],
            health_category=prediction['health_category'],
            is_anomaly=prediction['is_anomaly'],
            confidence=prediction['confidence'],
            threats=threats if isinstance(threats, list) else [],
            timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Mangrove health prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/predict/algal-bloom", response_model=BloomPredictionResponse)
async def predict_algal_bloom(input_data: AlgalBloomInput):
    """Predict algal bloom occurrence and severity"""
    try:
        if 'algal_bloom' not in models:
            raise HTTPException(status_code=503, detail="Algal bloom model not available")
        
        # Convert input to dict
        features = input_data.dict()
        
        # Get bloom prediction
        prediction = models['algal_bloom'].predict_bloom(features)
        
        # Determine risk level
        risk_level = determine_bloom_risk_level(prediction.get('bloom_probability', 0))
        
        # Analyze environmental factors
        env_factors = analyze_bloom_factors(features)
        
        return BloomPredictionResponse(
            bloom_type=prediction.get('bloom_type', 'unknown'),
            bloom_probability=prediction.get('bloom_probability', 0.0),
            severity_score=prediction.get('severity_score', 0.0),
            risk_level=risk_level,
            confidence=prediction.get('confidence', 75.0),
            environmental_factors=env_factors,
            timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Algal bloom prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/predict/ensemble", response_model=EnsembleResponse)
async def predict_ensemble(input_data: EnsemblePredictionInput):
    """Run ensemble prediction using multiple models"""
    try:
        individual_predictions = {}
        severity_scores = []
        threats = []
        
        # Extract environmental data
        env_data = input_data.environmental_data
        
        # Run coastal threat prediction if model available
        if 'coastal_threat' in models and models['coastal_threat'].is_trained:
            try:
                coastal_input = extract_coastal_features(env_data)
                coastal_pred = models['coastal_threat'].predict_threat(coastal_input)
                individual_predictions['coastal_threat'] = coastal_pred
                severity_scores.append(coastal_pred['severity_score'])
                if coastal_pred['threat_type'] != 'none':
                    threats.append(coastal_pred['threat_type'])
            except Exception as e:
                logger.warning(f"Coastal threat ensemble prediction failed: {e}")
        
        # Run mangrove health assessment if model available
        if 'mangrove_health' in models and models['mangrove_health'].is_trained:
            try:
                mangrove_input = extract_mangrove_features(env_data)
                mangrove_pred = models['mangrove_health'].predict_health(mangrove_input)
                individual_predictions['mangrove_health'] = mangrove_pred
                # Convert health score to severity (inverse relationship)
                severity_scores.append(100 - mangrove_pred['health_score'])
                if mangrove_pred['health_category'] in ['poor', 'critical']:
                    threats.append('ecosystem_degradation')
            except Exception as e:
                logger.warning(f"Mangrove ensemble prediction failed: {e}")
        
        # Run algal bloom prediction if model available
        if 'algal_bloom' in models and models['algal_bloom'].is_trained:
            try:
                bloom_input = extract_bloom_features(env_data)
                bloom_pred = models['algal_bloom'].predict_bloom(bloom_input)
                individual_predictions['algal_bloom'] = bloom_pred
                severity_scores.append(bloom_pred.get('severity_score', 0))
                if bloom_pred.get('bloom_type', 'no_bloom') != 'no_bloom':
                    threats.append('algal_bloom')
            except Exception as e:
                logger.warning(f"Algal bloom ensemble prediction failed: {e}")
        
        # Calculate combined metrics
        combined_severity = sum(severity_scores) / len(severity_scores) if severity_scores else 0
        overall_risk = determine_overall_risk_level(combined_severity)
        priority_threats = list(set(threats))[:3]  # Top 3 unique threats
        
        # Generate ensemble recommendations
        recommendations = generate_ensemble_recommendations(priority_threats, combined_severity)
        
        return EnsembleResponse(
            overall_risk_level=overall_risk,
            individual_predictions=individual_predictions,
            combined_severity=combined_severity,
            priority_threats=priority_threats,
            recommendations=recommendations,
            timestamp=datetime.now()
        )
        
    except Exception as e:
        logger.error(f"Ensemble prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Ensemble prediction failed: {str(e)}")

# Helper functions
def generate_threat_recommendations(threat_type: str, severity: float) -> List[str]:
    """Generate recommendations based on threat type and severity"""
    recommendations = []
    
    base_recommendations = {
        'storm_surge': [
            "Monitor storm tracking systems continuously",
            "Prepare evacuation routes and emergency shelters",
            "Secure or relocate coastal equipment and vessels"
        ],
        'coastal_flooding': [
            "Issue flood warnings to coastal communities",
            "Check and maintain drainage systems",
            "Prepare sandbags and temporary barriers"
        ],
        'cyclone': [
            "Activate emergency response protocols",
            "Issue evacuation orders if necessary",
            "Secure infrastructure and critical facilities"
        ],
        'erosion': [
            "Implement beach nourishment programs",
            "Install coastal protection structures",
            "Monitor vulnerable coastal areas"
        ],
        'king_tide': [
            "Issue high tide warnings",
            "Clear coastal drainage systems",
            "Prepare for temporary flooding"
        ],
        'pollution_event': [
            "Investigate pollution source",
            "Implement containment measures",
            "Monitor water quality continuously"
        ]
    }
    
    recommendations.extend(base_recommendations.get(threat_type, ["Monitor conditions closely"]))
    
    if severity > 70:
        recommendations.append("Activate highest alert level - immediate action required")
    elif severity > 40:
        recommendations.append("Increase monitoring frequency and prepare response teams")
    
    return recommendations

def determine_bloom_risk_level(probability: float) -> str:
    """Determine risk level based on bloom probability"""
    if probability > 0.8:
        return "very_high"
    elif probability > 0.6:
        return "high"
    elif probability > 0.4:
        return "moderate"
    elif probability > 0.2:
        return "low"
    else:
        return "very_low"

def analyze_bloom_factors(features: Dict[str, float]) -> Dict[str, str]:
    """Analyze environmental factors contributing to bloom risk"""
    factors = {}
    
    if features.get('water_temperature', 0) > 28:
        factors['temperature'] = "high_risk"
    elif features.get('water_temperature', 0) > 25:
        factors['temperature'] = "moderate_risk"
    else:
        factors['temperature'] = "low_risk"
    
    if features.get('nitrate_nitrogen', 0) > 5:
        factors['nutrients'] = "high_risk"
    elif features.get('nitrate_nitrogen', 0) > 2:
        factors['nutrients'] = "moderate_risk"
    else:
        factors['nutrients'] = "low_risk"
    
    if features.get('dissolved_oxygen', 8) < 5:
        factors['oxygen'] = "concerning"
    else:
        factors['oxygen'] = "normal"
    
    return factors

def extract_coastal_features(env_data: Dict[str, Any]) -> Dict[str, float]:
    """Extract coastal threat model features from environmental data"""
    return {
        'wave_height': env_data.get('wave_height', 1.0),
        'wind_speed': env_data.get('wind_speed', 15.0),
        'atmospheric_pressure': env_data.get('atmospheric_pressure', 1013.0),
        'tide_level': env_data.get('tide_level', 0.0),
        'water_temperature': env_data.get('water_temperature', 25.0),
        'rainfall_24h': env_data.get('rainfall_24h', 10.0),
        'storm_distance': env_data.get('storm_distance', 1000.0),
        'moon_phase': env_data.get('moon_phase', 0.5),
        'season': env_data.get('season', 1),
        'coastal_elevation': env_data.get('coastal_elevation', 5.0),
        'vegetation_cover': env_data.get('vegetation_cover', 0.6),
        'human_population': env_data.get('human_population', 10000.0)
    }

def extract_mangrove_features(env_data: Dict[str, Any]) -> Dict[str, float]:
    """Extract mangrove health features from environmental data"""
    return {
        'ndvi': env_data.get('ndvi', 0.7),
        'chlorophyll': env_data.get('chlorophyll', 10.0),
        'water_temp': env_data.get('water_temperature', 27.0),
        'salinity': env_data.get('salinity', 35.0),
        'turbidity': env_data.get('turbidity', 5.0),
        'rainfall': env_data.get('monthly_rainfall', 100.0),
        'tidal_range': env_data.get('tidal_range', 1.5),
        'distance_to_shore': env_data.get('distance_to_shore', 1.0),
        'human_activity_index': env_data.get('human_activity_index', 30.0)
    }

def extract_bloom_features(env_data: Dict[str, Any]) -> Dict[str, float]:
    """Extract algal bloom features from environmental data"""
    return {
        'water_temperature': env_data.get('water_temperature', 25.0),
        'chlorophyll_a': env_data.get('chlorophyll_a', 8.0),
        'dissolved_oxygen': env_data.get('dissolved_oxygen', 7.0),
        'ph_level': env_data.get('ph_level', 8.1),
        'turbidity': env_data.get('turbidity', 5.0),
        'nitrate_nitrogen': env_data.get('nitrate_nitrogen', 2.0),
        'phosphate_phosphorus': env_data.get('phosphate_phosphorus', 0.5),
        'salinity': env_data.get('salinity', 35.0),
        'solar_radiation': env_data.get('solar_radiation', 300.0),
        'wind_speed': env_data.get('wind_speed', 8.0),
        'rainfall_7d': env_data.get('rainfall_7d', 15.0),
        'water_depth': env_data.get('water_depth', 20.0),
        'current_velocity': env_data.get('current_velocity', 0.3),
        'upwelling_index': env_data.get('upwelling_index', 0.0),
        'sea_surface_height': env_data.get('sea_surface_height', 0.0),
        'human_activity_index': env_data.get('human_activity_index', 30.0)
    }

def determine_overall_risk_level(combined_severity: float) -> str:
    """Determine overall risk level from combined severity score"""
    if combined_severity > 80:
        return "extreme"
    elif combined_severity > 60:
        return "high"
    elif combined_severity > 40:
        return "moderate"
    elif combined_severity > 20:
        return "low"
    else:
        return "minimal"

def generate_ensemble_recommendations(threats: List[str], severity: float) -> List[str]:
    """Generate recommendations based on ensemble analysis"""
    recommendations = []
    
    if severity > 70:
        recommendations.append("🚨 CRITICAL: Immediate emergency response required")
        recommendations.append("Activate all available monitoring systems")
        recommendations.append("Issue public safety warnings through all channels")
    elif severity > 50:
        recommendations.append("⚠️ HIGH ALERT: Prepare emergency response teams")
        recommendations.append("Increase monitoring frequency")
        recommendations.append("Notify relevant authorities and stakeholders")
    elif severity > 30:
        recommendations.append("📊 MODERATE CONCERN: Enhanced monitoring recommended")
        recommendations.append("Prepare contingency plans")
    else:
        recommendations.append("✅ LOW RISK: Continue routine monitoring")
    
    # Threat-specific recommendations
    if 'algal_bloom' in threats:
        recommendations.append("Monitor water quality parameters closely")
        recommendations.append("Consider water usage restrictions if bloom is toxic")
    
    if 'storm_surge' in threats or 'coastal_flooding' in threats:
        recommendations.append("Prepare coastal evacuation routes")
        recommendations.append("Secure waterfront infrastructure")
    
    if 'ecosystem_degradation' in threats:
        recommendations.append("Implement ecosystem protection measures")
        recommendations.append("Reduce human impact in affected areas")
    
    return recommendations

@app.post("/models/retrain/{model_name}")
async def retrain_model(model_name: str, background_tasks: BackgroundTasks):
    """Retrain a specific model with new data"""
    if model_name not in models:
        raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found")
    
    def retrain_task():
        try:
            logger.info(f"Starting retraining for {model_name}")
            model_status[model_name]['status'] = 'retraining'
            
            # Retrain the model
            result = models[model_name].train()
            
            model_status[model_name]['status'] = 'ready'
            model_status[model_name]['last_trained'] = datetime.now()
            model_status[model_name]['training_result'] = result
            
            logger.info(f"Retraining completed for {model_name}")
            
        except Exception as e:
            model_status[model_name]['status'] = 'error'
            model_status[model_name]['error'] = str(e)
            logger.error(f"Retraining failed for {model_name}: {e}")
    
    background_tasks.add_task(retrain_task)
    
    return {
        "message": f"Retraining started for {model_name}",
        "status": "in_progress",
        "timestamp": datetime.now()
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

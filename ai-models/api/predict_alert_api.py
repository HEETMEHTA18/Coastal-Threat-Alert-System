from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI()

# Load the trained model
model = joblib.load('alert_model.pkl')

# Define the input data model
class PredictionInput(BaseModel):
    water_level_m: float
    wind_speed_m_s: float
    air_pressure_hpa: float
    chlorophyll_mg_m3: float
    rainfall: float

class PredictionOutput(BaseModel):
    anomaly: int
    probability: float

@app.post("/predict_alert")
def predict_alert(data: PredictionInput):
    features = np.array([
        [
            data.water_level_m,
            data.wind_speed_m_s,
            data.air_pressure_hpa,
            data.chlorophyll_mg_m3,
            data.rainfall
        ]
    ])
    pred = model.predict(features)[0]
    prob = float(model.predict_proba(features)[0][int(pred)])
    # Always return alerts and features_used for frontend compatibility
    return {
        "anomaly": int(pred),
        "probability": prob,
        "alerts": [],
        "features_used": None
    }

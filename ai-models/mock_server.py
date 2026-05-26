#!/usr/bin/env python3
"""Lightweight CTAS AI mock server.

This avoids the large ML dependency install while still exposing the
routes the backend and frontend use during development.
"""

from __future__ import annotations

import json
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse


def now_iso() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def read_json(handler: BaseHTTPRequestHandler) -> dict:
    content_length = int(handler.headers.get("Content-Length", "0") or 0)
    if content_length <= 0:
        return {}
    raw = handler.rfile.read(content_length)
    if not raw:
        return {}
    try:
        payload = json.loads(raw.decode("utf-8"))
        return payload if isinstance(payload, dict) else {}
    except json.JSONDecodeError:
        return {}


class MockAIServer(BaseHTTPRequestHandler):
    server_version = "CTASMockAI/1.0"

    def log_message(self, format: str, *args) -> None:  # noqa: A003
        print(f"[{now_iso()}] {self.address_string()} - {format % args}")

    def _send_json(self, status_code: int, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(body)

    def _route_prediction(self, path: str, data: dict) -> tuple[int, dict]:
        if path == "/health":
            return 200, {
                "status": "ok",
                "service": "CTAS AI Mock",
                "timestamp": now_iso(),
                "routes": [
                    "/api/predict_alert",
                    "/api/forecast",
                    "/predict/coastal-threat",
                    "/predict/mangrove-health",
                    "/predict/algal-bloom",
                    "/predict/ensemble",
                    "/models/status",
                ],
            }

        if path == "/models/status":
            return 200, {
                "status": "success",
                "models": {
                    "coastal_threat": {"status": "ready", "version": "mock-1.0"},
                    "mangrove_health": {"status": "ready", "version": "mock-1.0"},
                    "algal_bloom": {"status": "ready", "version": "mock-1.0"},
                    "ensemble": {"status": "ready", "version": "mock-1.0"},
                },
                "timestamp": now_iso(),
            }

        if path in {"/api/predict_alert", "/predict_alert"}:
            water_level = float(data.get("water_level_m", data.get("water_level", 1.5) or 1.5))
            wind_speed = float(data.get("wind_speed_m_s", data.get("wind_speed", 10.0) or 10.0))
            pressure = float(data.get("air_pressure_hpa", data.get("pressure", 1013.0) or 1013.0))
            chlorophyll = float(data.get("chlorophyll_mg_m3", data.get("chlorophyll", 5.0) or 5.0))
            rainfall = float(data.get("rainfall", 0.0) or 0.0)

            score = 0.0
            score += clamp(water_level - 1.0, 0.0, 3.0) * 18.0
            score += clamp(wind_speed - 6.0, 0.0, 30.0) * 1.4
            score += clamp(1015.0 - pressure, 0.0, 40.0) * 1.1
            score += clamp(chlorophyll - 4.0, 0.0, 25.0) * 1.5
            score += clamp(rainfall, 0.0, 150.0) * 0.25
            probability = round(clamp(score / 100.0, 0.05, 0.98), 2)

            return 200, {
                "type": "prediction",
                "payload": {
                    "rain_predicted": probability >= 0.45,
                    "rain_probability": round(clamp(probability * 100.0, 0, 100), 1),
                    "temperature_predicted": round(22 + max(0.0, wind_speed - 8.0) * 0.3, 1),
                    "humidity_predicted": round(clamp(55 + rainfall * 0.5 + chlorophyll * 1.2, 0, 100), 1),
                    "water_level_predicted": round(water_level + probability * 0.8, 2),
                    "location": {
                        "latitude": data.get("latitude"),
                        "longitude": data.get("longitude"),
                    },
                },
                "anomaly": int(probability >= 0.55),
                "probability": probability,
                "alerts": ["Elevated coastal monitoring recommended"] if probability >= 0.55 else [],
                "features_used": {
                    "water_level_m": water_level,
                    "wind_speed_m_s": wind_speed,
                    "air_pressure_hpa": pressure,
                    "chlorophyll_mg_m3": chlorophyll,
                    "rainfall": rainfall,
                },
                "timestamp": now_iso(),
            }

        if path in {"/api/forecast", "/forecast"}:
            latitude = float(data.get("latitude", data.get("lat", 19.0760) or 19.0760))
            longitude = float(data.get("longitude", data.get("lon", 72.8777) or 72.8777))
            seed = abs(latitude) + abs(longitude)
            days = []
            for index in range(5):
                base_temp = 27 + ((seed + index) % 6) - 2
                precipitation = round(max(0.0, ((seed * 0.3) + index * 1.9) % 9.5), 1)
                wind = round(5 + ((seed + index * 2) % 8), 1)
                humidity = int(clamp(62 + precipitation * 4 + index * 3, 30, 98))
                condition = "Rain" if precipitation > 5 else ("Clouds" if precipitation > 2 else "Clear")
                days.append({
                    "date": (datetime.utcnow() + timedelta(days=index)).date().isoformat(),
                    "tempMin": round(base_temp - 2.5, 1),
                    "tempMax": round(base_temp + 2.8, 1),
                    "avgHumidity": humidity,
                    "maxWindSpeed": wind,
                    "precipitation": precipitation,
                    "mainCondition": condition,
                    "icon": "10d" if condition == "Rain" else ("03d" if condition == "Clouds" else "01d"),
                })
            return 200, days

        if path == "/predict/coastal-threat":
            wave_height = float(data.get("wave_height", 1.5) or 1.5)
            wind_speed = float(data.get("wind_speed", 15.0) or 15.0)
            rainfall = float(data.get("rainfall_24h", 10.0) or 10.0)
            storm_distance = float(data.get("storm_distance", 1000.0) or 1000.0)
            severity = clamp((wave_height * 10) + (wind_speed * 0.5) + (rainfall * 0.2) + max(0.0, 200.0 - min(storm_distance, 200.0)) * 0.15, 0.0, 100.0)
            risk = "low" if severity < 30 else "medium" if severity < 60 else "high"
            return 200, {
                "threat_type": "coastal_flooding",
                "severity_score": round(severity, 1),
                "confidence": round(clamp(0.58 + severity / 220.0, 0.5, 0.97), 2),
                "recommendations": [
                    "Monitor tide and wave conditions",
                    "Keep emergency evacuation routes clear",
                    "Review coastal barrier integrity",
                ],
                "risk_level": risk,
                "timestamp": now_iso(),
                "model_version": "mock-1.0",
            }

        if path == "/predict/mangrove-health":
            ndvi = float(data.get("ndvi", 0.7) or 0.7)
            human_activity = float(data.get("human_activity_index", 30.0) or 30.0)
            health_score = clamp((ndvi * 100.0) - (human_activity * 0.25), 0.0, 100.0)
            category = "healthy" if health_score >= 70 else "stressed" if health_score >= 40 else "critical"
            return 200, {
                "health_score": round(health_score, 1),
                "health_category": category,
                "is_anomaly": category != "healthy",
                "confidence": round(clamp(0.6 + health_score / 250.0, 0.5, 0.96), 2),
                "threats": [
                    {"type": "human_pressure", "severity": round(clamp(human_activity / 20.0, 0.0, 5.0), 1)},
                    {"type": "salinity_shift", "severity": 2.0},
                ],
                "timestamp": now_iso(),
            }

        if path == "/predict/algal-bloom":
            temperature = float(data.get("water_temperature", 25.0) or 25.0)
            chlorophyll = float(data.get("chlorophyll_a", 8.0) or 8.0)
            nitrate = float(data.get("nitrate_nitrogen", 2.0) or 2.0)
            phosphate = float(data.get("phosphate_phosphorus", 0.5) or 0.5)
            bloom_probability = clamp(((temperature - 20.0) * 0.03) + (chlorophyll * 0.02) + (nitrate * 0.03) + (phosphate * 0.05), 0.05, 0.98)
            risk_level = "low" if bloom_probability < 0.35 else "moderate" if bloom_probability < 0.65 else "high"
            return 200, {
                "bloom_type": "harmful_algal_bloom",
                "bloom_probability": round(bloom_probability, 2),
                "severity_score": round(bloom_probability * 100.0, 1),
                "risk_level": risk_level,
                "confidence": round(clamp(0.57 + bloom_probability / 2.0, 0.5, 0.97), 2),
                "environmental_factors": {
                    "water_temperature": str(temperature),
                    "chlorophyll_a": str(chlorophyll),
                    "nitrate_nitrogen": str(nitrate),
                    "phosphate_phosphorus": str(phosphate),
                },
                "timestamp": now_iso(),
            }

        if path == "/predict/ensemble":
            environmental = data.get("environmental_data", {}) if isinstance(data.get("environmental_data", {}), dict) else {}
            wave_height = float(environmental.get("wave_height", 1.5) or 1.5)
            wind_speed = float(environmental.get("wind_speed", 15.0) or 15.0)
            rainfall = float(environmental.get("rainfall_24h", 10.0) or 10.0)
            overall = clamp((wave_height * 10.0 + wind_speed * 0.6 + rainfall * 0.3) / 3.0, 0.0, 100.0)
            overall_level = "low" if overall < 30 else "medium" if overall < 60 else "high"
            return 200, {
                "overall_risk_level": overall_level,
                "individual_predictions": {
                    "coastal_threat": {"severity_score": round(overall, 1)},
                    "mangrove_health": {"health_score": round(clamp(100.0 - overall, 0.0, 100.0), 1)},
                    "algal_bloom": {"risk": "moderate" if rainfall > 5 else "low"},
                },
                "combined_severity": round(overall, 1),
                "priority_threats": ["coastal_flooding", "storm_surge"] if overall_level != "low" else ["routine_monitoring"],
                "recommendations": [
                    "Increase monitoring cadence",
                    "Check shoreline defenses",
                    "Notify community response teams",
                ],
                "timestamp": now_iso(),
            }

        return 404, {"error": f"Route {path} not found"}

    def do_OPTIONS(self) -> None:
        self._send_json(204, {})

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        status_code, payload = self._route_prediction(path, {})
        self._send_json(status_code, payload)

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        data = read_json(self)
        status_code, payload = self._route_prediction(path, data)
        self._send_json(status_code, payload)


def main() -> None:
    port = 8000
    server = ThreadingHTTPServer(("0.0.0.0", port), MockAIServer)
    print(f"CTAS mock AI server listening on http://0.0.0.0:{port}")
    print("Available routes: /health, /models/status, /api/predict_alert, /api/forecast, /predict/*")
    server.serve_forever()


if __name__ == "__main__":
    main()
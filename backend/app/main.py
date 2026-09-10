from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

from app.config import settings
from app.services.battery_sim import battery_service
from app.services.ai_forecaster import ai_forecaster
from app.services.optimizer import optimizer_service
from app.services.alert_engine import alert_engine
from app.db.database import Base, engine

# Initialize Database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Powered Energy Decision-Support API for Polar Research Stations"
)

# Enable CORS for Frontend UI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "ONLINE",
        "system": settings.STATION_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/v1/status")
def get_station_status(is_blizzard: bool = Query(False)):
    ambient_temp = -35.0 if is_blizzard else -24.2
    wind_speed = 30.0 if is_blizzard else 19.8
    irradiance = 0.0 if is_blizzard else 320.0

    current_demand = 365.0 if is_blizzard else 285.4
    solar_gen = 0.0 if is_blizzard else 42.1
    wind_gen = 142.0 if is_blizzard else 115.0

    bms = battery_service.get_status()
    if is_blizzard:
        bms["current_soc_pct"] = 24.0
        bms["available_energy_kwh"] = 120.0

    diesel_kw = max(0.0, current_demand - (solar_gen + wind_gen + 40.0 if is_blizzard else 120.0))

    return {
        "station": settings.STATION_NAME,
        "coordinates": {"lat": settings.LATITUDE, "lng": settings.LONGITUDE},
        "telemetry": {
            "ambient_temp_c": ambient_temp,
            "wind_speed_ms": wind_speed,
            "solar_irradiance_wm2": irradiance
        },
        "power": {
            "current_demand_kw": current_demand,
            "solar_generation_kw": solar_gen,
            "wind_generation_kw": wind_gen,
            "diesel_generation_kw": round(diesel_kw, 1),
            "renewable_fraction_pct": round(((solar_gen + wind_gen) / max(1.0, current_demand)) * 100.0, 1)
        },
        "battery": bms
    }

@app.get("/api/v1/forecast")
def get_24h_forecast(is_blizzard: bool = Query(False), ambient_temp: float = Query(-24.2)):
    horizon = ai_forecaster.predict_24h_horizon(
        ambient_temp_c=-35.0 if is_blizzard else ambient_temp,
        is_blizzard=is_blizzard
    )
    return {
        "generated_at": datetime.utcnow().isoformat(),
        "horizon_steps": 24,
        "forecast": horizon
    }

@app.post("/api/v1/dispatch/optimize")
def get_optimal_dispatch(is_blizzard: bool = Query(False), flexible_loads_enabled: bool = Query(True)):
    temp = -35.0 if is_blizzard else -24.2
    horizon = ai_forecaster.predict_24h_horizon(ambient_temp_c=temp, is_blizzard=is_blizzard)
    dispatch_plan = optimizer_service.optimize_dispatch(
        forecast_horizon=horizon,
        battery_sim=battery_service,
        flexible_load_enabled=flexible_loads_enabled
    )
    return dispatch_plan

@app.get("/api/v1/alerts")
def get_predictive_alerts(is_blizzard: bool = Query(False)):
    temp = -35.0 if is_blizzard else -24.2
    horizon = ai_forecaster.predict_24h_horizon(ambient_temp_c=temp, is_blizzard=is_blizzard)
    dispatch_plan = optimizer_service.optimize_dispatch(
        forecast_horizon=horizon,
        battery_sim=battery_service
    )
    alerts = alert_engine.analyze_forecast(
        horizon_dispatch=dispatch_plan["hourly_dispatch"],
        ambient_temp_c=temp,
        is_blizzard=is_blizzard
    )
    return alerts

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np

from ai_engine import PolarAIEngine
from optimizer import PolarMicrogridOptimizer
from alerts import PolarAlertEngine
from database import init_db, seed_db_from_csv, DB_PATH

app = FastAPI(
    title="POLAR-EMS API",
    description="Polar Energy Management System - Antarctic Microgrid AI Forecasting & Dispatch API",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI, Optimizer & Alert Engines
ai_engine = PolarAIEngine()
optimizer = PolarMicrogridOptimizer()
alert_engine = PolarAlertEngine()

@app.on_event("startup")
def startup_event():
    init_db()
    csv_p = os.path.join(os.path.dirname(__file__), "polar_energy_data.csv")
    if not os.path.exists(csv_p):
        print("Generating dataset on startup...")
        ai_engine.load_or_generate_data()
    seed_db_from_csv(csv_p)
    ai_engine.load_models_or_train()

class WeatherInput(BaseModel):
    temperature: float = -15.0
    wind_speed: float = 25.0
    solar_irradiance: float = 120.0
    station_activity: float = 75.0

class SimulateInput(BaseModel):
    scenario_name: str = "Polar Vortex"
    temperature: float = -32.0
    wind_speed: float = 45.0
    solar_irradiance: float = 0.0
    station_activity: float = 80.0
    battery_soc: float = 65.0
    flexible_loads_enabled: bool = True

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "POLAR-EMS Microgrid Control API",
        "station": "Antarctic Bharati/Maitri Research Simulator",
        "version": "1.0.0"
    }

@app.get("/api/status")
def get_current_status():
    df = ai_engine.load_or_generate_data()
    latest = df.iloc[-1].to_dict()
    
    recent_24 = df.iloc[-24:]
    daily_demand = float(recent_24['energy_demand'].sum())
    daily_solar = float(recent_24['solar_generation'].sum())
    daily_wind = float(recent_24['wind_generation'].sum())
    daily_diesel = float(recent_24['diesel_generation'].sum())
    daily_fuel = float(recent_24['fuel_consumption'].sum())
    
    renewable_pct = round((daily_solar + daily_wind) / max(1.0, daily_demand) * 100.0, 1)
    
    return {
        "timestamp": latest["timestamp"],
        "telemetry": {
            "temperature": latest["temperature"],
            "wind_speed": latest["wind_speed"],
            "solar_irradiance": latest["solar_irradiance"],
            "station_activity": latest["station_activity"],
            "energy_demand": latest["energy_demand"],
            "solar_generation": latest["solar_generation"],
            "wind_generation": latest["wind_generation"],
            "battery_level": latest["battery_level"],
            "diesel_generation": latest["diesel_generation"],
            "fuel_consumption": latest["fuel_consumption"]
        },
        "daily_summary": {
            "demand_kwh": round(daily_demand, 1),
            "solar_kwh": round(daily_solar, 1),
            "wind_kwh": round(daily_wind, 1),
            "diesel_kwh": round(daily_diesel, 1),
            "fuel_liters": round(daily_fuel, 1),
            "renewable_pct": min(100.0, renewable_pct)
        }
    }

@app.get("/api/history")
def get_history(hours: int = 48):
    df = ai_engine.load_or_generate_data()
    sample = df.tail(hours).copy()
    records = sample.to_dict(orient="records")
    return {"count": len(records), "data": records}

@app.get("/api/metrics")
def get_ai_metrics():
    if not ai_engine.metrics:
        ai_engine.train_models()
    return ai_engine.metrics

@app.post("/api/forecast")
def generate_forecast(weather: WeatherInput):
    predictions = ai_engine.predict_24h_horizon(weather.model_dump() if hasattr(weather, 'model_dump') else weather.dict())
    return {"predictions": predictions}

@app.post("/api/optimize")
def run_optimization(weather: WeatherInput, battery_soc: float = 75.0, flexible_loads: bool = True):
    weather_dict = weather.model_dump() if hasattr(weather, 'model_dump') else weather.dict()
    predictions = ai_engine.predict_24h_horizon(weather_dict)
    optimization_res = optimizer.optimize_24h_dispatch(
        predictions, 
        initial_battery_soc=battery_soc, 
        flexible_loads_enabled=flexible_loads
    )
    
    # Generate predictive risk alerts
    generated_alerts = alert_engine.generate_alerts(
        predictions, 
        optimization_res['schedule'], 
        weather_dict
    )
    
    return {
        "weather_input": weather_dict,
        "alerts": generated_alerts,
        "optimization": optimization_res
    }

@app.post("/api/simulate")
def simulate_extreme_weather(sim: SimulateInput):
    sim_dict = sim.model_dump() if hasattr(sim, 'model_dump') else sim.dict()
    weather_dict = {
        "temperature": sim.temperature,
        "wind_speed": sim.wind_speed,
        "solar_irradiance": sim.solar_irradiance,
        "station_activity": sim.station_activity
    }
    
    predictions = ai_engine.predict_24h_horizon(weather_dict)
    opt_res = optimizer.optimize_24h_dispatch(
        predictions, 
        initial_battery_soc=sim.battery_soc,
        flexible_loads_enabled=sim.flexible_loads_enabled
    )
    
    generated_alerts = alert_engine.generate_alerts(
        predictions, 
        opt_res['schedule'], 
        weather_dict
    )
    
    peak_demand = max(p['predicted_demand'] for p in predictions)
    total_renewable = sum(p['predicted_solar'] + p['predicted_wind'] for p in predictions)
    total_demand = sum(p['predicted_demand'] for p in predictions)
    deficit_kwh = max(0.0, total_demand - total_renewable)
    
    if sim.temperature < -30.0 or sim.wind_speed > 60.0 or deficit_kwh > 2000.0:
        alert_level = "CRITICAL_DEFICIT"
        alert_message = f"⚠️ CRITICAL ENERGY DEFICIT DETECTED ({sim.scenario_name}): Sub-zero heating spike ({sim.temperature}°C). Critical loads protected, flexible loads shifted, diesel back-up engaged."
    elif sim.temperature < -20.0 or deficit_kwh > 800.0:
        alert_level = "MODERATE_WARNING"
        alert_message = f"⚡ MODERATE LOAD WARNING ({sim.scenario_name}): Cold snap increased heating load. Battery & diesel storage compensating."
    else:
        alert_level = "NORMAL_OPERATING"
        alert_message = f"✅ STABLE POLAR MICROGRID OPERATION ({sim.scenario_name}): Renewables and battery operating smoothly."

    return {
        "scenario_name": sim.scenario_name,
        "alert_level": alert_level,
        "alert_message": alert_message,
        "alerts": generated_alerts,
        "parameters": sim_dict,
        "summary": {
            "peak_demand_kw": round(peak_demand, 1),
            "total_24h_demand_kwh": round(total_demand, 1),
            "total_24h_renewable_kwh": round(total_renewable, 1),
            "deficit_kwh": round(deficit_kwh, 1),
            "fuel_saved_liters": opt_res['summary']['fuel_saved_liters'],
            "co2_reduced_kg": opt_res['summary']['co2_reduced_kg'],
            "renewable_fraction_pct": opt_res['summary']['renewable_fraction_pct']
        },
        "forecast_schedule": opt_res['schedule']
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

import os
import pytest
import pandas as pd
from fastapi.testclient import TestClient

from generate_dataset import generate_polar_dataset
from ai_engine import PolarAIEngine
from optimizer import PolarMicrogridOptimizer
from database import init_db, seed_db_from_csv
from main import app

client = TestClient(app)

def test_dataset_generation(tmp_path):
    test_csv = tmp_path / "test_polar_data.csv"
    df = generate_polar_dataset(str(test_csv), days=7)
    assert len(df) == 168  # 7 days * 24 hours
    assert "temperature" in df.columns
    assert "energy_demand" in df.columns
    assert df["energy_demand"].isnull().sum() == 0

def test_ai_engine():
    ai = PolarAIEngine()
    ai.load_models_or_train()
    fc = ai.predict_24h_horizon({"temperature": -20, "wind_speed": 30, "solar_irradiance": 100})
    assert len(fc) == 24
    assert fc[0]["predicted_demand"] > 0

def test_optimizer():
    opt = PolarMicrogridOptimizer()
    mock_forecast = [
        {"hour": h, "predicted_demand": 150.0, "predicted_solar": 40.0, "predicted_wind": 50.0}
        for h in range(24)
    ]
    res = opt.optimize_24h_dispatch(mock_forecast, initial_battery_soc=75.0)
    assert len(res["schedule"]) == 24
    assert res["summary"]["fuel_saved_liters"] >= 0.0

def test_fastapi_endpoints():
    r_root = client.get("/")
    assert r_root.status_code == 200
    assert r_root.json()["status"] == "online"

    r_status = client.get("/api/status")
    assert r_status.status_code == 200
    assert "telemetry" in r_status.json()

    r_sim = client.post("/api/simulate", json={
        "scenario_name": "Polar Vortex Test",
        "temperature": -35.0,
        "wind_speed": 40.0,
        "solar_irradiance": 0.0,
        "station_activity": 80.0,
        "battery_soc": 65.0,
        "flexible_loads_enabled": True
    })
    assert r_sim.status_code == 200
    res_json = r_sim.json()
    assert res_json["alert_level"] == "CRITICAL_DEFICIT"
    assert len(res_json["forecast_schedule"]) == 24

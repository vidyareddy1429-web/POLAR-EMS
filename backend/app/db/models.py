from sqlalchemy import Column, Integer, Float, String, DateTime, Boolean
from datetime import datetime
from app.db.database import Base

class SensorReadingDB(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    temp_c = Column(Float, nullable=False)
    wind_speed_ms = Column(Float, nullable=False)
    solar_irradiance_wm2 = Column(Float, nullable=False)
    actual_load_kw = Column(Float, nullable=False)
    is_valid = Column(Boolean, default=True)

class BatteryStateDB(Base):
    __tablename__ = "battery_states"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    capacity_kwh = Column(Float, default=500.0)
    current_soc_pct = Column(Float, nullable=False)
    available_energy_kwh = Column(Float, nullable=False)
    health_status = Column(String, default="HEALTHY")

class DispatchPlanDB(Base):
    __tablename__ = "dispatch_plans"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    horizon_hour = Column(Integer, nullable=False)
    solar_used_kw = Column(Float, nullable=False)
    wind_used_kw = Column(Float, nullable=False)
    battery_discharge_kw = Column(Float, nullable=False)
    diesel_gen_kw = Column(Float, nullable=False)

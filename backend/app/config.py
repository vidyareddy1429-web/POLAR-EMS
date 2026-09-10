import os

class Settings:
    PROJECT_NAME: str = "POLAR-EMS Backend API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Station Identity & Coordinates
    STATION_NAME: str = "Antarctic Research Station Bharati"
    LATITUDE: float = -70.75
    LONGITUDE: float = 11.7333

    # Battery Physics Constants
    BATTERY_CAPACITY_KWH: float = 500.0
    BATTERY_INITIAL_SOC_PCT: float = 70.0
    BATTERY_MIN_RESERVE_PCT: float = 20.0
    BATTERY_MAX_POWER_KW: float = 150.0
    BATTERY_EFFICIENCY_CHARGE: float = 0.95
    BATTERY_EFFICIENCY_DISCHARGE: float = 0.95

    # Fuel & Generator Settings
    DIESEL_MAX_POWER_KW: float = 350.0
    DIESEL_MIN_STABLE_KW: float = 30.0
    DIESEL_FUEL_CONSUMPTION_L_PER_KWH: float = 0.25

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./polar_ems.db")

settings = Settings()

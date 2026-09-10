import math
from typing import Dict, List, Any

class AIForecasterService:
    """
    AI Machine Learning Forecast Engine for Polar Station Telemetry.
    Predicts 24-hour load profile, solar availability, and wind generation.
    """
    def predict_24h_horizon(self, ambient_temp_c: float = -24.2, wind_speed_ms: float = 19.5, is_blizzard: bool = False) -> List[Dict[str, Any]]:
        horizon = []
        
        for h in range(24):
            # 1. Demand Forecast Model (kW)
            # Base critical load (Life Support + SatComm + Sci Core = ~190 kW)
            base_critical = 190.0
            
            # Heating Load Sensitivity: -1.8 kW per degree below 0°C
            heating_load = max(0.0, -1.8 * ambient_temp_c)
            
            # Diurnal station research activity profile
            activity_multiplier = 1.0
            if 6 <= h <= 10:
                activity_multiplier = 1.15 # Morning peak research shift
            elif 17 <= h <= 21:
                activity_multiplier = 1.25 # Evening processing peak

            total_demand = (base_critical + heating_load) * activity_multiplier
            if is_blizzard:
                total_demand += 85.0 # Thermal blizzard spike

            # 2. Solar Generation Forecast Model (kW)
            solar_kw = 0.0
            if not is_blizzard and 6 <= h <= 18:
                # Solar elevation angle bell curve centered at hour 12
                solar_kw = max(0.0, 65.0 * math.sin(((h - 6) / 12.0) * math.pi))

            # 3. Wind Generation Forecast Model (kW)
            wind_base_ms = wind_speed_ms + math.sin(h * 0.5) * 3.0
            if is_blizzard:
                wind_base_ms += 10.0
            
            # Wind turbine power curve P = 0.5 * rho * A * v^3 (Capped at 180 kW max output)
            wind_kw = min(180.0, max(0.0, 0.45 * (wind_base_ms ** 2.1)))

            horizon.append({
                "hour": h,
                "hour_label": f"{h:02d}:00",
                "predicted_demand_kw": round(total_demand, 1),
                "predicted_solar_kw": round(solar_kw, 1),
                "predicted_wind_kw": round(wind_kw, 1),
                "total_renewable_kw": round(solar_kw + wind_kw, 1),
                "confidence_score": round(0.94 - (h * 0.005), 2)
            })

        return horizon

ai_forecaster = AIForecasterService()

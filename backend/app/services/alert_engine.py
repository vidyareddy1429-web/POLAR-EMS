from typing import Dict, List, Any

class AlertEngineService:
    """
    Predictive Alert & Causal Explanation Engine.
    Detects power deficits before they manifest and generates human-readable root causes.
    """
    def analyze_forecast(self, 
                         horizon_dispatch: List[Dict[str, Any]], 
                         ambient_temp_c: float, 
                         is_blizzard: bool) -> Dict[str, Any]:
        
        # Scan horizon for maximum diesel backup dispatch / deficit point
        peak_deficit_hour = max(horizon_dispatch, key=lambda x: x["diesel_gen_kw"])
        max_diesel_kw = peak_deficit_hour["diesel_gen_kw"]

        if max_diesel_kw == 0.0:
            return {
                "alert_triggered": False,
                "status": "NOMINAL",
                "severity": "LOW",
                "title": "100% Clean Energy Dispatch Available",
                "message": "Renewable generation and battery reserves fully satisfy 24h station demand."
            }

        shortage_h = peak_deficit_hour["hour_label"]
        demand_at_peak = peak_deficit_hour["demand_kw"]
        soc_at_peak = peak_deficit_hour["simulated_soc_after_pct"]

        causal_chain = [
            f"Ambient temperature forecast is {ambient_temp_c}°C -> Heating load elevated",
            f"Peak demand reaches {demand_at_peak} kW at horizon step {shortage_h}",
            f"Solar irradiance drops to {peak_deficit_hour['solar_used_kw']} kW",
            f"Battery reaches minimum reserve limit ({soc_at_peak}% SOC) -> Max safe discharge capped"
        ]

        if is_blizzard:
            causal_chain.insert(0, "CRITICAL: Severe polar blizzard active (-35°C ambient)")

        recommended_actions = [
            f"Dispatch Diesel Generator #1 at {max_diesel_kw} kW from {shortage_h}",
            "Maintain 100% uninterrupted power to Tier 1 Critical Life Support & SatComm",
            "Optional: Defer Tier 2 EV Snowmobile Charging to save ~12.4 L fuel"
        ]

        return {
            "alert_triggered": True,
            "alert_id": f"ALT-POLAR-{shortage_h.replace(':', '')}",
            "severity": "CRITICAL" if is_blizzard or max_diesel_kw > 150.0 else "WARNING",
            "title": f"🔴 {max_diesel_kw:.1f} kW Power Shortage Predicted at {shortage_h}",
            "shortage_hour": shortage_h,
            "predicted_deficit_kw": max_diesel_kw,
            "causal_chain": causal_chain,
            "recommended_actions": recommended_actions
        }

alert_engine = AlertEngineService()

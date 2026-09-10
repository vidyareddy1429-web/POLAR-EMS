import numpy as np

class PolarMicrogridOptimizer:
    def __init__(self, battery_capacity_kwh=400.0, min_soc=20.0, max_soc=95.0):
        self.battery_capacity = battery_capacity_kwh
        self.min_soc = min_soc
        self.max_soc = max_soc
        self.max_charge_rate_kw = 80.0
        self.max_discharge_rate_kw = 100.0
        self.battery_efficiency = 0.92  # 92% roundtrip efficiency
        
    def optimize_24h_dispatch(self, forecast_records, initial_battery_soc=75.0, flexible_loads_enabled=True):
        """
        Calculates optimal 24-hour dispatch schedule given predicted demand and renewable generation.
        Separates Critical vs Flexible loads and minimizes diesel generator fuel consumption.
        """
        dispatch_schedule = []
        current_soc = initial_battery_soc
        total_diesel_liters_optimized = 0.0
        total_diesel_liters_unoptimized = 0.0
        
        for item in forecast_records:
            hour = item['hour']
            demand = item['predicted_demand']
            solar = item['predicted_solar']
            wind = item['predicted_wind']
            
            critical_demand = demand * 0.65  # 65% critical loads (must power)
            flexible_demand = demand * 0.35  # 35% flexible loads (shiftable)
            
            # Step 1: Available renewables
            renewables_total = solar + wind
            net_deficit = demand - renewables_total
            
            battery_flow_kw = 0.0
            diesel_kw = 0.0
            flexible_shed_kw = 0.0
            status_flag = "OPTIMAL_RENEWABLE"
            
            if net_deficit < 0:
                # Excess renewable energy -> Charge Battery
                excess = abs(net_deficit)
                charge_kw = min(excess, self.max_charge_rate_kw)
                
                # Check battery SOC headroom
                headroom_kwh = (self.max_soc - current_soc) / 100.0 * self.battery_capacity
                actual_charge_kw = min(charge_kw, headroom_kwh / (self.battery_efficiency))
                
                soc_increase = (actual_charge_kw * self.battery_efficiency / self.battery_capacity) * 100.0
                current_soc = min(self.max_soc, current_soc + soc_increase)
                battery_flow_kw = -actual_charge_kw  # Negative = Charging
                status_flag = "CHARGING_BATTERY"
                
            else:
                # Deficit -> Discharge Battery first
                available_battery_kwh = max(0.0, (current_soc - self.min_soc) / 100.0 * self.battery_capacity)
                max_discharge_allowed = available_battery_kwh * self.battery_efficiency
                
                discharge_kw = min(net_deficit, self.max_discharge_rate_kw, max_discharge_allowed)
                soc_decrease = (discharge_kw / self.battery_efficiency / self.battery_capacity) * 100.0
                current_soc = max(self.min_soc, current_soc - soc_decrease)
                battery_flow_kw = discharge_kw
                
                remaining_deficit = net_deficit - discharge_kw
                
                if remaining_deficit > 0:
                    # If high deficit and flexible load management is enabled, shift flexible loads
                    if flexible_loads_enabled and remaining_deficit > 50.0:
                        flexible_shed_kw = min(flexible_demand, remaining_deficit * 0.4)
                        remaining_deficit -= flexible_shed_kw
                        status_flag = "LOAD_SHIFTING_ACTIVE"
                    else:
                        status_flag = "DIESEL_GENERATION_ACTIVE"
                        
                    diesel_kw = round(remaining_deficit, 2)
            
            # Unoptimized comparison baseline (No battery management, runs diesel whenever renewables < demand)
            unopt_diesel = max(0.0, demand - renewables_total)
            unopt_fuel = 4.0 + (unopt_diesel * 0.255) if unopt_diesel > 0 else 0.0
            
            # Optimized fuel calculation
            opt_fuel = 4.0 + (diesel_kw * 0.255) if diesel_kw > 0 else 0.0
            
            total_diesel_liters_optimized += opt_fuel
            total_diesel_liters_unoptimized += unopt_fuel
            
            dispatch_schedule.append({
                "hour": hour,
                "demand": demand,
                "critical_demand": round(critical_demand, 1),
                "flexible_demand": round(flexible_demand, 1),
                "solar": solar,
                "wind": wind,
                "total_renewable": round(renewables_total, 1),
                "battery_flow_kw": round(battery_flow_kw, 1),
                "battery_soc_pct": round(current_soc, 1),
                "diesel_kw": diesel_kw,
                "flexible_shed_kw": round(flexible_shed_kw, 1),
                "fuel_liters_h": round(opt_fuel, 2),
                "status": status_flag
            })
            
        fuel_saved_liters = round(max(0.0, total_diesel_liters_unoptimized - total_diesel_liters_optimized), 1)
        co2_reduced_kg = round(fuel_saved_liters * 2.68, 1)  # ~2.68 kg CO2 per liter diesel
        renewable_fraction_pct = round(
            sum(item['total_renewable'] for item in dispatch_schedule) /
            max(1.0, sum(item['demand'] for item in dispatch_schedule)) * 100.0, 1
        )
        
        return {
            "schedule": dispatch_schedule,
            "summary": {
                "total_optimized_fuel_liters": round(total_diesel_liters_optimized, 1),
                "total_unoptimized_fuel_liters": round(total_diesel_liters_unoptimized, 1),
                "fuel_saved_liters": fuel_saved_liters,
                "co2_reduced_kg": co2_reduced_kg,
                "renewable_fraction_pct": renewable_fraction_pct,
                "ending_battery_soc": round(current_soc, 1)
            }
        }

if __name__ == "__main__":
    from ai_engine import PolarAIEngine
    ai = PolarAIEngine()
    forecasts = ai.predict_24h_horizon({"temperature": -25, "wind_speed": 20, "solar_irradiance": 0})
    opt = PolarMicrogridOptimizer()
    res = opt.optimize_24h_dispatch(forecasts)
    print("Optimizer Fuel Saved:", res['summary']['fuel_saved_liters'], "Liters")

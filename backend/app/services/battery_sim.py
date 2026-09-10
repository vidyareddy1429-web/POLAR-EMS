from app.config import settings

class BatterySimulatorService:
    """
    Deterministic Battery Management System (BMS) Simulator.
    Calculates state-of-charge (SOC) evolution, available energy, and charge/discharge constraints.
    """
    def __init__(self, 
                 capacity_kwh: float = settings.BATTERY_CAPACITY_KWH, 
                 initial_soc_pct: float = settings.BATTERY_INITIAL_SOC_PCT, 
                 min_reserve_pct: float = settings.BATTERY_MIN_RESERVE_PCT):
        self.capacity = capacity_kwh
        self.soc = initial_soc_pct
        self.min_reserve = min_reserve_pct
        self.max_power_kw = settings.BATTERY_MAX_POWER_KW
        self.eta_charge = settings.BATTERY_EFFICIENCY_CHARGE
        self.eta_discharge = settings.BATTERY_EFFICIENCY_DISCHARGE

    def get_status(self) -> dict:
        available_kwh = max(0.0, (self.soc / 100.0) * self.capacity)
        usable_kwh = max(0.0, ((self.soc - self.min_reserve) / 100.0) * self.capacity)
        
        health = "HEALTHY"
        if self.soc < self.min_reserve:
            health = "CRITICAL"
        elif self.soc < self.min_reserve + 10.0:
            health = "WARNING"

        return {
            "capacity_kwh": self.capacity,
            "current_soc_pct": round(self.soc, 1),
            "available_energy_kwh": round(available_kwh, 1),
            "usable_reserve_kwh": round(usable_kwh, 1),
            "max_charge_power_kw": self.max_power_kw,
            "max_discharge_power_kw": self.max_power_kw,
            "min_reserve_threshold_pct": self.min_reserve,
            "health_status": health
        }

    def step(self, net_power_kw: float, dt_hours: float = 1.0) -> dict:
        """
        Executes a 1-step deterministic battery update.
        net_power_kw > 0 => Surplus energy available to CHARGE battery
        net_power_kw < 0 => Deficit energy required to DISCHARGE battery
        """
        actual_charge_kw = 0.0
        actual_discharge_kw = 0.0

        if net_power_kw > 0:
            # Charging Mode
            requested_charge = min(net_power_kw, self.max_power_kw)
            headroom_kwh = max(0.0, (100.0 - self.soc) / 100.0 * self.capacity)
            max_possible_charge_kwh = headroom_kwh / self.eta_charge
            
            actual_charge_kwh = min(requested_charge * dt_hours, max_possible_charge_kwh)
            actual_charge_kw = actual_charge_kwh / dt_hours
            
            energy_stored = actual_charge_kwh * self.eta_charge
            self.soc = min(100.0, self.soc + (energy_stored / self.capacity) * 100.0)
        
        elif net_power_kw < 0:
            # Discharging Mode
            requested_discharge = min(abs(net_power_kw), self.max_power_kw)
            usable_reserve_kwh = max(0.0, (self.soc - self.min_reserve) / 100.0 * self.capacity)
            max_possible_draw_kwh = usable_reserve_kwh * self.eta_discharge

            actual_draw_kwh = min(requested_discharge * dt_hours, max_possible_draw_kwh)
            actual_discharge_kw = actual_draw_kwh / dt_hours

            energy_drawn_from_cell = actual_draw_kwh / self.eta_discharge
            self.soc = max(self.min_reserve, self.soc - (energy_drawn_from_cell / self.capacity) * 100.0)

        return {
            "battery_soc_after_pct": round(self.soc, 1),
            "actual_charge_kw": round(actual_charge_kw, 1),
            "actual_discharge_kw": round(actual_discharge_kw, 1)
        }

# Global Instance
battery_service = BatterySimulatorService()

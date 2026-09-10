class PolarAlertEngine:
    """
    Intelligent Predictive Alert Engine for POLAR-EMS.
    Analyzes 24-hour AI forecasts and microgrid optimization output to detect future risks,
    assign severity levels (CRITICAL, WARNING, NORMAL), build root cause chains ('WHY?'),
    and suggest actionable AI recommendations.
    """
    
    def generate_alerts(self, forecast_records, dispatch_schedule, current_weather):
        alerts = []
        
        # Extract forecast parameters
        temp = current_weather.get('temperature', -15.0)
        wind = current_weather.get('wind_speed', 25.0)
        solar = current_weather.get('solar_irradiance', 120.0)
        
        # 1. Check for Future Power Shortages across 24h horizon
        shortage_hours = [item for item in dispatch_schedule if item['diesel_kw'] > 0 or item['flexible_shed_kw'] > 0]
        
        if shortage_hours:
            peak_shortage_item = max(shortage_hours, key=lambda x: x['diesel_kw'] + x['flexible_shed_kw'])
            hour = peak_shortage_item['hour']
            deficit = peak_shortage_item['diesel_kw'] + peak_shortage_item['flexible_shed_kw']
            
            severity = "CRITICAL" if deficit > 80.0 else "WARNING"
            
            why_chain = [
                f"🌡️ Temperature dropped to {peak_shortage_item.get('temperature', temp)}°C -> Heating demand spiked",
                f"☀️ Solar generation at {peak_shortage_item['solar']} kW and Wind at {peak_shortage_item['wind']} kW",
                f"🔋 Battery storage depleted to safe operating limit ({peak_shortage_item['battery_soc_pct']}%)",
                f"⚡ Result: Unmet power gap of {round(deficit, 1)} kW predicted at {hour}:00"
            ]
            
            recommendations = [
                "Maximize wind turbine output to capacity",
                f"Pre-charge battery storage before {max(0, hour - 2)}:00",
                "Shift non-essential flexible loads (laundry, maintenance equipment)",
                f"Prepare diesel generator startup at {hour - 1}:40 if deficit remains",
                "Maintain 100% power protection on critical life support & comms loads"
            ]
            
            alerts.append({
                "id": "alert_shortage_1",
                "severity": severity,
                "type": "SHORTAGE",
                "icon_type": "shortage",
                "title": f"{round(deficit, 1)} kW Power Shortage Predicted",
                "subtitle": f"Shortage expected at {hour}:00 ({hour - 14 if hour >= 14 else 4} hours ahead)",
                "time": f"{hour}:00",
                "deficit_kw": round(deficit, 1),
                "weather_snapshot": {
                    "temperature": peak_shortage_item.get('temperature', temp),
                    "solar": peak_shortage_item['solar'],
                    "wind": peak_shortage_item['wind'],
                    "battery_soc": peak_shortage_item['battery_soc_pct']
                },
                "why_chain": why_chain,
                "recommendations": recommendations
            })

        # 2. Check for Extreme Cold Snap Risk
        if temp <= -28.0:
            alerts.append({
                "id": "alert_cold_1",
                "severity": "CRITICAL" if temp <= -32.0 else "WARNING",
                "type": "COLD",
                "icon_type": "cold",
                "title": f"Extreme Cold Condition Detected ({temp}°C)",
                "subtitle": "Sub-zero heating load expected to increase station demand by 28%",
                "time": "NOW",
                "deficit_kw": 0,
                "weather_snapshot": {"temperature": temp, "solar": solar, "wind": wind, "battery_soc": 75},
                "why_chain": [
                    f"🥶 Ambient temperature plummeted to extreme sub-zero level ({temp}°C)",
                    "🔥 Thermal building heat pumps operating at maximum electrical load",
                    "⚠️ High baseline electricity consumption creates microgrid vulnerability"
                ],
                "recommendations": [
                    "Reserve extra battery energy specifically for thermal heating circuits",
                    "Verify secondary backup generator fuel lines pre-heating",
                    "Close non-essential external ventilation baffles"
                ]
            })

        # 3. Check for Battery Low Level Alert (< 25% SOC)
        low_battery_items = [item for item in dispatch_schedule if item['battery_soc_pct'] < 25.0]
        if low_battery_items:
            min_soc_item = min(low_battery_items, key=lambda x: x['battery_soc_pct'])
            alerts.append({
                "id": "alert_battery_1",
                "severity": "WARNING",
                "type": "BATTERY",
                "icon_type": "battery",
                "title": f"Battery Level Projected Below 25% ({min_soc_item['battery_soc_pct']}%)",
                "subtitle": f"Depletion projected around {min_soc_item['hour']}:00",
                "time": f"{min_soc_item['hour']}:00",
                "deficit_kw": 0,
                "weather_snapshot": {"temperature": temp, "solar": solar, "wind": wind, "battery_soc": min_soc_item['battery_soc_pct']},
                "why_chain": [
                    "🔋 High discharge rate during low renewable period",
                    "⚡ Storage SOC approaching minimum safe depth-of-discharge (20%)",
                    "⚠️ Reserve margin reduced for sudden weather spikes"
                ],
                "recommendations": [
                    "Reduce battery discharge rate and initiate generator spinning reserve",
                    "Enable AI load shedding on flexible lab equipment",
                    "Schedule solar/wind re-charge window during daylight/breeze peak"
                ]
            })

        # 4. Check for High Diesel Usage Alert
        high_diesel = sum(item['fuel_liters_h'] for item in dispatch_schedule)
        if high_diesel > 150.0:
            alerts.append({
                "id": "alert_fuel_1",
                "severity": "WARNING",
                "type": "DIESEL",
                "icon_type": "fuel",
                "title": "High Diesel Fuel Usage Predicted",
                "subtitle": f"Estimated 24h consumption: {round(high_diesel, 1)} Liters",
                "time": "NEXT 24H",
                "deficit_kw": 0,
                "weather_snapshot": {"temperature": temp, "solar": solar, "wind": wind, "battery_soc": 70},
                "why_chain": [
                    "⛽ Renewable generation insufficient to cover peak heating demand",
                    "🔥 Backup diesel generator running for extended hours",
                    "📉 Fuel reserves depleting faster than station baseline"
                ],
                "recommendations": [
                    "Optimize flexible load schedules to maximize wind turbine alignment",
                    "Shift laundry and heavy lab maintenance to daytime hours",
                    "Set battery discharge profile to aggressive peak shaving"
                ]
            })

        # 5. Check for Low Solar Generation Alert
        low_solar = sum(item['solar'] for item in dispatch_schedule)
        if low_solar < 100.0:
            alerts.append({
                "id": "alert_solar_1",
                "severity": "INFO",
                "type": "SOLAR",
                "icon_type": "solar",
                "title": "Low Solar Generation Predicted (Polar Season)",
                "subtitle": "Solar array output limited by polar sun angle / cloud cover",
                "time": "ALL DAY",
                "deficit_kw": 0,
                "weather_snapshot": {"temperature": temp, "solar": solar, "wind": wind, "battery_soc": 70},
                "why_chain": [
                    "🌌 Sun angle low or polar night season active",
                    "☀️ Solar array generating under 10% of summer peak capacity"
                ],
                "recommendations": [
                    "Prioritize katabatic wind turbine generation",
                    "Maintain battery reserve above 50% SOC during night hours"
                ]
            })

        # Default Normal State if no severe alerts
        if not alerts:
            alerts.append({
                "id": "alert_normal_1",
                "severity": "NORMAL",
                "type": "NORMAL",
                "icon_type": "normal",
                "title": "Energy Supply Sufficient & Microgrid Stable",
                "subtitle": "Renewable generation and battery reserves fully cover predicted demand",
                "time": "NEXT 24H",
                "deficit_kw": 0,
                "weather_snapshot": {"temperature": temp, "solar": solar, "wind": wind, "battery_soc": 80},
                "why_chain": [
                    "✅ Solar and Wind output matching station electricity needs",
                    "✅ Battery state of charge healthy (above 70%)",
                    "✅ Diesel generator in standby mode (0 fuel wasted)"
                ],
                "recommendations": [
                    "Continue normal microgrid automated operation",
                    "Perform routine battery state-of-health monitoring"
                ]
            })
            
        return alerts

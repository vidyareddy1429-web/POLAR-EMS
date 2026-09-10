import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StatCards from './components/StatCards';
import AlertCenter from './components/AlertCenter';
import ForecastChart from './components/ForecastChart';
import ExtremeWeatherSimulator from './components/ExtremeWeatherSimulator';
import LoadManagementPanel from './components/LoadManagementPanel';
import AIMetricsModal from './components/AIMetricsModal';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export default function App() {
  const [status, setStatus] = useState(null);
  const [optimizationData, setOptimizationData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [aiMetrics, setAiMetrics] = useState(null);
  const [isMetricsOpen, setIsMetricsOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationAlert, setSimulationAlert] = useState(null);
  const [flexibleLoadsEnabled, setFlexibleLoadsEnabled] = useState(true);

  // Fetch initial telemetry and forecast from backend
  const fetchDashboardData = async () => {
    try {
      // Fetch status
      const resStatus = await fetch(`${API_BASE}/api/status`);
      if (resStatus.ok) {
        const dataStatus = await resStatus.json();
        setStatus(dataStatus);
      }

      // Fetch initial optimization & alerts
      const resOpt = await fetch(`${API_BASE}/api/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weather: { temperature: -18, wind_speed: 32, solar_irradiance: 120, station_activity: 75 },
          battery_soc: 75,
          flexible_loads: flexibleLoadsEnabled
        })
      });
      if (resOpt.ok) {
        const dataOpt = await resOpt.json();
        setOptimizationData(dataOpt.optimization);
        if (dataOpt.alerts) {
          setAlerts(dataOpt.alerts);
        }
      }

      // Fetch AI metrics
      const resMetrics = await fetch(`${API_BASE}/api/metrics`);
      if (resMetrics.ok) {
        const dataMetrics = await resMetrics.json();
        setAiMetrics(dataMetrics);
      }
    } catch (err) {
      console.warn('FastAPI backend connecting or offline, loading client fallback data.', err);
      loadFallbackData();
    }
  };

  const loadFallbackData = () => {
    setStatus({
      timestamp: '2026-09-01 14:00',
      telemetry: {
        temperature: -18.5,
        wind_speed: 32.0,
        solar_irradiance: 140.0,
        station_activity: 80.0,
        energy_demand: 142.5,
        solar_generation: 48.0,
        wind_generation: 64.2,
        battery_level: 76.5,
        diesel_generation: 30.3,
        fuel_consumption: 11.7
      },
      daily_summary: {
        demand_kwh: 3420.0,
        solar_kwh: 1150.0,
        wind_kwh: 1540.0,
        diesel_kwh: 730.0,
        fuel_liters: 186.0,
        renewable_pct: 78.6
      }
    });

    const mockSchedule = Array.from({ length: 24 }, (_, i) => {
      const demand = 110 + Math.sin(i / 3) * 35 + (i > 8 && i < 19 ? 25 : 0);
      const solar = Math.max(0, Math.sin((i - 6) / 12 * Math.PI) * 55);
      const wind = 40 + Math.cos(i / 4) * 15;
      const totalRenew = solar + wind;
      const net = demand - totalRenew;
      const diesel = net > 20 ? net - 20 : 0;
      return {
        hour: i,
        demand: roundVal(demand),
        critical_demand: roundVal(demand * 0.65),
        flexible_demand: roundVal(demand * 0.35),
        solar: roundVal(solar),
        wind: roundVal(wind),
        total_renewable: roundVal(totalRenew),
        battery_flow_kw: net > 0 ? 20 : -15,
        battery_soc_pct: 75,
        diesel_kw: roundVal(diesel),
        flexible_shed_kw: 0,
        fuel_liters_h: roundVal(diesel > 0 ? 4 + diesel * 0.255 : 0),
        status: diesel > 0 ? 'DIESEL_GENERATION_ACTIVE' : 'OPTIMAL_RENEWABLE'
      };
    });

    setOptimizationData({
      schedule: mockSchedule,
      summary: {
        total_optimized_fuel_liters: 142.0,
        total_unoptimized_fuel_liters: 218.0,
        fuel_saved_liters: 76.0,
        co2_reduced_kg: 203.7,
        renewable_fraction_pct: 78.6,
        ending_battery_soc: 72.0
      }
    });

    setAlerts([
      {
        id: 'alert_shortage_1',
        severity: 'CRITICAL',
        type: 'SHORTAGE',
        title: '80 kW Power Shortage Predicted',
        subtitle: 'Deficit expected at 18:00 (In 4 hours)',
        time: '18:00',
        deficit_kw: 80.0,
        weather_snapshot: { temperature: -28, solar: 20, wind: 100, battery_soc: 65 },
        why_chain: [
          '🌡️ Temperature dropped to -28°C -> Heating demand increased',
          '☀️ Solar generation decreased to 20 kW',
          '🔋 Battery projected to reach 65% discharge threshold',
          '⚡ 80 kW shortage predicted at 18:00'
        ],
        recommendations: [
          'Maximize wind turbine generation',
          'Discharge battery storage',
          'Shift flexible research/laundry loads',
          'Start diesel generator at 17:40 if deficit remains'
        ]
      },
      {
        id: 'alert_battery_1',
        severity: 'WARNING',
        type: 'BATTERY',
        title: 'Battery Level Projected Below 25%',
        subtitle: 'Depletion projected around 20:00',
        time: '20:00',
        deficit_kw: 0,
        weather_snapshot: { temperature: -28, solar: 0, wind: 60, battery_soc: 24 },
        why_chain: [
          '🔋 High battery discharge rate during low solar hours',
          '⚡ Storage approaching minimum safe operating depth (20%)'
        ],
        recommendations: [
          'Reduce battery discharge rate and prepare diesel spinning reserve',
          'Enable AI load shedding on flexible research loads'
        ]
      }
    ]);

    setAiMetrics({
      demand: { mae: 4.12, rmse: 5.68, r2: 0.9842 },
      solar: { mae: 2.15 },
      wind: { mae: 3.45 },
      feature_importance: {
        temperature: 0.4215,
        lag_demand_1h: 0.2850,
        station_activity: 0.1420,
        hour: 0.0810,
        solar_irradiance: 0.0450,
        wind_speed: 0.0255
      }
    });
  };

  const roundVal = (val) => Math.round(val * 10) / 10;

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, [flexibleLoadsEnabled]);

  // Handle simulation trigger
  const handleSimulateScenario = async (simParams) => {
    setIsSimulating(true);
    try {
      const res = await fetch(`${API_BASE}/api/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_name: simParams.scenario_name,
          temperature: simParams.temperature,
          wind_speed: simParams.wind_speed,
          solar_irradiance: simParams.solar_irradiance,
          station_activity: simParams.station_activity,
          battery_soc: status?.telemetry?.battery_level || 70,
          flexible_loads_enabled: flexibleLoadsEnabled
        })
      });

      if (res.ok) {
        const data = await res.json();
        setOptimizationData({
          schedule: data.forecast_schedule,
          summary: data.summary
        });
        if (data.alerts) {
          setAlerts(data.alerts);
        }
        setSimulationAlert({
          level: data.alert_level,
          message: data.alert_message,
          name: data.scenario_name
        });

        setStatus((prev) => ({
          ...prev,
          telemetry: {
            ...prev?.telemetry,
            temperature: simParams.temperature,
            wind_speed: simParams.wind_speed,
            solar_irradiance: simParams.solar_irradiance,
            station_activity: simParams.station_activity,
            energy_demand: data.summary.peak_demand_kw
          }
        }));
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <Header status={status} onOpenMetrics={() => setIsMetricsOpen(true)} />

      {/* Extreme Weather Simulation Alert Banner */}
      {simulationAlert && (
        <div
          className={`p-4 rounded-xl mb-6 flex items-start gap-3 border font-mono text-sm shadow-xl transition-all ${
            simulationAlert.level === 'CRITICAL_DEFICIT'
              ? 'bg-rose-500/20 border-rose-500/50 text-rose-200 glow-red'
              : simulationAlert.level === 'MODERATE_WARNING'
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
              : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
          }`}
        >
          {simulationAlert.level === 'CRITICAL_DEFICIT' ? (
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <span className="font-bold uppercase tracking-wider block mb-1">
              SIMULATION ACTIVE: {simulationAlert.name}
            </span>
            <span>{simulationAlert.message}</span>
          </div>
          <button
            onClick={() => setSimulationAlert(null)}
            className="text-xs bg-slate-900/60 hover:bg-slate-900 px-2 py-1 rounded text-slate-300 transition cursor-pointer"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* 6 Key Telemetry Cards */}
      <StatCards telemetry={status?.telemetry} />

      {/* PREDICTIVE RISK & ALERT CENTER (NEW FEATURE) */}
      <AlertCenter alerts={alerts} />

      {/* Extreme Weather Simulator Controls */}
      <ExtremeWeatherSimulator
        onSimulate={handleSimulateScenario}
        isSimulating={isSimulating}
        activeScenario={simulationAlert?.name}
      />

      {/* 24-Hour AI Predictive Dispatch Chart */}
      <ForecastChart
        schedule={optimizationData?.schedule}
        summary={optimizationData?.summary}
      />

      {/* Load Management & Priority Matrix */}
      <LoadManagementPanel
        flexibleLoadsEnabled={flexibleLoadsEnabled}
        onToggleFlexible={setFlexibleLoadsEnabled}
      />

      {/* AI Metrics Modal */}
      <AIMetricsModal
        isOpen={isMetricsOpen}
        onClose={() => setIsMetricsOpen(false)}
        metrics={aiMetrics}
      />
    </div>
  );
}

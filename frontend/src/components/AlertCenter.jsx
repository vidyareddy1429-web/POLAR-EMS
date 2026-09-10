import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, BatteryCharging, Flame, ThermometerSnowflake, Sun, Wind, ChevronRight, HelpCircle, Info } from 'lucide-react';
import AlertDetailModal from './AlertDetailModal';

export default function AlertCenter({ alerts }) {
  const [filter, setFilter] = useState('ALL');
  const [selectedAlert, setSelectedAlert] = useState(null);

  const activeAlerts = alerts || [
    {
      id: 'default_1',
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
        '🔋 Battery projected to reach safe operating discharge limit (65%)',
        '⚡ 80 kW shortage predicted at 18:00'
      ],
      recommendations: [
        'Maximize wind turbine generation',
        'Discharge battery storage',
        'Shift flexible research/laundry loads',
        'Start diesel generator at 17:40 if deficit remains'
      ]
    }
  ];

  const filteredAlerts = activeAlerts.filter((a) => {
    if (filter === 'ALL') return true;
    return a.severity === filter;
  });

  const getAlertIcon = (alert) => {
    if (alert.severity === 'CRITICAL') return ShieldAlert;
    if (alert.type === 'BATTERY') return BatteryCharging;
    if (alert.type === 'DIESEL') return Flame;
    if (alert.type === 'COLD') return ThermometerSnowflake;
    if (alert.type === 'SOLAR') return Sun;
    if (alert.type === 'WIND') return Wind;
    return CheckCircle2;
  };

  return (
    <div className="glass-panel p-6 mb-6 relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h2 className="heading-font text-lg font-bold text-white tracking-wide">
              PREDICTIVE RISK & ALERT CENTER
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
              AI RISK ENGINE
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Detects future power deficits before they happen & provides root-cause explanations
          </p>
        </div>

        {/* Severity Filters */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
          {['ALL', 'CRITICAL', 'WARNING', 'NORMAL'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg transition cursor-pointer font-bold ${
                filter === f
                  ? f === 'CRITICAL'
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                    : f === 'WARNING'
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                    : f === 'NORMAL'
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                    : 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAlerts.map((alert) => {
          const IconComp = getAlertIcon(alert);
          const isCrit = alert.severity === 'CRITICAL';
          const isWarn = alert.severity === 'WARNING';

          return (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all hover:-translate-y-0.5 cursor-pointer ${
                isCrit
                  ? 'bg-rose-500/10 border-rose-500/40 hover:border-rose-500'
                  : isWarn
                  ? 'bg-amber-500/10 border-amber-500/40 hover:border-amber-500'
                  : 'bg-emerald-500/10 border-emerald-500/40 hover:border-emerald-500'
              }`}
              onClick={() => setSelectedAlert(alert)}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <IconComp
                      className={`w-4 h-4 ${
                        isCrit ? 'text-rose-400' : isWarn ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    />
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                        isCrit ? 'text-rose-300' : isWarn ? 'text-amber-300' : 'text-emerald-300'
                      }`}
                    >
                      {alert.severity} • {alert.time}
                    </span>
                  </div>
                  {alert.deficit_kw > 0 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      -{alert.deficit_kw} kW DEFICIT
                    </span>
                  )}
                </div>

                <h3 className="heading-font text-sm font-bold text-white mb-1">
                  {alert.title}
                </h3>
                <p className="text-xs font-mono text-slate-400 line-clamp-2">
                  {alert.subtitle}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-cyan-300 group">
                <span className="flex items-center gap-1 font-semibold text-[11px]">
                  <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                  WHY? View Root Cause & Actions
                </span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Root Cause & Recommendations Modal */}
      <AlertDetailModal
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
      />
    </div>
  );
}

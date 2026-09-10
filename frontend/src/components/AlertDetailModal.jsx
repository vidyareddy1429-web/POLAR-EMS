import React from 'react';
import { X, AlertTriangle, ShieldAlert, CheckCircle2, Info, ArrowDownRight, Zap, ThermometerSnowflake, Sun, Wind, BatteryCharging, Flame } from 'lucide-react';

export default function AlertDetailModal({ alert, onClose }) {
  if (!alert) return null;

  const isCritical = alert.severity === 'CRITICAL';
  const isWarning = alert.severity === 'WARNING';
  const isNormal = alert.severity === 'NORMAL';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel w-full max-w-2xl p-6 relative border border-cyan-500/40 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition cursor-pointer p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3 mb-4 pr-8">
          <div
            className={`p-3 rounded-xl border shrink-0 ${
              isCritical
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 glow-red'
                : isWarning
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
            }`}
          >
            {isCritical ? (
              <ShieldAlert className="w-6 h-6" />
            ) : isWarning ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <CheckCircle2 className="w-6 h-6" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                  isCritical
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : isWarning
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {alert.severity} SEVERITY
              </span>
              <span className="text-xs font-mono text-slate-400">
                PREDICTED TIME: {alert.time}
              </span>
            </div>
            <h2 className="heading-font text-xl font-extrabold text-white">
              {alert.title}
            </h2>
            <p className="text-xs font-mono text-slate-300 mt-0.5">
              {alert.subtitle}
            </p>
          </div>
        </div>

        {/* Weather & Microgrid Snapshot Cards */}
        {alert.weather_snapshot && (
          <div className="grid grid-cols-4 gap-2 mb-6 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
            <div className="text-center">
              <span className="text-slate-400 block text-[10px]">TEMP</span>
              <span className="font-bold text-cyan-300">{alert.weather_snapshot.temperature}°C</span>
            </div>
            <div className="text-center">
              <span className="text-slate-400 block text-[10px]">SOLAR</span>
              <span className="font-bold text-yellow-300">{alert.weather_snapshot.solar} kW</span>
            </div>
            <div className="text-center">
              <span className="text-slate-400 block text-[10px]">WIND</span>
              <span className="font-bold text-sky-300">{alert.weather_snapshot.wind} kW</span>
            </div>
            <div className="text-center">
              <span className="text-slate-400 block text-[10px]">BATTERY</span>
              <span className="font-bold text-emerald-300">{alert.weather_snapshot.battery_soc}%</span>
            </div>
          </div>
        )}

        {/* Root Cause Explainer Section */}
        <div className="mb-6 p-4 rounded-xl bg-slate-900/60 border border-cyan-500/20">
          <h3 className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            WHY AM I GETTING THIS ALERT? (ROOT CAUSE ANALYSIS)
          </h3>

          <div className="space-y-2">
            {(alert.why_chain || []).map((step, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs text-slate-200 font-mono"
              >
                <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                  {idx + 1}
                </div>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Action Section */}
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <h3 className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            AI RECOMMENDED OPERATOR ACTIONS
          </h3>

          <ul className="space-y-2 font-mono text-xs text-slate-200">
            {(alert.recommendations || []).map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

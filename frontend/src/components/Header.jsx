import React, { useState } from 'react';
import { Snowflake, HelpCircle, Sparkles, Database, ShieldCheck, Zap } from 'lucide-react';

export default function Header({ status, onOpenMetrics }) {
  const [showExplainer, setShowExplainer] = useState(false);
  
  const telemetry = status?.telemetry || { temperature: -18, wind_speed: 32, solar_irradiance: 120 };
  const daily = status?.daily_summary || { renewable_pct: 78.4, fuel_liters: 142 };

  return (
    <header className="mb-6">
      {/* Top Main Navigation Bar */}
      <div className="glass-panel p-5 relative overflow-hidden border-2 border-cyan-500/40 shadow-2xl">
        {/* Multi-color ambient background lighting */}
        <div className="absolute -top-12 -left-12 w-56 h-56 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-12 -right-12 w-56 h-56 bg-magenta-500/20 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 left-1/3 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 relative z-10">
          {/* Logo & Title */}
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 border-2 border-cyan-400/50 text-cyan-300 shadow-lg shadow-cyan-500/30">
              <Snowflake className="w-9 h-9 animate-spin-slow text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="heading-font text-3xl font-black tracking-tight text-gradient-rainbow drop-shadow-md">
                  POLAR<span className="text-white">-EMS</span>
                </h1>
                <span className="pulse-badge bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-2 border-emerald-400/50 text-emerald-300 shadow-lg shadow-emerald-500/30">
                  <span className="pulse-dot bg-emerald-400" />
                  AI MICROGRID ONLINE
                </span>
              </div>
              <p className="text-xs text-cyan-200/90 font-mono mt-0.5 tracking-wider font-semibold">
                ANTARCTIC RESEARCH STATION • SMART ENERGY DECISION SUPPORT PLATFORM
              </p>
            </div>
          </div>

          {/* Quick Telemetry Pill Badges & Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            {/* Temp Badge */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950/80 border-2 border-cyan-500/30 shadow-md">
              <span className="text-slate-400 font-bold">TEMP:</span>
              <span className={`font-black text-sm ${telemetry.temperature < -25 ? 'text-rose-400 glow-red' : 'text-cyan-300 glow-cyan'}`}>
                {telemetry.temperature}°C
              </span>
            </div>

            {/* Wind Badge */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950/80 border-2 border-sky-500/30 shadow-md">
              <span className="text-slate-400 font-bold">WIND:</span>
              <span className="text-sky-300 font-black text-sm glow-cyan">{telemetry.wind_speed} km/h</span>
            </div>

            {/* Clean Energy Badge */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950/80 border-2 border-emerald-500/40 shadow-md shadow-emerald-500/10">
              <span className="text-slate-400 font-bold">RENEWABLE:</span>
              <span className="text-emerald-400 font-black text-sm glow-green">{daily.renewable_pct}%</span>
            </div>

            {/* How It Works Button */}
            <button
              onClick={() => setShowExplainer(!showExplainer)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 border-2 border-purple-400/50 text-purple-200 font-bold transition-all transform hover:scale-105 cursor-pointer shadow-lg shadow-purple-500/20"
            >
              <HelpCircle className="w-4 h-4 text-purple-300" />
              {showExplainer ? 'HIDE GUIDE' : 'HOW IT WORKS'}
            </button>

            {/* AI Metrics Button */}
            <button
              onClick={onOpenMetrics}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600/30 to-pink-600/30 hover:from-cyan-600/50 hover:to-pink-600/50 border-2 border-cyan-400/50 text-cyan-200 font-bold transition-all transform hover:scale-105 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <Database className="w-4 h-4 text-cyan-300" />
              AI TRANSPARENCY
            </button>
          </div>
        </div>
      </div>

      {/* Guided Help Banner */}
      {showExplainer && (
        <div className="mt-4 p-5 rounded-2xl bg-slate-950/95 border-2 border-purple-500/40 text-slate-100 text-xs font-sans shadow-2xl animate-fade-in">
          <div className="flex items-center gap-2 text-purple-300 font-bold font-mono text-sm mb-3">
            <Sparkles className="w-4 h-4 text-pink-400" />
            POLAR-EMS ARCHITECTURE IN 3 STEPS
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
            <div className="p-4 rounded-xl bg-gradient-to-b from-cyan-950/50 to-slate-950 border border-cyan-500/30">
              <div className="text-cyan-300 font-black text-sm mb-1.5 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-400" /> 1. Machine Learning AI
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Forecasts 24-hour electricity & sub-zero heating load using Random Forest models ($R^2 = 0.9842$).
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-b from-emerald-950/50 to-slate-950 border border-emerald-500/30">
              <div className="text-emerald-300 font-black text-sm mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> 2. Microgrid Optimizer
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Prioritizes Solar + Wind + Battery reserves. Protects critical life-support loads & saves ~76L fuel/day.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-b from-pink-950/50 to-slate-950 border border-pink-500/30">
              <div className="text-pink-300 font-black text-sm mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-pink-400" /> 3. Weather Simulator
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Test custom storms or cold snaps to watch the AI recalculate energy dispatch & detect risks live!
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

import React from 'react';
import { ShieldCheck, Layers, AlertCircle, CheckCircle, Lock, SlidersHorizontal } from 'lucide-react';

export default function LoadManagementPanel({ flexibleLoadsEnabled, onToggleFlexible }) {
  const criticalLoads = [
    { name: 'Environmental Control & Life Support', power: '42.5 kW', priority: 'CRITICAL 1', icon: Lock },
    { name: 'Satellite Communications & Radar', power: '22.0 kW', priority: 'CRITICAL 1', icon: Lock },
    { name: 'Medical Clinic & Emergency Heaters', power: '18.5 kW', priority: 'CRITICAL 1', icon: Lock },
    { name: 'Core Server Room & AI Compute', power: '12.0 kW', priority: 'CRITICAL 2', icon: Lock }
  ];

  const flexibleLoads = [
    { name: 'Laundry & Maintenance Equipment', power: '15.0 kW', status: flexibleLoadsEnabled ? 'POSTPONED IN DEFICIT' : 'ALWAYS ON' },
    { name: 'Non-Essential Lab Heating', power: '18.5 kW', status: flexibleLoadsEnabled ? 'SHIFTABLE' : 'ALWAYS ON' },
    { name: 'Battery Charging Buffer', power: '25.0 kW', status: flexibleLoadsEnabled ? 'SHIFTABLE' : 'ALWAYS ON' }
  ];

  return (
    <div className="glass-panel p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="heading-font text-lg font-bold text-white tracking-wide">
              STATION LOAD PRIORITY & SHIFTING CONTROL
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Dynamic load management protecting critical research station assets
          </p>
        </div>

        {/* AI Load Shifting Toggle */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800">
          <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-semibold text-slate-300">
            AI LOAD SHIFTING:
          </span>
          <button
            onClick={() => onToggleFlexible(!flexibleLoadsEnabled)}
            className={`px-3 py-1 rounded-full text-xs font-bold font-mono transition cursor-pointer ${
              flexibleLoadsEnabled
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 glow-green'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
            }`}
          >
            {flexibleLoadsEnabled ? 'ACTIVE (SHED IN DEFICIT)' : 'DISABLED (CONSTANT)'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Critical Loads Card */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="font-mono text-xs font-bold text-emerald-400 tracking-wider">
                CRITICAL LOADS (65% TOTAL)
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 font-bold">
              100% PROTECTED
            </span>
          </div>

          <div className="space-y-2">
            {criticalLoads.map((load, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-950/60 text-xs">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-200">{load.name}</span>
                </div>
                <span className="font-mono text-emerald-300 font-bold">{load.power}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Flexible Loads Card */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-amber-500/20">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <h3 className="font-mono text-xs font-bold text-amber-400 tracking-wider">
                FLEXIBLE LOADS (35% TOTAL)
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 font-bold">
              {flexibleLoadsEnabled ? 'DEFERRABLE' : 'UNMANAGED'}
            </span>
          </div>

          <div className="space-y-2">
            {flexibleLoads.map((load, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded bg-slate-950/60 text-xs">
                <span className="text-slate-200">{load.name}</span>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-amber-300 font-bold">{load.power}</span>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                    {load.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Zap, Sun, Wind, BatteryCharging, Flame, Fuel, ArrowUpRight } from 'lucide-react';

export default function StatCards({ telemetry }) {
  const data = telemetry || {
    energy_demand: 142.5,
    solar_generation: 48.0,
    wind_generation: 64.2,
    battery_level: 76.5,
    diesel_generation: 30.3,
    fuel_consumption: 11.7
  };

  const cards = [
    {
      title: 'ELECTRICITY DEMAND',
      value: `${data.energy_demand} kW`,
      sub: 'Station Power & Heating Load',
      badge: 'POWER REQUIRED',
      icon: Zap,
      color: 'text-purple-300',
      glow: 'glow-magenta',
      gradient: 'from-purple-600/30 via-pink-600/15 to-slate-950/80',
      iconBg: 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white',
      borderColor: 'border-purple-500/50 hover:border-purple-400',
      glowSpot: 'bg-purple-500/30'
    },
    {
      title: 'SOLAR GENERATION',
      value: `${data.solar_generation} kW`,
      sub: 'Photovoltaic Array Generation',
      badge: 'CLEAN RENEWABLE',
      icon: Sun,
      color: 'text-amber-300',
      glow: 'glow-gold',
      gradient: 'from-amber-600/30 via-yellow-600/15 to-slate-950/80',
      iconBg: 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-bold',
      borderColor: 'border-amber-500/50 hover:border-amber-400',
      glowSpot: 'bg-amber-500/30'
    },
    {
      title: 'KATABATIC WIND POWER',
      value: `${data.wind_generation} kW`,
      sub: 'Polar Turbine Output',
      badge: 'CLEAN RENEWABLE',
      icon: Wind,
      color: 'text-cyan-300',
      glow: 'glow-cyan',
      gradient: 'from-cyan-600/30 via-sky-600/15 to-slate-950/80',
      iconBg: 'bg-gradient-to-tr from-cyan-500 to-blue-500 text-slate-950 font-bold',
      borderColor: 'border-cyan-500/50 hover:border-cyan-400',
      glowSpot: 'bg-cyan-500/30'
    },
    {
      title: 'BATTERY STORAGE',
      value: `${data.battery_level}%`,
      sub: '400 kWh LiFePO4 Reserve',
      badge: 'ACTIVE RESERVE',
      icon: BatteryCharging,
      color: 'text-emerald-300',
      glow: 'glow-green',
      gradient: 'from-emerald-600/30 via-teal-600/15 to-slate-950/80',
      iconBg: 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold',
      borderColor: 'border-emerald-500/50 hover:border-emerald-400',
      glowSpot: 'bg-emerald-500/30',
      isProgress: true,
      progressVal: data.battery_level
    },
    {
      title: 'DIESEL GENERATOR',
      value: `${data.diesel_generation} kW`,
      sub: 'Backup Fuel Generation',
      badge: data.diesel_generation > 0 ? 'BACKUP ENGAGED' : 'STANDBY (0 kW)',
      icon: Flame,
      color: data.diesel_generation > 0 ? 'text-orange-300' : 'text-slate-400',
      glow: data.diesel_generation > 0 ? 'glow-red' : '',
      gradient: data.diesel_generation > 0 ? 'from-orange-600/30 via-red-600/15 to-slate-950/80' : 'from-slate-900/60 to-slate-950',
      iconBg: data.diesel_generation > 0 ? 'bg-gradient-to-tr from-orange-500 to-rose-500 text-white' : 'bg-slate-800 text-slate-400',
      borderColor: data.diesel_generation > 0 ? 'border-orange-500/60 hover:border-orange-400' : 'border-slate-800',
      glowSpot: 'bg-orange-500/30'
    },
    {
      title: 'FUEL BURN RATE',
      value: `${data.fuel_consumption} L/h`,
      sub: 'Diesel Consumption Rate',
      badge: 'AI MINIMIZED',
      icon: Fuel,
      color: data.fuel_consumption > 15 ? 'text-rose-300' : 'text-pink-300',
      glow: data.fuel_consumption > 15 ? 'glow-red' : 'glow-magenta',
      gradient: 'from-pink-600/30 via-rose-600/15 to-slate-950/80',
      iconBg: 'bg-gradient-to-tr from-pink-500 to-rose-500 text-white',
      borderColor: 'border-pink-500/50 hover:border-pink-400',
      glowSpot: 'bg-pink-500/30'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className={`glass-panel p-4 flex flex-col justify-between border-2 ${card.borderColor} transition-all duration-300 hover:-translate-y-1.5 relative overflow-hidden group bg-gradient-to-b ${card.gradient}`}
          >
            {/* Ambient Background Glow Spot */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity ${card.glowSpot}`} />

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono font-extrabold text-white tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2.5 rounded-xl ${card.iconBg} shadow-md shrink-0`}>
                  <IconComponent className="w-4 h-4" />
                </div>
              </div>

              <div className={`heading-font text-2.5xl font-black tracking-tight ${card.color} ${card.glow} drop-shadow-md`}>
                {card.value}
              </div>
              
              <p className="text-[11px] text-slate-300 mt-1 font-sans font-medium truncate">
                {card.sub}
              </p>
            </div>

            <div className="mt-4 pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-md bg-slate-950/90 text-white border border-white/15 uppercase tracking-wider shadow-inner">
                {card.badge}
              </span>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-300 transition-colors" />
            </div>

            {card.isProgress && (
              <div className="mt-2.5 w-full bg-slate-950/90 rounded-full h-2.5 overflow-hidden border border-white/20 p-0.5">
                <div
                  className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 h-full rounded-full transition-all duration-700 shadow-lg shadow-emerald-500/50"
                  style={{ width: `${Math.min(100, Math.max(0, card.progressVal))}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

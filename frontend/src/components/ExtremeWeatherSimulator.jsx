import React, { useState } from 'react';
import { CloudSnow, ThermometerSnowflake, Wind, Sun, AlertTriangle, CheckCircle2, Sliders, RefreshCw, Sparkles } from 'lucide-react';

export default function ExtremeWeatherSimulator({ onSimulate, isSimulating, activeScenario }) {
  const [temp, setTemp] = useState(-25);
  const [wind, setWind] = useState(35);
  const [solar, setSolar] = useState(80);
  const [activity, setActivity] = useState(75);

  const presets = [
    {
      name: 'Polar Vortex (-35°C)',
      description: 'Extreme freeze spike! Tests emergency heating & diesel backup.',
      temp: -35,
      wind: 40,
      solar: 0,
      act: 85,
      icon: ThermometerSnowflake,
      color: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
    },
    {
      name: 'Katabatic Blizzard (85 km/h)',
      description: 'High winds boost wind turbine output to maximum power.',
      temp: -22,
      wind: 85,
      solar: 0,
      act: 70,
      icon: Wind,
      color: 'bg-sky-500/20 text-sky-300 border-sky-500/40'
    },
    {
      name: 'Deep Polar Night',
      description: 'Simulates 24-hour winter darkness (0 Solar).',
      temp: -30,
      wind: 20,
      solar: 0,
      act: 60,
      icon: CloudSnow,
      color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
    },
    {
      name: 'Midsummer Sun',
      description: '24-hour sun produces maximum solar energy.',
      temp: -8,
      wind: 25,
      solar: 650,
      act: 90,
      icon: Sun,
      color: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    }
  ];

  const handleRunCustom = () => {
    onSimulate({
      scenario_name: 'Custom Weather Simulation',
      temperature: parseFloat(temp),
      wind_speed: parseFloat(wind),
      solar_irradiance: parseFloat(solar),
      station_activity: parseFloat(activity)
    });
  };

  const handlePreset = (preset) => {
    setTemp(preset.temp);
    setWind(preset.wind);
    setSolar(preset.solar);
    setActivity(preset.act);
    onSimulate({
      scenario_name: preset.name,
      temperature: preset.temp,
      wind_speed: preset.wind,
      solar_irradiance: preset.solar,
      station_activity: preset.act
    });
  };

  return (
    <div className="glass-panel p-6 mb-6 relative overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="heading-font text-lg font-bold text-white tracking-wide">
              EXTREME WEATHER SIMULATOR
            </h2>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              INTERACTIVE DEMO
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Click a preset polar scenario or drag the weather sliders below to see how AI adapts microgrid power live!
          </p>
        </div>
      </div>

      {/* Preset Scenario Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {presets.map((p, idx) => {
          const IconComp = p.icon;
          const isActive = activeScenario === p.name;
          return (
            <button
              key={idx}
              onClick={() => handlePreset(p)}
              className={`p-3 rounded-xl border text-left transition cursor-pointer hover:brightness-125 flex flex-col justify-between ${p.color} ${
                isActive ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/20' : ''
              }`}
            >
              <div>
                <div className="flex items-center gap-2 font-mono font-bold text-xs mb-1">
                  <IconComp className="w-4 h-4 shrink-0" />
                  {p.name}
                </div>
                <p className="text-[11px] font-sans text-slate-300 opacity-90 leading-tight">
                  {p.description}
                </p>
              </div>
              <div className="mt-2 text-[10px] font-mono font-semibold text-slate-400">
                CLICK TO TEST
              </div>
            </button>
          );
        })}
      </div>

      {/* Manual Weather Sliders Sandbox */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 mb-4">
        <div className="text-xs font-mono font-bold text-cyan-400 mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          MANUAL WEATHER ADJUSTMENT SANDBOX
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-400">TEMPERATURE</span>
              <span className={`font-bold ${temp < -25 ? 'text-rose-400' : 'text-cyan-300'}`}>
                {temp}°C
              </span>
            </div>
            <input
              type="range"
              min="-45"
              max="0"
              step="1"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              className="w-full"
            />
            <span className="text-[10px] text-slate-500 font-mono block mt-1">Colder = More heating power</span>
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-400">WIND SPEED</span>
              <span className="font-bold text-sky-300">{wind} km/h</span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="1"
              value={wind}
              onChange={(e) => setWind(e.target.value)}
              className="w-full"
            />
            <span className="text-[10px] text-slate-500 font-mono block mt-1">Higher wind = More wind power</span>
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-400">SOLAR LIGHT</span>
              <span className="font-bold text-yellow-300">{solar} W/m²</span>
            </div>
            <input
              type="range"
              min="0"
              max="800"
              step="10"
              value={solar}
              onChange={(e) => setSolar(e.target.value)}
              className="w-full"
            />
            <span className="text-[10px] text-slate-500 font-mono block mt-1">0 = Polar winter night</span>
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-400">STATION ACTIVITY</span>
              <span className="font-bold text-emerald-300">{activity}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="w-full"
            />
            <span className="text-[10px] text-slate-500 font-mono block mt-1">Lab research & computers</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <button
          onClick={handleRunCustom}
          disabled={isSimulating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs transition cursor-pointer shadow-lg shadow-cyan-500/20 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
          {isSimulating ? 'RECALCULATING AI DISPATCH...' : 'RUN CUSTOM WEATHER SIMULATION'}
        </button>
      </div>
    </div>
  );
}

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { TrendingUp, ShieldCheck, Leaf, Fuel } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ForecastChart({ schedule, summary }) {
  const hours = (schedule || []).map((s) => `${s.hour}:00`);
  
  const demandData = (schedule || []).map((s) => s.demand);
  const solarData = (schedule || []).map((s) => s.solar);
  const windData = (schedule || []).map((s) => s.wind);
  const batteryData = (schedule || []).map((s) => Math.max(0, s.battery_flow_kw));
  const dieselData = (schedule || []).map((s) => s.diesel_kw);

  const chartData = {
    labels: hours.length > 0 ? hours : Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        type: 'line',
        label: 'AI Predicted Demand (kW)',
        data: demandData,
        borderColor: '#ffd166',
        backgroundColor: 'rgba(255, 209, 102, 0.15)',
        borderWidth: 3,
        pointRadius: 3,
        pointHoverRadius: 6,
        tension: 0.3,
        fill: true,
        order: 0
      },
      {
        type: 'bar',
        label: 'Solar (kW)',
        data: solarData,
        backgroundColor: 'rgba(250, 204, 21, 0.8)',
        stack: 'dispatch',
        order: 1
      },
      {
        type: 'bar',
        label: 'Wind (kW)',
        data: windData,
        backgroundColor: 'rgba(56, 189, 248, 0.8)',
        stack: 'dispatch',
        order: 1
      },
      {
        type: 'bar',
        label: 'Battery Discharge (kW)',
        data: batteryData,
        backgroundColor: 'rgba(20, 184, 166, 0.8)',
        stack: 'dispatch',
        order: 1
      },
      {
        type: 'bar',
        label: 'Diesel Backup (kW)',
        data: dieselData,
        backgroundColor: 'rgba(249, 115, 22, 0.85)',
        stack: 'dispatch',
        order: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#cbd5e1',
          font: { family: 'Inter', size: 12 },
          usePointStyle: true,
          padding: 16
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#00f2ff',
        bodyColor: '#f8fafc',
        borderColor: 'rgba(0, 242, 255, 0.3)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'Fira Code', size: 11 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8', font: { family: 'Fira Code', size: 11 } },
        title: { display: true, text: 'Power (kW)', color: '#94a3b8' }
      }
    }
  };

  return (
    <div className="glass-panel p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h2 className="heading-font text-lg font-bold text-white tracking-wide">
              24-HOUR AI PREDICTIVE DISPATCH SCHEDULE
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Demand forecast vs optimal microgrid dispatch strategy
          </p>
        </div>

        {/* Optimization Metrics Summary */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <Leaf className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono text-slate-300">Fuel Saved:</span>
            <span className="text-sm font-bold text-emerald-400 glow-green">
              {summary?.fuel_saved_liters || 0} L
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono text-slate-300">CO2 Reduced:</span>
            <span className="text-sm font-bold text-cyan-400">
              {summary?.co2_reduced_kg || 0} kg
            </span>
          </div>
        </div>
      </div>

      <div className="h-[380px] w-full">
        <Chart type="bar" data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}

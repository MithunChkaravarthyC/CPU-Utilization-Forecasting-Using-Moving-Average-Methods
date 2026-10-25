import React, { useState } from 'react';
import { ScalingDecision } from '../types';
import { Server, ArrowUpRight, ArrowDownRight, CheckCircle2, Shield, Sliders, Zap, SlidersHorizontal } from 'lucide-react';

interface ScalingPageProps {
  currentCpu: number | null;
  forecastCpu: number | null;
  scaling: ScalingDecision | null;
  highThreshold: number;
  setHighThreshold: (t: number) => void;
  lowThreshold: number;
  setLowThreshold: (t: number) => void;
}

export const ScalingPage: React.FC<ScalingPageProps> = ({
  currentCpu,
  forecastCpu,
  scaling,
  highThreshold,
  setHighThreshold,
  lowThreshold,
  setLowThreshold
}) => {
  // Interactive simulator state
  const [testForecast, setTestForecast] = useState<number>(forecastCpu || 55.0);

  const calculateSimulatedDecision = (val: number, high: number, low: number) => {
    if (val >= high) {
      const diff = val - high;
      return {
        decision: 'Scale Up (+1 Server)',
        badgeClass: 'bg-white text-black font-extrabold border-white shadow-sm',
        icon: ArrowUpRight,
        reason: `Workload exceeds your ${high}% safe ceiling by +${diff.toFixed(1)}%. An extra server instance is added automatically.`
      };
    } else if (val < low) {
      const diffLow = low - val;
      return {
        decision: 'Scale Down (-1 Server)',
        badgeClass: 'bg-neutral-900 text-white font-bold border-neutral-700',
        icon: ArrowDownRight,
        reason: `Workload is ${diffLow.toFixed(1)}% below your ${low}% floor. An idle server is powered down to save cloud costs.`
      };
    } else {
      return {
        decision: 'Optimal Capacity',
        badgeClass: 'bg-neutral-900 text-neutral-200 border-neutral-700',
        icon: CheckCircle2,
        reason: `Workload is inside the safe target zone (${low}% – ${high}%). No server changes needed.`
      };
    }
  };

  const simResult = calculateSimulatedDecision(testForecast, highThreshold, lowThreshold);
  const SimIcon = simResult.icon;

  const presets = [
    { label: 'Production Standard', high: 75, low: 20 },
    { label: 'Aggressive Cost Saver', high: 80, low: 30 },
    { label: 'Ultra High Availability', high: 65, low: 15 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Server className="w-5 h-5 text-white" />
          <span>Auto-Scaling Rules & Capacity Simulator</span>
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          Configure proactive rules that automatically scale servers before traffic peaks slow down your application.
        </p>
      </div>

      {/* Threshold Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* High Threshold Card */}
        <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-neutral-900 text-white border border-neutral-800">
                <ArrowUpRight className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">Scale-Up Ceiling</h3>
                <p className="text-xs text-neutral-400">Trigger extra servers when forecast hits this ceiling</p>
              </div>
            </div>
            <span className="text-2xl font-mono font-extrabold text-white">
              {highThreshold}%
            </span>
          </div>

          <input
            type="range"
            min={50}
            max={95}
            step={1}
            value={highThreshold}
            onChange={(e) => setHighThreshold(Number(e.target.value))}
            className="w-full accent-white cursor-pointer"
          />

          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span>Aggressive (50%)</span>
            <span>Recommended (75%)</span>
            <span>Conservative (95%)</span>
          </div>
        </div>

        {/* Low Threshold Card */}
        <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-neutral-900 text-neutral-300 border border-neutral-800">
                <ArrowDownRight className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">Scale-Down Floor</h3>
                <p className="text-xs text-neutral-400">Power down idle servers when forecast drops below this floor</p>
              </div>
            </div>
            <span className="text-2xl font-mono font-extrabold text-neutral-300">
              {lowThreshold}%
            </span>
          </div>

          <input
            type="range"
            min={5}
            max={40}
            step={1}
            value={lowThreshold}
            onChange={(e) => setLowThreshold(Number(e.target.value))}
            className="w-full accent-neutral-400 cursor-pointer"
          />

          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span>Cost Saver (5%)</span>
            <span>Recommended (20%)</span>
            <span>Early Downscale (40%)</span>
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-neutral-400">Quick Rule Presets:</span>
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              setHighThreshold(p.high);
              setLowThreshold(p.low);
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
              highThreshold === p.high && lowThreshold === p.low
                ? 'bg-white border-white text-black font-bold shadow-sm'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            {p.label} ({p.high}% / {p.low}%)
          </button>
        ))}
      </div>

      {/* Interactive Simulator */}
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-800 gap-2">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="w-5 h-5 text-white" />
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Interactive Rule Simulator
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Drag the simulated workload slider to test how auto-scaling rules respond in real-time.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono px-3 py-1 rounded-full bg-neutral-900 text-white border border-neutral-700">
            Simulated CPU: <strong className="text-white">{testForecast.toFixed(1)}%</strong>
          </span>
        </div>

        {/* Simulator Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min={0}
            max={100}
            step={0.5}
            value={testForecast}
            onChange={(e) => setTestForecast(Number(e.target.value))}
            className="w-full accent-white cursor-pointer h-2"
          />
          <div className="flex justify-between text-[11px] text-neutral-500 font-mono">
            <span>0% Idle</span>
            <span>25% Light</span>
            <span>50% Medium</span>
            <span>75% Heavy</span>
            <span>100% Max</span>
          </div>
        </div>

        {/* Simulated Output Card */}
        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl border ${simResult.badgeClass}`}>
              <SimIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-neutral-400 block font-medium">Triggered Response</span>
              <span className="text-base font-bold text-white font-sans">{simResult.decision}</span>
              <p className="text-xs text-neutral-300 mt-0.5">{simResult.reason}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setTestForecast(forecastCpu || 50)}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium whitespace-nowrap transition self-start sm:self-auto"
          >
            Reset to Real Forecast
          </button>
        </div>
      </div>
    </div>
  );
};

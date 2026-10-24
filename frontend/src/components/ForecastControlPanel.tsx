import React, { useState } from 'react';
import { SlidersHorizontal, Play, RefreshCw, Sparkles, Laptop, Activity } from 'lucide-react';

interface ForecastControlPanelProps {
  source: 'LIVE' | 'SIMULATION';
  setSource: (src: 'LIVE' | 'SIMULATION') => void;
  horizon: '1h' | '6h' | '12h' | '24h';
  setHorizon: (h: '1h' | '6h' | '12h' | '24h') => void;
  windowSize: number;
  setWindowSize: (w: number) => void;
  resolution: 'auto' | 'fine' | 'standard';
  setResolution: (r: 'auto' | 'fine' | 'standard') => void;
  highThreshold: number;
  setHighThreshold: (t: number) => void;
  lowThreshold: number;
  setLowThreshold: (t: number) => void;
  onRunForecast: () => void;
  onCompareMethods: () => void;
  onGenerateSimulation: (duration: '24h' | '3d' | '7d', seed: number) => void;
  onOpenConnectModal?: () => void;
  isLoading: boolean;
  liveSamplesCount: number;
  isAutoRefresh: boolean;
  setIsAutoRefresh: (val: boolean) => void;
  lastSyncTime?: Date;
}

export const ForecastControlPanel: React.FC<ForecastControlPanelProps> = ({
  source,
  setSource,
  horizon,
  setHorizon,
  windowSize,
  setWindowSize,
  highThreshold,
  lowThreshold,
  onRunForecast,
  onGenerateSimulation,
  onOpenConnectModal,
  isLoading,
  liveSamplesCount,
  isAutoRefresh,
  setIsAutoRefresh,
  lastSyncTime
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [demoScenario, setDemoScenario] = useState<'24h' | '3d' | '7d'>('24h');

  const horizonTabs: { id: '1h' | '6h' | '12h' | '24h'; label: string }[] = [
    { id: '1h', label: '1 Hour' },
    { id: '6h', label: '6 Hours' },
    { id: '12h', label: '12 Hours' },
    { id: '24h', label: '24 Hours' }
  ];

  const smoothingOptions = [
    { value: 3, label: 'Fast (3m)', desc: 'High sensitivity to sudden changes' },
    { value: 5, label: 'Balanced (5m)', desc: 'Optimal for general production' },
    { value: 15, label: 'Smooth (15m)', desc: 'Filters out noisy short spikes' }
  ];

  return (
    <div className="bg-[#0e1424]/90 backdrop-blur border border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-3">
      {/* Primary Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Source Toggle */}
        <div className="flex items-center space-x-1 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setSource('LIVE')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              source === 'LIVE'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${source === 'LIVE' ? 'bg-emerald-300 animate-pulse' : 'bg-slate-500'}`} />
            <span>Live Machine</span>
            {liveSamplesCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-900/90 text-emerald-200">
                {liveSamplesCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setSource('SIMULATION')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              source === 'SIMULATION'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Demo Traffic</span>
          </button>
        </div>

        {/* Horizon Selector (Pill tabs) */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400 hidden sm:inline">
            Predict Ahead:
          </span>
          <div className="flex items-center space-x-1 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
            {horizonTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setHorizon(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  horizon === tab.id
                    ? 'bg-cyan-600 text-white shadow font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {source === 'LIVE' && onOpenConnectModal && (
            <button
              type="button"
              onClick={onOpenConnectModal}
              className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 text-xs font-medium border border-slate-700 transition"
              title="Connect your laptop or server via agent"
            >
              <Laptop className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Connect Machine</span>
            </button>
          )}

          {/* Auto-Sync Toggle Button */}
          <button
            type="button"
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              isAutoRefresh
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/50 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title={isAutoRefresh ? 'Live Auto-Sync is ACTIVE (Auto-updating every 4s)' : 'Click to enable Live Auto-Sync'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isAutoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span className="hidden sm:inline">Auto-Update:</span>
            <span>{isAutoRefresh ? 'ON (4s)' : 'OFF'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`p-2 rounded-xl border text-xs transition ${
              showAdvanced
                ? 'bg-slate-800 text-white border-slate-600'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Adjust smoothing & scenario"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onRunForecast}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
            title="Force immediate manual forecast update"
          >
            {isLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>Update Forecast</span>
          </button>
        </div>
      </div>

      {/* Advanced Drawer (Smoothing & Scenarios) */}
      {showAdvanced && (
        <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs animate-in fade-in duration-150">
          {/* Smoothing Setting */}
          <div>
            <label className="text-slate-400 font-semibold block mb-1.5">
              Traffic Smoothing (Noise Filter):
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {smoothingOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setWindowSize(opt.value)}
                  className={`py-1.5 px-2 rounded-lg text-center border transition ${
                    windowSize === opt.value
                      ? 'bg-sky-950/80 border-sky-600 text-sky-300 font-bold'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title={opt.desc}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Demo Scenario Generator (if simulation) or Threshold Info */}
          {source === 'SIMULATION' ? (
            <div>
              <label className="text-slate-400 font-semibold block mb-1.5">
                Simulated Workload Scenario:
              </label>
              <div className="flex items-center space-x-2">
                <select
                  value={demoScenario}
                  onChange={(e) => {
                    const dur = e.target.value as '24h' | '3d' | '7d';
                    setDemoScenario(dur);
                    onGenerateSimulation(dur, 42);
                  }}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 flex-1 focus:outline-none focus:border-cyan-500"
                >
                  <option value="24h">24-Hour Daily Cycle (Normal)</option>
                  <option value="3d">3-Day High Traffic Peaks</option>
                  <option value="7d">7-Day Production Simulation</option>
                </select>
                <button
                  type="button"
                  onClick={() => onGenerateSimulation(demoScenario, Math.floor(Math.random() * 1000))}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
                  title="Randomize traffic pattern"
                >
                  Randomize
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-slate-800 text-slate-400">
              <div>
                <span className="font-semibold text-slate-300 block">Safe Capacity Target:</span>
                <span className="text-[11px]">Auto-scale triggers above {highThreshold}% or below {lowThreshold}%</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50 font-bold">
                20% - 75%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

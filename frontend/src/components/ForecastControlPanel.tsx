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
    <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl p-4 shadow-sm space-y-3">
      {/* Primary Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Source Toggle */}
        <div className="flex items-center space-x-1 p-1 bg-neutral-950 border border-neutral-800 rounded-xl">
          <button
            type="button"
            onClick={() => setSource('LIVE')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              source === 'LIVE'
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${source === 'LIVE' ? 'bg-black animate-pulse' : 'bg-neutral-600'}`} />
            <span>Live Machine</span>
            {liveSamplesCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${source === 'LIVE' ? 'bg-neutral-200 text-black' : 'bg-neutral-800 text-neutral-300'}`}>
                {liveSamplesCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setSource('SIMULATION')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              source === 'SIMULATION'
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Demo Traffic</span>
          </button>
        </div>

        {/* Horizon Selector (Pill tabs) */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-neutral-400 hidden sm:inline">
            Predict Ahead:
          </span>
          <div className="flex items-center space-x-1 p-1 bg-neutral-950 border border-neutral-800 rounded-xl">
            {horizonTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setHorizon(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  horizon === tab.id
                    ? 'bg-white text-black font-bold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
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
              className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium border border-neutral-700 transition"
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
                ? 'bg-neutral-900 text-white border-neutral-600 shadow-sm'
                : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
            }`}
            title={isAutoRefresh ? 'Live Auto-Sync is ACTIVE (Auto-updating every 4s)' : 'Click to enable Live Auto-Sync'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isAutoRefresh ? 'bg-white animate-pulse' : 'bg-neutral-600'
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
                ? 'bg-white text-black border-white'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
            title="Adjust smoothing & scenario"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onRunForecast}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold shadow-md transition disabled:opacity-50"
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
        <div className="pt-3 border-t border-neutral-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs animate-in fade-in duration-150">
          {/* Smoothing Setting */}
          <div>
            <label className="text-neutral-400 font-semibold block mb-1.5">
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
                      ? 'bg-white border-white text-black font-bold shadow-sm'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
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
              <label className="text-neutral-400 font-semibold block mb-1.5">
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
                  className="bg-neutral-950 border border-neutral-800 text-white text-xs rounded-lg px-2.5 py-1.5 flex-1 focus:outline-none focus:border-white"
                >
                  <option value="24h">24-Hour Daily Cycle (Normal)</option>
                  <option value="3d">3-Day High Traffic Peaks</option>
                  <option value="7d">7-Day Production Simulation</option>
                </select>
                <button
                  type="button"
                  onClick={() => onGenerateSimulation(demoScenario, Math.floor(Math.random() * 1000))}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium transition"
                  title="Randomize traffic pattern"
                >
                  Randomize
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-400">
              <div>
                <span className="font-semibold text-white block">Safe Capacity Target:</span>
                <span className="text-[11px]">Auto-scale triggers above {highThreshold}% or below {lowThreshold}%</span>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-neutral-900 text-white border border-neutral-700 font-bold font-mono">
                20% - 75%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

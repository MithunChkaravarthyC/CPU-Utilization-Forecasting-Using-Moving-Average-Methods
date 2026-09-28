import React, { useState } from 'react';
import { Sliders, Play, BarChart2, Database, Sparkles, RefreshCw } from 'lucide-react';

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
  isLoading: boolean;
  liveSamplesCount: number;
}

export const ForecastControlPanel: React.FC<ForecastControlPanelProps> = ({
  source,
  setSource,
  horizon,
  setHorizon,
  windowSize,
  setWindowSize,
  resolution,
  setResolution,
  highThreshold,
  setHighThreshold,
  lowThreshold,
  setLowThreshold,
  onRunForecast,
  onCompareMethods,
  onGenerateSimulation,
  isLoading,
  liveSamplesCount
}) => {
  const [simDuration, setSimDuration] = useState<'24h' | '3d' | '7d'>('24h');
  const [simSeed, setSimSeed] = useState<number>(42);

  const windowOptions = [3, 5, 7, 15, 30, 60];
  const horizonOptions = [
    { value: '1h', label: '1 Hour' },
    { value: '6h', label: '6 Hours' },
    { value: '12h', label: '12 Hours' },
    { value: '24h', label: '24 Hours' }
  ];

  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-5 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-800 gap-2">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-sky-400" />
          <h3 className="text-base font-semibold text-white">Forecasting Configuration</h3>
        </div>
        <span className="text-xs text-gray-400">
          Deterministic mathematical moving-average engine
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Mode / Data Source */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-gray-400 font-medium mb-1.5">
            Data Source
          </label>
          <div className="grid grid-cols-2 gap-1 p-1 bg-gray-950 border border-gray-800 rounded-lg">
            <button
              type="button"
              onClick={() => setSource('SIMULATION')}
              className={`py-1.5 text-xs font-medium rounded-md transition ${
                source === 'SIMULATION'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Simulation
            </button>
            <button
              type="button"
              onClick={() => setSource('LIVE')}
              className={`py-1.5 text-xs font-medium rounded-md transition flex items-center justify-center space-x-1 ${
                source === 'LIVE'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span>Live Host</span>
              {liveSamplesCount > 0 && (
                <span className="text-[10px] px-1 bg-emerald-800/80 rounded">
                  {liveSamplesCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 2. Forecast Horizon */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-gray-400 font-medium mb-1.5">
            Forecast Horizon
          </label>
          <select
            value={horizon}
            onChange={(e) => setHorizon(e.target.value as any)}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
          >
            {horizonOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Window Size */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-gray-400 font-medium mb-1.5">
            Window Size (n = {windowSize})
          </label>
          <div className="grid grid-cols-6 gap-1">
            {windowOptions.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWindowSize(w)}
                className={`py-1.5 text-xs font-mono rounded border transition ${
                  windowSize === w
                    ? 'bg-sky-600 text-white border-sky-500 font-bold'
                    : 'bg-gray-950 text-gray-300 border-gray-800 hover:border-gray-700'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Forecast Resolution */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-gray-400 font-medium mb-1.5">
            Forecast Resolution
          </label>
          <select
            value={resolution}
            onChange={(e) => setResolution(e.target.value as any)}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
          >
            <option value="auto">Automatic (Optimized)</option>
            <option value="fine">Fine (1m / 2m intervals)</option>
            <option value="standard">Standard (5m / 15m intervals)</option>
          </select>
        </div>
      </div>

      {/* Simulation Controls when in Simulation Mode */}
      {source === 'SIMULATION' && (
        <div className="p-3 bg-gray-950/70 border border-indigo-900/30 rounded-lg flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-indigo-300">
            <Database className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Generate Realistic Synthetic Workloads:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md bg-gray-900 p-0.5 border border-gray-800">
              {(['24h', '3d', '7d'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSimDuration(d)}
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    simDuration === d ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {d.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-1">
              <span className="text-gray-400 text-[11px]">Seed:</span>
              <input
                type="number"
                value={simSeed}
                onChange={(e) => setSimSeed(parseInt(e.target.value) || 42)}
                className="w-16 bg-gray-900 border border-gray-800 rounded px-2 py-1 text-xs text-white font-mono"
              />
            </div>

            <button
              type="button"
              onClick={() => onGenerateSimulation(simDuration, simSeed)}
              disabled={isLoading}
              className="flex items-center space-x-1.5 px-3 py-1 rounded bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-medium transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Regenerate Dataset</span>
            </button>
          </div>
        </div>
      )}

      {/* Threshold and Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-gray-800/80 gap-3">
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">High Threshold:</span>
            <input
              type="number"
              min={50}
              max={95}
              value={highThreshold}
              onChange={(e) => setHighThreshold(parseFloat(e.target.value) || 75)}
              className="w-16 bg-gray-950 border border-gray-800 rounded px-2 py-1 text-xs text-rose-400 font-mono text-center font-bold"
            />
            <span className="text-gray-400">%</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-gray-400">Low Threshold:</span>
            <input
              type="number"
              min={5}
              max={40}
              value={lowThreshold}
              onChange={(e) => setLowThreshold(parseFloat(e.target.value) || 20)}
              className="w-16 bg-gray-950 border border-gray-800 rounded px-2 py-1 text-xs text-amber-400 font-mono text-center font-bold"
            />
            <span className="text-gray-400">%</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onCompareMethods}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium border border-gray-700 transition"
          >
            <BarChart2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Compare Windows</span>
          </button>

          <button
            type="button"
            onClick={onRunForecast}
            disabled={isLoading}
            className="flex items-center space-x-2 px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-950 transition disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isLoading ? 'animate-pulse' : ''}`} />
            <span>{isLoading ? 'Computing...' : 'Run Forecast'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

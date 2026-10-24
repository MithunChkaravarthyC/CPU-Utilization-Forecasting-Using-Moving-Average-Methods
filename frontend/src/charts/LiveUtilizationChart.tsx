import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { ForecastPoint } from '../types';
import { Activity, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';

interface LiveUtilizationChartProps {
  data: ForecastPoint[];
  currentCpu: number | null;
  deviceName?: string | null;
  sessionId?: string;
  source: 'LIVE' | 'SIMULATION';
  highThreshold?: number;
  lowThreshold?: number;
  isVisible: boolean;
  onToggleVisibility: () => void;
  samplesCount?: number;
}

const CustomLiveTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const val = payload[0]?.value;
    return (
      <div className="bg-[#0b101d] border border-emerald-700/60 p-3 rounded-xl shadow-2xl text-xs space-y-1 font-sans min-w-[170px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1">
          <span className="text-slate-300 font-mono text-[11px]">{label}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-700/50">
            Live
          </span>
        </div>
        <div className="flex items-center justify-between space-x-3">
          <span className="text-slate-400 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>CPU Usage:</span>
          </span>
          <span className="font-extrabold text-white font-mono text-sm">
            {val !== null && val !== undefined ? `${Number(val).toFixed(1)}%` : '--'}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export const LiveUtilizationChart: React.FC<LiveUtilizationChartProps> = ({
  data,
  currentCpu,
  deviceName,
  source,
  highThreshold = 75,
  lowThreshold = 20,
  isVisible,
  onToggleVisibility,
  samplesCount = 0
}) => {
  // Focus on the most recent 45 actual observations for high-frequency live stream
  const actualPoints = data.filter((p) => !p.is_forecast && p.actual !== null);
  const recentStream = actualPoints.slice(-45);

  const values = recentStream.map((p) => p.actual as number);
  const peakVal = values.length ? Math.max(...values) : (currentCpu || 0);
  const troughVal = values.length ? Math.min(...values) : (currentCpu || 0);
  const avgVal = values.length ? values.reduce((a, b) => a + b, 0) / values.length : (currentCpu || 0);

  const formatXAxis = (tickItem: string) => {
    if (!tickItem) return '';
    const parts = tickItem.split(' ');
    if (parts.length > 1) {
      return parts[1].length >= 8 ? parts[1].substring(0, 8) : parts[1].substring(0, 5);
    }
    return tickItem.substring(0, 5);
  };

  // If user has collapsed/hidden the real-time graph, show a crisp 1-line interactive strip
  if (!isVisible) {
    return (
      <div className="bg-[#0e1424]/90 backdrop-blur border border-slate-800/80 rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm transition">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-bold text-white tracking-wide">
              Real-Time CPU Stream Active
            </span>
          </div>

          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 font-mono font-bold">
            {currentCpu !== null ? `${currentCpu.toFixed(1)}%` : '--'}
          </span>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Device: <strong className="text-slate-300">{deviceName || (source === 'LIVE' ? 'Remote Machine' : 'Simulated Server')}</strong> • {samplesCount} recorded metrics
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleVisibility}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 text-xs font-semibold border border-slate-700 transition"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Show Live Monitor</span>
        </button>
      </div>
    );
  }

  // Full Expanded Real-Time Utilization Monitor
  return (
    <div className="bg-[#0e1424]/90 backdrop-blur border border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-4 transition">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <span className="p-1.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 shadow-sm">
              <Activity className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-white tracking-wide">
              Real-Time CPU Utilization Stream
            </h3>
            <span className="flex items-center space-x-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Telemetry</span>
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Live hardware utilization streaming continuously from <strong className="text-slate-200">{deviceName || (source === 'LIVE' ? 'Connected Machine' : 'Synthetic Telemetry Engine')}</strong>.
          </p>
        </div>

        {/* Action button: Hide Live Monitor */}
        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">Active Load</span>
            <span className="text-xl font-extrabold text-white font-mono leading-none">
              {currentCpu !== null ? `${currentCpu.toFixed(1)}%` : '--'}
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleVisibility}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition"
            title="Hide this live stream chart and view only the prediction graph"
          >
            <EyeOff className="w-3.5 h-3.5 text-slate-400" />
            <span>Hide Live Monitor</span>
          </button>
        </div>
      </div>

      {/* 4 Crisp Stream Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[11px] text-slate-400 block font-medium">Instant Utilization</span>
          <div className="flex items-baseline space-x-1 mt-0.5">
            <span className="text-lg font-extrabold text-emerald-400 font-mono">
              {currentCpu !== null ? `${currentCpu.toFixed(1)}%` : '--'}
            </span>
            <span className="text-[10px] text-slate-500">now</span>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[11px] text-slate-400 block font-medium">Stream Peak</span>
          <div className="flex items-baseline space-x-1 mt-0.5">
            <span className="text-lg font-bold text-rose-300 font-mono">
              {peakVal.toFixed(1)}%
            </span>
            <ArrowUp className="w-3 h-3 text-rose-400" />
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[11px] text-slate-400 block font-medium">Stream Trough</span>
          <div className="flex items-baseline space-x-1 mt-0.5">
            <span className="text-lg font-bold text-teal-300 font-mono">
              {troughVal.toFixed(1)}%
            </span>
            <ArrowDown className="w-3 h-3 text-teal-400" />
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
          <span className="text-[11px] text-slate-400 block font-medium">Stream Average</span>
          <div className="flex items-baseline space-x-1 mt-0.5">
            <span className="text-lg font-bold text-sky-300 font-mono">
              {avgVal.toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-500">window</span>
          </div>
        </div>
      </div>

      {/* Real-Time Area Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={recentStream} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="liveStreamGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
            />

            <YAxis
              stroke="#64748b"
              fontSize={11}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tickLine={false}
              ticks={[0, 20, 50, 75, 100]}
            />

            <Tooltip content={<CustomLiveTooltip />} />

            {/* Threshold Reference Lines */}
            <ReferenceLine
              y={highThreshold}
              stroke="#f43f5e"
              strokeDasharray="4 4"
              strokeWidth={1.2}
              label={{
                value: `Ceiling (${highThreshold}%)`,
                fill: '#f43f5e',
                fontSize: 10,
                position: 'insideTopRight'
              }}
            />

            <ReferenceLine
              y={lowThreshold}
              stroke="#10b981"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: `Floor (${lowThreshold}%)`,
                fill: '#10b981',
                fontSize: 10,
                position: 'insideBottomRight'
              }}
            />

            <Area
              type="monotone"
              dataKey="actual"
              name="Current CPU Usage"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#liveStreamGradient)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
        <span className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Real-time measurements ({recentStream.length} points plotted)</span>
        </span>
        <span className="text-slate-500 font-mono">
          Safe Band: {lowThreshold}% – {highThreshold}%
        </span>
      </div>
    </div>
  );
};

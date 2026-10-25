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
      <div className="bg-black border border-neutral-700 p-3 rounded-xl shadow-2xl text-xs space-y-1 font-sans min-w-[170px]">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-1 mb-1">
          <span className="text-neutral-400 font-mono text-[11px]">{label}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-neutral-900 text-white border border-neutral-700">
            Live
          </span>
        </div>
        <div className="flex items-center justify-between space-x-3">
          <span className="text-neutral-400 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>CPU Usage:</span>
          </span>
          <span className="font-extrabold text-cyan-300 font-mono text-sm">
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
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm transition">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
            </span>
            <span className="text-xs font-bold text-white tracking-wide">
              Real-Time CPU Stream Active
            </span>
          </div>

          <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800 font-mono font-bold">
            {currentCpu !== null ? `${currentCpu.toFixed(1)}%` : '--'}
          </span>

          <span className="text-[11px] text-neutral-400 hidden sm:inline">
            Device: <strong className="text-white">{deviceName || (source === 'LIVE' ? 'Remote Machine' : 'Simulated Server')}</strong> • {samplesCount} recorded metrics
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleVisibility}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold border border-neutral-700 transition"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Show Live Monitor</span>
        </button>
      </div>
    );
  }

  // Full Expanded Real-Time Utilization Monitor
  return (
    <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl p-6 shadow-sm space-y-4 transition">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-800 gap-3">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <span className="p-1.5 rounded-lg bg-cyan-950/70 text-cyan-400 border border-cyan-800/80 shadow-sm">
              <Activity className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-white tracking-wide">
              Real-Time CPU Utilization Stream
            </h3>
            <span className="flex items-center space-x-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Live Telemetry</span>
            </span>
          </div>
          <p className="text-xs text-neutral-400">
            Live hardware utilization streaming continuously from <strong className="text-white">{deviceName || (source === 'LIVE' ? 'Connected Machine' : 'Synthetic Telemetry Engine')}</strong>.
          </p>
        </div>

        {/* Action button: Hide Live Monitor */}
        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-neutral-400 block uppercase font-semibold">Active Load</span>
            <span className="text-xl font-extrabold text-cyan-400 font-mono leading-none">
              {currentCpu !== null ? `${currentCpu.toFixed(1)}%` : '--'}
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleVisibility}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold border border-neutral-700 transition"
            title="Hide this live stream chart and view only the prediction graph"
          >
            <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
            <span>Hide Live Monitor</span>
          </button>
        </div>
      </div>

      {/* 4 Crisp Stream Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
          <span className="text-[11px] text-neutral-400 block font-medium">Instant Utilization</span>
          <div className="flex items-baseline space-x-1 mt-0.5">
            <span className="text-lg font-extrabold text-cyan-400 font-mono">
              {currentCpu !== null ? `${currentCpu.toFixed(1)}%` : '--'}
            </span>
            <span className="text-[10px] text-neutral-500">now</span>
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
          <span className="text-[11px] text-neutral-400 block font-medium">Stream Peak</span>
          <div className="flex items-baseline space-x-1 mt-0.5">
            <span className="text-lg font-bold text-rose-400 font-mono">
              {peakVal.toFixed(1)}%
            </span>
            <ArrowUp className="w-3 h-3 text-rose-400" />
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
          <span className="text-[11px] text-neutral-400 block font-medium">Stream Trough</span>
          <div className="flex items-baseline space-x-1 mt-0.5">
            <span className="text-lg font-bold text-emerald-400 font-mono">
              {troughVal.toFixed(1)}%
            </span>
            <ArrowDown className="w-3 h-3 text-emerald-400" />
          </div>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3">
          <span className="text-[11px] text-neutral-400 block font-medium">Stream Average</span>
          <div className="flex items-baseline space-x-1 mt-0.5">
            <span className="text-lg font-bold text-sky-300 font-mono">
              {avgVal.toFixed(1)}%
            </span>
            <span className="text-[10px] text-neutral-500">window</span>
          </div>
        </div>
      </div>

      {/* Real-Time Area Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={recentStream} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="liveStreamGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />

            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              stroke="#737373"
              fontSize={11}
              tickLine={false}
            />

            <YAxis
              stroke="#737373"
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
              stroke="#06b6d4"
              strokeWidth={2.5}
              fill="url(#liveStreamGradient)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-800">
        <span className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>Real-time measurements ({recentStream.length} points plotted)</span>
        </span>
        <span className="text-neutral-400 font-mono">
          Safe Band: <span className="text-emerald-400">{lowThreshold}%</span> – <span className="text-rose-400">{highThreshold}%</span>
        </span>
      </div>
    </div>
  );
};

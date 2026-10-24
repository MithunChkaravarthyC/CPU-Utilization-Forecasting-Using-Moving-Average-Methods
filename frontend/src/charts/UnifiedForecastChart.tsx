import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { ForecastPoint } from '../types';
import { Eye, TrendingUp, Layers } from 'lucide-react';

interface UnifiedForecastChartProps {
  historicalData: ForecastPoint[];
  forecastData: ForecastPoint[];
  horizon: string;
  bestMethod: string;
  highThreshold?: number;
  lowThreshold?: number;
}

const CustomUnifiedTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const isFuture = payload[0]?.payload?.is_forecast;
    return (
      <div className="bg-[#0b101d] border border-slate-700/80 p-3.5 rounded-xl shadow-2xl text-xs space-y-1.5 font-sans min-w-[190px]">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
          <span className="text-slate-300 font-medium">{label}</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              isFuture
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/50'
                : 'bg-slate-800 text-slate-300'
            }`}
          >
            {isFuture ? 'Predicted' : 'Recorded'}
          </span>
        </div>
        {payload.map((entry: any, index: number) => {
          if (entry.value === null || entry.value === undefined) return null;
          return (
            <div key={`entry-${index}`} className="flex items-center justify-between space-x-3 text-xs">
              <span className="flex items-center space-x-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-bold text-white font-mono">{Number(entry.value).toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export const UnifiedForecastChart: React.FC<UnifiedForecastChartProps> = ({
  historicalData,
  forecastData,
  horizon,
  bestMethod,
  highThreshold = 75,
  lowThreshold = 20
}) => {
  const [showModels, setShowModels] = useState<boolean>(false);
  const [showThresholds, setShowThresholds] = useState<boolean>(true);

  // Combine historical and future forecast points cleanly
  // Historical points (up to last 60 for clean resolution)
  const recentHist = historicalData.slice(-60);
  const futurePoints = forecastData.filter((p) => p.is_forecast);

  // Mark future forecast points
  const combined = [
    ...recentHist.map((p) => ({
      ...p,
      displayActual: p.actual,
      predicted: null as number | null
    })),
    // Connecting anchor
    ...(recentHist.length > 0 && futurePoints.length > 0
      ? [
          {
            timestamp: recentHist[recentHist.length - 1].timestamp,
            displayActual: recentHist[recentHist.length - 1].actual,
            predicted: recentHist[recentHist.length - 1].actual,
            sma: recentHist[recentHist.length - 1].sma,
            wma: recentHist[recentHist.length - 1].wma,
            ema: recentHist[recentHist.length - 1].ema,
            is_forecast: false
          }
        ]
      : []),
    ...futurePoints.map((p) => {
      // Pick best forecast point
      const bestVal =
        bestMethod === 'SMA'
          ? p.sma
          : bestMethod === 'WMA'
          ? p.wma
          : p.ema;
      return {
        ...p,
        displayActual: null as number | null,
        predicted: bestVal
      };
    })
  ];

  const nowTimestamp = recentHist.length > 0 ? recentHist[recentHist.length - 1].timestamp : null;

  const formatXAxis = (tickItem: string) => {
    if (!tickItem) return '';
    const parts = tickItem.split(' ');
    if (parts.length > 1) {
      return parts[1].substring(0, 5); // HH:mm
    }
    return tickItem.substring(0, 5);
  };

  return (
    <div className="bg-[#0e1424]/90 backdrop-blur border border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-4">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-white tracking-wide">
              Workload Timeline & Proactive Forecast
            </h3>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
              Next {horizon} Ahead
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Solid line shows actual past usage; dashed glowing curve projects expected CPU demand.
          </p>
        </div>

        {/* Legend / Interactive Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setShowModels(!showModels)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border transition ${
              showModels
                ? 'bg-purple-950/80 text-purple-300 border-purple-600/60'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showModels ? 'Hide Model Variations' : 'Compare All Models'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowThresholds(!showThresholds)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border transition ${
              showThresholds
                ? 'bg-slate-800 text-slate-200 border-slate-700'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Thresholds (75% / 20%)</span>
          </button>
        </div>
      </div>

      {/* Main Responsive Chart */}
      <div className="w-full h-80 sm:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={combined} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
            <defs>
              {/* Actual CPU gradient */}
              <linearGradient id="actualAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
              </linearGradient>

              {/* Predicted Future Gradient */}
              <linearGradient id="forecastAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              minTickGap={35}
            />

            <YAxis
              stroke="#64748b"
              fontSize={11}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tickLine={false}
              ticks={[0, 20, 50, 75, 100]}
            />

            <Tooltip content={<CustomUnifiedTooltip />} />

            {/* Threshold Reference Lines */}
            {showThresholds && (
              <>
                <ReferenceLine
                  y={highThreshold}
                  stroke="#f43f5e"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
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
                  strokeWidth={1.2}
                  label={{
                    value: `Floor (${lowThreshold}%)`,
                    fill: '#10b981',
                    fontSize: 10,
                    position: 'insideBottomRight'
                  }}
                />
              </>
            )}

            {/* "NOW" vertical divider */}
            {nowTimestamp && (
              <ReferenceLine
                x={nowTimestamp}
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                label={{
                  value: 'NOW (Forecast Start)',
                  fill: '#94a3b8',
                  fontSize: 10,
                  position: 'top'
                }}
              />
            )}

            {/* Past Workload (Solid line with Area fill) */}
            <Area
              type="monotone"
              dataKey="displayActual"
              name="Past Workload"
              stroke="#38bdf8"
              strokeWidth={2.5}
              fill="url(#actualAreaGradient)"
              isAnimationActive={false}
              connectNulls={false}
            />

            {/* Future Predicted Workload (Dashed glowing line) */}
            <Area
              type="monotone"
              dataKey="predicted"
              name={`Forecast (${bestMethod})`}
              stroke="#2dd4bf"
              strokeWidth={3}
              strokeDasharray="5 5"
              fill="url(#forecastAreaGradient)"
              isAnimationActive={false}
              connectNulls={false}
            />

            {/* Optional model comparisons */}
            {showModels && (
              <>
                <Line
                  type="monotone"
                  dataKey="sma"
                  name="Balanced (SMA)"
                  stroke="#38bdf8"
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="wma"
                  name="Recent-Weighted (WMA)"
                  stroke="#c084fc"
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="ema"
                  name="Fast-Adaptive (EMA)"
                  stroke="#34d399"
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                  dot={false}
                  isAnimationActive={false}
                />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Indicator */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-[#38bdf8]" />
            <span>Recorded CPU Usage</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-[#2dd4bf] border-b-2 border-dashed border-[#2dd4bf]" />
            <span className="text-teal-300 font-medium">Future Expected Workload</span>
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          Proactive auto-scaling triggers before spikes happen
        </div>
      </div>
    </div>
  );
};

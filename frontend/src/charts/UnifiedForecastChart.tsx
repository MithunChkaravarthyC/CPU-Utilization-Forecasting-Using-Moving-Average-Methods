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
      <div className="bg-black border border-neutral-700 p-3.5 rounded-xl shadow-2xl text-xs space-y-1.5 font-sans min-w-[190px]">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5 mb-1.5">
          <span className="text-neutral-300 font-medium">{label}</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              isFuture
                ? 'bg-neutral-900 text-white border border-neutral-600'
                : 'bg-neutral-950 text-neutral-400 border border-neutral-800'
            }`}
          >
            {isFuture ? 'Predicted' : 'Recorded'}
          </span>
        </div>
        {payload.map((entry: any, index: number) => {
          if (entry.value === null || entry.value === undefined) return null;
          return (
            <div key={`entry-${index}`} className="flex items-center justify-between space-x-3 text-xs">
              <span className="flex items-center space-x-1.5 text-neutral-400">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || '#ffffff' }} />
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
    <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl p-6 shadow-sm space-y-4">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-white tracking-wide">
              Workload Timeline & Proactive Forecast
            </h3>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-900 text-white border border-neutral-700">
              Next {horizon} Ahead
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
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
                ? 'bg-white text-black font-bold border-white'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
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
                ? 'bg-neutral-900 text-white border-neutral-700'
                : 'bg-neutral-950 text-neutral-500 border-neutral-800'
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
              {/* Actual CPU gradient (Cyan) */}
              <linearGradient id="actualAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.30} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>

              {/* Predicted Future Gradient (Amber Glow) */}
              <linearGradient id="forecastAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />

            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              stroke="#737373"
              fontSize={11}
              tickLine={false}
              minTickGap={35}
            />

            <YAxis
              stroke="#737373"
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
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Ceiling (${highThreshold}%)`,
                    fill: '#ef4444',
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
                stroke="#a855f7"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                label={{
                  value: 'NOW (Forecast Start)',
                  fill: '#c084fc',
                  fontSize: 10,
                  position: 'top'
                }}
              />
            )}

            {/* Past Workload (Cyan Solid line with Area fill) */}
            <Area
              type="monotone"
              dataKey="displayActual"
              name="Past Workload"
              stroke="#06b6d4"
              strokeWidth={2.5}
              fill="url(#actualAreaGradient)"
              isAnimationActive={false}
              connectNulls={false}
            />

            {/* Future Predicted Workload (Amber Dashed line) */}
            <Area
              type="monotone"
              dataKey="predicted"
              name={`Forecast (${bestMethod})`}
              stroke="#f59e0b"
              strokeWidth={3}
              strokeDasharray="6 6"
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
                  strokeWidth={1.8}
                  strokeDasharray="3 3"
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="wma"
                  name="Recent-Weighted (WMA)"
                  stroke="#c084fc"
                  strokeWidth={1.8}
                  strokeDasharray="4 4"
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="ema"
                  name="Fast-Adaptive (EMA)"
                  stroke="#34d399"
                  strokeWidth={1.8}
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
      <div className="flex flex-wrap items-center justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-800">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-cyan-400" />
            <span className="text-cyan-300">Recorded CPU Usage</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-amber-400 border-b-2 border-dashed border-amber-400" />
            <span className="text-amber-300 font-medium">Future Expected Workload</span>
          </span>
        </div>
        <div className="text-[11px] text-neutral-400">
          Proactive auto-scaling triggers before spikes happen
        </div>
      </div>
    </div>
  );
};

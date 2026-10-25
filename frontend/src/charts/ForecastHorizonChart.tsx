import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { ForecastPoint } from '../types';

interface ForecastHorizonChartProps {
  historicalData: ForecastPoint[];
  forecastData: ForecastPoint[];
  horizon: string;
  bestMethod: string;
  highThreshold?: number;
}

const CustomForecastTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const isForecast = payload[0]?.payload?.is_forecast;
    return (
      <div className="bg-black border border-neutral-700 p-3 rounded-xl shadow-xl text-xs space-y-1 font-mono">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-1 mb-1">
          <span className="text-neutral-400">{label}</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
              isForecast ? 'bg-neutral-900 text-white border border-neutral-700' : 'bg-neutral-950 text-neutral-400'
            }`}
          >
            {isForecast ? 'Recursive Forecast' : 'Historical Sample'}
          </span>
        </div>
        {payload.map((entry: any, index: number) => {
          if (entry.value === null || entry.value === undefined) return null;
          return (
            <div key={`item-${index}`} className="flex items-center justify-between space-x-4">
              <span className="flex items-center space-x-1.5 text-neutral-300">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || '#ffffff' }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-bold text-white">{Number(entry.value).toFixed(2)}%</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export const ForecastHorizonChart: React.FC<ForecastHorizonChartProps> = ({
  historicalData,
  forecastData,
  horizon,
  bestMethod,
  highThreshold = 75
}) => {
  // Combine historical tail with forecast series
  // To avoid huge datasets, slice historical to last 40 points
  const recentHistory = historicalData.slice(-40);
  const combinedData = [...recentHistory, ...forecastData.filter((p) => p.is_forecast)];

  const formatXAxis = (tickItem: string) => {
    if (!tickItem) return '';
    const parts = tickItem.split(' ');
    if (parts.length > 1) {
      return parts[1].substring(0, 5);
    }
    return tickItem.substring(11, 16);
  };

  const dividerTimestamp = forecastData[0]?.timestamp;

  return (
    <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-semibold text-white">
              {horizon.toUpperCase()} Multi-Step Forecast Horizon
            </h3>
            <span className="px-2 py-0.5 rounded bg-neutral-900 text-white text-xs font-mono border border-neutral-700">
              Recursive Horizon
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Historical Actual vs. Recursive Mathematical Projections ({bestMethod} highlighted)
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-cyan-400" />
            <span className="text-cyan-300">Observed History</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-amber-400 border-b border-dashed border-amber-400" />
            <span className="text-amber-300">Multi-step Future</span>
          </div>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={combinedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              stroke="#737373"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#737373"
              fontSize={11}
              tickLine={false}
              ticks={[0, 20, 40, 60, 75, 100]}
            />
            <Tooltip content={<CustomForecastTooltip />} />

            {/* Threshold reference */}
            <ReferenceLine
              y={highThreshold}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Threshold (${highThreshold}%)`,
                fill: '#ef4444',
                fontSize: 10,
                position: 'insideTopRight'
              }}
            />

            {/* Vertical dividing line between history and forecast */}
            {dividerTimestamp && (
              <ReferenceLine
                x={dividerTimestamp}
                stroke="#a855f7"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                label={{
                  value: 'Forecast Start ➔',
                  fill: '#c084fc',
                  fontSize: 10,
                  position: 'top'
                }}
              />
            )}

            {/* Historical Actual */}
            <Line
              type="monotone"
              dataKey="actual"
              name="Historical Actual"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={false}
            />

            {/* SMA Forecast */}
            <Line
              type="monotone"
              dataKey="sma"
              name="SMA Forecast"
              stroke="#38bdf8"
              strokeWidth={bestMethod === 'SMA' ? 2.5 : 1.5}
              strokeDasharray={bestMethod === 'SMA' ? undefined : '3 3'}
              dot={false}
            />

            {/* WMA Forecast */}
            <Line
              type="monotone"
              dataKey="wma"
              name="WMA Forecast"
              stroke="#a855f7"
              strokeWidth={bestMethod === 'WMA' ? 2.5 : 1.5}
              strokeDasharray={bestMethod === 'WMA' ? undefined : '3 3'}
              dot={false}
            />

            {/* EMA Forecast */}
            <Line
              type="monotone"
              dataKey="ema"
              name="EMA Forecast"
              stroke="#10b981"
              strokeWidth={bestMethod === 'EMA' ? 2.5 : 1.5}
              strokeDasharray={bestMethod === 'EMA' ? undefined : '3 3'}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

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
      <div className="bg-gray-950 border border-gray-700/80 p-3 rounded-lg shadow-xl text-xs space-y-1 font-mono">
        <div className="flex items-center justify-between border-b border-gray-800 pb-1 mb-1">
          <span className="text-gray-400">{label}</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
              isForecast ? 'bg-amber-950 text-amber-300' : 'bg-slate-800 text-slate-300'
            }`}
          >
            {isForecast ? 'Recursive Forecast' : 'Historical Sample'}
          </span>
        </div>
        {payload.map((entry: any, index: number) => {
          if (entry.value === null || entry.value === undefined) return null;
          return (
            <div key={`item-${index}`} className="flex items-center justify-between space-x-4">
              <span className="flex items-center space-x-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
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
    <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-semibold text-white">
              {horizon.toUpperCase()} Multi-Step Forecast Horizon
            </h3>
            <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 text-xs font-mono border border-sky-800/50">
              Recursive Horizon
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Historical Actual vs. Recursive Mathematical Projections ({bestMethod} highlighted)
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-slate-300" />
            <span className="text-gray-300">Observed History</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-sky-400 border-b border-dashed" />
            <span className="text-sky-300">Multi-step Future</span>
          </div>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={combinedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              stroke="#6b7280"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#6b7280"
              fontSize={11}
              tickLine={false}
              ticks={[0, 20, 40, 60, 75, 100]}
            />
            <Tooltip content={<CustomForecastTooltip />} />

            {/* Threshold reference */}
            <ReferenceLine
              y={highThreshold}
              stroke="#f43f5e"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Threshold (${highThreshold}%)`,
                fill: '#f43f5e',
                fontSize: 10,
                position: 'insideTopRight'
              }}
            />

            {/* Vertical dividing line between history and forecast */}
            {dividerTimestamp && (
              <ReferenceLine
                x={dividerTimestamp}
                stroke="#0284c7"
                strokeWidth={1.5}
                label={{
                  value: 'Forecast Start ➔',
                  fill: '#38bdf8',
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
              stroke="#cbd5e1"
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
              stroke="#c084fc"
              strokeWidth={bestMethod === 'WMA' ? 2.5 : 1.5}
              strokeDasharray={bestMethod === 'WMA' ? undefined : '3 3'}
              dot={false}
            />

            {/* EMA Forecast */}
            <Line
              type="monotone"
              dataKey="ema"
              name="EMA Forecast"
              stroke="#34d399"
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

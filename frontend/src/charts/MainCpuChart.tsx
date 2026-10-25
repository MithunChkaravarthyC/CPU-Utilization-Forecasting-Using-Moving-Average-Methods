import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { ForecastPoint } from '../types';

interface MainCpuChartProps {
  data: ForecastPoint[];
  highThreshold?: number;
  lowThreshold?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black border border-neutral-700 p-3 rounded-xl shadow-xl text-xs space-y-1 font-mono">
        <p className="text-neutral-400 font-semibold border-b border-neutral-800 pb-1 mb-1">
          {label}
        </p>
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

export const MainCpuChart: React.FC<MainCpuChartProps> = ({
  data,
  highThreshold = 75,
  lowThreshold = 20
}) => {
  const [showActual, setShowActual] = useState(true);
  const [showSMA, setShowSMA] = useState(true);
  const [showWMA, setShowWMA] = useState(true);
  const [showEMA, setShowEMA] = useState(true);

  // Formatter for timestamp on X-axis (shows HH:mm)
  const formatXAxis = (tickItem: string) => {
    if (!tickItem) return '';
    const parts = tickItem.split(' ');
    if (parts.length > 1) {
      return parts[1].substring(0, 5);
    }
    return tickItem.substring(11, 16);
  };

  return (
    <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">Historical CPU Smoothing</h3>
          <p className="text-xs text-neutral-400">
            Comparing Actual measurements with SMA, WMA, and EMA curves
          </p>
        </div>

        {/* Visibility Toggles */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
          <button
            onClick={() => setShowActual(!showActual)}
            className={`px-2.5 py-1 rounded-lg border transition ${
              showActual
                ? 'bg-cyan-950 text-cyan-300 border-cyan-700 font-bold'
                : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:text-white'
            }`}
          >
            Actual
          </button>
          <button
            onClick={() => setShowSMA(!showSMA)}
            className={`px-2.5 py-1 rounded-lg border transition ${
              showSMA
                ? 'bg-sky-950 text-sky-300 border-sky-700 font-semibold'
                : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:text-white'
            }`}
          >
            SMA
          </button>
          <button
            onClick={() => setShowWMA(!showWMA)}
            className={`px-2.5 py-1 rounded-lg border transition ${
              showWMA
                ? 'bg-purple-950 text-purple-300 border-purple-700 font-semibold'
                : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:text-white'
            }`}
          >
            WMA
          </button>
          <button
            onClick={() => setShowEMA(!showEMA)}
            className={`px-2.5 py-1 rounded-lg border transition ${
              showEMA
                ? 'bg-emerald-950 text-emerald-300 border-emerald-700 font-semibold'
                : 'bg-neutral-950 text-neutral-500 border-neutral-800 hover:text-white'
            }`}
          >
            EMA
          </button>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            <Tooltip content={<CustomTooltip />} />
            
            {/* High threshold reference line */}
            <ReferenceLine
              y={highThreshold}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `High CPU (${highThreshold}%)`,
                fill: '#ef4444',
                fontSize: 10,
                position: 'insideTopRight'
              }}
            />
            
            {/* Low threshold reference line */}
            <ReferenceLine
              y={lowThreshold}
              stroke="#22c55e"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: `Low CPU (${lowThreshold}%)`,
                fill: '#22c55e',
                fontSize: 10,
                position: 'insideBottomRight'
              }}
            />

            {showActual && (
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual CPU"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: '#06b6d4', strokeWidth: 1 }}
              />
            )}
            {showSMA && (
              <Line
                type="monotone"
                dataKey="sma"
                name="SMA"
                stroke="#38bdf8"
                strokeDasharray="3 3"
                strokeWidth={1.75}
                dot={false}
              />
            )}
            {showWMA && (
              <Line
                type="monotone"
                dataKey="wma"
                name="WMA"
                stroke="#a855f7"
                strokeDasharray="4 4"
                strokeWidth={1.75}
                dot={false}
              />
            )}
            {showEMA && (
              <Line
                type="monotone"
                dataKey="ema"
                name="EMA"
                stroke="#10b981"
                strokeDasharray="2 2"
                strokeWidth={1.75}
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

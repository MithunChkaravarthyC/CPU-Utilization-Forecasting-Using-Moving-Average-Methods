import React, { useState } from 'react';
import { ScalingDecision } from '../types';
import { Server, ArrowUpRight, ArrowDownRight, CheckCircle2, Shield, Sliders } from 'lucide-react';

interface ScalingPageProps {
  currentCpu: number | null;
  forecastCpu: number | null;
  scaling: ScalingDecision | null;
  highThreshold: number;
  setHighThreshold: (t: number) => void;
  lowThreshold: number;
  setLowThreshold: (t: number) => void;
}

export const ScalingPage: React.FC<ScalingPageProps> = ({
  currentCpu,
  forecastCpu,
  scaling,
  highThreshold,
  setHighThreshold,
  lowThreshold,
  setLowThreshold
}) => {
  // Interactive simulator state
  const [testForecast, setTestForecast] = useState<number>(forecastCpu || 78.5);

  const calculateSimulatedDecision = (val: number, high: number, low: number) => {
    const diff = val - high;
    if (val >= high) {
      return {
        decision: 'SCALE UP',
        color: 'text-rose-400 bg-rose-950 border-rose-700',
        reason: `Exceeds high threshold by +${diff.toFixed(1)}%. Trigger horizontal cluster autoscaling.`
      };
    } else if (val < low) {
      const diffLow = val - low;
      return {
        decision: 'SCALE DOWN',
        color: 'text-amber-400 bg-amber-950 border-amber-700',
        reason: `Falls below low threshold by ${diffLow.toFixed(1)}%. Consolidate workloads and decommission idle nodes.`
      };
    } else {
      return {
        decision: 'NORMAL / MONITOR',
        color: 'text-emerald-400 bg-emerald-950 border-emerald-700',
        reason: `Headroom is balanced between ${low}% and ${high}%. Maintain current instance fleet.`
      };
    }
  };

  const simResult = calculateSimulatedDecision(testForecast, highThreshold, lowThreshold);

  // Simulated decision timeline history
  const historyEvents = [
    { time: '10:00:00', forecast: 72.4, threshold: highThreshold, action: 'NORMAL', statusColor: 'text-emerald-400' },
    { time: '10:15:00', forecast: 74.8, threshold: highThreshold, action: 'NORMAL', statusColor: 'text-emerald-400' },
    { time: '10:30:00', forecast: 78.6, threshold: highThreshold, action: 'SCALE UP', statusColor: 'text-rose-400' },
    { time: '10:45:00', forecast: 82.1, threshold: highThreshold, action: 'SCALE UP', statusColor: 'text-rose-400' },
    { time: '11:00:00', forecast: 65.3, threshold: highThreshold, action: 'NORMAL', statusColor: 'text-emerald-400' },
    { time: '11:15:00', forecast: 18.2, threshold: highThreshold, action: 'SCALE DOWN', statusColor: 'text-amber-400' }
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Server className="w-6 h-6 text-sky-400" />
          <span>Cloud Resource Scaling Logic</span>
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Proactive capacity orchestration based on mathematical moving-average forecasts
        </p>
      </div>

      {/* Primary Scaling Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">
            Current Host Utilization
          </span>
          <span className="text-2xl font-mono font-bold text-white">
            {currentCpu !== null ? `${currentCpu.toFixed(1)}%` : '--'}
          </span>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">
            Target Forecast (Best Model)
          </span>
          <span className="text-2xl font-mono font-bold text-sky-300">
            {forecastCpu !== null ? `${forecastCpu.toFixed(1)}%` : '--'}
          </span>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">
            Active High Threshold
          </span>
          <span className="text-2xl font-mono font-bold text-rose-400">
            {highThreshold.toFixed(1)}%
          </span>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">
            Deterministic Decision
          </span>
          <span className="text-xl font-mono font-extrabold text-white">
            {scaling?.decision || 'MONITOR'}
          </span>
        </div>
      </div>

      {/* Interactive Scaling Simulator */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-gray-800">
          <Sliders className="w-5 h-5 text-sky-400" />
          <h3 className="text-base font-semibold text-white">
            Interactive Threshold & Scaling Simulator
          </h3>
        </div>

        <p className="text-xs text-gray-300">
          Adjust hypothetical forecast levels and scaling thresholds to verify deterministic decision behavior:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div>
            <div className="flex justify-between text-xs text-gray-300 font-mono mb-1">
              <span>Hypothetical Forecast:</span>
              <span className="font-bold text-sky-400">{testForecast.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={testForecast}
              onChange={(e) => setTestForecast(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-300 font-mono mb-1">
              <span>Scale-Up Threshold:</span>
              <span className="font-bold text-rose-400">{highThreshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="1"
              value={highThreshold}
              onChange={(e) => setHighThreshold(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-300 font-mono mb-1">
              <span>Scale-Down Threshold:</span>
              <span className="font-bold text-amber-400">{lowThreshold}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              step="1"
              value={lowThreshold}
              onChange={(e) => setLowThreshold(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>

        {/* Live Simulation Output Box */}
        <div className={`p-4 rounded-lg border font-mono ${simResult.color} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider block opacity-75">
              Simulated Autonomous Decision
            </span>
            <span className="text-xl font-extrabold">{simResult.decision}</span>
            <p className="text-xs mt-1 opacity-90">{simResult.reason}</p>
          </div>
          <div className="text-right text-xs">
            <span>Forecast: <strong>{testForecast.toFixed(1)}%</strong></span>
            <br />
            <span>Delta: <strong>{(testForecast - highThreshold).toFixed(1)}%</strong></span>
          </div>
        </div>
      </div>

      {/* Decision History Log */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
        <h3 className="text-base font-semibold text-white">Scaling Decision Audit Trail</h3>
        <div className="overflow-x-auto border border-gray-800 rounded-lg">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-gray-950 text-gray-400 uppercase tracking-wider border-b border-gray-800">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Forecast Value</th>
                <th className="py-2.5 px-3">Configured Threshold</th>
                <th className="py-2.5 px-3">Evaluated Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {historyEvents.map((evt, i) => (
                <tr key={i} className="hover:bg-gray-850">
                  <td className="py-2 px-3 text-gray-300">{evt.time}</td>
                  <td className="py-2 px-3 font-semibold text-white">{evt.forecast.toFixed(1)}%</td>
                  <td className="py-2 px-3 text-gray-400">{evt.threshold.toFixed(1)}%</td>
                  <td className={`py-2 px-3 font-bold ${evt.statusColor}`}>
                    {evt.action}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

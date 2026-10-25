import React from 'react';
import { AccuracyMetricItem } from '../types';
import { Award, CheckCircle, ShieldCheck } from 'lucide-react';

interface AccuracyCardProps {
  metrics: AccuracyMetricItem[];
  bestMethod: string | null;
}

export const AccuracyCard: React.FC<AccuracyCardProps> = ({ metrics, bestMethod }) => {
  const getFriendlyName = (method: string) => {
    switch (method) {
      case 'EMA':
        return { name: 'Fast-Adaptive', badge: 'Spike Tracker', color: '#10b981' };
      case 'WMA':
        return { name: 'Recent-Weighted', badge: 'Trend Focus', color: '#a855f7' };
      case 'SMA':
        return { name: 'Balanced Average', badge: 'Steady Baseline', color: '#38bdf8' };
      default:
        return { name: method, badge: 'Standard', color: '#737373' };
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">
            Model Prediction Accuracy
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Tested against recent traffic to verify which model provides the most reliable forecast.
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-neutral-900 text-cyan-300 border border-neutral-700 font-medium flex items-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Real-time Verified</span>
        </span>
      </div>

      <div className="space-y-3">
        {metrics.map((row) => {
          const info = getFriendlyName(row.method);
          const isBest = bestMethod === row.method;
          // Calculate an intuitive accuracy percentage: 100 - MAE (clamped 0 to 100)
          const accuracyPercent = Math.max(0, Math.min(100, 100 - row.mae));

          return (
            <div
              key={row.method}
              className={`p-3.5 rounded-xl border transition ${
                isBest
                  ? 'bg-neutral-900/90 border-neutral-700 shadow-sm'
                  : 'bg-neutral-950 border-neutral-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: info.color }} />
                  <span className="font-bold text-white text-xs">{info.name}</span>
                  <span className="text-[10px] font-mono text-neutral-400">({row.method})</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300">
                    {info.badge}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-white">
                    {accuracyPercent.toFixed(1)}% Accurate
                  </span>
                  {isBest && (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-400 text-black font-extrabold shadow-sm">
                      <Award className="w-3 h-3" />
                      <span>TOP PICK</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Accuracy progress bar */}
              <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${accuracyPercent}%`, backgroundColor: info.color }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400">
                <span>Avg error margin: ±{row.mae.toFixed(1)}%</span>
                <span>Peak divergence: ±{row.rmse.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

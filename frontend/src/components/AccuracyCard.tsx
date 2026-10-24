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
        return { name: 'Fast-Adaptive', badge: 'Spike Tracker', color: '#2dd4bf' };
      case 'WMA':
        return { name: 'Recent-Weighted', badge: 'Trend Focus', color: '#c084fc' };
      case 'SMA':
        return { name: 'Balanced Average', badge: 'Steady Baseline', color: '#38bdf8' };
      default:
        return { name: method, badge: 'Standard', color: '#94a3b8' };
    }
  };

  return (
    <div className="bg-[#0e1424]/90 backdrop-blur border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">
            Model Prediction Accuracy
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Tested against recent traffic to verify which model provides the most reliable forecast.
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 font-medium flex items-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5" />
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
                  ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                  : 'bg-slate-950/40 border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: info.color }} />
                  <span className="font-bold text-white text-xs">{info.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">({row.method})</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                    {info.badge}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-white">
                    {accuracyPercent.toFixed(1)}% Accurate
                  </span>
                  {isBest && (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-950 text-amber-300 border border-amber-600/50 font-bold">
                      <Award className="w-3 h-3" />
                      <span>TOP PICK</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Accuracy progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${accuracyPercent}%`,
                    backgroundColor: isBest ? '#f59e0b' : info.color
                  }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
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

import React from 'react';
import { Award, CheckCircle } from 'lucide-react';

interface ForecastComparisonCardProps {
  smaForecast: number | null;
  wmaForecast: number | null;
  emaForecast: number | null;
  bestMethod: string | null;
  bestMethodReason?: string;
  horizon: string;
}

export const ForecastComparisonCard: React.FC<ForecastComparisonCardProps> = ({
  smaForecast,
  wmaForecast,
  emaForecast,
  bestMethod,
  bestMethodReason,
  horizon
}) => {
  const methods = [
    {
      id: 'SMA',
      name: 'Simple Moving Average',
      val: smaForecast,
      color: 'border-sky-500/40 text-sky-300',
      barColor: 'bg-sky-500'
    },
    {
      id: 'WMA',
      name: 'Weighted Moving Average',
      val: wmaForecast,
      color: 'border-purple-500/40 text-purple-300',
      barColor: 'bg-purple-500'
    },
    {
      id: 'EMA',
      name: 'Exponential Moving Average',
      val: emaForecast,
      color: 'border-emerald-500/40 text-emerald-300',
      barColor: 'bg-emerald-500'
    }
  ];

  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">Method Comparison</h3>
          <p className="text-xs text-gray-400">
            End-of-horizon ({horizon}) predictions calculated by each method
          </p>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
          3 Mathematical Models
        </span>
      </div>

      <div className="space-y-3">
        {methods.map((m) => {
          const isBest = bestMethod === m.id;
          return (
            <div
              key={m.id}
              className={`p-3 rounded-lg border transition ${
                isBest
                  ? 'bg-amber-950/20 border-amber-500/60 shadow-sm'
                  : 'bg-gray-950/40 border-gray-800/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-xs uppercase px-1.5 py-0.5 rounded bg-gray-800 text-white">
                    {m.id}
                  </span>
                  <span className="text-xs text-gray-300 hidden sm:inline">{m.name}</span>
                  {isBest && (
                    <span className="flex items-center space-x-1 text-[10px] uppercase font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-700/60">
                      <Award className="w-3 h-3" />
                      <span>Best Performer</span>
                    </span>
                  )}
                </div>
                <span className="font-mono text-base font-bold text-white">
                  {m.val !== null ? `${m.val.toFixed(1)}%` : '--'}
                </span>
              </div>

              <div className="w-full bg-gray-800/80 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${m.barColor}`}
                  style={{ width: `${Math.min(100, Math.max(0, m.val || 0))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {bestMethod && (
        <div className="p-3 bg-gray-950 border border-gray-800 rounded-lg text-xs flex items-start space-x-2 text-gray-300">
          <CheckCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">Selection Rationale: </span>
            <span>{bestMethodReason || `${bestMethod} achieved minimal error in historical backtesting.`}</span>
          </div>
        </div>
      )}
    </div>
  );
};

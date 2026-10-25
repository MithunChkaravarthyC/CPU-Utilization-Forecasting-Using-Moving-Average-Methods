import React from 'react';
import { Award, CheckCircle2, TrendingUp } from 'lucide-react';

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
  horizon
}) => {
  const models = [
    {
      id: 'EMA',
      name: 'Fast-Adaptive',
      sub: 'Rapid spike response',
      val: emaForecast,
      color: '#10b981',
      desc: 'Adapts quickly when CPU usage suddenly ramps up'
    },
    {
      id: 'WMA',
      name: 'Recent-Weighted',
      sub: 'Focuses on recent trend',
      val: wmaForecast,
      color: '#a855f7',
      desc: 'Weights the last 15 minutes heavier than older data'
    },
    {
      id: 'SMA',
      name: 'Balanced Average',
      sub: 'Even smoothing',
      val: smaForecast,
      color: '#38bdf8',
      desc: 'Filters out noisy spikes for stable baseline load'
    }
  ];

  return (
    <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">
            Model Predictions ({horizon} Horizon)
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Compare expected CPU load across different moving average styles.
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-neutral-900 text-neutral-300 border border-neutral-700">
          3 Prediction Styles
        </span>
      </div>

      <div className="space-y-3">
        {models.map((m) => {
          const isBest = bestMethod === m.id;
          const displayVal = m.val !== null ? `${m.val.toFixed(1)}%` : '--';

          return (
            <div
              key={m.id}
              className={`p-3.5 rounded-xl border transition ${
                isBest
                  ? 'bg-neutral-900/90 border-neutral-700 shadow-sm'
                  : 'bg-neutral-950 border-neutral-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} />
                  <span className="font-bold text-white text-xs">{m.name}</span>
                  <span className="text-[11px] text-neutral-400">({m.id})</span>
                  {isBest && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-400 text-black font-extrabold flex items-center space-x-1 shadow-sm">
                      <Award className="w-3 h-3" />
                      <span>RECOMMENDED</span>
                    </span>
                  )}
                </div>

                <span className="text-sm font-mono font-extrabold text-white">
                  {displayVal}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, m.val || 0))}%`,
                    backgroundColor: m.color
                  }}
                />
              </div>

              <p className="mt-2 text-[11px] text-neutral-400">
                {m.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { AccuracyMetricItem } from '../types';
import { Award, Info } from 'lucide-react';

interface AccuracyCardProps {
  metrics: AccuracyMetricItem[];
  bestMethod: string | null;
}

export const AccuracyCard: React.FC<AccuracyCardProps> = ({ metrics, bestMethod }) => {
  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">Historical Backtest Accuracy</h3>
          <p className="text-xs text-gray-400">
            One-step-ahead backtest evaluation on historical samples (zero data leakage)
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 uppercase tracking-wider font-mono">
              <th className="py-2.5 px-3">Method</th>
              <th className="py-2.5 px-3">MAE (%)</th>
              <th className="py-2.5 px-3">MSE (%²)</th>
              <th className="py-2.5 px-3">RMSE (%)</th>
              <th className="py-2.5 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 font-mono">
            {metrics.map((row) => {
              const isBest = bestMethod === row.method;
              return (
                <tr
                  key={row.method}
                  className={`transition ${
                    isBest ? 'bg-amber-950/20 text-white font-bold' : 'text-gray-300 hover:bg-gray-850'
                  }`}
                >
                  <td className="py-2.5 px-3 flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full" style={{
                      backgroundColor: row.method === 'SMA' ? '#38bdf8' : row.method === 'WMA' ? '#c084fc' : '#34d399'
                    }} />
                    <span>{row.method}</span>
                  </td>
                  <td className="py-2.5 px-3 text-sky-300">{row.mae.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-gray-400">{row.mse.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-cyan-300">{row.rmse.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right">
                    {isBest ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300 border border-amber-700/60">
                        <Award className="w-3 h-3" />
                        <span>LOWEST ERROR</span>
                      </span>
                    ) : (
                      <span className="text-gray-500 text-[10px]">--</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center space-x-2 text-[11px] text-gray-400 bg-gray-950/60 p-2.5 rounded-lg border border-gray-800/80">
        <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
        <span>Lower error indicates better historical forecasting performance. Evaluated on observed data only.</span>
      </div>
    </div>
  );
};

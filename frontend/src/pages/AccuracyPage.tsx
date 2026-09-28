import React, { useEffect, useState } from 'react';
import { fetchWindowComparison } from '../services/api';
import { WindowAnalysisItem, AccuracyMetricItem } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Activity, Award, Calculator, Info, RefreshCw } from 'lucide-react';

interface AccuracyPageProps {
  metrics: AccuracyMetricItem[];
  bestMethod: string;
  source: 'LIVE' | 'SIMULATION';
}

export const AccuracyPage: React.FC<AccuracyPageProps> = ({ metrics, bestMethod, source }) => {
  const [windowData, setWindowData] = useState<WindowAnalysisItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWindowComparison = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchWindowComparison(source);
      setWindowData(res.windows);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch window comparison');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWindowComparison();
  }, [source]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-800 gap-2">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Activity className="w-6 h-6 text-sky-400" />
            <span>Forecasting Accuracy & Window Analysis</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Empirical evaluation of error metrics (MAE, MSE, RMSE) and window size dynamics
          </p>
        </div>

        <button
          onClick={loadWindowComparison}
          disabled={isLoading}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-medium border border-gray-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* Accuracy Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((m) => {
          const isBest = bestMethod === m.method;
          return (
            <div
              key={m.method}
              className={`p-5 rounded-xl border transition ${
                isBest
                  ? 'bg-amber-950/20 border-amber-500/60 shadow-md'
                  : 'bg-gray-900 border-gray-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-base font-bold text-white">
                  {m.method}
                </span>
                {isBest && (
                  <span className="flex items-center space-x-1 text-[10px] font-bold uppercase text-amber-400 px-2 py-0.5 rounded bg-amber-950 border border-amber-700">
                    <Award className="w-3 h-3" />
                    <span>Best Model</span>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono">
                <div className="bg-gray-950 p-2 rounded">
                  <span className="text-[10px] text-gray-400 block">MAE</span>
                  <span className="text-base font-bold text-sky-300">{m.mae.toFixed(2)}%</span>
                </div>
                <div className="bg-gray-950 p-2 rounded">
                  <span className="text-[10px] text-gray-400 block">MSE</span>
                  <span className="text-base font-bold text-gray-300">{m.mse.toFixed(2)}</span>
                </div>
                <div className="bg-gray-950 p-2 rounded">
                  <span className="text-[10px] text-gray-400 block">RMSE</span>
                  <span className="text-base font-bold text-cyan-300">{m.rmse.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Window Size Comparison Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-white">
              Moving Average Window Size Analysis (MAE Comparison)
            </h3>
            <p className="text-xs text-gray-400">
              Comparing error across window sizes n ∈ &#123;3, 5, 7, 15, 30, 60&#125;
            </p>
          </div>
          <span className="text-xs font-mono text-gray-400">Source: {source}</span>
        </div>

        {error ? (
          <div className="p-4 bg-rose-950/40 text-rose-300 text-xs rounded-lg border border-rose-800">
            {error}
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={windowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="window" stroke="#6b7280" fontSize={11} tickFormatter={(w) => `n=${w}`} />
                <YAxis stroke="#6b7280" fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#030712', borderColor: '#374151', fontSize: '12px' }}
                  itemStyle={{ fontFamily: 'monospace' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="sma_mae" name="SMA MAE" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="wma_mae" name="WMA MAE" fill="#c084fc" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ema_mae" name="EMA MAE" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Detailed Window Size Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
        <h3 className="text-base font-semibold text-white">Detailed Window Error Benchmark Table</h3>
        <div className="overflow-x-auto border border-gray-800 rounded-lg">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-gray-950 text-gray-400 uppercase tracking-wider border-b border-gray-800">
              <tr>
                <th className="py-2.5 px-3">Window (n)</th>
                <th className="py-2.5 px-3">SMA MAE (%)</th>
                <th className="py-2.5 px-3">SMA RMSE (%)</th>
                <th className="py-2.5 px-3">WMA MAE (%)</th>
                <th className="py-2.5 px-3">WMA RMSE (%)</th>
                <th className="py-2.5 px-3">EMA MAE (%)</th>
                <th className="py-2.5 px-3">EMA RMSE (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {windowData.map((row) => (
                <tr key={row.window} className="hover:bg-gray-850">
                  <td className="py-2 px-3 font-bold text-white">n = {row.window}</td>
                  <td className="py-2 px-3 text-sky-300">{row.sma_mae.toFixed(2)}</td>
                  <td className="py-2 px-3 text-gray-400">{row.sma_rmse.toFixed(2)}</td>
                  <td className="py-2 px-3 text-purple-300">{row.wma_mae.toFixed(2)}</td>
                  <td className="py-2 px-3 text-gray-400">{row.wma_rmse.toFixed(2)}</td>
                  <td className="py-2 px-3 text-emerald-300">{row.ema_mae.toFixed(2)}</td>
                  <td className="py-2 px-3 text-gray-400">{row.ema_rmse.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mathematical Window Trade-offs Explained */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-2">
          <h4 className="text-sm font-bold text-sky-400">Smaller Windows (e.g. n = 3, 5)</h4>
          <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
            <li><strong>High Responsiveness:</strong> Quickly detects sharp workload transitions and spikes.</li>
            <li><strong>Noise Sensitivity:</strong> More prone to false alarms caused by transient CPU bursts.</li>
            <li>Ideal for highly bursty, latency-sensitive microservices.</li>
          </ul>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-2">
          <h4 className="text-sm font-bold text-emerald-400">Larger Windows (e.g. n = 30, 60)</h4>
          <ul className="text-xs text-gray-300 space-y-1 list-disc list-inside">
            <li><strong>Superior Smoothness:</strong> Successfully filters out high-frequency random noise.</li>
            <li><strong>Lag / Inherent Delay:</strong> Slower to identify real underlying capacity depletion.</li>
            <li>Ideal for steady batch jobs and baseline capacity provisioning.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

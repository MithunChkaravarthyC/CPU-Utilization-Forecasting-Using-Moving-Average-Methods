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
import { Activity, Award, ShieldCheck, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

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
      setError(err.message || 'Failed to fetch model comparison');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWindowComparison();
  }, [source]);

  const getModelTitle = (method: string) => {
    switch (method) {
      case 'EMA':
        return { name: 'Fast-Adaptive', tag: 'Fast Reaction', desc: 'Adapts quickly to unexpected traffic surges' };
      case 'WMA':
        return { name: 'Recent-Weighted', tag: 'Trend Focus', desc: 'Gives highest weight to the latest 15 minutes' };
      case 'SMA':
        return { name: 'Balanced Average', tag: 'Steady Baseline', desc: 'Smooths out noise for steady workloads' };
      default:
        return { name: method, tag: 'Standard', desc: 'General prediction model' };
    }
  };

  const getLookbackLabel = (n: number) => {
    if (n <= 3) return `${n} mins (Ultra Fast)`;
    if (n <= 5) return `${n} mins (Balanced)`;
    if (n <= 15) return `${n} mins (Smooth)`;
    return `${n} mins (Long Trend)`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800 gap-2">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Activity className="w-5 h-5 text-white" />
            <span>Model Performance & Reliability</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Verification of prediction accuracy and smoothing lookback settings against your workload.
          </p>
        </div>

        <button
          onClick={loadWindowComparison}
          disabled={isLoading}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold border border-neutral-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Reliability</span>
        </button>
      </div>

      {/* 3 Model Accuracy Scorecards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((m) => {
          const info = getModelTitle(m.method);
          const isBest = bestMethod === m.method;
          const accuracyPercent = Math.max(0, Math.min(100, 100 - m.mae));

          return (
            <div
              key={m.method}
              className={`p-5 rounded-2xl border transition ${
                isBest
                  ? 'bg-neutral-900 border-neutral-600 shadow-md'
                  : 'bg-[#0a0a0a] border-neutral-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-white text-base font-sans">
                    {info.name}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400">({m.method})</span>
                </div>
                {isBest ? (
                  <span className="flex items-center space-x-1 text-[10px] font-bold uppercase text-black px-2 py-0.5 rounded-full bg-white shadow-sm">
                    <Award className="w-3 h-3" />
                    <span>Top Match</span>
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-900 text-neutral-400 border border-neutral-800">
                    {info.tag}
                  </span>
                )}
              </div>

              {/* Accuracy Big Number */}
              <div className="flex items-baseline space-x-2 mb-2">
                <span className="text-3xl font-extrabold text-white font-mono">
                  {accuracyPercent.toFixed(1)}%
                </span>
                <span className="text-xs text-neutral-400">accuracy score</span>
              </div>

              <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-white"
                  style={{ width: `${accuracyPercent}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-neutral-800 text-neutral-300">
                <div>
                  <span className="text-neutral-500 block text-[10px]">Average Error:</span>
                  <span className="font-mono font-bold text-neutral-200">±{m.mae.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">Peak Divergence:</span>
                  <span className="font-mono font-bold text-neutral-200">±{m.rmse.toFixed(1)}%</span>
                </div>
              </div>

              <p className="mt-3 text-[11px] text-neutral-400">
                {info.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Smoothing Lookback Chart */}
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-800">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              Lookback Tuning (Smoothing vs. Responsiveness)
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Lower error bars indicate a more accurate lookback window for current workload.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-neutral-900 text-white border border-neutral-700 font-mono">
            Source: {source}
          </span>
        </div>

        {error ? (
          <div className="p-4 bg-neutral-900 text-neutral-300 text-xs rounded-xl border border-neutral-700">
            {error}
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={windowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis
                  dataKey="window"
                  stroke="#737373"
                  fontSize={11}
                  tickFormatter={(w) => `${w}m lookback`}
                />
                <YAxis stroke="#737373" fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#000000', borderColor: '#404040', borderRadius: '12px', fontSize: '12px', color: '#ffffff' }}
                  formatter={(val: any) => [`±${Number(val).toFixed(1)}% error`, 'Error Margin']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="sma_mae" name="Balanced (SMA)" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="wma_mae" name="Recent-Weighted (WMA)" fill="#c084fc" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ema_mae" name="Fast-Adaptive (EMA)" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Clean Lookback Benchmark Table */}
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl p-6 space-y-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">
            Lookback Window Benchmark
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            5-minute smoothing delivers optimal accuracy for web servers, while 3-minute smoothing reacts fastest to sudden surges.
          </p>
        </div>

        <div className="overflow-x-auto border border-neutral-800 rounded-xl">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-neutral-950 text-neutral-400 uppercase tracking-wider border-b border-neutral-800 text-[11px]">
              <tr>
                <th className="py-3 px-4">Smoothing Window</th>
                <th className="py-3 px-4">Balanced Error</th>
                <th className="py-3 px-4">Weighted Error</th>
                <th className="py-3 px-4">Adaptive Error</th>
                <th className="py-3 px-4">Ideal Workload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 font-mono">
              {windowData.map((row) => (
                <tr key={row.window} className="hover:bg-neutral-900/40 transition">
                  <td className="py-3 px-4 font-bold text-white font-sans">
                    {getLookbackLabel(row.window)}
                  </td>
                  <td className="py-3 px-4 text-white">±{row.sma_mae.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-neutral-300">±{row.wma_mae.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-neutral-400 font-bold">±{row.ema_mae.toFixed(1)}%</td>
                  <td className="py-3 px-4 font-sans text-neutral-400">
                    {row.window <= 3
                      ? 'Spiky / Real-time APIs'
                      : row.window <= 7
                      ? 'General Production (Recommended)'
                      : 'Background Batch Processing'}
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

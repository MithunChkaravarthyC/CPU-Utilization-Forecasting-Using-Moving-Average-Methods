import React from 'react';
import { Activity, TrendingUp, Award, Zap } from 'lucide-react';
import { ScalingDecision } from '../types';

interface TopCardsProps {
  currentCpu: number | null;
  forecastCpu: number | null;
  bestMethod: string | null;
  bestMethodReason?: string;
  scaling: ScalingDecision | null;
  horizon: string;
}

export const TopCards: React.FC<TopCardsProps> = ({
  currentCpu,
  forecastCpu,
  bestMethod,
  bestMethodReason,
  scaling,
  horizon
}) => {
  const getActionColor = (decision?: string) => {
    switch (decision) {
      case 'SCALE UP':
        return 'text-rose-400 bg-rose-950/40 border-rose-800/60';
      case 'SCALE DOWN':
        return 'text-amber-400 bg-amber-950/40 border-amber-800/60';
      case 'NORMAL':
        return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60';
      default:
        return 'text-sky-400 bg-sky-950/40 border-sky-800/60';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Current CPU Card */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-5 shadow-sm hover:border-gray-700 transition">
        <div className="flex items-center justify-between text-gray-400 text-xs uppercase font-medium tracking-wider mb-2">
          <span>Current CPU</span>
          <Activity className="w-4 h-4 text-sky-400" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-mono font-bold text-white">
            {currentCpu !== null ? `${currentCpu.toFixed(1)}%` : '--'}
          </span>
          <span className="text-xs text-gray-400">sampled now</span>
        </div>
        <div className="mt-3 w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              (currentCpu || 0) >= 75
                ? 'bg-rose-500'
                : (currentCpu || 0) >= 50
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, currentCpu || 0))}%` }}
          />
        </div>
      </div>

      {/* Forecast CPU Card */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-5 shadow-sm hover:border-gray-700 transition">
        <div className="flex items-center justify-between text-gray-400 text-xs uppercase font-medium tracking-wider mb-2">
          <span>{horizon.toUpperCase()} Forecast</span>
          <TrendingUp className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-mono font-bold text-cyan-300">
            {forecastCpu !== null ? `${forecastCpu.toFixed(1)}%` : '--'}
          </span>
          <span className="text-xs text-gray-400">recursive math</span>
        </div>
        <div className="mt-2 text-xs text-gray-400 flex items-center justify-between">
          <span>Target Horizon</span>
          <span className="text-cyan-400 font-mono font-medium">{horizon} ahead</span>
        </div>
      </div>

      {/* Best Method Card */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-5 shadow-sm hover:border-gray-700 transition">
        <div className="flex items-center justify-between text-gray-400 text-xs uppercase font-medium tracking-wider mb-2">
          <span>Best Method</span>
          <Award className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-mono font-bold text-amber-300">
            {bestMethod || '--'}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/40">
            Lowest MAE
          </span>
        </div>
        <p className="mt-2 text-xs text-gray-400 truncate" title={bestMethodReason}>
          {bestMethodReason || 'Evaluated via historical backtesting'}
        </p>
      </div>

      {/* Action / Scaling Status Card */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-xl p-5 shadow-sm hover:border-gray-700 transition">
        <div className="flex items-center justify-between text-gray-400 text-xs uppercase font-medium tracking-wider mb-2">
          <span>Cloud Scaling</span>
          <Zap className="w-4 h-4 text-rose-400" />
        </div>
        <div className="flex items-baseline space-x-2">
          <span className={`text-2xl font-mono font-extrabold px-3 py-1 rounded-lg border ${getActionColor(scaling?.decision)}`}>
            {scaling?.decision || 'MONITOR'}
          </span>
        </div>
        <div className="mt-2 text-xs text-gray-400 flex items-center justify-between">
          <span>Threshold: {scaling?.threshold ?? 75}%</span>
          <span className="font-mono font-semibold text-gray-300">
            {scaling?.difference !== undefined ? `${scaling.difference > 0 ? '+' : ''}${scaling.difference.toFixed(1)}%` : '--'}
          </span>
        </div>
      </div>
    </div>
  );
};

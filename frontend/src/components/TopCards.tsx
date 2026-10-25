import React from 'react';
import { Activity, TrendingUp, Sparkles, Server, CheckCircle2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
  scaling,
  horizon
}) => {
  // User-friendly model label
  const getFriendlyModelName = (method: string | null) => {
    switch (method) {
      case 'EMA':
        return { name: 'Fast-Adaptive', badge: 'High Reaction', desc: 'Adapts quickly to sudden traffic spikes' };
      case 'WMA':
        return { name: 'Recent-Weighted', badge: 'Balanced Shift', desc: 'Prioritizes recent 15-minute trend' };
      case 'SMA':
        return { name: 'Balanced Average', badge: 'Smooth Baseline', desc: 'Filters out noise for steady load' };
      default:
        return { name: 'Adaptive Model', badge: 'Auto Selected', desc: 'Selected for best accuracy' };
    }
  };

  const modelInfo = getFriendlyModelName(bestMethod);

  // User-friendly scaling label
  const getActionDetails = (decision?: string) => {
    switch (decision) {
      case 'SCALE UP':
        return {
          label: 'Scale Up (+1 Server)',
          badgeClass: 'bg-rose-950 text-rose-300 border-rose-800 font-extrabold shadow-sm',
          dotClass: 'bg-rose-400',
          icon: ArrowUpRight,
          desc: 'High traffic incoming. Extra capacity advised.'
        };
      case 'SCALE DOWN':
        return {
          label: 'Scale Down (-1 Server)',
          badgeClass: 'bg-amber-950 text-amber-300 border-amber-800 font-bold',
          dotClass: 'bg-amber-400',
          icon: ArrowDownRight,
          desc: 'Low load detected. Save cloud costs safely.'
        };
      case 'NORMAL':
        return {
          label: 'Optimal Capacity',
          badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-800 font-medium',
          dotClass: 'bg-emerald-400',
          icon: CheckCircle2,
          desc: 'Current servers are in the sweet spot (20%-75%).'
        };
      default:
        return {
          label: 'System Healthy',
          badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80 font-medium',
          dotClass: 'bg-emerald-400',
          icon: Server,
          desc: 'Continuous real-time auto-pilot.'
        };
    }
  };

  const action = getActionDetails(scaling?.decision);
  const ActionIcon = action.icon;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Current Workload */}
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl p-5 shadow-sm hover:border-neutral-700 transition">
        <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <span>Current Workload</span>
          <span className="p-1.5 rounded-lg bg-neutral-900 text-cyan-400 border border-neutral-800">
            <Activity className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
            {currentCpu !== null ? `${currentCpu.toFixed(1)}%` : '--'}
          </span>
          <span className="text-xs text-neutral-400">active now</span>
        </div>
        <div className="mt-3.5 w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              (currentCpu || 0) >= 75 ? 'bg-rose-500' : (currentCpu || 0) <= 20 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, currentCpu || 0))}%` }}
          />
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-neutral-400">
          <span>Target zone: 20% – 75%</span>
          <span className={`font-semibold ${(currentCpu || 0) >= 75 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {(currentCpu || 0) >= 75 ? 'High Load' : 'Healthy'}
          </span>
        </div>
      </div>

      {/* 2. Expected Workload (Forecast) */}
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl p-5 shadow-sm hover:border-neutral-700 transition">
        <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <span>Expected Next Load</span>
          <span className="p-1.5 rounded-lg bg-neutral-900 text-amber-400 border border-neutral-800">
            <TrendingUp className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold tracking-tight text-amber-400 font-mono">
            {forecastCpu !== null ? `${forecastCpu.toFixed(1)}%` : '--'}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-800 font-medium">
            in {horizon}
          </span>
        </div>
        <div className="mt-3 text-xs text-neutral-300 flex items-center justify-between">
          <span className="text-neutral-400">Peak Prediction</span>
          <span className="font-mono text-cyan-300 font-medium">
            {forecastCpu && currentCpu ? `${forecastCpu > currentCpu ? '+' : ''}${(forecastCpu - currentCpu).toFixed(1)}% shift` : 'Continuous'}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-neutral-400 truncate">
          Calculated ahead for proactive scaling
        </p>
      </div>

      {/* 3. Recommended Action */}
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl p-5 shadow-sm hover:border-neutral-700 transition">
        <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <span>Capacity Recommendation</span>
          <span className="p-1.5 rounded-lg bg-neutral-900 text-white border border-neutral-800">
            <Server className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs ${action.badgeClass}`}>
            <ActionIcon className="w-4 h-4" />
            <span>{action.label}</span>
          </span>
        </div>
        <p className="mt-3 text-[11px] text-neutral-300 leading-snug">
          {action.desc}
        </p>
      </div>

      {/* 4. Best Fit Model */}
      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl p-5 shadow-sm hover:border-neutral-700 transition">
        <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <span>Top Model</span>
          <span className="p-1.5 rounded-lg bg-neutral-900 text-white border border-neutral-800">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-extrabold tracking-tight text-white font-mono">
            {modelInfo.name}
          </span>
          <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold border ${
            bestMethod === 'EMA'
              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
              : bestMethod === 'WMA'
              ? 'bg-purple-950 text-purple-300 border-purple-800'
              : 'bg-sky-950 text-sky-300 border-sky-800'
          }`}>
            {bestMethod || 'EMA'}
          </span>
        </div>
        <div className="mt-2.5 flex items-center space-x-1.5 text-xs text-neutral-300 font-medium">
          <span className={`w-1.5 h-1.5 rounded-full ${
            bestMethod === 'EMA' ? 'bg-emerald-400' : bestMethod === 'WMA' ? 'bg-purple-400' : 'bg-sky-400'
          }`} />
          <span>{modelInfo.badge}</span>
        </div>
        <p className="mt-1 text-[11px] text-neutral-400 truncate" title={modelInfo.desc}>
          {modelInfo.desc}
        </p>
      </div>
    </div>
  );
};

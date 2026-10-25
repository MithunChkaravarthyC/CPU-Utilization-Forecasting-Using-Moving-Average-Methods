import React from 'react';
import { ScalingDecision } from '../types';
import { Server, ArrowUpRight, ArrowDownRight, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

interface ScalingDecisionCardProps {
  scaling: ScalingDecision | null;
}

export const ScalingDecisionCard: React.FC<ScalingDecisionCardProps> = ({ scaling }) => {
  const getActionDetails = (decision?: string) => {
    switch (decision) {
      case 'SCALE UP':
        return {
          title: 'High Load Ahead — Scale Up (+1 Server)',
          badgeText: 'SCALE UP REQUIRED',
          containerClass: 'bg-[#0a0a0a] border-neutral-700 text-white shadow-md',
          badgeClass: 'bg-rose-950 text-rose-300 border border-rose-800 font-extrabold shadow-sm',
          iconContainer: 'bg-rose-950 text-rose-400 border border-rose-800',
          icon: ArrowUpRight,
          headline: 'High Workload Expected',
          description:
            'Forecasted CPU exceeds your safe 75% ceiling. Spin up an additional server instance now to maintain fast response times.'
        };
      case 'SCALE DOWN':
        return {
          title: 'Low Traffic — Scale Down (-1 Server)',
          badgeText: 'COST SAVING AVAILABLE',
          containerClass: 'bg-[#0a0a0a] border-neutral-800 text-white',
          badgeClass: 'bg-amber-950 text-amber-300 border border-amber-800 font-bold',
          iconContainer: 'bg-amber-950 text-amber-400 border border-amber-800',
          icon: ArrowDownRight,
          headline: 'Underutilized Capacity',
          description:
            'Forecasted CPU is below your 20% floor. You can safely power down an idle instance to reduce cloud infrastructure costs.'
        };
      case 'NORMAL':
        return {
          title: 'Optimal Server Capacity — No Action Needed',
          badgeText: 'CAPACITY HEALTHY',
          containerClass: 'bg-[#0a0a0a] border-neutral-800 text-white',
          badgeClass: 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-medium',
          iconContainer: 'bg-emerald-950 text-emerald-400 border border-emerald-800',
          icon: CheckCircle2,
          headline: 'Inside Target Zone',
          description:
            'Forecasted CPU remains comfortably within the safe operational window (20% – 75%). Existing infrastructure is right-sized.'
        };
      default:
        return {
          title: 'System Capacity Monitoring',
          badgeText: 'MONITORING',
          containerClass: 'bg-[#0a0a0a] border-neutral-800 text-white',
          badgeClass: 'bg-neutral-900 text-white border border-neutral-700 font-medium',
          iconContainer: 'bg-neutral-900 text-white border border-neutral-800',
          icon: Server,
          headline: 'Live Monitoring',
          description: 'Evaluating workload predictions in real-time.'
        };
    }
  };

  const action = getActionDetails(scaling?.decision);
  const ActionIcon = action.icon;
  const forecastVal = scaling?.forecast_cpu ?? 50;

  return (
    <div className={`rounded-2xl border p-6 shadow-sm transition space-y-5 ${action.containerClass}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-800 gap-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-xl border ${action.iconContainer}`}>
            <ActionIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              {action.title}
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Proactive capacity guidance powered by moving average predictions
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-mono tracking-wider ${action.badgeClass}`}>
          {action.badgeText}
        </span>
      </div>

      {/* Target Zone Visual Gauge */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
          <span className="text-amber-400">Scale Down Zone (&lt;20%)</span>
          <span className="text-emerald-400 font-bold">Safe Target Zone (20% – 75%)</span>
          <span className="text-rose-400">Scale Up Zone (&gt;75%)</span>
        </div>

        {/* Triple-color zone bar */}
        <div className="relative w-full h-3 rounded-full bg-neutral-900 overflow-hidden flex border border-neutral-800">
          <div className="w-[20%] bg-amber-500/80" title="Low Utilization Zone (<20%)" />
          <div className="w-[55%] bg-emerald-500/80" title="Safe Target Zone (20%-75%)" />
          <div className="w-[25%] bg-rose-500/80" title="High Load Zone (>75%)" />

          {/* Pointer for current forecasted CPU */}
          <div
            className="absolute top-0 bottom-0 w-3 bg-white border-2 border-black shadow-lg rounded-full transition-all duration-500 transform -translate-x-1/2"
            style={{ left: `${Math.min(100, Math.max(0, forecastVal))}%` }}
            title={`Forecast CPU: ${forecastVal.toFixed(1)}%`}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-1.5 font-mono">
          <span>0%</span>
          <span>20% (Floor)</span>
          <span className="text-white font-bold bg-neutral-900 px-2 py-0.5 rounded border border-neutral-700">
            Forecast: {forecastVal.toFixed(1)}%
          </span>
          <span>75% (Ceiling)</span>
          <span>100%</span>
        </div>
      </div>

      {/* Clear Explanation */}
      <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 leading-relaxed">
        <span className="font-semibold text-white block mb-1">
          {action.headline}:
        </span>
        {action.description}
      </div>
    </div>
  );
};

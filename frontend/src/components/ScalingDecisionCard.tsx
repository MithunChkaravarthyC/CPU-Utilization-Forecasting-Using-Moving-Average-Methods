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
          containerClass: 'bg-rose-950/20 border-rose-500/40 text-rose-300',
          badgeClass: 'bg-rose-600 text-white',
          icon: ArrowUpRight,
          headline: 'High Workload Expected',
          description:
            'Forecasted CPU exceeds your safe 75% ceiling. Spin up an additional server instance now to maintain fast response times.'
        };
      case 'SCALE DOWN':
        return {
          title: 'Low Traffic — Scale Down (-1 Server)',
          badgeText: 'COST SAVING AVAILABLE',
          containerClass: 'bg-amber-950/20 border-amber-500/40 text-amber-300',
          badgeClass: 'bg-amber-600 text-white',
          icon: ArrowDownRight,
          headline: 'Underutilized Capacity',
          description:
            'Forecasted CPU is below your 20% floor. You can safely power down an idle instance to reduce cloud infrastructure costs.'
        };
      case 'NORMAL':
        return {
          title: 'Optimal Server Capacity — No Action Needed',
          badgeText: 'CAPACITY HEALTHY',
          containerClass: 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300',
          badgeClass: 'bg-emerald-600 text-white',
          icon: CheckCircle2,
          headline: 'Inside Target Zone',
          description:
            'Forecasted CPU remains comfortably within the safe operational window (20% – 75%). Existing infrastructure is right-sized.'
        };
      default:
        return {
          title: 'System Capacity Monitoring',
          badgeText: 'MONITORING',
          containerClass: 'bg-slate-950/40 border-slate-800 text-slate-300',
          badgeClass: 'bg-sky-600 text-white',
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-white">
            <ActionIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              {action.title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Proactive capacity guidance powered by moving average predictions
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider ${action.badgeClass}`}>
          {action.badgeText}
        </span>
      </div>

      {/* Target Zone Visual Gauge */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-medium">
          <span>Scale Down Zone (&lt;20%)</span>
          <span className="text-emerald-400 font-bold">Safe Target Zone (20% – 75%)</span>
          <span className="text-rose-400">Scale Up Zone (&gt;75%)</span>
        </div>

        {/* Triple-color bar */}
        <div className="relative w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
          <div className="w-[20%] bg-amber-500/50" title="Low Utilization Zone" />
          <div className="w-[55%] bg-emerald-500/50" title="Safe Target Zone" />
          <div className="w-[25%] bg-rose-500/50" title="High Load Zone" />

          {/* Pointer for current forecasted CPU */}
          <div
            className="absolute top-0 bottom-0 w-2.5 bg-white border border-black shadow-lg rounded-full transition-all duration-500 transform -translate-x-1/2"
            style={{ left: `${Math.min(100, Math.max(0, forecastVal))}%` }}
            title={`Forecast CPU: ${forecastVal.toFixed(1)}%`}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-mono">
          <span>0%</span>
          <span>20% (Floor)</span>
          <span className="text-white font-bold">Forecast: {forecastVal.toFixed(1)}%</span>
          <span>75% (Ceiling)</span>
          <span>100%</span>
        </div>
      </div>

      {/* Clear Explanation */}
      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
        <span className="font-semibold text-white block mb-1">
          {action.headline}:
        </span>
        {action.description}
      </div>
    </div>
  );
};

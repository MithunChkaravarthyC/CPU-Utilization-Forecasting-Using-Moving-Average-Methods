import React from 'react';
import { ScalingDecision } from '../types';
import { Server, ArrowUpRight, ArrowDownRight, CheckCircle2, ShieldAlert } from 'lucide-react';

interface ScalingDecisionCardProps {
  scaling: ScalingDecision | null;
}

export const ScalingDecisionCard: React.FC<ScalingDecisionCardProps> = ({ scaling }) => {
  const getBadgeStyle = (decision?: string) => {
    switch (decision) {
      case 'SCALE UP':
        return {
          bg: 'bg-rose-950/50 border-rose-600 text-rose-300',
          badge: 'bg-rose-600 text-white',
          icon: ArrowUpRight,
          label: 'HIGH LOAD THRESHOLD EXCEEDED'
        };
      case 'SCALE DOWN':
        return {
          bg: 'bg-amber-950/50 border-amber-600 text-amber-300',
          badge: 'bg-amber-600 text-white',
          icon: ArrowDownRight,
          label: 'UNDERUTILIZATION DETECTED'
        };
      case 'NORMAL':
        return {
          bg: 'bg-emerald-950/50 border-emerald-600 text-emerald-300',
          badge: 'bg-emerald-600 text-white',
          icon: CheckCircle2,
          label: 'OPTIMAL RESOURCE CONSUMPTION'
        };
      default:
        return {
          bg: 'bg-sky-950/50 border-sky-600 text-sky-300',
          badge: 'bg-sky-600 text-white',
          icon: Server,
          label: 'CONTINUOUS MONITORING'
        };
    }
  };

  const currentStyle = getBadgeStyle(scaling?.decision);
  const Icon = currentStyle.icon;

  return (
    <div className={`rounded-xl border p-5 shadow-sm transition ${currentStyle.bg}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-800/80 gap-2">
        <div className="flex items-center space-x-2">
          <Server className="w-5 h-5 text-gray-300" />
          <h3 className="text-base font-bold text-white tracking-wide">
            Cloud Scaling Recommendation
          </h3>
        </div>
        <span className="text-xs uppercase tracking-wider font-mono text-gray-400">
          Deterministic Rule Engine
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
        {/* Main Decision Badge */}
        <div className="flex flex-col justify-center items-start p-4 bg-gray-950/70 rounded-lg border border-gray-800">
          <span className="text-[11px] uppercase tracking-wider text-gray-400 mb-1 font-mono">
            Action Recommendation
          </span>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1.5 rounded-lg text-lg font-mono font-extrabold uppercase tracking-wider shadow ${currentStyle.badge}`}>
              {scaling?.decision || 'MONITOR'}
            </span>
            <Icon className="w-6 h-6 shrink-0" />
          </div>
          <span className="text-[11px] text-gray-400 mt-2 font-mono">
            {currentStyle.label}
          </span>
        </div>

        {/* Forecast vs Threshold Numbers */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-gray-950/70 rounded-lg border border-gray-800 font-mono">
          <div>
            <span className="text-[10px] text-gray-400 uppercase block">Forecast Target</span>
            <span className="text-xl font-bold text-white">
              {scaling?.forecast_cpu !== undefined ? `${scaling.forecast_cpu.toFixed(1)}%` : '--'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-gray-400 uppercase block">Configured Thresh</span>
            <span className="text-xl font-bold text-gray-300">
              {scaling?.threshold !== undefined ? `${scaling.threshold.toFixed(1)}%` : '75.0%'}
            </span>
          </div>
          <div className="col-span-2 pt-2 border-t border-gray-800/80 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">Threshold Delta:</span>
            <span className={`text-sm font-bold ${
              (scaling?.difference || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {scaling?.difference !== undefined ? `${scaling.difference > 0 ? '+' : ''}${scaling.difference.toFixed(1)}%` : '--'}
            </span>
          </div>
        </div>

        {/* Reason / Context */}
        <div className="p-4 bg-gray-950/70 rounded-lg border border-gray-800 flex flex-col justify-center">
          <span className="text-[11px] uppercase tracking-wider text-gray-400 mb-1 font-mono">
            Deterministic Reason
          </span>
          <p className="text-xs text-gray-200 leading-relaxed">
            {scaling?.reason || 'Awaiting forecast evaluation against high/low utilization limits.'}
          </p>
        </div>
      </div>
    </div>
  );
};

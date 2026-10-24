import React from 'react';
import { ForecastResponse } from '../types';
import { UnifiedForecastChart } from '../charts/UnifiedForecastChart';
import { ForecastComparisonCard } from '../components/ForecastComparisonCard';
import { TrendingUp, TrendingDown, Minus, Cpu, ShieldCheck, Clock, Zap } from 'lucide-react';

interface ForecastAnalysisPageProps {
  forecastData: ForecastResponse | null;
  highThreshold: number;
  lowThreshold?: number;
}

export const ForecastAnalysisPage: React.FC<ForecastAnalysisPageProps> = ({
  forecastData,
  highThreshold,
  lowThreshold = 20
}) => {
  if (!forecastData) {
    return (
      <div className="p-12 text-center text-slate-400 bg-[#0e1424]/80 border border-slate-800 rounded-2xl">
        No active forecast data available. Please return to Overview and click "Update Forecast".
      </div>
    );
  }

  const trend = forecastData.trend;
  const getTrendInfo = (dir: string) => {
    if (dir === 'INCREASING') {
      return {
        label: 'Traffic Rising',
        desc: 'Usage is climbing. System preparing for higher load.',
        color: 'text-amber-400',
        bg: 'bg-amber-950/40 border-amber-800/50',
        icon: TrendingUp
      };
    }
    if (dir === 'DECREASING') {
      return {
        label: 'Traffic Easing',
        desc: 'Usage is declining toward low-load territory.',
        color: 'text-teal-400',
        bg: 'bg-teal-950/40 border-teal-800/50',
        icon: TrendingDown
      };
    }
    return {
      label: 'Stable Workload',
      desc: 'Traffic is balanced with no sharp surges.',
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/40 border-cyan-800/50',
      icon: Minus
    };
  };

  const trendInfo = getTrendInfo(trend.direction);
  const TrendIcon = trendInfo.icon;

  const bestVal =
    forecastData.best_method === 'SMA'
      ? forecastData.sma_forecast
      : forecastData.best_method === 'WMA'
      ? forecastData.wma_forecast
      : forecastData.ema_forecast;

  const diff = bestVal - forecastData.current_cpu;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span>Workload Predictor Lab</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Proactive workload projections ahead of time so you can right-size servers before bottlenecks occur.
          </p>
        </div>

        <span className="text-xs px-3 py-1 rounded-full bg-slate-900 text-slate-300 border border-slate-700 font-mono">
          Horizon: {forecastData.horizon} ({forecastData.resolution})
        </span>
      </div>

      {/* 4 Summary Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Workload Direction */}
        <div className="bg-[#0e1424]/80 backdrop-blur border border-slate-800/80 rounded-2xl p-4">
          <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1 font-semibold">
            Traffic Trend
          </span>
          <div className="flex items-center space-x-2">
            <TrendIcon className={`w-5 h-5 ${trendInfo.color}`} />
            <span className={`text-lg font-bold ${trendInfo.color}`}>
              {trendInfo.label}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1.5 block">
            {trendInfo.desc}
          </span>
        </div>

        {/* Expected Peak Load */}
        <div className="bg-[#0e1424]/80 backdrop-blur border border-slate-800/80 rounded-2xl p-4">
          <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1 font-semibold">
            Predicted Workload
          </span>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl font-mono font-extrabold text-cyan-300">
              {bestVal.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400">in {forecastData.horizon}</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1.5 block">
            {diff >= 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`} shift from current
          </span>
        </div>

        {/* Safe Capacity Target */}
        <div className="bg-[#0e1424]/80 backdrop-blur border border-slate-800/80 rounded-2xl p-4">
          <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1 font-semibold">
            Capacity Safety Zone
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-mono font-extrabold text-white">
              20% – {highThreshold}%
            </span>
          </div>
          <span className="text-[11px] text-emerald-400 mt-1.5 block font-medium">
            {bestVal <= highThreshold && bestVal >= lowThreshold
              ? 'Within safe boundaries'
              : bestVal > highThreshold
              ? 'Exceeds safe ceiling'
              : 'Below floor (low load)'}
          </span>
        </div>

        {/* Recommended Proactive Action */}
        <div className="bg-[#0e1424]/80 backdrop-blur border border-slate-800/80 rounded-2xl p-4">
          <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1 font-semibold">
            Recommended Action
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-base font-bold text-white">
              {forecastData.scaling_decision.decision === 'NORMAL'
                ? 'Optimal Capacity'
                : forecastData.scaling_decision.decision === 'SCALE UP'
                ? 'Add +1 Server'
                : 'Reduce -1 Server'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1.5 block truncate">
            {forecastData.scaling_decision.reason}
          </span>
        </div>
      </div>

      {/* Main Continuous Timeline Chart */}
      <UnifiedForecastChart
        historicalData={forecastData.historical_series}
        forecastData={forecastData.forecast_series}
        horizon={forecastData.horizon}
        bestMethod={forecastData.best_method}
        highThreshold={highThreshold}
        lowThreshold={lowThreshold}
      />

      {/* Model Breakdown */}
      <ForecastComparisonCard
        smaForecast={forecastData.sma_forecast}
        wmaForecast={forecastData.wma_forecast}
        emaForecast={forecastData.ema_forecast}
        bestMethod={forecastData.best_method}
        bestMethodReason={forecastData.best_method_reason}
        horizon={forecastData.horizon}
      />
    </div>
  );
};

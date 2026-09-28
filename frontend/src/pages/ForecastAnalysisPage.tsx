import React from 'react';
import { ForecastResponse } from '../types';
import { ForecastHorizonChart } from '../charts/ForecastHorizonChart';
import { TrendingUp, TrendingDown, Minus, Info, Calculator, Cpu } from 'lucide-react';

interface ForecastAnalysisPageProps {
  forecastData: ForecastResponse | null;
  highThreshold: number;
}

export const ForecastAnalysisPage: React.FC<ForecastAnalysisPageProps> = ({
  forecastData,
  highThreshold
}) => {
  if (!forecastData) {
    return (
      <div className="p-8 text-center text-gray-400 bg-gray-900 border border-gray-800 rounded-xl font-mono">
        No active forecast data available. Please return to Dashboard and click "Run Forecast".
      </div>
    );
  }

  const trend = forecastData.trend;
  const getTrendIcon = (dir: string) => {
    if (dir === 'INCREASING') return <TrendingUp className="w-5 h-5 text-rose-400" />;
    if (dir === 'DECREASING') return <TrendingDown className="w-5 h-5 text-emerald-400" />;
    return <Minus className="w-5 h-5 text-sky-400" />;
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Cpu className="w-6 h-6 text-sky-400" />
          <span>In-Depth Forecast Analysis</span>
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Detailed mathematical breakdown of recursive multi-step forecasting and workload trajectories
        </p>
      </div>

      {/* Trend & Horizon Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">
            Historical Workload Trend
          </span>
          <div className="flex items-center space-x-2">
            {getTrendIcon(trend.direction)}
            <span className="text-xl font-mono font-bold text-white">
              {trend.direction}
            </span>
          </div>
          <span className="text-[11px] text-gray-400 mt-2 block font-mono">
            Slope: {trend.slope > 0 ? '+' : ''}{trend.slope.toFixed(4)} %/sample
          </span>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">
            Recent vs Overall Mean
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-mono font-bold text-sky-300">
              {trend.recent_avg.toFixed(1)}%
            </span>
            <span className="text-xs text-gray-400">
              (All: {trend.historical_avg.toFixed(1)}%)
            </span>
          </div>
          <span className="text-[11px] text-gray-400 mt-2 block">
            Delta: {(trend.recent_avg - trend.historical_avg).toFixed(1)}%
          </span>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">
            Forecast Horizon
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-mono font-bold text-cyan-300">
              {forecastData.horizon.toUpperCase()}
            </span>
            <span className="text-xs text-gray-400">({forecastData.resolution})</span>
          </div>
          <span className="text-[11px] text-gray-400 mt-2 block font-mono">
            {forecastData.forecast_series.length - 1} recursive steps
          </span>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">
            Selected Best Model
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-mono font-bold text-amber-300">
              {forecastData.best_method}
            </span>
            <span className="text-xs text-gray-400">(MAE min)</span>
          </div>
          <span className="text-[11px] text-gray-400 mt-2 block truncate" title={forecastData.best_method_reason}>
            {forecastData.best_method_reason}
          </span>
        </div>
      </div>

      {/* Main Forecast Horizon Chart */}
      <ForecastHorizonChart
        historicalData={forecastData.historical_series}
        forecastData={forecastData.forecast_series}
        horizon={forecastData.horizon}
        bestMethod={forecastData.best_method}
        highThreshold={highThreshold}
      />

      {/* Mathematical Explanation of Recursive Forecasting */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center space-x-2">
          <Calculator className="w-5 h-5 text-sky-400" />
          <h3 className="text-base font-semibold text-white">
            Controlled Recursive Multi-Step Forecasting Principle
          </h3>
        </div>

        <p className="text-sm text-gray-300 leading-relaxed">
          Standard moving averages naturally generate a <strong>one-step-ahead</strong> forecast (x&#770;<sub>t+1</sub>).
          To project utilization into multi-step operational cloud horizons (such as 6, 12, or 24 hours), our engine employs a strict <strong>controlled recursive autoregressive loop</strong>:
        </p>

        <div className="bg-gray-950 p-4 rounded-lg border border-gray-800 font-mono text-xs text-sky-200 space-y-2">
          <p>{"1. At step t+1: Compute x̂_{t+1} = Model(x_t, x_{t-1}, ..., x_{t-n+1})"}</p>
          <p>{"2. Append synthetic projection x̂_{t+1} into the rolling observation buffer."}</p>
          <p>{"3. At step t+2: Compute x̂_{t+2} = Model(x̂_{t+1}, x_t, ..., x_{t-n+2})"}</p>
          <p>{"4. Iterate recursively until the requested forecast horizon is fully populated."}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-3 bg-gray-950/80 rounded-lg border border-gray-800 text-xs">
            <span className="font-bold text-sky-400 block mb-1">Simple Moving Average (SMA)</span>
            <p className="text-gray-400">
              In recursive forecasting, SMA projections will smoothly transition toward the mean of the latest n window values.
            </p>
          </div>
          <div className="p-3 bg-gray-950/80 rounded-lg border border-gray-800 text-xs">
            <span className="font-bold text-purple-400 block mb-1">Weighted Moving Average (WMA)</span>
            <p className="text-gray-400">
              WMA preserves recent momentum more dynamically before gently attenuating to the window's weighted equilibrium.
            </p>
          </div>
          <div className="p-3 bg-gray-950/80 rounded-lg border border-gray-800 text-xs">
            <span className="font-bold text-emerald-400 block mb-1">Exponential Moving Average (EMA)</span>
            <p className="text-gray-400">
              {"Single exponential smoothing without seasonal trend maintains an asymptotic horizontal trajectory: x̂_{t+k} = EMA_t."}
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-2 text-xs text-amber-300 bg-amber-950/30 p-3 rounded-lg border border-amber-800/40">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>Scientific Integrity Statement:</strong> Multi-step forecasts are mathematical projections based on historical data. The application explicitly documents that recursive projections do not constitute future measured data. No future actuals are leaked during calculation.
          </span>
        </div>
      </div>
    </div>
  );
};

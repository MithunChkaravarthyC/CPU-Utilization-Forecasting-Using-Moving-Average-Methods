import React from 'react';
import { TopCards } from '../components/TopCards';
import { LiveMonitoringPanel } from '../components/LiveMonitoringPanel';
import { ForecastControlPanel } from '../components/ForecastControlPanel';
import { MainCpuChart } from '../charts/MainCpuChart';
import { ForecastHorizonChart } from '../charts/ForecastHorizonChart';
import { ForecastComparisonCard } from '../components/ForecastComparisonCard';
import { AccuracyCard } from '../components/AccuracyCard';
import { ScalingDecisionCard } from '../components/ScalingDecisionCard';
import { AIExplanationCard } from '../components/AIExplanationCard';
import { DataTable } from '../components/DataTable';
import {
  MonitorStatus,
  ForecastResponse,
  AIExplainResponse
} from '../types';

interface DashboardPageProps {
  monitorStatus: MonitorStatus | null;
  forecastData: ForecastResponse | null;
  aiExplanation: AIExplainResponse | null;
  source: 'LIVE' | 'SIMULATION';
  setSource: (s: 'LIVE' | 'SIMULATION') => void;
  horizon: '1h' | '6h' | '12h' | '24h';
  setHorizon: (h: '1h' | '6h' | '12h' | '24h') => void;
  windowSize: number;
  setWindowSize: (w: number) => void;
  resolution: 'auto' | 'fine' | 'standard';
  setResolution: (r: 'auto' | 'fine' | 'standard') => void;
  highThreshold: number;
  setHighThreshold: (t: number) => void;
  lowThreshold: number;
  setLowThreshold: (t: number) => void;
  onStartMonitoring: (interval?: number) => Promise<void>;
  onStopMonitoring: () => Promise<void>;
  onClearMonitoring: () => Promise<void>;
  onRefreshMonitoring: () => Promise<void>;
  onRunForecast: () => void;
  onCompareMethods: () => void;
  onGenerateSimulation: (duration: '24h' | '3d' | '7d', seed: number) => void;
  onGenerateAIExplanation: () => void;
  isLoadingForecast: boolean;
  isLoadingAI: boolean;
  isLoadingMonitor: boolean;
  aiStatus: 'ONLINE' | 'OFFLINE';
  modelName: string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  monitorStatus,
  forecastData,
  aiExplanation,
  source,
  setSource,
  horizon,
  setHorizon,
  windowSize,
  setWindowSize,
  resolution,
  setResolution,
  highThreshold,
  setHighThreshold,
  lowThreshold,
  setLowThreshold,
  onStartMonitoring,
  onStopMonitoring,
  onClearMonitoring,
  onRefreshMonitoring,
  onRunForecast,
  onCompareMethods,
  onGenerateSimulation,
  onGenerateAIExplanation,
  isLoadingForecast,
  isLoadingAI,
  isLoadingMonitor,
  aiStatus,
  modelName
}) => {
  const currentCpu = forecastData?.current_cpu ?? monitorStatus?.current_cpu ?? null;
  const bestForecastValue = forecastData
    ? forecastData.best_method === 'SMA'
      ? forecastData.sma_forecast
      : forecastData.best_method === 'WMA'
      ? forecastData.wma_forecast
      : forecastData.ema_forecast
    : null;

  return (
    <div className="space-y-6">
      {/* Top 4 Summary Cards */}
      <TopCards
        currentCpu={currentCpu}
        forecastCpu={bestForecastValue}
        bestMethod={forecastData?.best_method ?? null}
        bestMethodReason={forecastData?.best_method_reason}
        scaling={forecastData?.scaling_decision ?? null}
        horizon={horizon}
      />

      {/* Live Monitoring Panel */}
      <LiveMonitoringPanel
        status={monitorStatus}
        onStart={onStartMonitoring}
        onStop={onStopMonitoring}
        onClear={onClearMonitoring}
        onRefresh={onRefreshMonitoring}
        isLoading={isLoadingMonitor}
      />

      {/* Forecast Controls */}
      <ForecastControlPanel
        source={source}
        setSource={setSource}
        horizon={horizon}
        setHorizon={setHorizon}
        windowSize={windowSize}
        setWindowSize={setWindowSize}
        resolution={resolution}
        setResolution={setResolution}
        highThreshold={highThreshold}
        setHighThreshold={setHighThreshold}
        lowThreshold={lowThreshold}
        setLowThreshold={setLowThreshold}
        onRunForecast={onRunForecast}
        onCompareMethods={onCompareMethods}
        onGenerateSimulation={onGenerateSimulation}
        isLoading={isLoadingForecast}
        liveSamplesCount={monitorStatus?.samples_collected ?? 0}
      />

      {/* Main Historical Chart */}
      {forecastData && (
        <MainCpuChart
          data={forecastData.historical_series}
          highThreshold={highThreshold}
          lowThreshold={lowThreshold}
        />
      )}

      {/* Forecast Horizon Chart */}
      {forecastData && (
        <ForecastHorizonChart
          historicalData={forecastData.historical_series}
          forecastData={forecastData.forecast_series}
          horizon={horizon}
          bestMethod={forecastData.best_method}
          highThreshold={highThreshold}
        />
      )}

      {/* 2-Column: Method Comparison & Accuracy Metrics */}
      {forecastData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ForecastComparisonCard
            smaForecast={forecastData.sma_forecast}
            wmaForecast={forecastData.wma_forecast}
            emaForecast={forecastData.ema_forecast}
            bestMethod={forecastData.best_method}
            bestMethodReason={forecastData.best_method_reason}
            horizon={horizon}
          />
          <AccuracyCard
            metrics={forecastData.metrics}
            bestMethod={forecastData.best_method}
          />
        </div>
      )}

      {/* Scaling Decision Card */}
      {forecastData && (
        <ScalingDecisionCard scaling={forecastData.scaling_decision} />
      )}

      {/* AI Explanation Card */}
      {forecastData && (
        <AIExplanationCard
          explanationData={aiExplanation}
          onGenerateExplanation={onGenerateAIExplanation}
          isLoading={isLoadingAI}
          aiStatus={aiStatus}
          modelName={modelName}
        />
      )}

      {/* Telemetry Log Data Table */}
      {forecastData && (
        <DataTable
          historicalData={forecastData.historical_series}
          forecastData={forecastData.forecast_series}
        />
      )}
    </div>
  );
};

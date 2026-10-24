import React, { useState } from 'react';
import { TopCards } from '../components/TopCards';
import { ForecastControlPanel } from '../components/ForecastControlPanel';
import { LiveUtilizationChart } from '../charts/LiveUtilizationChart';
import { UnifiedForecastChart } from '../charts/UnifiedForecastChart';
import { ForecastComparisonCard } from '../components/ForecastComparisonCard';
import { AccuracyCard } from '../components/AccuracyCard';
import { ScalingDecisionCard } from '../components/ScalingDecisionCard';
import { AIExplanationCard } from '../components/AIExplanationCard';
import { DataTable } from '../components/DataTable';
import {
  MonitorStatus,
  ForecastResponse,
  AIExplainResponse,
  SessionStatus
} from '../types';
import { ChevronDown, ChevronUp, Table, Laptop } from 'lucide-react';

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
  onOpenConnectModal?: () => void;
  onRunForecast: () => void;
  onCompareMethods: () => void;
  onGenerateSimulation: (duration: '24h' | '3d' | '7d', seed: number) => void;
  onGenerateAIExplanation: () => void;
  isLoadingForecast: boolean;
  isLoadingAI: boolean;
  isLoadingMonitor: boolean;
  aiStatus: 'ONLINE' | 'OFFLINE';
  modelName: string;
  isAutoRefresh: boolean;
  setIsAutoRefresh: (val: boolean) => void;
  lastSyncTime?: Date;
  deviceName?: string | null;
  sessionStatus?: SessionStatus | null;
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
  onOpenConnectModal,
  onRunForecast,
  onCompareMethods,
  onGenerateSimulation,
  onGenerateAIExplanation,
  isLoadingForecast,
  isLoadingAI,
  isLoadingMonitor,
  aiStatus,
  modelName,
  isAutoRefresh,
  setIsAutoRefresh,
  lastSyncTime,
  deviceName,
  sessionStatus
}) => {
  const [showLogTable, setShowLogTable] = useState(false);
  const [showLiveMonitor, setShowLiveMonitor] = useState(true);

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
      {/* 1. Top 4 Crisp Metric Tiles */}
      <TopCards
        currentCpu={currentCpu}
        forecastCpu={bestForecastValue}
        bestMethod={forecastData?.best_method ?? null}
        bestMethodReason={forecastData?.best_method_reason}
        scaling={forecastData?.scaling_decision ?? null}
        horizon={horizon}
      />

      {/* 2. Sleek Forecast Control Toolbar */}
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
        onOpenConnectModal={onOpenConnectModal}
        isLoading={isLoadingForecast}
        liveSamplesCount={monitorStatus?.samples_collected ?? 0}
        isAutoRefresh={isAutoRefresh}
        setIsAutoRefresh={setIsAutoRefresh}
        lastSyncTime={lastSyncTime}
      />

      {/* 3. Real-Time CPU Utilization Stream (Auto-updating with Show/Hide Toggle) */}
      {forecastData && (
        <LiveUtilizationChart
          data={forecastData.historical_series}
          currentCpu={currentCpu}
          deviceName={deviceName || sessionStatus?.device_name}
          sessionId={sessionStatus?.session_id}
          source={source}
          highThreshold={highThreshold}
          lowThreshold={lowThreshold}
          isVisible={showLiveMonitor}
          onToggleVisibility={() => setShowLiveMonitor(!showLiveMonitor)}
          samplesCount={forecastData.sample_count}
        />
      )}

      {/* 4. Proactive Prediction & Workload Forecast Chart */}
      {forecastData && (
        <UnifiedForecastChart
          historicalData={forecastData.historical_series}
          forecastData={forecastData.forecast_series}
          horizon={horizon}
          bestMethod={forecastData.best_method}
          highThreshold={highThreshold}
          lowThreshold={lowThreshold}
        />
      )}

      {/* 4. Actionable Two-Column Section: Capacity Decision & AI Assistant */}
      {forecastData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ScalingDecisionCard scaling={forecastData.scaling_decision} />
          <AIExplanationCard
            explanationData={aiExplanation}
            onGenerateExplanation={onGenerateAIExplanation}
            isLoading={isLoadingAI}
            aiStatus={aiStatus}
            modelName={modelName}
          />
        </div>
      )}

      {/* 5. Model Accuracy & Prediction Comparisons */}
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

      {/* 6. Expandable Raw Data Log Section (Kept secondary to avoid clutter) */}
      {forecastData && (
        <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-[#0e1424]/60">
          <button
            type="button"
            onClick={() => setShowLogTable(!showLogTable)}
            className="w-full px-6 py-3.5 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900/60 transition"
          >
            <div className="flex items-center space-x-2">
              <Table className="w-4 h-4 text-cyan-400" />
              <span>Inspection Logs & Recorded Metrics ({forecastData.sample_count} observations)</span>
            </div>
            <div className="flex items-center space-x-1.5 text-slate-400">
              <span>{showLogTable ? 'Hide Table' : 'Expand Table'}</span>
              {showLogTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showLogTable && (
            <div className="p-4 border-t border-slate-800">
              <DataTable
                historicalData={forecastData.historical_series}
                forecastData={forecastData.forecast_series}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

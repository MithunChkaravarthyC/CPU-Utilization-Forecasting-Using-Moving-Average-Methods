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
  SessionStatus,
  User
} from '../types';
import { ChevronDown, ChevronUp, Table, Laptop, ShieldCheck, User as UserIcon, Sparkles } from 'lucide-react';

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
  user?: User | null;
  onOpenAuthModal?: () => void;
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
  sessionStatus,
  user,
  onOpenAuthModal
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
      {/* Multi-Tenant Workspace & Isolation Banner */}
      {user ? (
        <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-700/80 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-xs">Private Workspace:</span>
                <span className="text-emerald-300 font-semibold text-xs">{user.full_name || user.email}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-400 border border-emerald-700 font-mono font-bold">
                  Data Isolated
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Session Token: <code className="text-cyan-400 font-mono font-bold">{user.session_id}</code> • Telemetry streamed to this token will never clash with other users.
              </p>
            </div>
          </div>
          {onOpenConnectModal && (
            <button
              onClick={onOpenConnectModal}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-sm transition flex items-center space-x-1.5 shrink-0 self-start sm:self-auto"
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Copy PowerShell Command</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5 text-xs text-neutral-300">
            <UserIcon className="w-4 h-4 text-neutral-400 shrink-0" />
            <span>
              <strong className="text-white">Guest Session Mode:</strong> Data is isolated to this browser. Log in or create an account to get a permanent token and ensure telemetry never clashes with other machines.
            </span>
          </div>
          {onOpenAuthModal && (
            <button
              onClick={onOpenAuthModal}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs shadow-sm transition whitespace-nowrap self-start sm:self-auto"
            >
              Log In / Create Account
            </button>
          )}
        </div>
      )}

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
        <div className="border border-neutral-800 rounded-2xl overflow-hidden bg-[#0a0a0a]">
          <button
            type="button"
            onClick={() => setShowLogTable(!showLogTable)}
            className="w-full px-6 py-3.5 flex items-center justify-between text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-900/60 transition"
          >
            <div className="flex items-center space-x-2">
              <Table className="w-4 h-4 text-white" />
              <span>Inspection Logs & Recorded Metrics ({forecastData.sample_count} observations)</span>
            </div>
            <div className="flex items-center space-x-1.5 text-neutral-400">
              <span>{showLogTable ? 'Hide Table' : 'Expand Table'}</span>
              {showLogTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showLogTable && (
            <div className="p-4 border-t border-neutral-800">
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

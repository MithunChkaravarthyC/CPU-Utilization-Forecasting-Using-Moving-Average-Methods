import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { ForecastAnalysisPage } from './pages/ForecastAnalysisPage';
import { AccuracyPage } from './pages/AccuracyPage';
import { ScalingPage } from './pages/ScalingPage';
import { AIInspectorPage } from './pages/AIInspectorPage';
import { AboutPage } from './pages/AboutPage';
import { ConnectDataModal } from './components/ConnectDataModal';

import {
  MonitorStatus,
  ForecastResponse,
  AIExplainResponse
} from './types';
import {
  fetchHealth,
  fetchConfig,
  fetchMonitorStatus,
  startMonitoring,
  stopMonitoring,
  clearMonitorData,
  generateSimulation,
  postForecast,
  requestAIExplain
} from './services/api';
import { AlertCircle, X } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [source, setSource] = useState<'LIVE' | 'SIMULATION'>('SIMULATION');
  const [horizon, setHorizon] = useState<'1h' | '6h' | '12h' | '24h'>('6h');
  const [windowSize, setWindowSize] = useState<number>(5);
  const [resolution, setResolution] = useState<'auto' | 'fine' | 'standard'>('auto');
  const [highThreshold, setHighThreshold] = useState<number>(75.0);
  const [lowThreshold, setLowThreshold] = useState<number>(20.0);

  const [monitorStatus, setMonitorStatus] = useState<MonitorStatus | null>(null);
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [aiExplanation, setAiExplanation] = useState<AIExplainResponse | null>(null);
  const [aiStatus, setAiStatus] = useState<'ONLINE' | 'OFFLINE'>('OFFLINE');
  const [modelName, setModelName] = useState<string>('qwen3:8b');

  const [isLoadingForecast, setIsLoadingForecast] = useState<boolean>(false);
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [isLoadingMonitor, setIsLoadingMonitor] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);

  // Load initial health & config
  const checkSystemHealth = useCallback(async () => {
    try {
      const health = await fetchHealth();
      setAiStatus(health.ollama_status || 'OFFLINE');
      if (health.ollama_model) setModelName(health.ollama_model);

      const status = await fetchMonitorStatus();
      setMonitorStatus(status);
    } catch (err: any) {
      console.warn('System health check error:', err);
    }
  }, []);

  // Run Forecast
  const handleRunForecast = useCallback(async () => {
    setIsLoadingForecast(true);
    setErrorMessage(null);
    try {
      const data = await postForecast({
        horizon,
        window: windowSize,
        source,
        resolution,
        high_threshold: highThreshold,
        low_threshold: lowThreshold
      });
      setForecastData(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Forecast calculation failed');
    } finally {
      setIsLoadingForecast(false);
    }
  }, [horizon, windowSize, source, resolution, highThreshold, lowThreshold]);

  // Generate Simulation
  const handleGenerateSimulation = async (duration: '24h' | '3d' | '7d', seed: number) => {
    setIsLoadingForecast(true);
    setErrorMessage(null);
    try {
      await generateSimulation(duration, seed, true);
      setSource('SIMULATION');
      // Automatically refresh forecast
      const data = await postForecast({
        horizon,
        window: windowSize,
        source: 'SIMULATION',
        resolution,
        high_threshold: highThreshold,
        low_threshold: lowThreshold
      });
      setForecastData(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Simulation generation failed');
    } finally {
      setIsLoadingForecast(false);
    }
  };

  // Live Monitor Controls
  const handleStartMonitoring = async (interval: number = 60) => {
    setIsLoadingMonitor(true);
    setErrorMessage(null);
    try {
      const updated = await startMonitoring(interval);
      setMonitorStatus(updated);
      setSource('LIVE');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to start live monitor');
    } finally {
      setIsLoadingMonitor(false);
    }
  };

  const handleStopMonitoring = async () => {
    setIsLoadingMonitor(true);
    try {
      const updated = await stopMonitoring();
      setMonitorStatus(updated);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to stop live monitor');
    } finally {
      setIsLoadingMonitor(false);
    }
  };

  const handleClearMonitoring = async () => {
    setIsLoadingMonitor(true);
    try {
      await clearMonitorData('LIVE');
      const updated = await fetchMonitorStatus();
      setMonitorStatus(updated);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to clear live samples');
    } finally {
      setIsLoadingMonitor(false);
    }
  };

  const handleRefreshMonitoring = async () => {
    setIsLoadingMonitor(true);
    try {
      const updated = await fetchMonitorStatus();
      setMonitorStatus(updated);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to refresh status');
    } finally {
      setIsLoadingMonitor(false);
    }
  };

  // Generate AI Explanation
  const handleGenerateAIExplanation = async () => {
    if (!forecastData) {
      setErrorMessage('Please run a forecast before requesting an AI explanation.');
      return;
    }
    setIsLoadingAI(true);
    setErrorMessage(null);

    const smaMetric = forecastData.metrics.find((m) => m.method === 'SMA')?.mae ?? 0;
    const wmaMetric = forecastData.metrics.find((m) => m.method === 'WMA')?.mae ?? 0;
    const emaMetric = forecastData.metrics.find((m) => m.method === 'EMA')?.mae ?? 0;

    const evidence = {
      current_cpu: forecastData.current_cpu,
      forecast_horizon: `${forecastData.horizon} (${forecastData.resolution})`,
      sma_forecast: forecastData.sma_forecast,
      wma_forecast: forecastData.wma_forecast,
      ema_forecast: forecastData.ema_forecast,
      best_method: forecastData.best_method,
      sma_mae: smaMetric,
      wma_mae: wmaMetric,
      ema_mae: emaMetric,
      threshold: forecastData.scaling_decision.threshold,
      scaling_decision: forecastData.scaling_decision.decision,
      recent_trend: forecastData.trend.direction
    };

    try {
      const resp = await requestAIExplain(evidence);
      setAiExplanation(resp);
      setAiStatus(resp.status);
    } catch (err: any) {
      setErrorMessage(err.message || 'AI explanation request failed');
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Initial load
  useEffect(() => {
    checkSystemHealth();
    handleRunForecast();
  }, []);

  // Periodic status poll (every 15s if live monitoring is running)
  useEffect(() => {
    if (!monitorStatus?.is_running) return;
    const interval = setInterval(async () => {
      try {
        const status = await fetchMonitorStatus();
        setMonitorStatus(status);
      } catch (e) {
        // silent background check
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [monitorStatus?.is_running]);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-gray-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mode={source}
        isLiveRunning={monitorStatus?.is_running ?? false}
        aiStatus={aiStatus}
        currentCpu={forecastData?.current_cpu ?? monitorStatus?.current_cpu ?? null}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
      />

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 w-full">
          <div className="bg-rose-950/80 border border-rose-700/80 p-3 rounded-lg flex items-center justify-between text-xs text-rose-200">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
              {errorMessage.includes('Insufficient') && (
                <button
                  onClick={() => setIsConnectModalOpen(true)}
                  className="ml-2 px-2 py-0.5 rounded bg-sky-900/60 hover:bg-sky-800 text-sky-200 border border-sky-600/50 font-medium text-[11px] transition"
                >
                  📡 Connect Machine / Upload Data
                </button>
              )}
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardPage
            monitorStatus={monitorStatus}
            forecastData={forecastData}
            aiExplanation={aiExplanation}
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
            onStartMonitoring={handleStartMonitoring}
            onStopMonitoring={handleStopMonitoring}
            onClearMonitoring={handleClearMonitoring}
            onRefreshMonitoring={handleRefreshMonitoring}
            onOpenConnectModal={() => setIsConnectModalOpen(true)}
            onRunForecast={handleRunForecast}
            onCompareMethods={() => setActiveTab('accuracy')}
            onGenerateSimulation={handleGenerateSimulation}
            onGenerateAIExplanation={handleGenerateAIExplanation}
            isLoadingForecast={isLoadingForecast}
            isLoadingAI={isLoadingAI}
            isLoadingMonitor={isLoadingMonitor}
            aiStatus={aiStatus}
            modelName={modelName}
          />
        )}

        {activeTab === 'forecast' && (
          <ForecastAnalysisPage
            forecastData={forecastData}
            highThreshold={highThreshold}
            lowThreshold={lowThreshold}
          />
        )}

        {activeTab === 'accuracy' && (
          <AccuracyPage
            metrics={forecastData?.metrics || []}
            bestMethod={forecastData?.best_method || 'EMA'}
            source={source}
          />
        )}

        {activeTab === 'scaling' && (
          <ScalingPage
            currentCpu={forecastData?.current_cpu ?? monitorStatus?.current_cpu ?? null}
            forecastCpu={
              forecastData
                ? forecastData.best_method === 'SMA'
                  ? forecastData.sma_forecast
                  : forecastData.best_method === 'WMA'
                  ? forecastData.wma_forecast
                  : forecastData.ema_forecast
                : null
            }
            scaling={forecastData?.scaling_decision ?? null}
            highThreshold={highThreshold}
            setHighThreshold={setHighThreshold}
            lowThreshold={lowThreshold}
            setLowThreshold={setLowThreshold}
          />
        )}

        {activeTab === 'ai-inspector' && (
          <AIInspectorPage
            explanationData={aiExplanation}
            onGenerateExplanation={handleGenerateAIExplanation}
            isLoading={isLoadingAI}
            aiStatus={aiStatus}
            modelName={modelName}
            evidence={
              forecastData
                ? {
                    current_cpu: forecastData.current_cpu,
                    forecast_horizon: `${forecastData.horizon} (${forecastData.resolution})`,
                    sma_forecast: forecastData.sma_forecast,
                    wma_forecast: forecastData.wma_forecast,
                    ema_forecast: forecastData.ema_forecast,
                    best_method: forecastData.best_method,
                    sma_mae: forecastData.metrics.find((m) => m.method === 'SMA')?.mae ?? 0,
                    wma_mae: forecastData.metrics.find((m) => m.method === 'WMA')?.mae ?? 0,
                    ema_mae: forecastData.metrics.find((m) => m.method === 'EMA')?.mae ?? 0,
                    threshold: forecastData.scaling_decision.threshold,
                    scaling_decision: forecastData.scaling_decision.decision,
                    recent_trend: forecastData.trend.direction
                  }
                : null
            }
          />
        )}

        {activeTab === 'about' && <AboutPage />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070b14] py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <strong className="text-slate-300">CPU Pulse</strong> — Intelligent Cloud Capacity & Workload Forecasting
          </span>
          <span className="font-mono text-slate-500">
            Real-Time Telemetry • 24h Projections • Proactive Capacity Rules
          </span>
        </div>
      </footer>

      {/* Connect Machine / Telemetry Modal */}
      <ConnectDataModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onDataIngested={() => {
          setSource('LIVE');
          handleRunForecast();
        }}
      />
    </div>
  );
};

export default App;

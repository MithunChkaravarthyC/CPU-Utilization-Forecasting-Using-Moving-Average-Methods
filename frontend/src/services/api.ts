import {
  MonitorStatus,
  ForecastResponse,
  AccuracyMetricItem,
  WindowAnalysisItem,
  AIExplainResponse,
  ConfigInfo,
  ScalingDecision
} from '../types';

const API_BASE = '/api';

export async function fetchHealth(): Promise<any> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchConfig(): Promise<ConfigInfo> {
  const res = await fetch(`${API_BASE}/config`);
  if (!res.ok) throw new Error(`Config fetch failed: ${res.statusText}`);
  return res.json();
}

export async function fetchMonitorStatus(): Promise<MonitorStatus> {
  const res = await fetch(`${API_BASE}/monitor/status`);
  if (!res.ok) throw new Error(`Monitor status failed: ${res.statusText}`);
  return res.json();
}

export async function startMonitoring(intervalSeconds: number = 60): Promise<MonitorStatus> {
  const res = await fetch(`${API_BASE}/monitor/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ interval_seconds: intervalSeconds })
  });
  if (!res.ok) throw new Error(`Failed to start monitoring: ${res.statusText}`);
  return res.json();
}

export async function stopMonitoring(): Promise<MonitorStatus> {
  const res = await fetch(`${API_BASE}/monitor/stop`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error(`Failed to stop monitoring: ${res.statusText}`);
  return res.json();
}

export async function clearMonitorData(source: 'LIVE' | 'SIMULATION' | 'ALL' = 'LIVE'): Promise<any> {
  const res = await fetch(`${API_BASE}/monitor/clear?source=${source}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error(`Failed to clear data: ${res.statusText}`);
  return res.json();
}

export async function fetchCurrentCpu(): Promise<{ current_cpu: number; timestamp: string }> {
  const res = await fetch(`${API_BASE}/monitor/current`);
  if (!res.ok) throw new Error(`Failed to fetch current CPU: ${res.statusText}`);
  return res.json();
}

export async function fetchData(source: 'LIVE' | 'SIMULATION' = 'SIMULATION', limit: number = 200): Promise<any> {
  const res = await fetch(`${API_BASE}/data?source=${source}&limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch data: ${res.statusText}`);
  return res.json();
}

export async function generateSimulation(
  duration: '24h' | '3d' | '7d' = '24h',
  seed: number = 42,
  clearExisting: boolean = true
): Promise<any> {
  const res = await fetch(`${API_BASE}/data/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      duration,
      seed,
      clear_existing: clearExisting
    })
  });
  if (!res.ok) throw new Error(`Failed to generate simulation: ${res.statusText}`);
  return res.json();
}

export async function postForecast(params: {
  horizon: '1h' | '6h' | '12h' | '24h';
  window: number;
  source: 'LIVE' | 'SIMULATION';
  resolution?: 'auto' | 'fine' | 'standard';
  high_threshold?: number;
  low_threshold?: number;
}): Promise<ForecastResponse> {
  const res = await fetch(`${API_BASE}/forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      horizon: params.horizon,
      window: params.window,
      source: params.source,
      resolution: params.resolution || 'auto',
      high_threshold: params.high_threshold ?? 75.0,
      low_threshold: params.low_threshold ?? 20.0
    })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Forecast calculation failed');
  }
  return res.json();
}

export async function fetchWindowComparison(source: 'LIVE' | 'SIMULATION'): Promise<{
  source: string;
  sample_count: number;
  windows: WindowAnalysisItem[];
}> {
  const res = await fetch(`${API_BASE}/forecast/compare?source=${source}`, {
    method: 'POST'
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Window comparison failed');
  }
  return res.json();
}

export async function fetchBacktest(source: 'LIVE' | 'SIMULATION', window: number = 5): Promise<{
  source: string;
  window: number;
  metrics: AccuracyMetricItem[];
  best_method: 'SMA' | 'WMA' | 'EMA';
  reason: string;
}> {
  const res = await fetch(`${API_BASE}/backtest?source=${source}&window=${window}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Backtest failed');
  }
  return res.json();
}

export async function fetchScaling(forecast: number, highThresh: number = 75, lowThresh: number = 20): Promise<ScalingDecision> {
  const res = await fetch(`${API_BASE}/scaling?forecast=${forecast}&high_threshold=${highThresh}&low_threshold=${lowThresh}`);
  if (!res.ok) throw new Error('Scaling calculation failed');
  return res.json();
}

export async function requestAIExplain(evidence: {
  current_cpu: number;
  forecast_horizon: string;
  sma_forecast: number;
  wma_forecast: number;
  ema_forecast: number;
  best_method: string;
  sma_mae: number;
  wma_mae: number;
  ema_mae: number;
  threshold: number;
  scaling_decision: string;
  recent_trend: string;
}): Promise<AIExplainResponse> {
  const res = await fetch(`${API_BASE}/ai/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(evidence)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'AI explanation request failed');
  }
  return res.json();
}

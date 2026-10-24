import {
  MonitorStatus,
  ForecastResponse,
  AccuracyMetricItem,
  WindowAnalysisItem,
  AIExplainResponse,
  ConfigInfo,
  ScalingDecision,
  SessionStatus
} from '../types';

// Dynamic API Base URL resolver: checks localStorage override, then Vite ENV, then fallback '/api'
export function getApiBaseUrl(): string {
  const custom = localStorage.getItem('cpu_forecast_api_url');
  if (custom && custom.trim()) {
    return custom.trim().replace(/\/+$/, '') + '/api';
  }
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '') + '/api';
  }
  return '/api';
}

export function setApiBaseUrl(url: string): void {
  if (url && url.trim()) {
    localStorage.setItem('cpu_forecast_api_url', url.trim());
  } else {
    localStorage.removeItem('cpu_forecast_api_url');
  }
}

export function getRawServerUrl(): string {
  const custom = localStorage.getItem('cpu_forecast_api_url');
  if (custom && custom.trim()) {
    return custom.trim().replace(/\/+$/, '');
  }
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  // When running in local Vite dev (port 5173), direct the agent to backend port 8000
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }
  return window.location.origin;
}

// Client Session ID for isolated multi-device/multi-user live streaming
export function getSessionId(): string {
  let id = localStorage.getItem('cpu_forecast_session_id');
  if (!id) {
    id = 'client_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('cpu_forecast_session_id', id);
  }
  return id;
}

export function setSessionId(newId: string): void {
  if (newId && newId.trim()) {
    localStorage.setItem('cpu_forecast_session_id', newId.trim());
  }
}

export async function fetchHealth(): Promise<any> {
  const res = await fetch(`${getApiBaseUrl()}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchConfig(): Promise<ConfigInfo> {
  const res = await fetch(`${getApiBaseUrl()}/config`);
  if (!res.ok) throw new Error(`Config fetch failed: ${res.statusText}`);
  return res.json();
}

export async function fetchMonitorStatus(): Promise<MonitorStatus> {
  const res = await fetch(`${getApiBaseUrl()}/monitor/status`);
  if (!res.ok) throw new Error(`Monitor status failed: ${res.statusText}`);
  return res.json();
}

export async function startMonitoring(intervalSeconds: number = 60): Promise<MonitorStatus> {
  const res = await fetch(`${getApiBaseUrl()}/monitor/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ interval_seconds: intervalSeconds })
  });
  if (!res.ok) throw new Error(`Failed to start monitoring: ${res.statusText}`);
  return res.json();
}

export async function stopMonitoring(): Promise<MonitorStatus> {
  const res = await fetch(`${getApiBaseUrl()}/monitor/stop`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error(`Failed to stop monitoring: ${res.statusText}`);
  return res.json();
}

export async function clearMonitorData(source: 'LIVE' | 'SIMULATION' | 'ALL' = 'LIVE'): Promise<any> {
  const sess = getSessionId();
  const url = `${getApiBaseUrl()}/monitor/clear?source=${source}${source !== 'SIMULATION' ? `&session_id=${sess}` : ''}`;
  const res = await fetch(url, {
    method: 'POST'
  });
  if (!res.ok) throw new Error(`Failed to clear data: ${res.statusText}`);
  return res.json();
}

export async function fetchCurrentCpu(): Promise<{ current_cpu: number; timestamp: string; device_name?: string }> {
  const sess = getSessionId();
  const res = await fetch(`${getApiBaseUrl()}/monitor/current?session_id=${sess}`);
  if (!res.ok) throw new Error(`Failed to fetch current CPU: ${res.statusText}`);
  return res.json();
}

export async function fetchSessionStatus(sessionId?: string): Promise<SessionStatus> {
  const sess = sessionId || getSessionId();
  const res = await fetch(`${getApiBaseUrl()}/telemetry/session/${sess}`);
  if (!res.ok) throw new Error(`Failed to fetch session status: ${res.statusText}`);
  return res.json();
}

export async function uploadCsvTelemetry(
  file: File,
  deviceName: string = 'Uploaded Dataset',
  clearExisting: boolean = true
): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('session_id', getSessionId());
  formData.append('device_name', deviceName);
  formData.append('clear_existing', clearExisting ? 'true' : 'false');

  const res = await fetch(`${getApiBaseUrl()}/telemetry/upload-csv`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'CSV upload failed');
  }
  return res.json();
}

export function getAgentDownloadUrl(): string {
  return `${getApiBaseUrl()}/agent/download`;
}

export function getAgentCliCommand(): string {
  const server = getRawServerUrl();
  const sess = getSessionId();
  return `python agent.py --server ${server} --session ${sess}`;
}

export async function fetchData(source: 'LIVE' | 'SIMULATION' = 'SIMULATION', limit: number = 200): Promise<any> {
  const sess = getSessionId();
  const url = `${getApiBaseUrl()}/data?source=${source}&limit=${limit}${source === 'LIVE' ? `&session_id=${sess}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch data: ${res.statusText}`);
  return res.json();
}

export async function generateSimulation(
  duration: '24h' | '3d' | '7d' = '24h',
  seed: number = 42,
  clearExisting: boolean = true
): Promise<any> {
  const res = await fetch(`${getApiBaseUrl()}/data/generate`, {
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
  const res = await fetch(`${getApiBaseUrl()}/forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      horizon: params.horizon,
      window: params.window,
      source: params.source,
      session_id: getSessionId(),
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
  const sess = getSessionId();
  const url = `${getApiBaseUrl()}/forecast/compare?source=${source}${source === 'LIVE' ? `&session_id=${sess}` : ''}`;
  const res = await fetch(url, {
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
  const sess = getSessionId();
  const url = `${getApiBaseUrl()}/backtest?source=${source}&window=${window}${source === 'LIVE' ? `&session_id=${sess}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorData.detail || 'Backtest failed');
  }
  return res.json();
}

export async function fetchScaling(forecast: number, highThresh: number = 75, lowThresh: number = 20): Promise<ScalingDecision> {
  const res = await fetch(`${getApiBaseUrl()}/scaling?forecast=${forecast}&high_threshold=${highThresh}&low_threshold=${lowThresh}`);
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
  const res = await fetch(`${getApiBaseUrl()}/ai/explain`, {
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

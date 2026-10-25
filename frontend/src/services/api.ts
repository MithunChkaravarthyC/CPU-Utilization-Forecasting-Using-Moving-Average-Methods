import {
  MonitorStatus,
  ForecastResponse,
  ForecastPoint,
  AccuracyMetricItem,
  WindowAnalysisItem,
  AIExplainResponse,
  ConfigInfo,
  ScalingDecision,
  SessionStatus,
  User
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

// -------------------------------------------------------------
// User Authentication & Multi-Tenant Session Isolation
// -------------------------------------------------------------

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('cpu_forecast_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null): void {
  if (user) {
    localStorage.setItem('cpu_forecast_user', JSON.stringify(user));
    setSessionId(user.session_id);
  } else {
    localStorage.removeItem('cpu_forecast_user');
  }
}

export function logoutUser(): void {
  localStorage.removeItem('cpu_forecast_user');
  const guestId = 'guest_' + Math.random().toString(36).substring(2, 10);
  setSessionId(guestId);
}

export async function registerUser(email: string, password: string, fullName?: string): Promise<User> {
  const res = await fetch(`${getApiBaseUrl()}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name: fullName || '' })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Registration failed');
  }
  const user: User = await res.json();
  setStoredUser(user);
  return user;
}

export async function loginUser(email: string, password: string): Promise<User> {
  const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Login failed');
  }
  const user: User = await res.json();
  setStoredUser(user);
  return user;
}

export async function fetchCurrentUser(): Promise<User | null> {
  const stored = getStoredUser();
  if (!stored) return null;
  try {
    const res = await fetch(`${getApiBaseUrl()}/auth/me?session_id=${encodeURIComponent(stored.session_id)}`);
    if (res.ok) {
      const user = await res.json();
      setStoredUser(user);
      return user;
    }
  } catch {
    // If backend offline, retain stored user session
  }
  return stored;
}

// Client Session ID for isolated multi-device/multi-user live streaming
export function getSessionId(): string {
  const user = getStoredUser();
  if (user && user.session_id) {
    return user.session_id;
  }
  let id = localStorage.getItem('cpu_forecast_session_id');
  if (!id) {
    id = 'guest_' + Math.random().toString(36).substring(2, 10);
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

export function getAgentDownloadUrl(type: 'python' | 'powershell' = 'python'): string {
  const server = getRawServerUrl();
  return type === 'powershell' ? `${server}/api/agent/ps1` : `${server}/api/agent/download`;
}

export function getAgentCliCommand(osType: 'windows' | 'windows-file' | 'mac-linux' | 'local' = 'windows'): string {
  const server = getRawServerUrl();
  const sess = getSessionId();
  const dlUrl = getAgentDownloadUrl('python');
  const ps1Url = getAgentDownloadUrl('powershell');
  const agentUrl = `${ps1Url}?session=${encodeURIComponent(sess)}&server=${encodeURIComponent(server)}`;

  if (osType === 'windows') {
    // ── Works on ALL Windows laptops (Win10/11 PS5 & PS7, corporate TLS restrictions) ──
    // 1. Force TLS 1.2 so irm can reach HTTPS servers on older PS versions
    // 2. -ExecutionPolicy Bypass bypasses corporate restrictions
    // 3. & ([scriptblock]::Create(...)) runs the downloaded text as a script with full param support
    return `powershell -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; iex(irm '${agentUrl}')"` ;
  }
  if (osType === 'windows-file') {
    // Download agent.ps1 and run via PowerShell with execution policy bypass
    return `curl.exe -s "${ps1Url}" -o agent.ps1; powershell -ExecutionPolicy Bypass -File .\\agent.ps1 -Server "${server}" -Session "${sess}"`;
  }
  if (osType === 'mac-linux') {
    return `curl -s "${dlUrl}" -o agent.py && python3 agent.py --server "${server}" --session "${sess}"`;
  }
  return `python backend/agent.py --server "${server}" --session "${sess}"`;
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
}): Promise<ForecastResponse | null> {
  try {
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
    if (res.ok) {
      return await res.json();
    }
    // When in LIVE mode and machine is disconnected or has 0 samples, NEVER generate fake mock data!
    if (params.source === 'LIVE') {
      return null;
    }
  } catch {
    // When backend is unreachable in LIVE mode, return null to show disconnected standby state
    if (params.source === 'LIVE') {
      return null;
    }
  }

  // Only fall back to client mock for simulation if backend is down
  return generateClientMockForecast(params);
}

function generateClientMockForecast(params: {
  horizon: '1h' | '6h' | '12h' | '24h';
  window: number;
  source: 'LIVE' | 'SIMULATION';
  high_threshold?: number;
  low_threshold?: number;
}): ForecastResponse {
  const high = params.high_threshold ?? 75.0;
  const low = params.low_threshold ?? 20.0;
  const pointsCount = 48;
  const now = new Date();
  const historical_series: ForecastPoint[] = [];

  let currentVal = 44.0;
  for (let i = pointsCount - 1; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 5 * 60 * 1000);
    const timeStr = t.toTimeString().substring(0, 5);
    const noise = Math.sin(i * 0.35) * 10 + Math.cos(i * 0.18) * 6;
    const cpu = Math.max(12, Math.min(92, +(currentVal + noise).toFixed(2)));
    historical_series.push({
      timestamp: timeStr,
      actual: cpu,
      sma: +(cpu * 0.98).toFixed(2),
      wma: +(cpu * 0.99).toFixed(2),
      ema: +(cpu * 1.01).toFixed(2),
      is_forecast: false
    });
  }

  const lastActual = historical_series[historical_series.length - 1].actual ?? 45.0;
  const futureCount = params.horizon === '1h' ? 12 : params.horizon === '6h' ? 24 : params.horizon === '12h' ? 36 : 48;
  const forecast_series: ForecastPoint[] = [];

  for (let j = 1; j <= futureCount; j++) {
    const t = new Date(now.getTime() + j * 5 * 60 * 1000);
    const timeStr = t.toTimeString().substring(0, 5);
    const projected = Math.max(15, Math.min(90, +(lastActual + Math.sin(j * 0.28) * 12 + j * 0.3).toFixed(2)));
    forecast_series.push({
      timestamp: timeStr,
      actual: null,
      sma: +(projected * 0.97).toFixed(2),
      wma: +(projected * 1.02).toFixed(2),
      ema: +(projected * 0.99).toFixed(2),
      is_forecast: true
    });
  }

  const endForecast = forecast_series[forecast_series.length - 1];
  const wmaVal = endForecast.wma ?? 52.5;
  const smaVal = endForecast.sma ?? 48.2;
  const emaVal = endForecast.ema ?? 50.1;
  const bestForecast = wmaVal;

  let decision: 'SCALE UP' | 'NORMAL' | 'SCALE DOWN' | 'MONITOR' = 'NORMAL';
  let reason = `Forecast CPU (${bestForecast.toFixed(1)}%) is within the safe operational envelope (${low}% - ${high}%).`;
  if (bestForecast > high) {
    decision = 'SCALE UP';
    reason = `Forecast CPU (${bestForecast.toFixed(1)}%) exceeds safety threshold (${high}%). Proactive capacity scale-up recommended.`;
  } else if (bestForecast < low) {
    decision = 'SCALE DOWN';
    reason = `Forecast CPU (${bestForecast.toFixed(1)}%) is below floor (${low}%). Scale-down recommended to reduce cloud costs.`;
  }

  return {
    current_cpu: lastActual,
    horizon: params.horizon,
    resolution: '5-minute',
    window: params.window,
    sma_forecast: smaVal,
    wma_forecast: wmaVal,
    ema_forecast: emaVal,
    best_method: 'WMA',
    best_method_reason: 'WMA produced the lowest historical MAE (3.24%) and RMSE (4.62%).',
    metrics: [
      { method: 'SMA', mae: 4.12, mse: 32.4, rmse: 5.69 },
      { method: 'WMA', mae: 3.24, mse: 21.3, rmse: 4.62 },
      { method: 'EMA', mae: 3.78, mse: 26.8, rmse: 5.18 }
    ],
    scaling_decision: {
      decision,
      forecast_cpu: bestForecast,
      threshold: bestForecast > high ? high : low,
      difference: +(bestForecast - (bestForecast > high ? high : low)).toFixed(2),
      reason
    },
    trend: {
      direction: 'STABLE',
      recent_avg: lastActual,
      historical_avg: 42.0,
      slope: 0.1
    },
    historical_series,
    forecast_series,
    sample_count: historical_series.length
  };
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

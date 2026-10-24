export interface MonitorStatus {
  is_running: boolean;
  sampling_interval_seconds: number;
  samples_collected: number;
  duration_formatted: string;
  last_sample_time: string | null;
  current_cpu: number | null;
  source: string;
}

export interface MeasurementItem {
  id?: number;
  timestamp: string;
  cpu_utilization: number;
  source: 'LIVE' | 'SIMULATION';
}

export interface AccuracyMetricItem {
  method: 'SMA' | 'WMA' | 'EMA';
  mae: number;
  mse: number;
  rmse: number;
}

export interface WindowAnalysisItem {
  window: number;
  sma_mae: number;
  sma_rmse: number;
  wma_mae: number;
  wma_rmse: number;
  ema_mae: number;
  ema_rmse: number;
}

export interface ForecastPoint {
  timestamp: string;
  actual: number | null;
  sma: number | null;
  wma: number | null;
  ema: number | null;
  is_forecast: boolean;
}

export interface ScalingDecision {
  decision: 'SCALE UP' | 'NORMAL' | 'SCALE DOWN' | 'MONITOR';
  forecast_cpu: number;
  threshold: number;
  difference: number;
  reason: string;
}

export interface TrendInfo {
  direction: 'INCREASING' | 'DECREASING' | 'STABLE';
  recent_avg: number;
  historical_avg: number;
  slope: number;
}

export interface ForecastResponse {
  current_cpu: number;
  horizon: '1h' | '6h' | '12h' | '24h';
  resolution: string;
  window: number;
  sma_forecast: number;
  wma_forecast: number;
  ema_forecast: number;
  best_method: 'SMA' | 'WMA' | 'EMA';
  best_method_reason: string;
  metrics: AccuracyMetricItem[];
  scaling_decision: ScalingDecision;
  trend: TrendInfo;
  forecast_series: ForecastPoint[];
  historical_series: ForecastPoint[];
  sample_count: number;
}

export interface AIExplainResponse {
  status: 'ONLINE' | 'OFFLINE';
  model: string;
  explanation: string;
  response_time_ms: number;
  is_fallback: boolean;
  input_evidence: Record<string, any>;
}

export interface ConfigInfo {
  app_name: string;
  default_sampling_interval_seconds: number;
  default_high_cpu_threshold: number;
  default_low_cpu_threshold: number;
  default_window_size: number;
  default_horizon: string;
  ollama_endpoint: string;
  ollama_model: string;
  ollama_status: 'ONLINE' | 'OFFLINE';
}

export interface SessionStatus {
  session_id: string;
  device_name: string | null;
  is_connected: boolean;
  total_samples: number;
  last_sample_time: string | null;
  current_cpu: number | null;
}


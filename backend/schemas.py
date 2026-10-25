from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

class MonitorStatusResponse(BaseModel):
    is_running: bool
    sampling_interval_seconds: int
    samples_collected: int
    duration_formatted: str
    last_sample_time: Optional[str]
    current_cpu: Optional[float]
    source: str = "LIVE"

class MonitorStartRequest(BaseModel):
    interval_seconds: Optional[int] = Field(default=60, ge=1, le=3600)

class MeasurementItem(BaseModel):
    id: Optional[int] = None
    timestamp: str
    cpu_utilization: float
    source: Literal["LIVE", "SIMULATION"]
    session_id: Optional[str] = "default"
    device_name: Optional[str] = "Local Machine"

class GenerateDataRequest(BaseModel):
    duration: Literal["24h", "3d", "7d"] = "24h"
    seed: Optional[int] = 42
    clear_existing: bool = True

class ForecastRequest(BaseModel):
    horizon: Literal["1h", "6h", "12h", "24h"] = "6h"
    window: int = Field(default=5, ge=2, le=60)
    source: Literal["LIVE", "SIMULATION"] = "SIMULATION"
    session_id: Optional[str] = "default"
    resolution: Literal["auto", "fine", "standard"] = "auto"
    high_threshold: Optional[float] = 75.0
    low_threshold: Optional[float] = 20.0

class TelemetryPushRequest(BaseModel):
    session_id: str
    cpu_utilization: float = Field(ge=0.0, le=100.0)
    timestamp: Optional[str] = None
    device_name: Optional[str] = "My Machine"
    source: Literal["LIVE", "SIMULATION"] = "LIVE"

class TelemetryBatchPushRequest(BaseModel):
    session_id: str
    device_name: Optional[str] = "My Machine"
    records: List[Dict[str, Any]]

class SessionStatusResponse(BaseModel):
    session_id: str
    device_name: Optional[str] = None
    is_connected: bool
    total_samples: int
    last_sample_time: Optional[str] = None
    current_cpu: Optional[float] = None

class AccuracyMetricItem(BaseModel):
    method: Literal["SMA", "WMA", "EMA"]
    mae: float
    mse: float
    rmse: float

class WindowAnalysisItem(BaseModel):
    window: int
    sma_mae: float
    sma_rmse: float
    wma_mae: float
    wma_rmse: float
    ema_mae: float
    ema_rmse: float

class ForecastPoint(BaseModel):
    timestamp: str
    actual: Optional[float] = None
    sma: Optional[float] = None
    wma: Optional[float] = None
    ema: Optional[float] = None
    is_forecast: bool = False

class ScalingDecision(BaseModel):
    decision: Literal["SCALE UP", "NORMAL", "SCALE DOWN", "MONITOR"]
    forecast_cpu: float
    threshold: float
    difference: float
    reason: str

class TrendInfo(BaseModel):
    direction: Literal["INCREASING", "DECREASING", "STABLE"]
    recent_avg: float
    historical_avg: float
    slope: float

class ForecastResponse(BaseModel):
    current_cpu: float
    horizon: str
    resolution: str
    window: int
    sma_forecast: float
    wma_forecast: float
    ema_forecast: float
    best_method: Literal["SMA", "WMA", "EMA"]
    best_method_reason: str
    metrics: List[AccuracyMetricItem]
    scaling_decision: ScalingDecision
    trend: TrendInfo
    forecast_series: List[ForecastPoint]
    historical_series: List[ForecastPoint]
    sample_count: int

class AIExplainRequest(BaseModel):
    current_cpu: float
    forecast_horizon: str
    sma_forecast: float
    wma_forecast: float
    ema_forecast: float
    best_method: str
    sma_mae: float
    wma_mae: float
    ema_mae: float
    threshold: float
    scaling_decision: str
    recent_trend: str

class AIExplainResponse(BaseModel):
    status: Literal["ONLINE", "OFFLINE"]
    model: str
    explanation: str
    response_time_ms: float
    is_fallback: bool
    input_evidence: Dict[str, Any]

class RegisterRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="User password (min 6 characters)")
    full_name: Optional[str] = Field(default="", description="Optional full name or display name")

class LoginRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="User password")

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    session_id: str
    created_at: str
    token: str

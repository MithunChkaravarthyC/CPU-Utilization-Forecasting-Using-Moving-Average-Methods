import os
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
import psutil

from backend.config import settings
from backend.database import (
    init_db,
    get_measurements,
    get_measurement_count,
    clear_measurements,
    get_latest_measurement,
    insert_measurement
)
from backend.data_collector import collector
from backend.data_generator import generate_simulated_cpu_data
from backend.forecast_engine import (
    calculate_sma,
    calculate_wma,
    calculate_ema,
    forecast_recursive_sma,
    forecast_recursive_wma,
    forecast_recursive_ema
)
from backend.backtesting import run_historical_backtest, compare_window_sizes
from backend.scaling import evaluate_scaling
from backend.trend_analysis import analyze_trend
from backend.ai_service import generate_explanation, check_ollama_status
from backend.schemas import (
    MonitorStatusResponse,
    MonitorStartRequest,
    MeasurementItem,
    GenerateDataRequest,
    ForecastRequest,
    ForecastResponse,
    ForecastPoint,
    AccuracyMetricItem,
    WindowAnalysisItem,
    ScalingDecision,
    TrendInfo,
    AIExplainRequest,
    AIExplainResponse
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database
    init_db()
    # Check if simulation data exists, if not initialize 24h of simulation data so the user has immediate data
    if get_measurement_count(source="SIMULATION") == 0:
        generate_simulated_cpu_data(duration="24h", seed=42, clear_existing=False)
    yield
    # Stop background collector on shutdown
    collector.stop()

app = FastAPI(
    title=settings.app_name,
    description="Mathematical CPU Utilization Forecasting & Cloud Scaling Engine with Local Explainability",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    ollama_online, model_name = await check_ollama_status()
    return {
        "status": "healthy",
        "app_name": settings.app_name,
        "database": "sqlite_ready",
        "ollama_status": "ONLINE" if ollama_online else "OFFLINE",
        "ollama_model": model_name,
        "collector_running": collector.is_running
    }

@app.get("/api/config")
async def get_config():
    ollama_online, model_name = await check_ollama_status()
    return {
        "app_name": settings.app_name,
        "default_sampling_interval_seconds": settings.default_sampling_interval_seconds,
        "default_high_cpu_threshold": settings.default_high_cpu_threshold,
        "default_low_cpu_threshold": settings.default_low_cpu_threshold,
        "default_window_size": settings.default_window_size,
        "default_horizon": settings.default_horizon,
        "ollama_endpoint": settings.ollama_endpoint,
        "ollama_model": model_name,
        "ollama_status": "ONLINE" if ollama_online else "OFFLINE"
    }

@app.get("/api/monitor/status", response_model=MonitorStatusResponse)
async def monitor_status():
    status_data = collector.get_status()
    return MonitorStatusResponse(**status_data)

@app.post("/api/monitor/start", response_model=MonitorStatusResponse)
async def monitor_start(req: Optional[MonitorStartRequest] = None):
    interval = req.interval_seconds if req else settings.default_sampling_interval_seconds
    collector.start(interval_seconds=interval)
    return MonitorStatusResponse(**collector.get_status())

@app.post("/api/monitor/stop", response_model=MonitorStatusResponse)
async def monitor_stop():
    collector.stop()
    return MonitorStatusResponse(**collector.get_status())

@app.post("/api/monitor/clear")
async def monitor_clear(source: str = Query("LIVE", enum=["LIVE", "SIMULATION", "ALL"])):
    if source == "ALL":
        clear_measurements()
    else:
        clear_measurements(source=source)
    if source in ("LIVE", "ALL"):
        collector.clear_session()
    return {"message": f"Successfully cleared measurements for source: {source}"}

@app.get("/api/monitor/current")
async def monitor_current():
    cpu = psutil.cpu_percent(interval=0.1)
    return {
        "current_cpu": round(cpu, 1),
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

@app.get("/api/data")
async def get_data(
    source: str = Query("SIMULATION", enum=["LIVE", "SIMULATION"]),
    limit: Optional[int] = Query(200, ge=10, le=10000)
):
    measurements = get_measurements(source=source, limit=limit, order="DESC")
    # Return in chronological order
    measurements.reverse()
    return {
        "source": source,
        "count": len(measurements),
        "total_records": get_measurement_count(source=source),
        "data": measurements
    }

@app.post("/api/data/generate")
async def generate_data(req: GenerateDataRequest):
    count = generate_simulated_cpu_data(
        duration=req.duration,
        seed=req.seed,
        clear_existing=req.clear_existing
    )
    return {
        "message": f"Successfully generated {count} simulated observations for {req.duration}.",
        "count": count,
        "duration": req.duration,
        "seed": req.seed
    }

def get_horizon_resolution_steps(horizon: str, resolution: str) -> tuple[int, int, str]:
    """
    Returns (steps, interval_minutes, resolution_label)
    Default sensible resolutions (Section 7):
    - 1 hour: 1-minute intervals (60 steps)
    - 6 hour: 5-minute intervals (72 steps)
    - 12 hour: 10-minute intervals (72 steps)
    - 24 hour: 15-minute intervals (96 steps)
    """
    if horizon == "1h":
        interval = 1
        steps = 60
    elif horizon == "6h":
        interval = 1 if resolution == "fine" else 5
        steps = 360 if resolution == "fine" else 72
    elif horizon == "12h":
        interval = 2 if resolution == "fine" else 10
        steps = 360 if resolution == "fine" else 72
    elif horizon == "24h":
        interval = 5 if resolution == "fine" else 15
        steps = 288 if resolution == "fine" else 96
    else:
        interval = 5
        steps = 72
        
    return steps, interval, f"{interval}-minute"

@app.post("/api/forecast", response_model=ForecastResponse)
async def create_forecast(req: ForecastRequest):
    # Fetch historical data for requested source
    # For computation, we fetch up to the last 288 records (or all available)
    raw_measurements = get_measurements(source=req.source, limit=288, order="DESC")
    if not raw_measurements or len(raw_measurements) < req.window:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient historical data for this forecast configuration. Required window: {req.window} observations, available: {len(raw_measurements)}."
        )

    raw_measurements.reverse()
    timestamps = [m["timestamp"] for m in raw_measurements]
    cpu_values = [float(m["cpu_utilization"]) for m in raw_measurements]
    
    current_cpu = cpu_values[-1]
    
    # 1. Historical Smoothing & Backtesting
    sma_hist = calculate_sma(cpu_values, req.window)
    wma_hist = calculate_wma(cpu_values, req.window)
    ema_hist = calculate_ema(cpu_values, req.window)
    
    metrics_list, best_method, best_reason = run_historical_backtest(cpu_values, req.window)
    
    # 2. Multi-step Recursive Forecasting
    steps, interval_mins, res_label = get_horizon_resolution_steps(req.horizon, req.resolution)
    
    sma_future = forecast_recursive_sma(cpu_values, req.window, steps)
    wma_future = forecast_recursive_wma(cpu_values, req.window, steps)
    ema_future = forecast_recursive_ema(cpu_values, req.window, steps)
    
    # Final horizon forecast values
    sma_final = sma_future[-1]
    wma_final = wma_future[-1]
    ema_final = ema_future[-1]
    
    # Pick forecast based on best method
    best_forecast_val = {
        "SMA": sma_final,
        "WMA": wma_final,
        "EMA": ema_final
    }.get(best_method, ema_final)
    
    # 3. Deterministic Scaling Recommendation
    scaling_dec = evaluate_scaling(
        forecast_cpu=best_forecast_val,
        high_threshold=req.high_threshold or settings.default_high_cpu_threshold,
        low_threshold=req.low_threshold or settings.default_low_cpu_threshold
    )
    
    # 4. Trend Analysis
    trend = analyze_trend(cpu_values, recent_window=max(req.window * 2, 10))
    
    # 5. Format series for frontend charts
    # For historical series, return recent points (up to last 120 points for smooth rendering)
    display_history_limit = min(len(raw_measurements), 120)
    hist_start_idx = len(raw_measurements) - display_history_limit
    
    historical_series: List[ForecastPoint] = []
    for i in range(hist_start_idx, len(raw_measurements)):
        historical_series.append(ForecastPoint(
            timestamp=timestamps[i],
            actual=cpu_values[i],
            sma=sma_hist[i],
            wma=wma_hist[i],
            ema=ema_hist[i],
            is_forecast=False
        ))
        
    # Generate future timestamps
    last_dt = datetime.strptime(timestamps[-1], "%Y-%m-%d %H:%M:%S")
    forecast_series: List[ForecastPoint] = []
    
    # Add connecting anchor point at last known timestamp
    forecast_series.append(ForecastPoint(
        timestamp=timestamps[-1],
        actual=current_cpu,
        sma=sma_hist[-1] or current_cpu,
        wma=wma_hist[-1] or current_cpu,
        ema=ema_hist[-1] or current_cpu,
        is_forecast=False
    ))
    
    for step_idx in range(steps):
        future_dt = last_dt + timedelta(minutes=(step_idx + 1) * interval_mins)
        ts_str = future_dt.strftime("%Y-%m-%d %H:%M:%S")
        forecast_series.append(ForecastPoint(
            timestamp=ts_str,
            actual=None,
            sma=sma_future[step_idx],
            wma=wma_future[step_idx],
            ema=ema_future[step_idx],
            is_forecast=True
        ))
        
    accuracy_metrics = [AccuracyMetricItem(**m) for m in metrics_list]
    
    return ForecastResponse(
        current_cpu=current_cpu,
        horizon=req.horizon,
        resolution=res_label,
        window=req.window,
        sma_forecast=sma_final,
        wma_forecast=wma_final,
        ema_forecast=ema_final,
        best_method=best_method,
        best_method_reason=best_reason,
        metrics=accuracy_metrics,
        scaling_decision=ScalingDecision(**scaling_dec),
        trend=TrendInfo(**trend),
        forecast_series=forecast_series,
        historical_series=historical_series,
        sample_count=len(raw_measurements)
    )

@app.post("/api/forecast/compare")
async def forecast_window_comparison(
    source: str = Query("SIMULATION", enum=["LIVE", "SIMULATION"])
):
    measurements = get_measurements(source=source, limit=500, order="DESC")
    if not measurements or len(measurements) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient historical data to perform window size comparison. Please generate simulation data or collect live samples."
        )
    measurements.reverse()
    cpu_values = [float(m["cpu_utilization"]) for m in measurements]
    
    window_results = compare_window_sizes(cpu_values, windows=[3, 5, 7, 15, 30, 60])
    return {
        "source": source,
        "sample_count": len(cpu_values),
        "windows": window_results
    }

@app.get("/api/metrics")
async def get_metrics(
    source: str = Query("SIMULATION", enum=["LIVE", "SIMULATION"]),
    window: int = Query(5, ge=2, le=60)
):
    measurements = get_measurements(source=source, limit=500, order="DESC")
    if not measurements or len(measurements) < window:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient historical observations for metrics calculation."
        )
    measurements.reverse()
    cpu_values = [float(m["cpu_utilization"]) for m in measurements]
    metrics, best_method, reason = run_historical_backtest(cpu_values, window)
    return {
        "source": source,
        "window": window,
        "metrics": metrics,
        "best_method": best_method,
        "reason": reason
    }

@app.get("/api/backtest")
async def get_backtest(
    source: str = Query("SIMULATION", enum=["LIVE", "SIMULATION"]),
    window: int = Query(5, ge=2, le=60)
):
    measurements = get_measurements(source=source, limit=500, order="DESC")
    if not measurements or len(measurements) < window:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient historical observations for backtesting."
        )
    measurements.reverse()
    cpu_values = [float(m["cpu_utilization"]) for m in measurements]
    metrics, best_method, reason = run_historical_backtest(cpu_values, window)
    return {
        "source": source,
        "window": window,
        "metrics": metrics,
        "best_method": best_method,
        "reason": reason
    }

@app.get("/api/scaling")
async def get_scaling_status(
    forecast: float = Query(..., ge=0.0, le=100.0),
    high_threshold: float = Query(75.0, ge=1.0, le=99.0),
    low_threshold: float = Query(20.0, ge=0.0, le=98.0)
):
    decision = evaluate_scaling(
        forecast_cpu=forecast,
        high_threshold=high_threshold,
        low_threshold=low_threshold
    )
    return decision

@app.post("/api/ai/explain", response_model=AIExplainResponse)
async def explain_forecast(req: AIExplainRequest):
    evidence = req.model_dump()
    result = await generate_explanation(evidence)
    return AIExplainResponse(**result)

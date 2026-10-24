import numpy as np
from datetime import datetime
from typing import List, Dict, Tuple, Optional

def calculate_sma(series: List[float], window: int) -> List[Optional[float]]:
    """
    Computes SMA over historical series.
    Returns array of same length as series; values before window size are None.
    """
    n = len(series)
    if n < window:
        return [None] * n
    
    result: List[Optional[float]] = [None] * (window - 1)
    cum = np.cumsum(np.insert(series, 0, 0))
    rolling_sum = (cum[window:] - cum[:-window]) / window
    for val in rolling_sum:
        result.append(float(round(np.clip(val, 0.0, 100.0), 2)))
    return result

def calculate_wma(series: List[float], window: int) -> List[Optional[float]]:
    """
    Computes WMA over historical series.
    Weights are 1, 2, ..., window.
    """
    n = len(series)
    if n < window:
        return [None] * n
    
    weights = np.arange(1, window + 1, dtype=float)
    weight_sum = float(np.sum(weights))
    
    result: List[Optional[float]] = [None] * (window - 1)
    series_arr = np.array(series, dtype=float)
    for i in range(window - 1, n):
        window_slice = series_arr[i - window + 1 : i + 1]
        wma_val = np.sum(window_slice * weights) / weight_sum
        result.append(float(round(np.clip(wma_val, 0.0, 100.0), 2)))
    return result

def calculate_ema(series: List[float], window: int) -> List[Optional[float]]:
    """
    Computes EMA over historical series.
    alpha = 2 / (window + 1)
    """
    n = len(series)
    if n < window:
        return [None] * n
    
    alpha = 2.0 / (window + 1.0)
    result: List[Optional[float]] = [None] * (window - 1)
    
    first_ema = float(np.mean(series[:window]))
    result.append(float(round(np.clip(first_ema, 0.0, 100.0), 2)))
    
    current_ema = first_ema
    for i in range(window, n):
        current_ema = alpha * series[i] + (1.0 - alpha) * current_ema
        result.append(float(round(np.clip(current_ema, 0.0, 100.0), 2)))
        
    return result

def _get_diurnal_delta(start_time: Optional[datetime], k: int, interval_mins: int, amplitude: float = 12.0) -> float:
    """
    Computes natural diurnal cycle progression at future step k (1-indexed).
    24-hour cycle: peak at 14:00 (minute 840), trough at 02:00 (minute 120).
    """
    start_dt = start_time or datetime.now()
    now_min = start_dt.hour * 60 + start_dt.minute + start_dt.second / 60.0
    future_min = now_min + k * interval_mins
    
    s_now = np.sin(2.0 * np.pi * (now_min - 480.0) / 1440.0)
    s_future = np.sin(2.0 * np.pi * (future_min - 480.0) / 1440.0)
    
    return float(amplitude * (s_future - s_now))

def forecast_recursive_ema(
    series: List[float],
    window: int,
    steps: int,
    start_time: Optional[datetime] = None,
    interval_mins: int = 1
) -> List[float]:
    """
    Dynamic multi-step forecast using Fast-Adaptive Double Exponential Smoothing (Holt's Linear Trend with Damping).
    Projects local velocity + diurnal workload cycle + micro-burst oscillations without flat lines.
    """
    if not series:
        return [0.0] * steps
        
    alpha = 2.0 / (window + 1.0)
    beta = alpha * 0.4
    phi = 0.93  # Damping factor
    
    # Initialize Holt's Level and Trend
    l = float(series[0])
    b = float(series[1] - series[0]) if len(series) > 1 else 0.0
    for y in series[1:]:
        l_prev, b_prev = l, b
        l = alpha * y + (1.0 - alpha) * (l_prev + phi * b_prev)
        b = beta * (l - l_prev) + (1.0 - beta) * phi * b_prev
        
    # Amplitude estimated from data variance
    amp = min(22.0, max(8.0, float(np.std(series) * 3.0))) if len(series) >= 10 else 12.0
    
    future_forecasts = []
    for k in range(1, steps + 1):
        damped_trend = b * phi * (1.0 - (phi ** k)) / (1.0 - phi)
        diurnal_delta = _get_diurnal_delta(start_time, k, interval_mins, amplitude=amp)
        micro = 1.0 * np.sin(2.0 * np.pi * (k * interval_mins) / 25.0) * np.exp(-0.015 * k)
        
        pred = l + damped_trend + diurnal_delta + micro
        future_forecasts.append(float(round(np.clip(pred, 2.0, 98.5), 2)))
        
    return future_forecasts

def forecast_recursive_wma(
    series: List[float],
    window: int,
    steps: int,
    start_time: Optional[datetime] = None,
    interval_mins: int = 1
) -> List[float]:
    """
    Dynamic multi-step forecast using Recent-Weighted Moving Average.
    Fits a weighted linear trend over the latest window and extends with damping.
    """
    if not series:
        return [0.0] * steps
        
    w = min(window, len(series))
    recent_slice = np.array(series[-w:], dtype=float)
    weights = np.arange(1, w + 1, dtype=float)
    wma_level = float(np.sum(recent_slice * weights) / np.sum(weights))
    
    # Weighted slope over recent slice
    if w >= 2:
        x = np.arange(w, dtype=float)
        x_bar = np.sum(weights * x) / np.sum(weights)
        y_bar = wma_level
        cov = np.sum(weights * (x - x_bar) * (recent_slice - y_bar))
        var_x = np.sum(weights * ((x - x_bar) ** 2))
        slope = float(cov / var_x) if var_x > 1e-6 else 0.0
    else:
        slope = 0.0
        
    phi = 0.90
    amp = min(20.0, max(7.0, float(np.std(series) * 2.8))) if len(series) >= 10 else 11.0
    
    future_forecasts = []
    for k in range(1, steps + 1):
        damped_trend = slope * phi * (1.0 - (phi ** k)) / (1.0 - phi)
        diurnal_delta = _get_diurnal_delta(start_time, k, interval_mins, amplitude=amp)
        micro = 0.7 * np.sin(2.0 * np.pi * (k * interval_mins) / 30.0) * np.exp(-0.02 * k)
        
        pred = wma_level + damped_trend + diurnal_delta + micro
        future_forecasts.append(float(round(np.clip(pred, 2.0, 98.5), 2)))
        
    return future_forecasts

def forecast_recursive_sma(
    series: List[float],
    window: int,
    steps: int,
    start_time: Optional[datetime] = None,
    interval_mins: int = 1
) -> List[float]:
    """
    Dynamic multi-step forecast using Balanced Moving Average.
    Baseline level with conservative mean-reversion and diurnal cycle.
    """
    if not series:
        return [0.0] * steps
        
    w = min(window, len(series))
    sma_level = float(np.mean(series[-w:]))
    overall_mean = float(np.mean(series[-min(len(series), 60):]))
    
    slope = (series[-1] - sma_level) * 0.3
    phi = 0.85
    amp = min(18.0, max(6.0, float(np.std(series) * 2.5))) if len(series) >= 10 else 10.0
    
    future_forecasts = []
    for k in range(1, steps + 1):
        damped_trend = slope * phi * (1.0 - (phi ** k)) / (1.0 - phi)
        mean_reversion = (overall_mean - sma_level) * (1.0 - np.exp(-0.03 * k))
        diurnal_delta = _get_diurnal_delta(start_time, k, interval_mins, amplitude=amp)
        
        pred = sma_level + damped_trend + mean_reversion * 0.4 + diurnal_delta
        future_forecasts.append(float(round(np.clip(pred, 2.0, 98.5), 2)))
        
    return future_forecasts

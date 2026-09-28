import numpy as np
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
    # Fast rolling mean
    cum = np.cumsum(np.insert(series, 0, 0))
    rolling_sum = (cum[window:] - cum[:-window]) / window
    for val in rolling_sum:
        result.append(float(round(np.clip(val, 0.0, 100.0), 2)))
    return result

def calculate_wma(series: List[float], window: int) -> List[Optional[float]]:
    """
    Computes WMA over historical series.
    Weights are 1, 2, ..., window.
    Sum of weights = window * (window + 1) / 2
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
    Initial seed is SMA of first `window` observations.
    """
    n = len(series)
    if n < window:
        return [None] * n
    
    alpha = 2.0 / (window + 1.0)
    result: List[Optional[float]] = [None] * (window - 1)
    
    # Initialize first EMA value as SMA of first `window` points
    first_ema = float(np.mean(series[:window]))
    result.append(float(round(np.clip(first_ema, 0.0, 100.0), 2)))
    
    current_ema = first_ema
    for i in range(window, n):
        current_ema = alpha * series[i] + (1.0 - alpha) * current_ema
        result.append(float(round(np.clip(current_ema, 0.0, 100.0), 2)))
        
    return result

def forecast_recursive_sma(series: List[float], window: int, steps: int) -> List[float]:
    """
    Recursive multi-step forecast using SMA.
    Each future step uses the average of the previous `window` points.
    """
    working_series = list(series)
    future_forecasts = []
    
    for _ in range(steps):
        window_slice = working_series[-window:]
        next_val = float(np.mean(window_slice))
        clamped_val = float(round(np.clip(next_val, 0.0, 100.0), 2))
        future_forecasts.append(clamped_val)
        working_series.append(clamped_val)
        
    return future_forecasts

def forecast_recursive_wma(series: List[float], window: int, steps: int) -> List[float]:
    """
    Recursive multi-step forecast using WMA.
    """
    weights = np.arange(1, window + 1, dtype=float)
    weight_sum = float(np.sum(weights))
    
    working_series = list(series)
    future_forecasts = []
    
    for _ in range(steps):
        window_slice = np.array(working_series[-window:], dtype=float)
        next_val = float(np.sum(window_slice * weights) / weight_sum)
        clamped_val = float(round(np.clip(next_val, 0.0, 100.0), 2))
        future_forecasts.append(clamped_val)
        working_series.append(clamped_val)
        
    return future_forecasts

def forecast_recursive_ema(series: List[float], window: int, steps: int) -> List[float]:
    """
    Recursive multi-step forecast using EMA.
    In exponential smoothing, recursive 1-step to n-step forecast is flat:
    forecast_{t+k} = EMA_t.
    """
    # First compute the current EMA up to the end of the series
    ema_series = calculate_ema(series, window)
    last_ema = None
    for val in reversed(ema_series):
        if val is not None:
            last_ema = val
            break
            
    if last_ema is None:
        last_ema = float(round(np.mean(series[-window:]), 2))
        
    return [float(round(last_ema, 2))] * steps

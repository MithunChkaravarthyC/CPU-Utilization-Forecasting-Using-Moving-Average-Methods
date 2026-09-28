import numpy as np
from typing import List, Dict, Any, Tuple
from backend.forecast_engine import calculate_sma, calculate_wma, calculate_ema
from backend.metrics import calculate_all_metrics

def run_historical_backtest(series: List[float], window: int) -> Tuple[List[Dict[str, Any]], str, str]:
    """
    Performs one-step-ahead rolling backtest on historical series.
    Calculates MAE, MSE, and RMSE for SMA, WMA, EMA.
    Identifies the best method strictly through Python mathematical error minimization.
    """
    n = len(series)
    if n <= window:
        empty_metrics = [
            {"method": "SMA", "mae": 0.0, "mse": 0.0, "rmse": 0.0},
            {"method": "WMA", "mae": 0.0, "mse": 0.0, "rmse": 0.0},
            {"method": "EMA", "mae": 0.0, "mse": 0.0, "rmse": 0.0}
        ]
        return empty_metrics, "EMA", "Insufficient historical samples for full backtesting evaluation."

    # In one-step-ahead backtesting:
    # At time t, the forecast was based on x[0 ... t-1].
    # Therefore, predicted value at t is the moving average computed through t-1.
    actuals = series[window:]
    
    # Calculate moving averages
    sma_all = calculate_sma(series, window)
    wma_all = calculate_wma(series, window)
    ema_all = calculate_ema(series, window)
    
    # For one-step-ahead predictions at t in [window, n-1]:
    # prediction is the MA at index t-1
    sma_preds = [sma_all[i - 1] for i in range(window, n)]
    wma_preds = [wma_all[i - 1] for i in range(window, n)]
    ema_preds = [ema_all[i - 1] for i in range(window, n)]
    
    sma_metrics = calculate_all_metrics(actuals, sma_preds)
    wma_metrics = calculate_all_metrics(actuals, wma_preds)
    ema_metrics = calculate_all_metrics(actuals, ema_preds)
    
    metrics = [
        {"method": "SMA", **sma_metrics},
        {"method": "WMA", **wma_metrics},
        {"method": "EMA", **ema_metrics}
    ]
    
    # Select best method based on lowest MAE (with RMSE as tiebreaker)
    best = min(metrics, key=lambda m: (m["mae"], m["rmse"]))
    best_method = best["method"]
    reason = f"{best_method} produced the lowest historical MAE ({best['mae']:.2f}%) and RMSE ({best['rmse']:.2f}%)."
    
    return metrics, best_method, reason

def compare_window_sizes(series: List[float], windows: List[int] = [3, 5, 7, 15, 30, 60]) -> List[Dict[str, Any]]:
    """
    Computes MAE and RMSE across multiple window sizes for SMA, WMA, and EMA.
    Shows the mathematical trade-off: responsiveness vs noise dampening.
    """
    results = []
    n = len(series)
    
    for w in windows:
        if n > w + 2:
            metrics, _, _ = run_historical_backtest(series, w)
            sma_m = next(m for m in metrics if m["method"] == "SMA")
            wma_m = next(m for m in metrics if m["method"] == "WMA")
            ema_m = next(m for m in metrics if m["method"] == "EMA")
            
            results.append({
                "window": w,
                "sma_mae": sma_m["mae"],
                "sma_rmse": sma_m["rmse"],
                "wma_mae": wma_m["mae"],
                "wma_rmse": wma_m["rmse"],
                "ema_mae": ema_m["mae"],
                "ema_rmse": ema_m["rmse"]
            })
        else:
            results.append({
                "window": w,
                "sma_mae": 0.0,
                "sma_rmse": 0.0,
                "wma_mae": 0.0,
                "wma_rmse": 0.0,
                "ema_mae": 0.0,
                "ema_rmse": 0.0
            })
            
    return results

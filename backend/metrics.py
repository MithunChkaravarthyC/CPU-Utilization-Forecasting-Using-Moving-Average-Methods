import numpy as np
from typing import Sequence, Dict, Optional, Tuple

def calculate_mae(actual: Sequence[float], forecast: Sequence[float]) -> float:
    """
    MAE = sum(|Actual - Forecast|) / n
    """
    a = np.array(actual, dtype=float)
    f = np.array(forecast, dtype=float)
    mask = ~np.isnan(a) & ~np.isnan(f)
    if not np.any(mask):
        return 0.0
    mae = np.mean(np.abs(a[mask] - f[mask]))
    return float(round(mae, 4))

def calculate_mse(actual: Sequence[float], forecast: Sequence[float]) -> float:
    """
    MSE = sum((Actual - Forecast)^2) / n
    """
    a = np.array(actual, dtype=float)
    f = np.array(forecast, dtype=float)
    mask = ~np.isnan(a) & ~np.isnan(f)
    if not np.any(mask):
        return 0.0
    mse = np.mean((a[mask] - f[mask]) ** 2)
    return float(round(mse, 4))

def calculate_rmse(actual: Sequence[float], forecast: Sequence[float]) -> float:
    """
    RMSE = sqrt(MSE)
    """
    mse = calculate_mse(actual, forecast)
    return float(round(np.sqrt(mse), 4))

def calculate_all_metrics(actual: Sequence[float], forecast: Sequence[float]) -> Dict[str, float]:
    """
    Returns dict containing MAE, MSE, and RMSE.
    """
    a = np.array(actual, dtype=float)
    f = np.array(forecast, dtype=float)
    mask = ~np.isnan(a) & ~np.isnan(f)
    if not np.any(mask) or np.sum(mask) == 0:
        return {"mae": 0.0, "mse": 0.0, "rmse": 0.0}
    
    diff = a[mask] - f[mask]
    mae = float(np.mean(np.abs(diff)))
    mse = float(np.mean(diff ** 2))
    rmse = float(np.sqrt(mse))
    return {
        "mae": round(mae, 4),
        "mse": round(mse, 4),
        "rmse": round(rmse, 4)
    }

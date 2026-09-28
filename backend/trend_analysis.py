import numpy as np
from typing import Sequence, Dict, Any

def analyze_trend(series: Sequence[float], recent_window: int = 15) -> Dict[str, Any]:
    """
    Computes trend direction, recent average, overall historical average, and recent slope.
    """
    clean_series = [float(x) for x in series if x is not None and not np.isnan(x)]
    if not clean_series:
        return {
            "direction": "STABLE",
            "recent_avg": 0.0,
            "historical_avg": 0.0,
            "slope": 0.0
        }
    
    historical_avg = float(np.mean(clean_series))
    recent_k = min(len(clean_series), max(3, recent_window))
    recent_data = clean_series[-recent_k:]
    recent_avg = float(np.mean(recent_data))
    
    # Calculate slope using linear regression on recent_data
    if len(recent_data) > 1:
        x = np.arange(len(recent_data))
        y = np.array(recent_data)
        # y = slope * x + intercept
        slope, _ = np.polyfit(x, y, 1)
        slope = float(slope)
    else:
        slope = 0.0
    
    # Classify direction based on slope and difference
    # A slope threshold of +/- 0.15% per step represents a discernible drift
    if slope > 0.15:
        direction = "INCREASING"
    elif slope < -0.15:
        direction = "DECREASING"
    else:
        direction = "STABLE"
        
    return {
        "direction": direction,
        "recent_avg": round(recent_avg, 2),
        "historical_avg": round(historical_avg, 2),
        "slope": round(slope, 4)
    }

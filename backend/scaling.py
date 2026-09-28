from typing import Dict, Any

def evaluate_scaling(
    forecast_cpu: float,
    high_threshold: float = 75.0,
    low_threshold: float = 20.0
) -> Dict[str, Any]:
    """
    Evaluates cloud scaling recommendation deterministically.
    """
    forecast_clean = round(float(forecast_cpu), 2)
    high_thresh = round(float(high_threshold), 2)
    low_thresh = round(float(low_threshold), 2)
    
    diff = round(forecast_clean - high_thresh, 2)
    
    if forecast_clean >= high_thresh:
        decision = "SCALE UP"
        reason = f"Forecast of {forecast_clean:.1f}% exceeds the high CPU threshold of {high_thresh:.1f}% by {diff:+.1f}%. Provision additional cloud computing instances."
    elif forecast_clean < low_thresh:
        diff_low = round(forecast_clean - low_thresh, 2)
        decision = "SCALE DOWN"
        reason = f"Forecast of {forecast_clean:.1f}% is below the low CPU threshold of {low_thresh:.1f}% by {diff_low:.1f}%. Scale in idle instances to optimize cloud cost."
    else:
        decision = "NORMAL"
        reason = f"Forecast of {forecast_clean:.1f}% is within acceptable operating headroom ({low_thresh:.1f}% - {high_thresh:.1f}%). Continuous monitoring active."
        
    return {
        "decision": decision,
        "forecast_cpu": forecast_clean,
        "threshold": high_thresh,
        "difference": diff,
        "reason": reason
    }

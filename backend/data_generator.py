import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from backend.database import insert_measurements_batch, clear_measurements

def generate_simulated_cpu_data(
    duration: str = "24h",
    seed: Optional[int] = 42,
    clear_existing: bool = True
) -> int:
    """
    Generates realistic synthetic CPU utilization data for 24h, 3d, or 7d.
    Samples every 1 minute ending at the current time.
    """
    if seed is not None:
        np.random.seed(seed)
        
    duration_map = {
        "24h": 24 * 60,       # 1,440 minutes
        "3d": 3 * 24 * 60,    # 4,320 minutes
        "7d": 7 * 24 * 60     # 10,080 minutes
    }
    total_minutes = duration_map.get(duration, 1440)
    
    end_time = datetime.now().replace(second=0, microsecond=0)
    start_time = end_time - timedelta(minutes=total_minutes - 1)
    
    t = np.arange(total_minutes)
    
    # 1. Diurnal circadian pattern (24-hour cycle = 1440 minutes)
    # Peak at 14:00 (minute 840), trough at 04:00 (minute 240)
    diurnal = 22.0 * np.sin(2 * np.pi * (t - 480) / 1440) + 48.0
    
    # 2. Add weekly variation if 3d or 7d (lower load on day 6 and 7)
    day_indices = (t // 1440) % 7
    weekend_factor = np.where((day_indices == 5) | (day_indices == 6), 0.75, 1.0)
    base_signal = diurnal * weekend_factor
    
    # 3. Autoregressive AR(1) gradual trend & fluctuation
    ar_noise = np.zeros(total_minutes)
    phi = 0.94  # Strong persistence
    white_noise = np.random.normal(0, 2.5, total_minutes)
    for i in range(1, total_minutes):
        ar_noise[i] = phi * ar_noise[i - 1] + white_noise[i]
        
    # 4. Stochastic workload spikes (batch jobs, heavy requests)
    spikes = np.zeros(total_minutes)
    num_spikes = total_minutes // 120  # Average spike every 2 hours
    spike_indices = np.random.choice(total_minutes, size=num_spikes, replace=False)
    for idx in spike_indices:
        spike_duration = np.random.randint(5, 25)
        spike_magnitude = np.random.uniform(15.0, 32.0)
        end_idx = min(total_minutes, idx + spike_duration)
        spikes[idx:end_idx] += spike_magnitude * np.hanning(end_idx - idx) if end_idx - idx > 2 else spike_magnitude
        
    # Combine signals
    raw_cpu = base_signal + ar_noise + spikes
    # Strict clamping between 2.0% and 98.5%
    clamped_cpu = np.clip(raw_cpu, 2.0, 98.5)
    
    records: List[Dict[str, Any]] = []
    current_ts = start_time
    for val in clamped_cpu:
        records.append({
            "timestamp": current_ts.strftime("%Y-%m-%d %H:%M:%S"),
            "cpu_utilization": float(round(val, 2)),
            "source": "SIMULATION"
        })
        current_ts += timedelta(minutes=1)
        
    if clear_existing:
        clear_measurements(source="SIMULATION")
        
    insert_measurements_batch(records)
    return len(records)

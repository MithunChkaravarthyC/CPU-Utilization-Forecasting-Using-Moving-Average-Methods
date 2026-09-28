import time
import threading
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import psutil
from backend.database import insert_measurement, get_latest_measurement, get_measurement_count, clear_measurements

class BackgroundDataCollector:
    def __init__(self, interval_seconds: int = 60):
        self.interval_seconds = interval_seconds
        self._stop_event = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._start_time: Optional[datetime] = None
        self._last_sample_time: Optional[str] = None
        self._last_cpu_value: Optional[float] = None
        self._samples_count: int = 0
        self._lock = threading.Lock()

    @property
    def is_running(self) -> bool:
        return self._thread is not None and self._thread.is_alive()

    def start(self, interval_seconds: Optional[int] = None):
        with self._lock:
            if self.is_running:
                return
            if interval_seconds:
                self.interval_seconds = interval_seconds
            self._stop_event.clear()
            self._start_time = datetime.now()
            self._thread = threading.Thread(target=self._run_loop, daemon=True, name="CPUMonitorThread")
            self._thread.start()

    def stop(self):
        with self._lock:
            if not self.is_running:
                return
            self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=2.0)
            self._thread = None

    def _collect_sample(self):
        # psutil.cpu_percent with interval=None returns percentage since last call
        # We can pass interval=0.1 on initial or None when periodic
        cpu = psutil.cpu_percent(interval=0.2)
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        insert_measurement(timestamp=now_str, cpu_utilization=cpu, source="LIVE")
        with self._lock:
            self._last_sample_time = now_str
            self._last_cpu_value = cpu
            self._samples_count += 1

    def _run_loop(self):
        # Prime psutil first
        psutil.cpu_percent(interval=None)
        # Take immediate first sample
        self._collect_sample()
        
        while not self._stop_event.is_set():
            # Wait for interval or until stopped
            if self._stop_event.wait(timeout=self.interval_seconds):
                break
            self._collect_sample()

    def get_status(self) -> Dict[str, Any]:
        with self._lock:
            running = self.is_running
            start = self._start_time
            last_ts = self._last_sample_time
            last_cpu = self._last_cpu_value
            
        if not last_cpu or not last_ts:
            latest = get_latest_measurement(source="LIVE")
            if latest:
                last_ts = latest["timestamp"]
                last_cpu = latest["cpu_utilization"]
            else:
                last_cpu = psutil.cpu_percent(interval=None)
                last_ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        duration_formatted = "0h 00m"
        if start and running:
            delta = datetime.now() - start
            total_seconds = int(delta.total_seconds())
            hours = total_seconds // 3600
            mins = (total_seconds % 3600) // 60
            duration_formatted = f"{hours}h {mins:02d}m"

        total_live_samples = get_measurement_count(source="LIVE")

        return {
            "is_running": running,
            "sampling_interval_seconds": self.interval_seconds,
            "samples_collected": total_live_samples,
            "duration_formatted": duration_formatted,
            "last_sample_time": last_ts,
            "current_cpu": round(last_cpu, 1) if last_cpu is not None else None,
            "source": "LIVE"
        }

    def clear_session(self):
        clear_measurements(source="LIVE")
        with self._lock:
            self._samples_count = 0
            self._last_sample_time = None
            self._last_cpu_value = None
            if self.is_running:
                self._start_time = datetime.now()

# Global collector instance
collector = BackgroundDataCollector(interval_seconds=60)

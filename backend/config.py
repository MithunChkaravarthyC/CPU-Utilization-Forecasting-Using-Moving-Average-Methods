from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "cpu_measurements.db"

class Settings(BaseSettings):
    app_name: str = "CPU Utilization Forecasting Engine"
    database_url: str = f"sqlite:///{DB_PATH}"
    ollama_endpoint: str = "http://127.0.0.1:11434"
    ollama_model: str = "qwen3:8b"
    ollama_fallback_model: str = "qwen2.5:7b"
    ollama_timeout_seconds: float = 12.0
    
    # Monitoring Defaults
    default_sampling_interval_seconds: int = 60
    
    # Thresholds
    default_high_cpu_threshold: float = 75.0
    default_low_cpu_threshold: float = 20.0
    
    # Moving Average Window Defaults
    default_window_size: int = 5
    default_horizon: str = "6h"

    class Config:
        env_prefix = "CPU_FORECAST_"

settings = Settings()

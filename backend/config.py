import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "cpu_measurements.db"

# Load local .env file if it exists
env_path = BASE_DIR / ".env"
if env_path.is_file():
    try:
        from dotenv import load_dotenv
        load_dotenv(env_path)
    except ImportError:
        pass

class Settings(BaseSettings):
    app_name: str = "CPU Utilization Forecasting Engine"
    database_url: str = f"sqlite:///{DB_PATH}"
    
    # Cloud AI (Groq API)
    groq_api_key: str = ""
    groq_model: str = "qwen/qwen3.8-27b"
    groq_timeout_seconds: float = 12.0
    
    # Local AI (Ollama)
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

    @property
    def effective_groq_key(self) -> str:
        key = (
            os.getenv("GROQ_API_KEY") or
            os.getenv("CPU_FORECAST_GROQ_API_KEY") or
            self.groq_api_key
        )
        return key.strip() if key else ""

    class Config:
        env_prefix = "CPU_FORECAST_"
        env_file = str(BASE_DIR / ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()

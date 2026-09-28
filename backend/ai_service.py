import time
import json
from typing import Dict, Any, Tuple
import httpx
from backend.config import settings

SYSTEM_PROMPT = """You are an explainability assistant for a CPU utilization forecasting system.
The forecasting system uses deterministic mathematical methods including Simple Moving Average, Weighted Moving Average, and Exponential Moving Average.
All numerical values supplied to you have already been calculated by the mathematical forecasting engine.
Your task is to explain those results in simple technical language.
You must not perform or replace the official numerical calculations.
Never change numerical values.
Never invent data.
Never change the scaling recommendation.
Never create new thresholds.

Explain:
1. current CPU utilization
2. forecast
3. trend
4. best-performing forecasting method
5. forecasting accuracy
6. scaling recommendation

Keep the response concise and suitable for a college project demonstration.
Maximum response: 150 words."""

def generate_deterministic_fallback(evidence: Dict[str, Any]) -> str:
    """
    Deterministic Python-generated explanation used when Ollama is offline or unavailable.
    Ensures zero dependency on external network or local LLM availability.
    """
    current = evidence.get("current_cpu", 0.0)
    best_method = evidence.get("best_method", "EMA")
    forecast_key = f"{best_method.lower()}_forecast"
    forecast_val = evidence.get(forecast_key, evidence.get("ema_forecast", current))
    trend = evidence.get("recent_trend", "STABLE").lower()
    decision = evidence.get("scaling_decision", "NORMAL")
    threshold = evidence.get("threshold", 75.0)
    
    mae_key = f"{best_method.lower()}_mae"
    best_mae = evidence.get(mae_key, 0.0)
    
    explanation_parts = [
        f"Current CPU utilization is recorded at {current:.1f}%, exhibiting a {trend} workload trajectory.",
        f"The {best_method} model was determined as optimal via historical backtesting, achieving the lowest Mean Absolute Error (MAE: {best_mae:.2f}%).",
        f"Over the {evidence.get('forecast_horizon', 'selected')} horizon, {best_method} projects utilization reaching {forecast_val:.1f}%."
    ]
    
    if decision == "SCALE UP":
        explanation_parts.append(
            f"Because this forecast exceeds the high load threshold of {threshold:.1f}%, the cloud scaling engine issues a SCALE UP action to safeguard infrastructure headroom."
        )
    elif decision == "SCALE DOWN":
        explanation_parts.append(
            f"Because projected utilization drops below the threshold, the system recommends a SCALE DOWN action to conserve cloud infrastructure resources."
        )
    else:
        explanation_parts.append(
            f"As predicted demand remains comfortably balanced against threshold limits ({threshold:.1f}%), the system maintains NORMAL operational monitoring."
        )
        
    return " ".join(explanation_parts)

async def check_ollama_status() -> Tuple[bool, str]:
    """
    Checks if local Ollama daemon is reachable and whether the target model is present.
    """
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(f"{settings.ollama_endpoint}/api/tags")
            if resp.status_code == 200:
                data = resp.json()
                models = [m.get("name", "") for m in data.get("models", [])]
                # Look for qwen3:8b, or any qwen variant
                target = settings.ollama_model
                matched_model = next((m for m in models if target in m), None)
                if not matched_model and models:
                    # Check if any qwen model is available
                    qwen_found = next((m for m in models if "qwen" in m.lower()), models[0])
                    return True, qwen_found
                return True, target if matched_model else (models[0] if models else target)
    except Exception:
        pass
    return False, settings.ollama_model

async def generate_explanation(evidence: Dict[str, Any]) -> Dict[str, Any]:
    """
    Requests an explanation from Ollama Qwen3 8B.
    Falls back gracefully to deterministic Python explanation if Ollama is offline or errors.
    """
    start_time = time.time()
    is_online, active_model = await check_ollama_status()
    
    if not is_online:
        fallback_text = generate_deterministic_fallback(evidence)
        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        return {
            "status": "OFFLINE",
            "model": settings.ollama_model,
            "explanation": fallback_text,
            "response_time_ms": elapsed_ms,
            "is_fallback": True,
            "input_evidence": evidence
        }

    # Prepare compact structured prompt
    user_prompt = f"Please interpret and explain the following calculated forecasting results:\n\n{json.dumps(evidence, indent=2)}"
    
    payload = {
        "model": active_model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ],
        "stream": False,
        "options": {
            "temperature": 0.2,
            "num_predict": 220
        }
    }
    
    try:
        async with httpx.AsyncClient(timeout=settings.ollama_timeout_seconds) as client:
            resp = await client.post(
                f"{settings.ollama_endpoint}/api/chat",
                json=payload
            )
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            
            if resp.status_code == 200:
                result = resp.json()
                text = result.get("message", {}).get("content", "").strip()
                if text:
                    return {
                        "status": "ONLINE",
                        "model": active_model,
                        "explanation": text,
                        "response_time_ms": elapsed_ms,
                        "is_fallback": False,
                        "input_evidence": evidence
                    }
    except Exception:
        # Fall back cleanly
        pass
        
    fallback_text = generate_deterministic_fallback(evidence)
    elapsed_ms = round((time.time() - start_time) * 1000, 2)
    return {
        "status": "OFFLINE",
        "model": active_model,
        "explanation": fallback_text,
        "response_time_ms": elapsed_ms,
        "is_fallback": True,
        "input_evidence": evidence
    }

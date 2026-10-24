#!/usr/bin/env python3
"""
Real-time CPU Utilization Telemetry Agent
=========================================
Streams live CPU utilization metrics from any laptop or server to the
Vercel Forecasting Dashboard.

Usage:
    python agent.py --server https://your-backend.onrender.com --session YOUR_SESSION_ID
    python agent.py --server http://localhost:8000 --session test-session
"""

import os
import sys
import time
import socket
import platform
import argparse
import json
from datetime import datetime
from urllib import request, error

# Ensure terminal stdout handles Unicode safely across Windows/Linux/Mac
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# ---------------------------------------------------------
# Dynamic psutil loader with graceful OS fallback
# ---------------------------------------------------------
def get_cpu_reading() -> float:
    try:
        import psutil
        return float(psutil.cpu_percent(interval=0.5))
    except ImportError:
        pass

    # Fallback for Windows without psutil
    if platform.system() == "Windows":
        try:
            import subprocess
            cmd = 'powershell -NoProfile -Command "(Get-CimInstance Win32_Processor).LoadPercentage | Measure-Object -Average | Select -ExpandProperty Average"'
            output = subprocess.check_output(cmd, shell=True, text=True, timeout=2).strip()
            if output:
                return float(output)
        except Exception:
            pass

    # Fallback for Linux without psutil
    if platform.system() == "Linux":
        try:
            with open("/proc/stat", "r") as f:
                fields = [float(x) for x in f.readline().strip().split()[1:5]]
            idle1, total1 = fields[3], sum(fields)
            time.sleep(0.5)
            with open("/proc/stat", "r") as f:
                fields = [float(x) for x in f.readline().strip().split()[1:5]]
            idle2, total2 = fields[3], sum(fields)
            idle_delta = idle2 - idle1
            total_delta = total2 - total1
            if total_delta > 0:
                return round((1.0 - idle_delta / total_delta) * 100.0, 1)
        except Exception:
            pass

    # If all else fails, attempt auto-install
    try:
        print("[Agent] Installing psutil for high-accuracy CPU metrics...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "psutil", "--quiet"])
        import psutil
        return float(psutil.cpu_percent(interval=0.5))
    except Exception as e:
        print(f"[Agent] Note: Could not auto-install psutil ({e}).")
        return 25.0

def make_progress_bar(percent: float, length: int = 20) -> str:
    filled = int(round(length * percent / 100.0))
    bar = "=" * filled + "-" * (length - filled)
    return bar

def push_telemetry(server_url: str, session_id: str, device_name: str, cpu_val: float) -> bool:
    endpoint = f"{server_url.rstrip('/')}/api/telemetry/push"
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    payload = {
        "session_id": session_id,
        "cpu_utilization": round(cpu_val, 2),
        "timestamp": now_str,
        "device_name": device_name,
        "source": "LIVE"
    }
    
    data_bytes = json.dumps(payload).encode("utf-8")
    req = request.Request(
        endpoint,
        data=data_bytes,
        headers={"Content-Type": "application/json", "User-Agent": "CPUForecasterAgent/1.0"},
        method="POST"
    )

    try:
        with request.urlopen(req, timeout=5) as resp:
            return resp.status in (200, 201)
    except error.HTTPError as he:
        print(f" [HTTP {he.code}]", end="")
        return False
    except Exception as e:
        print(f" [Error: {type(e).__name__}]", end="")
        return False

def main():
    parser = argparse.ArgumentParser(description="CPU Telemetry Streaming Agent")
    parser.add_argument("--server", type=str, default="http://localhost:8000", help="Forecasting Backend URL (e.g., https://your-backend.onrender.com)")
    parser.add_argument("--session", type=str, default="default", help="Unique Session ID displayed in your dashboard")
    parser.add_argument("--device-name", type=str, default="", help="Custom friendly device label")
    parser.add_argument("--interval", type=int, default=5, help="Sampling interval in seconds (default: 5s)")
    parser.add_argument("--once", action="store_true", help="Send a single test measurement and exit")
    args = parser.parse_args()

    hostname = socket.gethostname()
    system_info = f"{platform.system()} {platform.release()}"
    device = args.device_name or f"{hostname} ({system_info})"
    server = args.server.rstrip("/")

    print("=" * 65)
    print(" [*] CPU UTILIZATION FORECASTING - TELEMETRY AGENT")
    print("=" * 65)
    print(f" Backend URL : {server}")
    print(f" Session ID  : {args.session}")
    print(f" Device Name : {device}")
    print(f" Interval    : Every {args.interval}s")
    print("=" * 65)
    print(" Streaming live CPU metrics... Press Ctrl+C to stop.\n")

    samples_sent = 0
    while True:
        try:
            cpu = get_cpu_reading()
            bar = make_progress_bar(cpu, length=18)
            now_ts = datetime.now().strftime("%H:%M:%S")
            
            print(f"[{now_ts}] CPU [{bar}] {cpu:5.1f}%", end="", flush=True)
            success = push_telemetry(server, args.session, device, cpu)
            
            if success:
                samples_sent += 1
                print(f" -> Sent (Total: {samples_sent})")
            else:
                print(" -> Retrying next tick...")

            if args.once:
                print(f"\n[Agent] Test sample complete. Sent: {samples_sent}")
                break

            time.sleep(args.interval)
        except KeyboardInterrupt:
            print(f"\n\n[Agent] Stopped by user. Total samples streamed: {samples_sent}")
            break
        except Exception as ex:
            print(f"\n[Agent] Unexpected error: {ex}. Waiting 5 seconds before retry...")
            time.sleep(5)

if __name__ == "__main__":
    main()

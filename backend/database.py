import sqlite3
from typing import List, Dict, Any, Optional
from datetime import datetime
from backend.config import DB_PATH

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cpu_measurements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                cpu_utilization REAL NOT NULL,
                source TEXT NOT NULL CHECK(source IN ('LIVE', 'SIMULATION')),
                session_id TEXT DEFAULT 'default',
                device_name TEXT DEFAULT 'Local Machine'
            )
        """)
        # Safe migration if table previously existed without session_id / device_name
        cursor.execute("PRAGMA table_info(cpu_measurements)")
        existing_cols = [row[1] for row in cursor.fetchall()]
        if "session_id" not in existing_cols:
            cursor.execute("ALTER TABLE cpu_measurements ADD COLUMN session_id TEXT DEFAULT 'default'")
        if "device_name" not in existing_cols:
            cursor.execute("ALTER TABLE cpu_measurements ADD COLUMN device_name TEXT DEFAULT 'Local Machine'")

        cursor.execute("CREATE INDEX IF NOT EXISTS idx_source_timestamp ON cpu_measurements (source, timestamp)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_session_source ON cpu_measurements (session_id, source, timestamp)")
        conn.commit()

def insert_measurement(
    timestamp: str,
    cpu_utilization: float,
    source: str = "LIVE",
    session_id: str = "default",
    device_name: str = "Local Machine"
) -> int:
    # Ensure CPU utilization is clamped between 0 and 100
    cpu_clean = max(0.0, min(100.0, round(float(cpu_utilization), 2)))
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO cpu_measurements (timestamp, cpu_utilization, source, session_id, device_name)
            VALUES (?, ?, ?, ?, ?)
            """,
            (timestamp, cpu_clean, source, session_id, device_name)
        )
        conn.commit()
        return cursor.lastrowid

def insert_measurements_batch(records: List[Dict[str, Any]]):
    """
    Records list of dicts: {'timestamp': str, 'cpu_utilization': float, 'source': str, 'session_id'?: str, 'device_name'?: str}
    """
    cleaned_records = []
    for r in records:
        cleaned_records.append({
            "timestamp": r["timestamp"],
            "cpu_utilization": max(0.0, min(100.0, round(float(r["cpu_utilization"]), 2))),
            "source": r.get("source", "LIVE"),
            "session_id": r.get("session_id", "default"),
            "device_name": r.get("device_name", "Local Machine")
        })

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.executemany(
            """
            INSERT INTO cpu_measurements (timestamp, cpu_utilization, source, session_id, device_name)
            VALUES (:timestamp, :cpu_utilization, :source, :session_id, :device_name)
            """,
            cleaned_records
        )
        conn.commit()

def get_measurements(
    source: Optional[str] = None,
    session_id: Optional[str] = None,
    limit: Optional[int] = None,
    order: str = "ASC"
) -> List[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        query = "SELECT id, timestamp, cpu_utilization, source, session_id, device_name FROM cpu_measurements"
        params = []
        conditions = []
        if source:
            conditions.append("source = ?")
            params.append(source)
        if session_id:
            conditions.append("session_id = ?")
            params.append(session_id)

        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        query += f" ORDER BY timestamp {order}"
        if limit:
            query += f" LIMIT {int(limit)}"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        result = [dict(row) for row in rows]
        if order == "DESC" and not limit:
            result.reverse()
        return result

def get_measurement_count(source: Optional[str] = None, session_id: Optional[str] = None) -> int:
    with get_connection() as conn:
        cursor = conn.cursor()
        query = "SELECT COUNT(*) FROM cpu_measurements"
        params = []
        conditions = []
        if source:
            conditions.append("source = ?")
            params.append(source)
        if session_id:
            conditions.append("session_id = ?")
            params.append(session_id)
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        cursor.execute(query, params)
        return cursor.fetchone()[0]

def clear_measurements(source: Optional[str] = None, session_id: Optional[str] = None):
    with get_connection() as conn:
        cursor = conn.cursor()
        query = "DELETE FROM cpu_measurements"
        params = []
        conditions = []
        if source:
            conditions.append("source = ?")
            params.append(source)
        if session_id:
            conditions.append("session_id = ?")
            params.append(session_id)
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        cursor.execute(query, params)
        conn.commit()

def get_latest_measurement(source: Optional[str] = None, session_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        query = "SELECT id, timestamp, cpu_utilization, source, session_id, device_name FROM cpu_measurements"
        params = []
        conditions = []
        if source:
            conditions.append("source = ?")
            params.append(source)
        if session_id:
            conditions.append("session_id = ?")
            params.append(session_id)
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        query += " ORDER BY timestamp DESC LIMIT 1"
        cursor.execute(query, params)
        row = cursor.fetchone()
        return dict(row) if row else None

def get_session_status(session_id: str) -> Dict[str, Any]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, timestamp, cpu_utilization, device_name
            FROM cpu_measurements
            WHERE session_id = ?
            ORDER BY timestamp DESC LIMIT 1
            """,
            (session_id,)
        )
        row = cursor.fetchone()
        count = get_measurement_count(session_id=session_id)
        if not row:
            return {
                "session_id": session_id,
                "device_name": None,
                "is_connected": False,
                "total_samples": 0,
                "last_sample_time": None,
                "current_cpu": None
            }
        
        last_dt_str = row["timestamp"]
        # Check if last sample was in the last 60 seconds
        is_active = False
        try:
            last_dt = datetime.strptime(last_dt_str, "%Y-%m-%d %H:%M:%S")
            diff = (datetime.now() - last_dt).total_seconds()
            is_active = abs(diff) < 90  # within 90 seconds
        except Exception:
            is_active = False

        return {
            "session_id": session_id,
            "device_name": row["device_name"],
            "is_connected": is_active,
            "total_samples": count,
            "last_sample_time": last_dt_str,
            "current_cpu": round(row["cpu_utilization"], 1)
        }

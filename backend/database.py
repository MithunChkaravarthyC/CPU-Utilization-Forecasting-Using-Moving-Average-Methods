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
                source TEXT NOT NULL CHECK(source IN ('LIVE', 'SIMULATION'))
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_source_timestamp ON cpu_measurements (source, timestamp)")
        conn.commit()

def insert_measurement(timestamp: str, cpu_utilization: float, source: str = "LIVE") -> int:
    # Ensure CPU utilization is clamped between 0 and 100
    cpu_clean = max(0.0, min(100.0, round(float(cpu_utilization), 2)))
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO cpu_measurements (timestamp, cpu_utilization, source) VALUES (?, ?, ?)",
            (timestamp, cpu_clean, source)
        )
        conn.commit()
        return cursor.lastrowid

def insert_measurements_batch(records: List[Dict[str, Any]]):
    """
    Records list of dicts: {'timestamp': str, 'cpu_utilization': float, 'source': str}
    """
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.executemany(
            "INSERT INTO cpu_measurements (timestamp, cpu_utilization, source) VALUES (:timestamp, :cpu_utilization, :source)",
            records
        )
        conn.commit()

def get_measurements(source: Optional[str] = None, limit: Optional[int] = None, order: str = "ASC") -> List[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        query = "SELECT id, timestamp, cpu_utilization, source FROM cpu_measurements"
        params = []
        if source:
            query += " WHERE source = ?"
            params.append(source)
        
        query += f" ORDER BY timestamp {order}"
        if limit:
            query += f" LIMIT {int(limit)}"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        result = [dict(row) for row in rows]
        if order == "DESC" and not limit:
            result.reverse()
        return result

def get_measurement_count(source: Optional[str] = None) -> int:
    with get_connection() as conn:
        cursor = conn.cursor()
        if source:
            cursor.execute("SELECT COUNT(*) FROM cpu_measurements WHERE source = ?", (source,))
        else:
            cursor.execute("SELECT COUNT(*) FROM cpu_measurements")
        return cursor.fetchone()[0]

def clear_measurements(source: Optional[str] = None):
    with get_connection() as conn:
        cursor = conn.cursor()
        if source:
            cursor.execute("DELETE FROM cpu_measurements WHERE source = ?", (source,))
        else:
            cursor.execute("DELETE FROM cpu_measurements")
        conn.commit()

def get_latest_measurement(source: Optional[str] = None) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        if source:
            cursor.execute("SELECT id, timestamp, cpu_utilization, source FROM cpu_measurements WHERE source = ? ORDER BY timestamp DESC LIMIT 1", (source,))
        else:
            cursor.execute("SELECT id, timestamp, cpu_utilization, source FROM cpu_measurements ORDER BY timestamp DESC LIMIT 1")
        row = cursor.fetchone()
        return dict(row) if row else None

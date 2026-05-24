import sqlite3
import json
import os
from datetime import datetime

class MonitorDB:
    def __init__(self, db_path="holmes_monitor.db"):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.db_path = os.path.join(base_dir, db_path)
        self._init_db()

    def _get_conn(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_conn() as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS monitors (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    target TEXT NOT NULL,
                    checks TEXT NOT NULL,
                    webhook_url TEXT,
                    webhook_type TEXT,
                    last_run TEXT
                )
            ''')
            conn.execute('''
                CREATE TABLE IF NOT EXISTS scans (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    monitor_id INTEGER,
                    timestamp TEXT,
                    findings TEXT
                )
            ''')
            conn.execute('''
                CREATE TABLE IF NOT EXISTS alerts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    monitor_id INTEGER,
                    timestamp TEXT,
                    new_findings TEXT
                )
            ''')
            conn.commit()

    def list_monitors(self):
        with self._get_conn() as conn:
            cur = conn.execute("SELECT * FROM monitors")
            return [dict(row) for row in cur.fetchall()]

    def get_monitor(self, monitor_id):
        with self._get_conn() as conn:
            cur = conn.execute("SELECT * FROM monitors WHERE id = ?", (monitor_id,))
            row = cur.fetchone()
            return dict(row) if row else None

    def add_monitor(self, target, checks, webhook_url, webhook_type):
        with self._get_conn() as conn:
            cur = conn.execute(
                "INSERT INTO monitors (target, checks, webhook_url, webhook_type, last_run) VALUES (?, ?, ?, ?, ?)",
                (target, json.dumps(checks), webhook_url, webhook_type, None)
            )
            conn.commit()
            return cur.lastrowid

    def delete_monitor(self, monitor_id):
        with self._get_conn() as conn:
            conn.execute("DELETE FROM monitors WHERE id = ?", (monitor_id,))
            conn.execute("DELETE FROM scans WHERE monitor_id = ?", (monitor_id,))
            conn.execute("DELETE FROM alerts WHERE monitor_id = ?", (monitor_id,))
            conn.commit()

    def get_latest_scan_for_target(self, target):
        with self._get_conn() as conn:
            cur = conn.execute('''
                SELECT s.* FROM scans s
                JOIN monitors m ON s.monitor_id = m.id
                WHERE m.target = ?
                ORDER BY s.timestamp DESC LIMIT 1
            ''', (target,))
            row = cur.fetchone()
            return dict(row) if row else None

    def save_scan(self, monitor_id, findings):
        with self._get_conn() as conn:
            cur = conn.execute(
                "INSERT INTO scans (monitor_id, timestamp, findings) VALUES (?, ?, ?)",
                (monitor_id, datetime.utcnow().isoformat(), json.dumps(findings))
            )
            conn.commit()
            return cur.lastrowid

    def diff_findings(self, new_scan_id, last_scan_id):
        with self._get_conn() as conn:
            new_cur = conn.execute("SELECT findings FROM scans WHERE id = ?", (new_scan_id,))
            old_cur = conn.execute("SELECT findings FROM scans WHERE id = ?", (last_scan_id,))
            new_row = new_cur.fetchone()
            old_row = old_cur.fetchone()

        if not new_row or not old_row:
            return {"new": []}

        new_f = json.loads(new_row["findings"])
        old_f = json.loads(old_row["findings"])

        new_items = []
        for key, val in new_f.items():
            if key not in old_f or old_f[key] != val:
                if isinstance(val, list) and isinstance(old_f.get(key, []), list):
                    diff_list = [v for v in val if v not in old_f.get(key, [])]
                    if diff_list:
                        new_items.append({"key": key, "value": diff_list})
                else:
                    new_items.append({"key": key, "value": val})
        
        return {"new": new_items}

    def update_monitor_last_run(self, monitor_id):
        with self._get_conn() as conn:
            conn.execute(
                "UPDATE monitors SET last_run = ? WHERE id = ?",
                (datetime.utcnow().isoformat(), monitor_id)
            )
            conn.commit()

    def save_alert(self, monitor_id, new_items):
        with self._get_conn() as conn:
            conn.execute(
                "INSERT INTO alerts (monitor_id, timestamp, new_findings) VALUES (?, ?, ?)",
                (monitor_id, datetime.utcnow().isoformat(), json.dumps(new_items))
            )
            conn.commit()

    def get_monitor_history(self, monitor_id, limit=10):
        with self._get_conn() as conn:
            cur = conn.execute(
                "SELECT * FROM alerts WHERE monitor_id = ? ORDER BY timestamp DESC LIMIT ?",
                (monitor_id, limit)
            )
            return [dict(row) for row in cur.fetchall()]

# Initialize singleton for main app
db = MonitorDB()

import sqlite3
import uuid
import json
from datetime import datetime
from typing import List, Dict, Any, Optional

DATABASE_PATH = "holmes.db"

class HolmesDB:
    def __init__(self):
        self.conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self._init_schema()
    
    def _init_schema(self):
        c = self.conn.cursor()
        
        c.execute("""
        CREATE TABLE IF NOT EXISTS scans (
            id TEXT PRIMARY KEY,
            target TEXT NOT NULL,
            target_type TEXT,
            status TEXT DEFAULT 'running',
            modules_run TEXT,
            risk_score INTEGER DEFAULT 0,
            risk_level TEXT DEFAULT 'INFO',
            created_at TEXT,
            completed_at TEXT
        );
        """)

        c.execute("""
        CREATE TABLE IF NOT EXISTS findings (
            id TEXT PRIMARY KEY,
            scan_id TEXT NOT NULL,
            module TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            risk_level TEXT DEFAULT 'INFO',
            confirmed INTEGER DEFAULT 0,
            created_at TEXT,
            FOREIGN KEY (scan_id) REFERENCES scans(id)
        );
        """)

        c.execute("""
        CREATE TABLE IF NOT EXISTS correlations (
            id TEXT PRIMARY KEY,
            scan_id TEXT NOT NULL,
            rule_name TEXT NOT NULL,
            severity TEXT NOT NULL,
            description TEXT,
            recommendation TEXT,
            created_at TEXT,
            FOREIGN KEY (scan_id) REFERENCES scans(id)
        );
        """)

        c.execute("""
        CREATE TABLE IF NOT EXISTS monitors (
            id TEXT PRIMARY KEY,
            target TEXT NOT NULL,
            checks TEXT,
            webhook_url TEXT,
            webhook_type TEXT,
            last_run TEXT,
            created_at TEXT
        );
        """)

        c.execute("""
        CREATE TABLE IF NOT EXISTS monitor_logs (
            id TEXT PRIMARY KEY,
            monitor_id TEXT NOT NULL,
            status TEXT,
            details TEXT,
            created_at TEXT,
            FOREIGN KEY (monitor_id) REFERENCES monitors(id)
        );
        """)

        c.execute("""
        CREATE TABLE IF NOT EXISTS investigations (
            id TEXT PRIMARY KEY,
            name TEXT,
            targets TEXT,
            notes TEXT,
            created_at TEXT,
            updated_at TEXT
        );
        """)
        self.conn.commit()
        
        # Self-healing migrations for older database instances
        try:
            c.execute("SELECT scan_id FROM findings LIMIT 1")
        except sqlite3.OperationalError:
            try:
                c.execute("ALTER TABLE findings ADD COLUMN scan_id TEXT")
                self.conn.commit()
            except Exception:
                pass
                
        try:
            c.execute("SELECT scan_id FROM correlations LIMIT 1")
        except sqlite3.OperationalError:
            try:
                c.execute("ALTER TABLE correlations ADD COLUMN scan_id TEXT")
                self.conn.commit()
            except Exception:
                pass

    # ==========================
    # SCANS
    # ==========================
    def create_scan(self, target: str, target_type: str) -> str:
        scan_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        c = self.conn.cursor()
        c.execute(
            "INSERT INTO scans (id, target, target_type, created_at) VALUES (?, ?, ?, ?)",
            (scan_id, target, target_type, now)
        )
        self.conn.commit()
        return scan_id

    def update_scan(self, scan_id: str, **kwargs):
        if not kwargs: return
        set_clause = ", ".join([f"{k}=?" for k in kwargs.keys()])
        values = list(kwargs.values())
        values.append(scan_id)
        
        c = self.conn.cursor()
        c.execute(f"UPDATE scans SET {set_clause} WHERE id=?", values)
        self.conn.commit()

    def get_scan(self, scan_id: str) -> dict:
        c = self.conn.cursor()
        c.execute("SELECT * FROM scans WHERE id=?", (scan_id,))
        scan_row = c.fetchone()
        if not scan_row:
            return {}
            
        result = dict(scan_row)
        if result.get("modules_run"):
            try: result["modules_run"] = json.loads(result["modules_run"])
            except: pass
            
        c.execute("SELECT * FROM findings WHERE scan_id=? ORDER BY created_at DESC", (scan_id,))
        result["findings"] = [dict(row) for row in c.fetchall()]
        
        c.execute("SELECT * FROM correlations WHERE scan_id=? ORDER BY created_at DESC", (scan_id,))
        result["correlations"] = [dict(row) for row in c.fetchall()]
        
        return result

    def list_scans(self, limit: int = 50) -> List[dict]:
        c = self.conn.cursor()
        c.execute("SELECT * FROM scans ORDER BY created_at DESC LIMIT ?", (limit,))
        rows = []
        for row in c.fetchall():
            d = dict(row)
            if d.get("modules_run"):
                try: d["modules_run"] = json.loads(d["modules_run"])
                except: pass
            rows.append(d)
        return rows

    def delete_scan(self, scan_id: str):
        c = self.conn.cursor()
        c.execute("DELETE FROM findings WHERE scan_id=?", (scan_id,))
        c.execute("DELETE FROM correlations WHERE scan_id=?", (scan_id,))
        c.execute("DELETE FROM scans WHERE id=?", (scan_id,))
        self.conn.commit()

    # ==========================
    # FINDINGS
    # ==========================
    def save_finding(self, scan_id: str, module: str, key: str, value: Any, risk_level: str = "INFO") -> str:
        f_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        if isinstance(value, (dict, list)):
            val_str = json.dumps(value)
        else:
            val_str = str(value)
            
        c = self.conn.cursor()
        c.execute(
            "INSERT INTO findings (id, scan_id, module, key, value, risk_level, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (f_id, scan_id, module, key, val_str, risk_level, now)
        )
        self.conn.commit()
        return f_id

    def get_findings(self, scan_id: str, risk_level: Optional[str] = None) -> List[dict]:
        c = self.conn.cursor()
        if risk_level:
            c.execute("SELECT * FROM findings WHERE scan_id=? AND risk_level=? ORDER BY created_at DESC", (scan_id, risk_level))
        else:
            c.execute("SELECT * FROM findings WHERE scan_id=? ORDER BY created_at DESC", (scan_id,))
        return [dict(row) for row in c.fetchall()]

    def update_finding_status(self, finding_id: str, confirmed: int):
        c = self.conn.cursor()
        c.execute("UPDATE findings SET confirmed=? WHERE id=?", (confirmed, finding_id))
        self.conn.commit()

    def diff_findings(self, scan_id_new: str, scan_id_old: str) -> dict:
        c = self.conn.cursor()
        c.execute("SELECT key, value FROM findings WHERE scan_id=?", (scan_id_new,))
        new_f = {f"{row['key']}": row['value'] for row in c.fetchall()}
        
        c.execute("SELECT key, value FROM findings WHERE scan_id=?", (scan_id_old,))
        old_f = {f"{row['key']}": row['value'] for row in c.fetchall()}
        
        new_findings = []
        resolved_findings = []
        unchanged = []
        
        for k, v in new_f.items():
            if k not in old_f:
                new_findings.append({"key": k, "value": v})
            elif old_f[k] != v:
                new_findings.append({"key": k, "value": v, "previous": old_f[k]})
            else:
                unchanged.append({"key": k, "value": v})
                
        for k, v in old_f.items():
            if k not in new_f:
                resolved_findings.append({"key": k, "value": v})

        return {
            "new": new_findings, # Added for monitor compatibility
            "new_findings": new_findings,
            "resolved_findings": resolved_findings,
            "unchanged": unchanged
        }

    def get_latest_scan_for_target(self, target: str) -> Optional[dict]:
        c = self.conn.cursor()
        c.execute("SELECT * FROM scans WHERE target=? ORDER BY created_at DESC LIMIT 1", (target,))
        row = c.fetchone()
        return dict(row) if row else None

    # ==========================
    # CORRELATIONS
    # ==========================
    def save_correlation(self, scan_id: str, rule_name: str, severity: str, description: str, recommendation: str):
        c_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        c = self.conn.cursor()
        c.execute(
            "INSERT INTO correlations (id, scan_id, rule_name, severity, description, recommendation, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (c_id, scan_id, rule_name, severity, description, recommendation, now)
        )
        self.conn.commit()

    def get_correlations(self, scan_id: str) -> List[dict]:
        c = self.conn.cursor()
        c.execute("SELECT * FROM correlations WHERE scan_id=? ORDER BY created_at DESC", (scan_id,))
        return [dict(row) for row in c.fetchall()]

    # ==========================
    # MONITORS
    # ==========================
    def add_monitor(self, target: str, checks: list, webhook_url: str, webhook_type: str) -> str:
        m_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        c = self.conn.cursor()
        c.execute(
            "INSERT INTO monitors (id, target, checks, webhook_url, webhook_type, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (m_id, target, json.dumps(checks), webhook_url, webhook_type, now)
        )
        self.conn.commit()
        return m_id

    def list_monitors(self) -> List[dict]:
        c = self.conn.cursor()
        c.execute("SELECT * FROM monitors ORDER BY created_at DESC")
        rows = []
        for row in c.fetchall():
            d = dict(row)
            if d.get("checks"):
                try: d["checks"] = json.loads(d["checks"])
                except: pass
            rows.append(d)
        return rows

    def get_monitor(self, monitor_id: str) -> Optional[dict]:
        c = self.conn.cursor()
        c.execute("SELECT * FROM monitors WHERE id=?", (monitor_id,))
        row = c.fetchone()
        if not row: return None
        d = dict(row)
        if d.get("checks"):
            try: d["checks"] = json.loads(d["checks"])
            except: pass
        return d

    def delete_monitor(self, monitor_id: str):
        c = self.conn.cursor()
        c.execute("DELETE FROM monitor_logs WHERE monitor_id=?", (monitor_id,))
        c.execute("DELETE FROM monitors WHERE id=?", (monitor_id,))
        self.conn.commit()

    def update_monitor_last_run(self, monitor_id: str):
        now = datetime.utcnow().isoformat()
        c = self.conn.cursor()
        c.execute("UPDATE monitors SET last_run=? WHERE id=?", (now, monitor_id))
        self.conn.commit()

    def add_monitor_log(self, monitor_id: str, status: str, details: str):
        l_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        c = self.conn.cursor()
        c.execute(
            "INSERT INTO monitor_logs (id, monitor_id, status, details, created_at) VALUES (?, ?, ?, ?, ?)",
            (l_id, monitor_id, status, details, now)
        )
        self.conn.commit()

    def get_monitor_logs(self, monitor_id: str, limit: int = 10) -> List[dict]:
        c = self.conn.cursor()
        c.execute("SELECT * FROM monitor_logs WHERE monitor_id=? ORDER BY created_at DESC LIMIT ?", (monitor_id, limit))
        return [dict(row) for row in c.fetchall()]

# Singleton instance
db = HolmesDB()

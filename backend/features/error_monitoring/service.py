"""
エラーモニタリングサービス
"""
import json
import sqlite3
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from pathlib import Path
import threading
from collections import defaultdict, deque
import hashlib

from .models import (
    ErrorReport, ErrorOccurrence, ErrorStatistics,
    ErrorSeverity, ErrorCategory, ErrorStatus
)
from core.logger import get_logger, LogCategory

logger = get_logger(__name__)

class ErrorMonitoringService:
    """
    エンタープライズグレードエラーモニタリングサービス
    """
    
    def __init__(self, db_path: str = "error_monitoring.db"):
        self.db_path = db_path
        self.recent_errors = deque(maxlen=1000)  # メモリ内の最近のエラー
        self.error_counts = defaultdict(int)  # エラー発生回数
        self.lock = threading.Lock()
        
        self._init_database()
        logger.info("Error monitoring service initialized", category=LogCategory.SYSTEM)
    
    def _init_database(self):
        """データベース初期化"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # エラーレポートテーブル
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS error_reports (
                id TEXT PRIMARY KEY,
                fingerprint TEXT UNIQUE,
                message TEXT,
                category TEXT,
                severity TEXT,
                status TEXT,
                first_occurrence TEXT,
                last_occurrence TEXT,
                occurrence_count INTEGER,
                affected_users TEXT,
                stack_trace TEXT,
                context TEXT,
                resolution_notes TEXT,
                assigned_to TEXT
            )
        ''')
        
        # エラー発生テーブル
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS error_occurrences (
                id TEXT PRIMARY KEY,
                error_report_id TEXT,
                timestamp TEXT,
                user_id TEXT,
                session_id TEXT,
                request_id TEXT,
                url TEXT,
                user_agent TEXT,
                context TEXT,
                FOREIGN KEY (error_report_id) REFERENCES error_reports (id)
            )
        ''')
        
        # インデックス作成
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_error_reports_fingerprint 
            ON error_reports (fingerprint)
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_error_reports_category 
            ON error_reports (category)
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_error_reports_severity 
            ON error_reports (severity)
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_error_occurrences_timestamp 
            ON error_occurrences (timestamp)
        ''')
        cursor.execute('''
            CREATE INDEX IF NOT EXISTS idx_error_occurrences_error_report_id 
            ON error_occurrences (error_report_id)
        ''')
        
        conn.commit()
        conn.close()
    
    def _generate_fingerprint(self, message: str, stack_trace: str = None) -> str:
        """エラーフィンガープリント生成"""
        # メッセージとスタックトレースの最初の行からフィンガープリントを生成
        content = message
        if stack_trace:
            first_stack_line = stack_trace.split('\\n')[0] if stack_trace else ''
            content += first_stack_line
        
        return hashlib.md5(content.encode()).hexdigest()[:16]
    
    def report_error(
        self,
        message: str,
        category: ErrorCategory = ErrorCategory.UNKNOWN,
        severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        stack_trace: str = None,
        context: Dict[str, Any] = None,
        user_id: str = None,
        session_id: str = None,
        request_id: str = None,
        url: str = None,
        user_agent: str = None
    ) -> str:
        """エラーレポート作成"""
        fingerprint = self._generate_fingerprint(message, stack_trace)
        now = datetime.now()
        
        with self.lock:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            try:
                # 既存のエラーレポート確認
                cursor.execute(
                    "SELECT id, occurrence_count, affected_users FROM error_reports WHERE fingerprint = ?",
                    (fingerprint,)
                )
                existing = cursor.fetchone()
                
                if existing:
                    # 既存エラーを更新
                    report_id, count, affected_users_json = existing
                    affected_users = json.loads(affected_users_json) if affected_users_json else []
                    
                    if user_id and user_id not in affected_users:
                        affected_users.append(user_id)
                    
                    cursor.execute('''
                        UPDATE error_reports 
                        SET last_occurrence = ?, occurrence_count = ?, affected_users = ?
                        WHERE id = ?
                    ''', (
                        now.isoformat(),
                        count + 1,
                        json.dumps(affected_users),
                        report_id
                    ))\n                else:\n                    # 新規エラーレポート作成\n                    import uuid\n                    report_id = str(uuid.uuid4())\n                    affected_users = [user_id] if user_id else []\n                    \n                    cursor.execute('''\n                        INSERT INTO error_reports (\n                            id, fingerprint, message, category, severity, status,\n                            first_occurrence, last_occurrence, occurrence_count,\n                            affected_users, stack_trace, context\n                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\n                    ''', (\n                        report_id,\n                        fingerprint,\n                        message,\n                        category.value,\n                        severity.value,\n                        ErrorStatus.OPEN.value,\n                        now.isoformat(),\n                        now.isoformat(),\n                        1,\n                        json.dumps(affected_users),\n                        stack_trace,\n                        json.dumps(context) if context else None\n                    ))\n                \n                # エラー発生記録\n                occurrence_id = str(uuid.uuid4())\n                cursor.execute('''\n                    INSERT INTO error_occurrences (\n                        id, error_report_id, timestamp, user_id, session_id,\n                        request_id, url, user_agent, context\n                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)\n                ''', (\n                    occurrence_id,\n                    report_id,\n                    now.isoformat(),\n                    user_id,\n                    session_id,\n                    request_id,\n                    url,\n                    user_agent,\n                    json.dumps(context) if context else None\n                ))\n                \n                conn.commit()\n                \n                # メモリ内キャッシュ更新\n                self.recent_errors.append({\n                    'id': report_id,\n                    'fingerprint': fingerprint,\n                    'message': message,\n                    'category': category.value,\n                    'severity': severity.value,\n                    'timestamp': now.isoformat(),\n                    'user_id': user_id\n                })\n                \n                self.error_counts[fingerprint] += 1\n                \n                logger.info(\n                    f\"Error reported: {message[:100]}\",\n                    category=LogCategory.SYSTEM,\n                    error_fingerprint=fingerprint,\n                    error_category=category.value,\n                    error_severity=severity.value\n                )\n                \n                return report_id\n                \n            except Exception as e:\n                conn.rollback()\n                logger.error(f\"Failed to report error: {e}\", category=LogCategory.SYSTEM, exc_info=True)\n                raise\n            finally:\n                conn.close()\n    \n    def get_error_reports(\n        self,\n        category: ErrorCategory = None,\n        severity: ErrorSeverity = None,\n        status: ErrorStatus = None,\n        limit: int = 100,\n        offset: int = 0\n    ) -> List[ErrorReport]:\n        \"\"\"エラーレポート一覧取得\"\"\"\n        conn = sqlite3.connect(self.db_path)\n        cursor = conn.cursor()\n        \n        query = \"SELECT * FROM error_reports WHERE 1=1\"\n        params = []\n        \n        if category:\n            query += \" AND category = ?\"\n            params.append(category.value)\n        \n        if severity:\n            query += \" AND severity = ?\"\n            params.append(severity.value)\n        \n        if status:\n            query += \" AND status = ?\"\n            params.append(status.value)\n        \n        query += \" ORDER BY last_occurrence DESC LIMIT ? OFFSET ?\"\n        params.extend([limit, offset])\n        \n        cursor.execute(query, params)\n        rows = cursor.fetchall()\n        conn.close()\n        \n        reports = []\n        for row in rows:\n            reports.append(ErrorReport(\n                id=row[0],\n                fingerprint=row[1],\n                message=row[2],\n                category=ErrorCategory(row[3]),\n                severity=ErrorSeverity(row[4]),\n                status=ErrorStatus(row[5]),\n                first_occurrence=datetime.fromisoformat(row[6]),\n                last_occurrence=datetime.fromisoformat(row[7]),\n                occurrence_count=row[8],\n                affected_users=json.loads(row[9]) if row[9] else [],\n                stack_trace=row[10],\n                context=json.loads(row[11]) if row[11] else None,\n                resolution_notes=row[12],\n                assigned_to=row[13]\n            ))\n        \n        return reports\n    \n    def get_error_statistics(self, hours: int = 24) -> ErrorStatistics:\n        \"\"\"エラー統計取得\"\"\"\n        since = datetime.now() - timedelta(hours=hours)\n        \n        conn = sqlite3.connect(self.db_path)\n        cursor = conn.cursor()\n        \n        # 総エラー数\n        cursor.execute(\n            \"SELECT COUNT(*) FROM error_occurrences WHERE timestamp >= ?\",\n            (since.isoformat(),)\n        )\n        total_errors = cursor.fetchone()[0]\n        \n        # エラー率（分あたり）\n        error_rate = total_errors / (hours * 60) if hours > 0 else 0\n        \n        # カテゴリ別エラー数\n        cursor.execute('''\n            SELECT er.category, COUNT(*) \n            FROM error_reports er\n            JOIN error_occurrences eo ON er.id = eo.error_report_id\n            WHERE eo.timestamp >= ?\n            GROUP BY er.category\n        ''', (since.isoformat(),))\n        \n        errors_by_category = {}\n        for category_str, count in cursor.fetchall():\n            errors_by_category[ErrorCategory(category_str)] = count\n        \n        # 重要度別エラー数\n        cursor.execute('''\n            SELECT er.severity, COUNT(*) \n            FROM error_reports er\n            JOIN error_occurrences eo ON er.id = eo.error_report_id\n            WHERE eo.timestamp >= ?\n            GROUP BY er.severity\n        ''', (since.isoformat(),))\n        \n        errors_by_severity = {}\n        for severity_str, count in cursor.fetchall():\n            errors_by_severity[ErrorSeverity(severity_str)] = count\n        \n        # トップエラー\n        cursor.execute('''\n            SELECT er.* FROM error_reports er\n            WHERE er.last_occurrence >= ?\n            ORDER BY er.occurrence_count DESC\n            LIMIT 10\n        ''', (since.isoformat(),))\n        \n        top_errors = []\n        for row in cursor.fetchall():\n            top_errors.append(ErrorReport(\n                id=row[0],\n                fingerprint=row[1],\n                message=row[2],\n                category=ErrorCategory(row[3]),\n                severity=ErrorSeverity(row[4]),\n                status=ErrorStatus(row[5]),\n                first_occurrence=datetime.fromisoformat(row[6]),\n                last_occurrence=datetime.fromisoformat(row[7]),\n                occurrence_count=row[8],\n                affected_users=json.loads(row[9]) if row[9] else [],\n                stack_trace=row[10],\n                context=json.loads(row[11]) if row[11] else None,\n                resolution_notes=row[12],\n                assigned_to=row[13]\n            ))\n        \n        conn.close()\n        \n        return ErrorStatistics(\n            total_errors=total_errors,\n            error_rate=error_rate,\n            errors_by_category=errors_by_category,\n            errors_by_severity=errors_by_severity,\n            top_errors=top_errors,\n            trend_data=[]  # 実装省略\n        )\n    \n    def resolve_error(self, error_id: str, resolution_notes: str = None, assigned_to: str = None) -> bool:\n        \"\"\"エラー解決\"\"\"\n        conn = sqlite3.connect(self.db_path)\n        cursor = conn.cursor()\n        \n        cursor.execute('''\n            UPDATE error_reports \n            SET status = ?, resolution_notes = ?, assigned_to = ?\n            WHERE id = ?\n        ''', (ErrorStatus.RESOLVED.value, resolution_notes, assigned_to, error_id))\n        \n        success = cursor.rowcount > 0\n        conn.commit()\n        conn.close()\n        \n        if success:\n            logger.audit(\n                \"error_resolved\",\n                f\"error_report:{error_id}\",\n                result=\"SUCCESS\",\n                resolver=assigned_to\n            )\n        \n        return success\n    \n    def get_error_trends(self, hours: int = 24, interval_minutes: int = 60) -> List[Dict[str, Any]]:\n        \"\"\"エラートレンド取得\"\"\"\n        since = datetime.now() - timedelta(hours=hours)\n        \n        conn = sqlite3.connect(self.db_path)\n        cursor = conn.cursor()\n        \n        # 時間間隔でエラー数を集計\n        cursor.execute('''\n            SELECT \n                datetime((julianday(timestamp) - julianday(?)) * 24 * 60 / ? ) * ? / 60 / 24 + julianday(?)) as interval_start,\n                COUNT(*) as error_count\n            FROM error_occurrences \n            WHERE timestamp >= ?\n            GROUP BY interval_start\n            ORDER BY interval_start\n        ''', (since.isoformat(), interval_minutes, interval_minutes, since.isoformat(), since.isoformat()))\n        \n        trends = []\n        for row in cursor.fetchall():\n            trends.append({\n                'timestamp': row[0],\n                'error_count': row[1]\n            })\n        \n        conn.close()\n        return trends\n\n# グローバルインスタンス\nerror_monitoring_service = ErrorMonitoringService()
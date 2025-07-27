"""
Enterprise-grade Backend Logging System
エンタープライズレベルのバックエンドログシステム
"""
import logging
import logging.handlers
import sys
import json
import threading
import time
import uuid
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
from contextlib import contextmanager
import traceback

class LogLevel(Enum):
    CRITICAL = 50
    ERROR = 40
    WARNING = 30
    INFO = 20
    DEBUG = 10
    TRACE = 5

class LogCategory(Enum):
    API = "api"
    DATABASE = "database"
    BUSINESS = "business"
    SECURITY = "security"
    PERFORMANCE = "performance"
    SYSTEM = "system"
    EXTERNAL = "external"
    AUDIT = "audit"

@dataclass
class LogEntry:
    timestamp: str
    level: str
    category: str
    message: str
    logger_name: str
    module: str
    function: str
    line_number: int
    process_id: int
    thread_id: str
    correlation_id: Optional[str] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    request_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None
    stack_trace: Optional[str] = None
    duration_ms: Optional[float] = None
    error_fingerprint: Optional[str] = None

class StructuredFormatter(logging.Formatter):
    """構造化ログフォーマッター"""
    
    def format(self, record: logging.LogRecord) -> str:
        # 基本情報
        log_entry = LogEntry(
            timestamp=datetime.fromtimestamp(record.created).isoformat(),
            level=record.levelname,
            category=getattr(record, 'category', LogCategory.SYSTEM.value),
            message=record.getMessage(),
            logger_name=record.name,
            module=record.module,
            function=record.funcName,
            line_number=record.lineno,
            process_id=record.process,
            thread_id=str(record.thread),
            correlation_id=getattr(record, 'correlation_id', None),
            user_id=getattr(record, 'user_id', None),
            session_id=getattr(record, 'session_id', None),
            request_id=getattr(record, 'request_id', None),
            context=getattr(record, 'context', None),
            duration_ms=getattr(record, 'duration_ms', None),
            error_fingerprint=getattr(record, 'error_fingerprint', None)
        )
        
        # スタックトレース
        if record.exc_info:
            log_entry.stack_trace = self.formatException(record.exc_info)
        
        return json.dumps(asdict(log_entry), ensure_ascii=False, separators=(',', ':'))

class EnterpriseLogger:
    """
    エンタープライズグレードロガー
    """
    
    def __init__(self, name: str):
        self.name = name
        self.logger = logging.getLogger(name)
        self._local = threading.local()
    
    def _get_context(self) -> Dict[str, Any]:
        """スレッドローカルコンテキストを取得"""
        if not hasattr(self._local, 'context'):
            self._local.context = {}
        return self._local.context
    
    def set_context(self, **kwargs):
        """ログコンテキストを設定"""
        context = self._get_context()
        context.update(kwargs)
    
    def clear_context(self):
        """ログコンテキストをクリア"""
        if hasattr(self._local, 'context'):
            self._local.context.clear()
    
    @contextmanager
    def context(self, **kwargs):
        """一時的なコンテキスト"""
        old_context = self._get_context().copy()
        try:
            self.set_context(**kwargs)
            yield
        finally:
            self._local.context = old_context
    
    def _log(self, level: int, message: str, category: LogCategory = LogCategory.SYSTEM, 
             exc_info=None, **kwargs):
        """内部ログメソッド"""
        if self.logger.isEnabledFor(level):
            context = self._get_context().copy()
            context.update(kwargs)
            
            extra = {
                'category': category.value,
                'context': context if context else None,
                **{k: v for k, v in context.items() if k in [
                    'correlation_id', 'user_id', 'session_id', 'request_id',
                    'duration_ms', 'error_fingerprint'
                ]}
            }
            
            self.logger.log(level, message, exc_info=exc_info, extra=extra)
    
    def trace(self, message: str, category: LogCategory = LogCategory.SYSTEM, **kwargs):
        self._log(LogLevel.TRACE.value, message, category, **kwargs)
    
    def debug(self, message: str, category: LogCategory = LogCategory.SYSTEM, **kwargs):
        self._log(LogLevel.DEBUG.value, message, category, **kwargs)
    
    def info(self, message: str, category: LogCategory = LogCategory.SYSTEM, **kwargs):
        self._log(LogLevel.INFO.value, message, category, **kwargs)
    
    def warning(self, message: str, category: LogCategory = LogCategory.SYSTEM, **kwargs):
        self._log(LogLevel.WARNING.value, message, category, **kwargs)
    
    def error(self, message: str, category: LogCategory = LogCategory.SYSTEM, 
              exc_info=None, **kwargs):
        if exc_info is True:
            exc_info = sys.exc_info()
        
        # エラーフィンガープリント生成
        if exc_info and exc_info[1]:
            error_type = exc_info[0].__name__ if exc_info[0] else 'Unknown'
            error_msg = str(exc_info[1]) if exc_info[1] else ''
            kwargs['error_fingerprint'] = f"{error_type}:{hash(error_msg) % 10000:04d}"
        
        self._log(LogLevel.ERROR.value, message, category, exc_info, **kwargs)
    
    def critical(self, message: str, category: LogCategory = LogCategory.SYSTEM, 
                 exc_info=None, **kwargs):
        if exc_info is True:
            exc_info = sys.exc_info()
        self._log(LogLevel.CRITICAL.value, message, category, exc_info, **kwargs)
    
    # API専用メソッド
    def api_request(self, method: str, path: str, status_code: int = None, 
                   duration_ms: float = None, **kwargs):
        self.info(
            f"{method} {path} - {status_code or 'PENDING'}",
            category=LogCategory.API,
            duration_ms=duration_ms,
            **kwargs
        )
    
    def api_error(self, method: str, path: str, error: Exception, **kwargs):
        self.error(
            f"{method} {path} - API Error: {error}",
            category=LogCategory.API,
            exc_info=True,
            **kwargs
        )
    
    # データベース専用メソッド
    def db_query(self, query: str, duration_ms: float = None, rows_affected: int = None, **kwargs):
        self.debug(
            f"Database Query: {query[:100]}{'...' if len(query) > 100 else ''}",
            category=LogCategory.DATABASE,
            duration_ms=duration_ms,
            rows_affected=rows_affected,
            **kwargs
        )
    
    def db_error(self, query: str, error: Exception, **kwargs):
        self.error(
            f"Database Error: {error}",
            category=LogCategory.DATABASE,
            exc_info=True,
            query=query[:200],
            **kwargs
        )
    
    # セキュリティ専用メソッド
    def security_event(self, event_type: str, details: Dict[str, Any], **kwargs):
        self.warning(
            f"Security Event: {event_type}",
            category=LogCategory.SECURITY,
            event_details=details,
            **kwargs
        )
    
    # パフォーマンス専用メソッド
    def performance_metric(self, operation: str, duration_ms: float, 
                          success: bool = True, **kwargs):
        level = LogLevel.INFO if success else LogLevel.WARNING
        self._log(
            level.value,
            f"Performance: {operation} - {duration_ms:.2f}ms - {'SUCCESS' if success else 'SLOW'}",
            LogCategory.PERFORMANCE,
            duration_ms=duration_ms,
            **kwargs
        )
    
    # 監査ログ
    def audit(self, action: str, resource: str, result: str = 'SUCCESS', **kwargs):
        self.info(
            f"Audit: {action} on {resource} - {result}",
            category=LogCategory.AUDIT,
            **kwargs
        )

class LogManager:
    """
    ログ管理システム
    """
    
    def __init__(self):
        self.loggers: Dict[str, EnterpriseLogger] = {}
        self.handlers: List[logging.Handler] = []
        self.metrics = {
            'total_logs': 0,
            'error_count': 0,
            'warning_count': 0,
            'last_error_time': None
        }
    
    def setup_logging(
        self,
        level: str = "INFO",
        log_file: Optional[Path] = None,
        structured: bool = True,
        max_file_size: int = 10 * 1024 * 1024,  # 10MB
        backup_count: int = 5,
        enable_metrics: bool = True
    ) -> None:
        """
        エンタープライズログ設定
        """
        log_level = getattr(logging, level.upper(), logging.INFO)
        
        # ルートロガー設定
        root_logger = logging.getLogger()
        root_logger.setLevel(log_level)
        root_logger.handlers.clear()
        
        # フォーマッター
        if structured:
            formatter = StructuredFormatter()
        else:
            formatter = logging.Formatter(
                fmt='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
        
        # コンソールハンドラー
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(log_level)
        console_handler.setFormatter(formatter)
        root_logger.addHandler(console_handler)
        self.handlers.append(console_handler)
        
        # ローテーションファイルハンドラー
        if log_file:
            log_file.parent.mkdir(parents=True, exist_ok=True)
            file_handler = logging.handlers.RotatingFileHandler(
                log_file,
                maxBytes=max_file_size,
                backupCount=backup_count,
                encoding='utf-8'
            )
            file_handler.setLevel(log_level)
            file_handler.setFormatter(formatter)
            root_logger.addHandler(file_handler)
            self.handlers.append(file_handler)
        
        # メトリクス収集ハンドラー
        if enable_metrics:
            metrics_handler = MetricsHandler(self.metrics)
            metrics_handler.setLevel(logging.WARNING)  # 警告以上のみ
            root_logger.addHandler(metrics_handler)
            self.handlers.append(metrics_handler)
    
    def get_logger(self, name: str) -> EnterpriseLogger:
        """
        エンタープライズロガー取得
        """
        if name not in self.loggers:
            self.loggers[name] = EnterpriseLogger(name)
        return self.loggers[name]
    
    def get_metrics(self) -> Dict[str, Any]:
        """ログメトリクス取得"""
        return self.metrics.copy()
    
    def reset_metrics(self):
        """メトリクスリセット"""
        self.metrics = {
            'total_logs': 0,
            'error_count': 0,
            'warning_count': 0,
            'last_error_time': None
        }

class MetricsHandler(logging.Handler):
    """ログメトリクス収集ハンドラー"""
    
    def __init__(self, metrics: Dict[str, Any]):
        super().__init__()
        self.metrics = metrics
    
    def emit(self, record: logging.LogRecord):
        self.metrics['total_logs'] += 1
        
        if record.levelno >= logging.ERROR:
            self.metrics['error_count'] += 1
            self.metrics['last_error_time'] = datetime.now().isoformat()
        elif record.levelno >= logging.WARNING:
            self.metrics['warning_count'] += 1

# グローバルログマネージャー
log_manager = LogManager()

# 後方互換性のための関数
def setup_logging(level: str = "INFO", log_file: Optional[Path] = None) -> None:
    log_manager.setup_logging(level, log_file)

def get_logger(name: str) -> EnterpriseLogger:
    return log_manager.get_logger(name)
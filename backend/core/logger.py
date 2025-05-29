"""
ログ機能（システムプロンプト準拠：適切なレベル、統一フォーマット）
"""
import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional
import uuid

class TodoAppLogger:
    """統一ログ機能"""
    
    def __init__(self, name: str, level: str = "INFO", log_file: Optional[str] = None):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(getattr(logging, level))
        
        # トランザクションID生成
        self.transaction_id = self._generate_transaction_id()
        
        # フォーマッター（システムプロンプト準拠：タイムスタンプ、トランザクションID）
        formatter = logging.Formatter(
            fmt='%(asctime)s - %(name)s - %(levelname)s - [TXN:%(transaction_id)s] - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        
        # コンソールハンドラー
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)
        
        # ファイルハンドラー（指定された場合）
        if log_file:
            log_path = Path(log_file)
            log_path.parent.mkdir(parents=True, exist_ok=True)
            
            file_handler = logging.FileHandler(log_file, encoding='utf-8')
            file_handler.setFormatter(formatter)
            self.logger.addHandler(file_handler)
    
    def _generate_transaction_id(self) -> str:
        """トランザクションID生成"""
        return f"txn_{int(datetime.now().timestamp())}_{str(uuid.uuid4())[:8]}"
    
    def _log_with_context(self, level: int, message: str, **context):
        """コンテキスト付きログ出力"""
        extra = {
            'transaction_id': self.transaction_id,
            **context
        }
        self.logger.log(level, message, extra=extra)
    
    def error(self, message: str, **context):
        """エラーレベル"""
        self._log_with_context(logging.ERROR, message, **context)
    
    def warning(self, message: str, **context):
        """警告レベル"""
        self._log_with_context(logging.WARNING, message, **context)
    
    def info(self, message: str, **context):
        """情報レベル"""
        self._log_with_context(logging.INFO, message, **context)
    
    def debug(self, message: str, **context):
        """デバッグレベル"""
        self._log_with_context(logging.DEBUG, message, **context)
    
    def trace(self, message: str, **context):
        """トレースレベル（カスタム）"""
        # TRACEは標準レベルにないため、DEBUGレベルで代用
        self._log_with_context(logging.DEBUG, f"[TRACE] {message}", **context)

def setup_logging(level: str = "INFO", log_file: Optional[str] = None):
    """ログ設定初期化"""
    # ルートロガーの設定
    logging.basicConfig(
        level=getattr(logging, level),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

def get_logger(name: str, level: str = "INFO", log_file: Optional[str] = None) -> TodoAppLogger:
    """ロガー取得"""
    return TodoAppLogger(name, level, log_file)

# デフォルトロガー
logger = get_logger(__name__)
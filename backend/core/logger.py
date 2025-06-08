"""
統一ログ管理モジュール
システムプロンプト準拠：適切なログレベル、統一フォーマット、デバッグ機能強化
"""
import logging
import sys
from pathlib import Path
from typing import Optional, Any, Dict
from datetime import datetime

def setup_logging(level: str = "INFO", log_file: Optional[Path] = None) -> None:
    """ログ設定の初期化"""
    log_level = getattr(logging, level.upper(), logging.INFO)
    
    # フォーマッター設定
    formatter = logging.Formatter(
        fmt='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # ルートロガー設定
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # 既存ハンドラーをクリア
    root_logger.handlers.clear()
    
    # コンソールハンドラー
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # ファイルハンドラー（指定時のみ）
    if log_file:
        log_file.parent.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(log_file, encoding='utf-8')
        file_handler.setLevel(log_level)
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)

def get_logger(name: str) -> logging.Logger:
    """ロガーインスタンス取得"""
    return logging.getLogger(name)

def log_api_operation(
    logger: logging.Logger,
    method: str,
    endpoint: str,
    success: bool,
    duration_ms: Optional[float] = None,
    context: Optional[Dict[str, Any]] = None
) -> None:
    """API操作のログ出力"""
    log_context = {
        'method': method,
        'endpoint': endpoint,
        'success': success,
        'duration_ms': duration_ms,
        'timestamp': datetime.now().isoformat(),
        **(context or {})
    }
    
    if success:
        logger.info(f"API operation completed: {method} {endpoint}")
    else:
        logger.error(f"API operation failed: {method} {endpoint}")
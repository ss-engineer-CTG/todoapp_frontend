"""
統一ログ管理モジュール
システムプロンプト準拠：適切なログレベル、統一フォーマット
"""
import logging
import sys
from pathlib import Path
from typing import Optional, Any, Dict

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

def get_logger(name: str, level: str = "INFO", log_file: Optional[Path] = None) -> logging.Logger:
    """ロガーインスタンス取得"""
    logger = logging.getLogger(name)
    
    # 初期化されていない場合はセットアップ
    if not logger.handlers:
        setup_logging(level, log_file)
    
    return logger

# システムプロンプト準拠：新規追加 - データ変換専用ログ関数
def log_data_conversion(
    logger: logging.Logger,
    operation: str,
    input_data: Any,
    output_data: Any,
    success: bool,
    context: Optional[Dict[str, Any]] = None
) -> None:
    """データ変換操作のログ出力"""
    log_context = {
        'operation': operation,
        'success': success,
        'input_type': type(input_data).__name__,
        'output_type': type(output_data).__name__ if output_data is not None else 'None',
        **(context or {})
    }
    
    if success:
        logger.debug(f"Data conversion successful: {operation}", extra=log_context)
    else:
        logger.warn(f"Data conversion failed: {operation}", extra=log_context)

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
        **(context or {})
    }
    
    if success:
        logger.info(f"API operation completed: {method} {endpoint}", extra=log_context)
    else:
        logger.error(f"API operation failed: {method} {endpoint}", extra=log_context)
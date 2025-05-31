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
        'timestamp': datetime.now().isoformat(),
        **(context or {})
    }
    
    if success:
        logger.debug(f"Data conversion successful: {operation}", extra=log_context)
    else:
        logger.warning(f"Data conversion failed: {operation}", extra=log_context)

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
        logger.info(f"API operation completed: {method} {endpoint}", extra=log_context)
    else:
        logger.error(f"API operation failed: {method} {endpoint}", extra=log_context)

# システムプロンプト準拠：新規追加 - ショートカット操作ログ関数
def log_shortcut_operation(
    logger: logging.Logger,
    operation: str,
    key: str,
    success: bool,
    context: Optional[Dict[str, Any]] = None
) -> None:
    """ショートカット操作のログ出力"""
    log_context = {
        'operation': operation,
        'key': key,
        'success': success,
        'timestamp': datetime.now().isoformat(),
        **(context or {})
    }
    
    if success:
        logger.info(f"Shortcut operation: {operation} via {key}", extra=log_context)
    else:
        logger.warning(f"Shortcut operation failed: {operation} via {key}", extra=log_context)

# システムプロンプト準拠：新規追加 - タスク操作ログ関数
def log_task_operation(
    logger: logging.Logger,
    operation: str,
    task_id: str,
    success: bool,
    context: Optional[Dict[str, Any]] = None
) -> None:
    """タスク操作のログ出力"""
    log_context = {
        'operation': operation,
        'task_id': task_id,
        'success': success,
        'timestamp': datetime.now().isoformat(),
        **(context or {})
    }
    
    if success:
        logger.info(f"Task {operation} completed: {task_id}", extra=log_context)
    else:
        logger.error(f"Task {operation} failed: {task_id}", extra=log_context)

# システムプロンプト準拠：新規追加 - デバッグ用詳細ログ関数
def log_debug_info(
    logger: logging.Logger,
    component: str,
    message: str,
    data: Optional[Dict[str, Any]] = None
) -> None:
    """デバッグ情報の詳細ログ出力"""
    log_context = {
        'component': component,
        'debug_info': data or {},
        'timestamp': datetime.now().isoformat()
    }
    
    logger.debug(f"[{component}] {message}", extra=log_context)

# システムプロンプト準拠：新規追加 - エラー詳細ログ関数
def log_error_details(
    logger: logging.Logger,
    error: Exception,
    operation: str,
    context: Optional[Dict[str, Any]] = None
) -> None:
    """エラーの詳細ログ出力（スタックトレース付き）"""
    error_context = {
        'operation': operation,
        'error_type': type(error).__name__,
        'error_message': str(error),
        'timestamp': datetime.now().isoformat(),
        **(context or {})
    }
    
    logger.error(
        f"Error in {operation}: {error}",
        extra=error_context,
        exc_info=True
    )

# システムプロンプト準拠：新規追加 - パフォーマンス測定ログ関数
def log_performance(
    logger: logging.Logger,
    operation: str,
    duration_ms: float,
    context: Optional[Dict[str, Any]] = None
) -> None:
    """パフォーマンス測定のログ出力"""
    perf_context = {
        'operation': operation,
        'duration_ms': duration_ms,
        'timestamp': datetime.now().isoformat(),
        **(context or {})
    }
    
    # パフォーマンス閾値に応じてログレベルを調整
    if duration_ms > 1000:  # 1秒以上
        logger.warning(f"Slow operation detected: {operation} took {duration_ms}ms", extra=perf_context)
    elif duration_ms > 500:  # 500ms以上
        logger.info(f"Performance: {operation} completed in {duration_ms}ms", extra=perf_context)
    else:
        logger.debug(f"Performance: {operation} completed in {duration_ms}ms", extra=perf_context)

# システムプロンプト準拠：新規追加 - 統計情報ログ関数
def log_statistics(
    logger: logging.Logger,
    operation: str,
    stats: Dict[str, Any]
) -> None:
    """統計情報のログ出力"""
    stats_context = {
        'operation': operation,
        'statistics': stats,
        'timestamp': datetime.now().isoformat()
    }
    
    logger.info(f"Statistics for {operation}: {stats}", extra=stats_context)

# システムプロンプト準拠：新規追加 - 設定変更ログ関数
def log_configuration_change(
    logger: logging.Logger,
    setting_name: str,
    old_value: Any,
    new_value: Any,
    context: Optional[Dict[str, Any]] = None
) -> None:
    """設定変更のログ出力"""
    config_context = {
        'setting_name': setting_name,
        'old_value': str(old_value),
        'new_value': str(new_value),
        'timestamp': datetime.now().isoformat(),
        **(context or {})
    }
    
    logger.info(f"Configuration changed: {setting_name} = {new_value} (was: {old_value})", extra=config_context)
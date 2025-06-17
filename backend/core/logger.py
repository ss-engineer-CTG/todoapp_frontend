"""
統一ログ管理モジュール
システムプロンプト準拠：KISS原則、YAGNI原則、必要最小限の機能のみ
"""
import logging
import sys
from pathlib import Path
from typing import Optional

def setup_logging(level: str = "INFO", log_file: Optional[Path] = None) -> None:
    """
    ログ設定の初期化
    システムプロンプト準拠：シンプルで必要最小限の設定
    """
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
    """
    ロガーインスタンス取得
    システムプロンプト準拠：シンプルなロガー提供
    """
    return logging.getLogger(name)
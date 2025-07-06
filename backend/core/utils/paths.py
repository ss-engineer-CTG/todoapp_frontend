"""
バックエンドパス管理ユーティリティ
システムプロンプト準拠：KISS原則、YAGNI原則、ハードコード禁止
"""
from pathlib import Path
from typing import Dict

def get_backend_paths() -> Dict[str, Path]:
    """
    バックエンドの全パスを一元管理
    システムプロンプト準拠：パス結合専用関数使用、ハードコード禁止
    """
    base_dir = Path(__file__).parent.parent.parent
    
    paths = {
        'BASE': base_dir,
        'CORE': base_dir / 'core',
        'FEATURES': base_dir / 'features',
        'TASKLIST': base_dir / 'features' / 'tasklist',
        'API': base_dir / 'api',
        'DATA': base_dir / 'data',
        'SCHEMAS': base_dir / 'data' / 'schemas',
        'SEEDS': base_dir / 'data' / 'seeds',
        'DATABASE': base_dir / 'todo.db',
        'SCHEMA': base_dir / 'data' / 'schemas' / 'init.sql',
        'LOG_DIR': base_dir / 'logs',
    }
    
    # ログファイルパス
    log_dir = paths['LOG_DIR']
    log_dir.mkdir(exist_ok=True)
    paths['LOG_FILE'] = log_dir / 'app.log'
    
    return paths

def ensure_directory_exists(path: Path) -> None:
    """ディレクトリの存在確認と作成"""
    if not path.exists():
        path.mkdir(parents=True, exist_ok=True)
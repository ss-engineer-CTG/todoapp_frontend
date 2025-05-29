"""
設定管理（システムプロンプト準拠：一元管理）
"""
import os
from pathlib import Path
from typing import Optional
from dataclasses import dataclass

@dataclass
class Config:
    """アプリケーション設定"""
    # データベース設定
    database_url: str
    database_path: str
    
    # サーバー設定
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    
    # ログ設定
    log_level: str = "INFO"
    log_file: Optional[str] = None
    
    # CORS設定
    cors_origins: list[str] = None
    
    def __post_init__(self):
        if self.cors_origins is None:
            self.cors_origins = ["http://localhost:3000"]

def get_config() -> Config:
    """設定を取得（環境変数から読み込み）"""
    base_dir = Path(__file__).parent.parent
    
    return Config(
        database_url=os.getenv("DATABASE_URL", f"sqlite:///{base_dir}/todo.db"),
        database_path=os.getenv("DATABASE_PATH", str(base_dir / "todo.db")),
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        debug=os.getenv("DEBUG", "False").lower() == "true",
        log_level=os.getenv("LOG_LEVEL", "INFO").upper(),
        log_file=os.getenv("LOG_FILE"),
        cors_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    )

# グローバル設定インスタンス
config = get_config()
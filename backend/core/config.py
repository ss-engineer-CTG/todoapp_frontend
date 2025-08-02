"""
統一設定管理モジュール
システムプロンプト準拠：KISS原則、DRY原則、一元管理
"""
import os
from pathlib import Path
from .utils.paths import get_backend_paths

# システムプロンプト準拠：パス管理の一元化
BACKEND_PATHS = get_backend_paths()

class Config:
    """アプリケーション設定クラス"""
    
    def __init__(self):
        # システムプロンプト準拠：パス管理の一元化
        self.base_dir = BACKEND_PATHS['BASE']
        self.database_path = BACKEND_PATHS['DATABASE']
        self.schema_path = BACKEND_PATHS['SCHEMA']
        self.log_file = BACKEND_PATHS['LOG_FILE']
        
        # サーバー設定
        self.host = os.getenv("HOST", "localhost")
        self.port = int(os.getenv("PORT", 8000))
        self.debug = os.getenv("DEBUG", "false").lower() == "true"
        
        # ログ設定
        self.log_level = os.getenv("LOG_LEVEL", "INFO")
        
        # CORS設定
        self.cors_origins = [
            "http://localhost:3000",
            "http://localhost:3001",  # Vite fallback port
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001"
        ]
    
    def get_database_url(self) -> str:
        """データベースURLを取得"""
        return f"sqlite:///{self.database_path}"
    
    def validate_paths(self) -> bool:
        """必要なパスの存在確認"""
        return self.schema_path.exists()

# グローバル設定インスタンス
config = Config()
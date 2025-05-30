"""
統一設定管理モジュール
システムプロンプト準拠：KISS原則、DRY原則、一元管理
"""
import os
from pathlib import Path
from utils.paths import get_base_dir, get_database_path, get_schema_path, get_log_file_path

class Config:
    """アプリケーション設定クラス"""
    
    def __init__(self):
        # システムプロンプト準拠：パス管理の一元化（シンプル実装）
        self.base_dir = get_base_dir()
        self.database_path = get_database_path()
        self.schema_path = get_schema_path()
        self.log_file = get_log_file_path()
        
        # サーバー設定
        self.host = os.getenv("HOST", "0.0.0.0")
        self.port = int(os.getenv("PORT", 8000))
        self.debug = os.getenv("DEBUG", "false").lower() == "true"
        
        # ログ設定
        self.log_level = os.getenv("LOG_LEVEL", "INFO")
        
        # CORS設定
        self.cors_origins = [
            "http://localhost:3000",
            "http://127.0.0.1:3000"
        ]
    
    def get_database_url(self) -> str:
        """データベースURLを取得"""
        return f"sqlite:///{self.database_path}"
    
    def validate_paths(self) -> bool:
        """必要なパスの存在確認"""
        return self.schema_path.exists()

# グローバル設定インスタンス
config = Config()
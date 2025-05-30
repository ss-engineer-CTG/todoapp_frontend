"""
統一設定管理モジュール（システムプロンプト準拠改良版）
"""
import os
from pathlib import Path
from typing import List
from ..utils.paths import PathUtils, PathConstants

class Config:
    """アプリケーション設定クラス"""
    
    def __init__(self):
        # システムプロンプト準拠: パス管理の一元化
        self.base_dir = PathConstants.BASE_DIR
        self.database_path = PathUtils.get_database_path()
        self.schema_path = PathUtils.get_schema_path()
        self.log_file = PathUtils.get_log_file_path()
        
        # ログディレクトリの作成
        self.log_dir = self.log_file.parent
        PathUtils.ensure_directory(self.log_dir)
        
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
        """パスの存在確認"""
        return all([
            self.base_dir.exists(),
            self.schema_path.exists()
        ])

# グローバル設定インスタンス
config = Config()
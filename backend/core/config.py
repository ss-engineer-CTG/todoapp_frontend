"""
統一設定管理モジュール
システムプロンプト準拠：DRY原則、パス管理の一元化
"""
import os
from pathlib import Path
from typing import List

class Config:
    """アプリケーション設定クラス"""
    
    def __init__(self):
        # パス設定（システムプロンプト準拠）
        self.base_dir = Path(__file__).parent.parent
        self.database_path = self.base_dir / "todo.db"
        self.schema_path = self.base_dir / "schema.sql"
        self.log_dir = self.base_dir / "logs"
        
        # サーバー設定
        self.host = os.getenv("HOST", "0.0.0.0")
        self.port = int(os.getenv("PORT", 8000))
        self.debug = os.getenv("DEBUG", "false").lower() == "true"
        
        # ログ設定
        self.log_level = os.getenv("LOG_LEVEL", "INFO")
        self.log_file = self.log_dir / "app.log"
        
        # CORS設定
        self.cors_origins = [
            "http://localhost:3000",
            "http://127.0.0.1:3000"
        ]
        
        # ディレクトリ作成
        self.log_dir.mkdir(exist_ok=True)
    
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
"""
システムプロンプト準拠: パス管理統一モジュール
ハードコードパス禁止、パス結合専用関数の使用
"""
import os
from pathlib import Path
from typing import Union

# パス定数定義（システムプロンプト準拠: 一箇所に集約）
class PathConstants:
    """パス定数クラス"""
    
    # ベースディレクトリ
    BASE_DIR = Path(__file__).parent.parent
    
    # データベース関連
    DATABASE_FILE = "todo.db"
    SCHEMA_FILE = "schema.sql"
    
    # ログ関連
    LOGS_DIR = "logs"
    LOG_FILE = "app.log"
    
    # 設定関連
    CONFIG_DIR = "config"
    
    # サービス関連
    CORE_DIR = "core"
    SERVICES_DIR = "services"
    UTILS_DIR = "utils"

class PathUtils:
    """
    パス操作ユーティリティクラス
    システムプロンプト準拠: パス結合専用関数、検証・正規化
    """
    
    @staticmethod
    def join_path(*segments: Union[str, Path]) -> Path:
        """
        パス結合専用関数
        システムプロンプト準拠: 「+」や文字列結合は禁止
        """
        result = Path()
        for segment in segments:
            if segment:  # 空文字列やNoneを除外
                result = result / Path(segment)
        return result
    
    @staticmethod
    def validate_path(path: Union[str, Path]) -> bool:
        """
        パス検証関数
        システムプロンプト準拠: パス検証・正規化関数を適切に使用
        """
        path_str = str(path)
        
        # 危険なパスパターンをチェック
        dangerous_patterns = [
            '..',  # ディレクトリトラバーサル
            '//',  # 連続スラッシュ
            '\\\\',  # 連続バックスラッシュ
        ]
        
        for pattern in dangerous_patterns:
            if pattern in path_str:
                return False
        
        # 不正文字チェック（OS依存）
        if os.name == 'nt':  # Windows
            invalid_chars = '<>:"|?*'
            if any(char in path_str for char in invalid_chars):
                return False
        
        return True
    
    @staticmethod
    def normalize_path(path: Union[str, Path]) -> Path:
        """
        パス正規化関数
        システムプロンプト準拠: パス検証・正規化関数を適切に使用
        """
        return Path(path).resolve()
    
    @staticmethod
    def ensure_directory(path: Union[str, Path]) -> Path:
        """
        ディレクトリが存在しない場合は作成
        """
        dir_path = Path(path)
        if not PathUtils.validate_path(dir_path):
            raise ValueError(f"Invalid path: {dir_path}")
        
        dir_path.mkdir(parents=True, exist_ok=True)
        return dir_path
    
    @staticmethod
    def get_database_path() -> Path:
        """
        データベースファイルパスを取得
        システムプロンプト準拠: ハードコード禁止
        """
        return PathUtils.join_path(
            PathConstants.BASE_DIR,
            PathConstants.DATABASE_FILE
        )
    
    @staticmethod
    def get_schema_path() -> Path:
        """
        スキーマファイルパスを取得
        システムプロンプト準拠: ハードコード禁止
        """
        return PathUtils.join_path(
            PathConstants.BASE_DIR,
            PathConstants.SCHEMA_FILE
        )
    
    @staticmethod
    def get_log_file_path() -> Path:
        """
        ログファイルパスを取得
        システムプロンプト準拠: ハードコード禁止
        """
        log_dir = PathUtils.join_path(
            PathConstants.BASE_DIR,
            PathConstants.LOGS_DIR
        )
        PathUtils.ensure_directory(log_dir)
        
        return PathUtils.join_path(log_dir, PathConstants.LOG_FILE)
    
    @staticmethod
    def get_service_path(service_name: str) -> Path:
        """
        サービスファイルパスを取得
        """
        return PathUtils.join_path(
            PathConstants.BASE_DIR,
            PathConstants.SERVICES_DIR,
            f"{service_name}.py"
        )

# 便利関数として直接エクスポート
def get_database_path() -> Path:
    """データベースパス取得の便利関数"""
    return PathUtils.get_database_path()

def get_schema_path() -> Path:
    """スキーマパス取得の便利関数"""
    return PathUtils.get_schema_path()

def get_log_file_path() -> Path:
    """ログファイルパス取得の便利関数"""
    return PathUtils.get_log_file_path()
"""
統一例外処理モジュール
システムプロンプト準拠：統一例外処理、適切なログ出力
"""
from typing import Dict, Any, Optional
from core.logger import get_logger

logger = get_logger(__name__)

class TodoAppError(Exception):
    """アプリケーション基底例外クラス"""
    
    def __init__(self, message: str, context: Optional[Dict[str, Any]] = None):
        self.message = message
        self.context = context or {}
        super().__init__(message)
    
    def to_dict(self) -> Dict[str, Any]:
        """例外情報を辞書形式で返す"""
        return {
            "error": self.__class__.__name__,
            "message": self.message,
            "context": self.context
        }

class DatabaseError(TodoAppError):
    """データベース関連例外"""
    pass

class ValidationError(TodoAppError):
    """バリデーション例外"""
    pass

class NotFoundError(TodoAppError):
    """リソース未発見例外"""
    pass

class BusinessLogicError(TodoAppError):
    """ビジネスロジック例外"""
    pass

def handle_exception(exc: Exception, context: Optional[Dict[str, Any]] = None) -> TodoAppError:
    """一般例外をアプリケーション例外に変換"""
    error_context = context or {}
    error_context['original_exception'] = str(exc)
    error_context['exception_type'] = type(exc).__name__
    
    logger.error(f"Handling exception: {exc}", exc_info=True)
    
    # 既にアプリケーション例外の場合はそのまま返す
    if isinstance(exc, TodoAppError):
        return exc
    
    # 一般例外をアプリケーション例外に変換
    return TodoAppError(
        message=f"An unexpected error occurred: {exc}",
        context=error_context
    )
"""
統一例外処理（システムプロンプト準拠）
"""
from typing import Optional, Dict, Any
from datetime import datetime

class TodoAppError(Exception):
    """アプリケーション基底例外"""
    
    def __init__(
        self,
        message: str,
        code: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
        original_exception: Optional[Exception] = None
    ):
        super().__init__(message)
        self.message = message
        self.code = code or self.__class__.__name__
        self.context = context or {}
        self.original_exception = original_exception
        self.timestamp = datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        """辞書形式に変換"""
        return {
            'error_type': self.__class__.__name__,
            'message': self.message,
            'code': self.code,
            'context': self.context,
            'timestamp': self.timestamp.isoformat()
        }

class ValidationError(TodoAppError):
    """バリデーションエラー"""
    pass

class DatabaseError(TodoAppError):
    """データベースエラー"""
    pass

class NotFoundError(TodoAppError):
    """リソース未検出エラー"""
    pass

class ConflictError(TodoAppError):
    """競合エラー"""
    pass

class AuthenticationError(TodoAppError):
    """認証エラー"""
    pass

class AuthorizationError(TodoAppError):
    """認可エラー"""
    pass

def handle_exception(e: Exception, context: Optional[Dict[str, Any]] = None) -> TodoAppError:
    """例外ハンドリング統一関数"""
    if isinstance(e, TodoAppError):
        # 既にアプリケーション例外の場合はそのまま返す
        if context:
            e.context.update(context)
        return e
    
    # 標準例外をアプリケーション例外に変換
    if isinstance(e, ValueError):
        return ValidationError(str(e), context=context, original_exception=e)
    elif isinstance(e, FileNotFoundError):
        return NotFoundError(str(e), context=context, original_exception=e)
    else:
        return TodoAppError(str(e), context=context, original_exception=e)
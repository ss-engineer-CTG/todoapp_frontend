"""
統一例外処理モジュール
システムプロンプト準拠：統一例外処理、適切なログ出力
"""
from typing import Dict, Any, Optional
from .logger import get_logger

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

class DateConversionError(TodoAppError):
    """日付変換関連例外"""
    
    def __init__(self, message: str, field_name: str = None, original_value: Any = None, context: Optional[Dict[str, Any]] = None):
        self.field_name = field_name
        self.original_value = original_value
        
        enhanced_context = context or {}
        enhanced_context.update({
            'field_name': field_name,
            'original_value': str(original_value) if original_value is not None else None,
            'conversion_type': 'date_field'
        })
        
        super().__init__(message, enhanced_context)

def handle_exception(exc: Exception, context: Optional[Dict[str, Any]] = None) -> TodoAppError:
    """一般例外をアプリケーション例外に変換"""
    error_context = context or {}
    error_context['original_exception'] = str(exc)
    error_context['exception_type'] = type(exc).__name__
    
    logger.error(f"Handling exception: {exc}", exc_info=True)
    
    # 既にアプリケーション例外の場合はそのまま返す
    if isinstance(exc, TodoAppError):
        return exc
    
    # システムプロンプト準拠：日付変換エラーの特別処理
    if ('date' in str(exc).lower() or 
        'time' in str(exc).lower() or
        'isoformat' in str(exc) or
        isinstance(exc, ValueError) and 'invalid literal' in str(exc)):
        
        return DateConversionError(
            message=f"Date conversion failed: {exc}",
            context=error_context
        )
    
    # 一般例外をアプリケーション例外に変換
    return TodoAppError(
        message=f"An unexpected error occurred: {exc}",
        context=error_context
    )

def handle_date_conversion_error(
    field_name: str, 
    original_value: Any, 
    exc: Exception, 
    context: Optional[Dict[str, Any]] = None
) -> DateConversionError:
    """日付変換エラーの専用ハンドラー"""
    
    error_context = context or {}
    error_context.update({
        'field_name': field_name,
        'original_value': str(original_value),
        'original_exception': str(exc),
        'conversion_attempt': True
    })
    
    logger.warn(f"Date conversion failed for field {field_name}: {original_value}")
    
    return DateConversionError(
        message=f"Failed to convert date field '{field_name}': {exc}",
        field_name=field_name,
        original_value=original_value,
        context=error_context
    )
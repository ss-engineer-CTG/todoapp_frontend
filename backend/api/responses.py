"""
統一レスポンス形式
システムプロンプト準拠：レスポンス標準化
"""
from typing import Any, Dict, Optional
from datetime import datetime

def success_response(
    data: Any = None, 
    message: str = "Success", 
    meta: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """成功レスポンス"""
    response = {
        "success": True,
        "message": message,
        "timestamp": datetime.now().isoformat()
    }
    
    if data is not None:
        response["data"] = data
    
    if meta:
        response["meta"] = meta
    
    return response

def error_response(
    message: str = "Error occurred",
    error_code: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """エラーレスポンス"""
    response = {
        "success": False,
        "message": message,
        "timestamp": datetime.now().isoformat()
    }
    
    if error_code:
        response["error_code"] = error_code
    
    if details:
        response["details"] = details
    
    return response
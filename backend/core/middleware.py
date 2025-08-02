"""
Enterprise-grade Middleware
エンタープライズレベルのミドルウェア
"""
import time
import uuid
from typing import Callable
from fastapi import Request, Response, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from .logger import get_logger, LogCategory
from .exceptions import TodoAppError, handle_exception

logger = get_logger(__name__)

class LoggingMiddleware(BaseHTTPMiddleware):
    """
    APIリクエスト/レスポンスログミドルウェア
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # リクエスト情報
        start_time = time.time()
        method = request.method
        url = str(request.url)
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        # 相関IDの生成または取得
        correlation_id = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())
        
        # ログコンテキスト設定
        logger.set_context(
            correlation_id=correlation_id,
            client_ip=client_ip,
            method=method,
            url=url
        )
        
        # リクエストログ
        logger.api_request(
            method=method,
            path=url,
            client_ip=client_ip,
            user_agent=user_agent,
            correlation_id=correlation_id
        )
        
        try:
            # リクエスト処理
            response = await call_next(request)
            
            # レスポンス時間計算
            process_time = time.time() - start_time
            duration_ms = process_time * 1000
            
            # レスポンスヘッダーに相関IDを追加
            response.headers["X-Correlation-ID"] = correlation_id
            response.headers["X-Process-Time"] = str(duration_ms)
            
            # レスポンスログ
            logger.api_request(
                method=method,
                path=url,
                status_code=response.status_code,
                duration_ms=duration_ms,
                correlation_id=correlation_id
            )
            
            # パフォーマンス監視
            if duration_ms > 1000:  # 1秒以上
                logger.performance_metric(
                    operation=f"{method} {url}",
                    duration_ms=duration_ms,
                    success=response.status_code < 400,
                    slow_request=True
                )
            
            return response
            
        except Exception as e:
            # エラー処理
            process_time = time.time() - start_time
            duration_ms = process_time * 1000
            
            # エラーログ
            logger.api_error(
                method=method,
                path=url,
                error=e,
                duration_ms=duration_ms,
                correlation_id=correlation_id
            )
            
            # アプリケーション例外の場合
            if isinstance(e, TodoAppError):
                return JSONResponse(
                    status_code=400,
                    content=e.to_dict(),
                    headers={"X-Correlation-ID": correlation_id}
                )
            
            # HTTPException の場合
            if isinstance(e, HTTPException):
                return JSONResponse(
                    status_code=e.status_code,
                    content={"error": e.detail},
                    headers={"X-Correlation-ID": correlation_id}
                )
            
            # その他の例外
            app_error = handle_exception(e, {"correlation_id": correlation_id})
            return JSONResponse(
                status_code=500,
                content=app_error.to_dict(),
                headers={"X-Correlation-ID": correlation_id}
            )
        
        finally:
            # ログコンテキストクリア
            logger.clear_context()

class SecurityMiddleware(BaseHTTPMiddleware):
    """
    セキュリティ関連ミドルウェア
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # セキュリティヘッダー
        response = await call_next(request)
        
        # セキュリティヘッダーの追加
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        return response

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    レート制限ミドルウェア（簡易版）
    """
    
    def __init__(self, app, calls: int = 100, period: int = 60):
        super().__init__(app)
        self.calls = calls
        self.period = period
        self.clients = {}  # {client_ip: [timestamps]}
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()
        
        # クライアントのリクエスト履歴を取得
        if client_ip not in self.clients:
            self.clients[client_ip] = []
        
        client_requests = self.clients[client_ip]
        
        # 期間外のリクエストを削除
        client_requests[:] = [
            timestamp for timestamp in client_requests 
            if current_time - timestamp < self.period
        ]
        
        # レート制限チェック
        if len(client_requests) >= self.calls:
            logger.security_event(
                "rate_limit_exceeded",
                {
                    "client_ip": client_ip,
                    "requests_count": len(client_requests),
                    "limit": self.calls,
                    "period": self.period
                }
            )
            
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "message": f"Too many requests. Limit: {self.calls} per {self.period} seconds"
                }
            )
        
        # リクエストタイムスタンプを記録
        client_requests.append(current_time)
        
        return await call_next(request)

class ErrorMonitoringMiddleware(BaseHTTPMiddleware):
    """
    エラーモニタリング統合ミドルウェア
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            response = await call_next(request)
            
            # TODO: 4xx, 5xxエラーの場合はエラーモニタリングに報告（一時的に無効化）
            # if response.status_code >= 400:
            #     from features.error_monitoring.service import error_monitoring_service
            #     from features.error_monitoring.models import ErrorCategory, ErrorSeverity
            #     
            #     # エラーカテゴリ判定
            #     if response.status_code >= 500:
            #         category = ErrorCategory.API
            #         severity = ErrorSeverity.HIGH
            #     elif response.status_code == 401:
            #         category = ErrorCategory.AUTHENTICATION
            #         severity = ErrorSeverity.MEDIUM
            #     elif response.status_code == 403:
            #         category = ErrorCategory.AUTHORIZATION
            #         severity = ErrorSeverity.MEDIUM
            #     elif response.status_code == 404:
            #         category = ErrorCategory.API
            #         severity = ErrorSeverity.LOW
            #     else:
            #         category = ErrorCategory.API
            #         severity = ErrorSeverity.MEDIUM
            #     
            #     # エラーレポート作成
            #     error_monitoring_service.report_error(
            #         message=f"HTTP {response.status_code} - {request.method} {request.url}",
            #         category=category,
            #         severity=severity,
            #         context={
            #             "status_code": response.status_code,
            #             "method": request.method,
            #             "url": str(request.url),
            #             "headers": dict(request.headers)
            #         },
            #         user_id=request.headers.get("X-User-ID"),
            #         session_id=request.headers.get("X-Session-ID"),
            #         request_id=request.headers.get("X-Correlation-ID"),
            #         url=str(request.url),
            #         user_agent=request.headers.get("user-agent")
            #     )
            
            return response
            
        except Exception as e:
            # TODO: 未処理例外をエラーモニタリングに報告（一時的に無効化）
            # from features.error_monitoring.service import error_monitoring_service
            # from features.error_monitoring.models import ErrorCategory, ErrorSeverity
            # 
            # error_monitoring_service.report_error(
            #     message=f"Unhandled exception: {str(e)}",
            #     category=ErrorCategory.SYSTEM,
            #     severity=ErrorSeverity.CRITICAL,
            #     stack_trace=str(e.__traceback__) if hasattr(e, '__traceback__') else None,
            #     context={
            #         "method": request.method,
            #         "url": str(request.url),
            #         "exception_type": type(e).__name__
            #     },
            #     user_id=request.headers.get("X-User-ID"),
            #     session_id=request.headers.get("X-Session-ID"),
            #     request_id=request.headers.get("X-Correlation-ID"),
            #     url=str(request.url),
            #     user_agent=request.headers.get("user-agent")
            # )
            
            raise
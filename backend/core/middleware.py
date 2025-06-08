"""
FastAPI共通ミドルウェア
システムプロンプト準拠：統一例外処理、ログ機能
"""
import time
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from .logger import get_logger
from .exceptions import TodoAppError, handle_exception

logger = get_logger(__name__)

class LoggingMiddleware(BaseHTTPMiddleware):
    """リクエスト/レスポンスログミドルウェア"""
    
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        # リクエストログ
        logger.info(f"Request: {request.method} {request.url.path}")
        
        try:
            response = await call_next(request)
            
            # レスポンスログ
            process_time = time.time() - start_time
            logger.info(f"Response: {response.status_code} - {process_time:.3f}s")
            
            response.headers["X-Process-Time"] = str(process_time)
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(f"Request failed: {e} - {process_time:.3f}s")
            raise

class ExceptionHandlerMiddleware(BaseHTTPMiddleware):
    """統一例外処理ミドルウェア"""
    
    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except TodoAppError as e:
            logger.error(f"Todo app error: {e.message}")
            return JSONResponse(
                status_code=400,
                content=e.to_dict()
            )
        except HTTPException:
            # FastAPIのHTTPExceptionはそのまま通す
            raise
        except Exception as e:
            app_error = handle_exception(e)
            logger.error(f"Unhandled exception: {e}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content=app_error.to_dict()
            )

def add_middleware(app: FastAPI) -> None:
    """アプリケーションにミドルウェアを追加"""
    app.add_middleware(LoggingMiddleware)
    app.add_middleware(ExceptionHandlerMiddleware)
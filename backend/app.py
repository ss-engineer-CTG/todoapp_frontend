"""
階層型ToDoリストアプリケーション メインAPI
システムプロンプト準拠：KISS原則、簡素化されたメインアプリケーション
"""
import sys
from pathlib import Path
from contextlib import asynccontextmanager

# システムプロンプト準拠：パス管理の一元化
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import config
from core.logger import setup_logging, get_logger
from core.database import init_database
from core.middleware import (
    LoggingMiddleware, SecurityMiddleware, 
    RateLimitMiddleware, ErrorMonitoringMiddleware
)
from api.router import api_router

# システムプロンプト準拠：統一ログ機能
setup_logging(config.log_level, config.log_file)
logger = get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    アプリケーションライフサイクル管理
    システムプロンプト準拠：起動・終了時の適切なログ出力
    """
    # 起動時の処理
    logger.info("Starting Todo Application...")
    logger.info(f"Database path: {config.database_path}")
    logger.info(f"Log level: {config.log_level}")
    
    try:
        init_database()
        logger.info("Application startup completed successfully")
    except Exception as e:
        logger.error(f"Application startup failed: {e}", exc_info=True)
        raise
    
    yield
    
    # 終了時の処理
    logger.info("Shutting down Todo Application...")

# FastAPIアプリケーション作成
app = FastAPI(
    title="Todo Application API",
    description="階層型ToDoリストアプリケーション",
    version="1.0.0",
    lifespan=lifespan
)

# ミドルウェア設定（順序重要：逆順で実行される）
app.add_middleware(ErrorMonitoringMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(SecurityMiddleware)
app.add_middleware(RateLimitMiddleware, calls=1000, period=60)  # 1000 req/min

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# APIルーター統合
app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    
    logger.info(f"Starting server on {config.host}:{config.port}")
    logger.info(f"Debug mode: {config.debug}")
    
    uvicorn.run(
        "app:app",
        host=config.host,
        port=config.port,
        reload=config.debug,
        log_level=config.log_level.lower()
    )
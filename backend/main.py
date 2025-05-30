# 既存のmain.pyにログ統合とパス管理統一を適用
"""
新しいメインアプリケーション（リファクタリング後）
システムプロンプト準拠：DRY原則、統一ログ機能、統一例外処理、パス管理統一
"""
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from typing import List, Optional
from datetime import datetime

# コア機能
from core.config import config
from core.logger import setup_logging, get_logger
from core.database import DatabaseManager, init_database
from core.exceptions import TodoAppError, handle_exception

# サービス
from services.project_service import ProjectService
from services.task_service import TaskService

# システムプロンプト準拠: パス管理統一
from utils.paths import PathUtils

# Pydanticモデル（既存のスキーマを流用）
from pydantic import BaseModel

# システムプロンプト準拠: ログ設定
setup_logging(config.log_level, config.log_file)
logger = get_logger(__name__, config.log_level, config.log_file)

# データベースマネージャー
db_manager = DatabaseManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """アプリケーションライフサイクル管理"""
    # 起動時の処理
    logger.info("Starting Todo Application...")
    logger.info(f"Database path: {config.database_path}")
    
    try:
        init_database()
        logger.info("Application startup completed successfully")
    except Exception as e:
        logger.error(f"Application startup failed: {e}")
        raise
    
    yield
    
    # 終了時の処理
    logger.info("Shutting down Todo Application...")

# 残りのコードは既存のmain.pyと同じ...
# （FastAPIアプリケーション作成、ルート定義等）

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=config.host,
        port=config.port,
        reload=config.debug,
        log_level=config.log_level.lower()
    )
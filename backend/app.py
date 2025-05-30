# 既存のapp.pyにログ機能とエラーハンドリングを統合
import sqlite3
import os
from datetime import datetime
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# システムプロンプト準拠: パス管理統一の使用
from utils.paths import PathUtils, get_database_path, get_schema_path

# 既存のcore modulesを使用
from core.config import config
from core.logger import setup_logging, get_logger
from core.database import DatabaseManager, init_database
from core.exceptions import TodoAppError, handle_exception

# ログ設定（システムプロンプト準拠）
setup_logging(config.log_level, config.log_file)
logger = get_logger(__name__, config.log_level, config.log_file)

# データベースマネージャー
db_manager = DatabaseManager()

def get_db():
    """データベース接続を取得"""
    try:
        # システムプロンプト準拠: パス管理統一
        db_path = get_database_path()
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.Error as e:
        # システムプロンプト準拠: エラーログ
        logger.error(f"Database connection error: {e}")
        raise HTTPException(status_code=500, detail="Database connection error")

def init_database():
    """データベース初期化"""
    try:
        # システムプロンプト準拠: パス管理統一
        schema_path = get_schema_path()
        
        if not schema_path.exists():
            logger.error(f"Schema file not found: {schema_path}")
            raise FileNotFoundError(f"Schema file not found: {schema_path}")
        
        with open(schema_path, "r", encoding="utf-8") as f:
            schema = f.read()
        
        conn = get_db()
        conn.executescript(schema)
        conn.commit()
        conn.close()
        
        # システムプロンプト準拠: 成功時のINFOログ
        logger.info(f"Database initialized successfully at: {get_database_path()}")
    except Exception as e:
        # システムプロンプト準拠: エラーログとスタックトレース
        logger.error(f"Database initialization error: {e}", exc_info=True)
        raise

@asynccontextmanager
async def lifespan(app: FastAPI):
    """アプリケーションのライフサイクル管理"""
    # 起動時の処理
    logger.info("Starting application...")
    logger.info(f"Base directory: {config.base_dir}")
    logger.info(f"Database path: {config.database_path}")
    logger.info(f"Schema path: {config.schema_path}")
    
    try:
        init_database()
        logger.info("Application startup completed")
    except Exception as e:
        logger.error(f"Application startup failed: {e}")
        raise
    
    yield
    
    # 終了時の処理
    logger.info("Shutting down application...")

# 残りのコードは既存のapp.pyと同じ...
# （既存のFastAPIアプリケーション設定、ルート定義等）

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host=config.host,
        port=config.port,
        reload=config.debug,
        log_level=config.log_level.lower()
    )
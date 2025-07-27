"""
APIルート統合管理
システムプロンプト準拠：DRY原則、ルート統一管理、KISS原則
"""
from fastapi import APIRouter
from datetime import datetime

from features.tasklist import projects_router, tasks_router
from features.error_monitoring.routes import router as error_router
from core.logger import get_logger, LogCategory

logger = get_logger(__name__)

# メインAPIルーター
api_router = APIRouter()

# ヘルスチェック（標準的なGETエンドポイント）
@api_router.get("/health")
async def health_check():
    """
    アプリケーションヘルスチェック
    システムプロンプト準拠：KISS原則により最小限の実装
    FastAPIが自動的にGET/HEADリクエスト両方をサポート
    """
    return {
        "status": "ok", 
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "service": "todo-app-backend"
    }

# 機能別ルーター統合
api_router.include_router(projects_router)
api_router.include_router(tasks_router)
api_router.include_router(error_router)

logger.info("API router initialized with all feature routes", category=LogCategory.API)
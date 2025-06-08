"""
APIルート統合管理
システムプロンプト準拠：DRY原則、ルート統一管理
"""
from fastapi import APIRouter
from datetime import datetime

from features.tasklist import projects_router, tasks_router
from core.logger import get_logger

logger = get_logger(__name__)

# メインAPIルーター
api_router = APIRouter()

# ヘルスチェック
@api_router.get("/health")
async def health_check():
    """アプリケーションヘルスチェック"""
    logger.debug("Health check requested")
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

# 機能別ルーター統合
api_router.include_router(projects_router)
api_router.include_router(tasks_router)

logger.info("API router initialized with all feature routes")
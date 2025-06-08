"""
Tasklist feature module.
システムプロンプト準拠：タスクリスト機能の統一エクスポート
"""

from .routes.projects import router as projects_router
from .routes.tasks import router as tasks_router

# 機能内ルーター統合
tasklist_router = [projects_router, tasks_router]

__all__ = ['tasklist_router', 'projects_router', 'tasks_router']
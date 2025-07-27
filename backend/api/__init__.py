"""
API module for Todo application.
システムプロンプト準拠：API共通機能の統一管理
"""

from .router import api_router
from .dependencies import get_database_manager

__all__ = ['api_router', 'get_database_manager']
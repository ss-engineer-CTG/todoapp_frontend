"""
エラーモニタリング API エンドポイント
"""
from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Dict, Any, Optional
from datetime import datetime

from .service import error_monitoring_service
from .models import ErrorSeverity, ErrorCategory, ErrorStatus
from .alert_service import alert_service
from core.logger import get_logger, LogCategory

logger = get_logger(__name__)
router = APIRouter(prefix="/errors", tags=["Error Monitoring"])

@router.post("/report")
async def report_error(
    error_data: Dict[str, Any] = Body(...)
):
    """フロントエンドからのエラーレポート受信"""
    try:
        # フロントエンドエラーデータの解析
        message = error_data.get('message', 'Unknown error')
        category_str = error_data.get('category', 'unknown')
        severity_str = error_data.get('severity', 'medium')
        
        # 列挙型に変換
        try:
            category = ErrorCategory(category_str)
        except ValueError:
            category = ErrorCategory.UNKNOWN
        
        try:
            severity = ErrorSeverity(severity_str)
        except ValueError:
            severity = ErrorSeverity.MEDIUM
        
        # コンテキスト情報
        context = error_data.get('context', {})
        stack_trace = error_data.get('stackTrace')
        
        # ユーザー・セッション情報
        user_id = error_data.get('userId')
        session_id = error_data.get('sessionId')
        request_id = error_data.get('correlationId')
        url = error_data.get('url')
        user_agent = error_data.get('userAgent')
        
        # エラーレポート作成
        error_id = error_monitoring_service.report_error(
            message=message,
            category=category,
            severity=severity,
            stack_trace=stack_trace,
            context=context,
            user_id=user_id,
            session_id=session_id,
            request_id=request_id,
            url=url,
            user_agent=user_agent
        )
        
        logger.info(
            f"Frontend error reported: {error_id}",
            category=LogCategory.API,
            error_id=error_id,
            frontend_error=True
        )
        
        return {
            "success": True,
            "error_id": error_id,
            "message": "Error reported successfully"
        }
        
    except Exception as e:
        logger.error(
            f"Failed to process error report: {e}",
            category=LogCategory.API,
            exc_info=True
        )
        raise HTTPException(status_code=500, detail="Failed to report error")\n\n@router.get(\"/reports\")\nasync def get_error_reports(\n    category: Optional[str] = Query(None),\n    severity: Optional[str] = Query(None),\n    status: Optional[str] = Query(None),\n    limit: int = Query(100, le=1000),\n    offset: int = Query(0, ge=0)\n):\n    \"\"\"エラーレポート一覧取得\"\"\"\n    try:\n        # パラメータ変換\n        category_enum = None\n        if category:\n            try:\n                category_enum = ErrorCategory(category)\n            except ValueError:\n                raise HTTPException(status_code=400, detail=f\"Invalid category: {category}\")\n        \n        severity_enum = None\n        if severity:\n            try:\n                severity_enum = ErrorSeverity(severity)\n            except ValueError:\n                raise HTTPException(status_code=400, detail=f\"Invalid severity: {severity}\")\n        \n        status_enum = None\n        if status:\n            try:\n                status_enum = ErrorStatus(status)\n            except ValueError:\n                raise HTTPException(status_code=400, detail=f\"Invalid status: {status}\")\n        \n        # エラーレポート取得\n        reports = error_monitoring_service.get_error_reports(\n            category=category_enum,\n            severity=severity_enum,\n            status=status_enum,\n            limit=limit,\n            offset=offset\n        )\n        \n        # JSONシリアライズ可能な形式に変換\n        report_data = []\n        for report in reports:\n            report_data.append({\n                \"id\": report.id,\n                \"fingerprint\": report.fingerprint,\n                \"message\": report.message,\n                \"category\": report.category.value,\n                \"severity\": report.severity.value,\n                \"status\": report.status.value,\n                \"first_occurrence\": report.first_occurrence.isoformat(),\n                \"last_occurrence\": report.last_occurrence.isoformat(),\n                \"occurrence_count\": report.occurrence_count,\n                \"affected_users\": report.affected_users,\n                \"stack_trace\": report.stack_trace,\n                \"context\": report.context,\n                \"resolution_notes\": report.resolution_notes,\n                \"assigned_to\": report.assigned_to\n            })\n        \n        return {\n            \"reports\": report_data,\n            \"total\": len(report_data),\n            \"limit\": limit,\n            \"offset\": offset\n        }\n        \n    except HTTPException:\n        raise\n    except Exception as e:\n        logger.error(\n            f\"Failed to get error reports: {e}\",\n            category=LogCategory.API,\n            exc_info=True\n        )\n        raise HTTPException(status_code=500, detail=\"Failed to get error reports\")\n\n@router.get(\"/statistics\")\nasync def get_error_statistics(\n    hours: int = Query(24, ge=1, le=168)  # 最大1週間\n):\n    \"\"\"エラー統計取得\"\"\"\n    try:\n        stats = error_monitoring_service.get_error_statistics(hours=hours)\n        \n        # JSONシリアライズ可能な形式に変換\n        return {\n            \"total_errors\": stats.total_errors,\n            \"error_rate\": stats.error_rate,\n            \"errors_by_category\": {\n                category.value: count \n                for category, count in stats.errors_by_category.items()\n            },\n            \"errors_by_severity\": {\n                severity.value: count \n                for severity, count in stats.errors_by_severity.items()\n            },\n            \"top_errors\": [\n                {\n                    \"id\": error.id,\n                    \"message\": error.message,\n                    \"category\": error.category.value,\n                    \"severity\": error.severity.value,\n                    \"occurrence_count\": error.occurrence_count,\n                    \"last_occurrence\": error.last_occurrence.isoformat()\n                }\n                for error in stats.top_errors\n            ],\n            \"timeframe_hours\": hours\n        }\n        \n    except Exception as e:\n        logger.error(\n            f\"Failed to get error statistics: {e}\",\n            category=LogCategory.API,\n            exc_info=True\n        )\n        raise HTTPException(status_code=500, detail=\"Failed to get error statistics\")\n\n@router.get(\"/trends\")\nasync def get_error_trends(\n    hours: int = Query(24, ge=1, le=168),\n    interval_minutes: int = Query(60, ge=5, le=1440)\n):\n    \"\"\"エラートレンド取得\"\"\"\n    try:\n        trends = error_monitoring_service.get_error_trends(\n            hours=hours,\n            interval_minutes=interval_minutes\n        )\n        \n        return {\n            \"trends\": trends,\n            \"timeframe_hours\": hours,\n            \"interval_minutes\": interval_minutes\n        }\n        \n    except Exception as e:\n        logger.error(\n            f\"Failed to get error trends: {e}\",\n            category=LogCategory.API,\n            exc_info=True\n        )\n        raise HTTPException(status_code=500, detail=\"Failed to get error trends\")\n\n@router.post(\"/reports/{error_id}/resolve\")\nasync def resolve_error(\n    error_id: str,\n    resolution_data: Dict[str, Any] = Body(...)\n):\n    \"\"\"エラー解決\"\"\"\n    try:\n        resolution_notes = resolution_data.get('resolution_notes')\n        assigned_to = resolution_data.get('assigned_to')\n        \n        success = error_monitoring_service.resolve_error(\n            error_id=error_id,\n            resolution_notes=resolution_notes,\n            assigned_to=assigned_to\n        )\n        \n        if not success:\n            raise HTTPException(status_code=404, detail=\"Error report not found\")\n        \n        logger.info(\n            f\"Error resolved: {error_id}\",\n            category=LogCategory.API,\n            error_id=error_id,\n            resolved_by=assigned_to\n        )\n        \n        return {\n            \"success\": True,\n            \"message\": \"Error resolved successfully\"\n        }\n        \n    except HTTPException:\n        raise\n    except Exception as e:\n        logger.error(\n            f\"Failed to resolve error: {e}\",\n            category=LogCategory.API,\n            exc_info=True\n        )\n        raise HTTPException(status_code=500, detail=\"Failed to resolve error\")\n\n@router.get(\"/health\")\nasync def error_monitoring_health():\n    \"\"\"エラーモニタリングシステムのヘルスチェック\"\"\"\n    try:\n        # 基本的なヘルスチェック\n        recent_stats = error_monitoring_service.get_error_statistics(hours=1)\n        \n        return {\n            \"status\": \"healthy\",\n            \"recent_errors\": recent_stats.total_errors,\n            \"error_rate\": recent_stats.error_rate,\n            \"timestamp\": datetime.now().isoformat()\n        }\n        \n    except Exception as e:\n        logger.error(\n            f\"Error monitoring health check failed: {e}\",\n            category=LogCategory.SYSTEM,\n            exc_info=True\n        )\n        return {\n            \"status\": \"unhealthy\",\n            \"error\": str(e),\n            \"timestamp\": datetime.now().isoformat()\n        }
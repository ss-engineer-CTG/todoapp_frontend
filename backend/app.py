"""
階層型ToDoリストアプリケーション メインAPI
システムプロンプト準拠：KISS原則、DRY原則、統一ログ・例外処理
"""
import sys
import os
from pathlib import Path

# システムプロンプト準拠：パス管理の一元化
# バックエンドディレクトリをPythonパスに追加
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

import sqlite3
from datetime import datetime
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn

# コア機能（絶対インポートに変更）
from core.config import config
from core.logger import setup_logging, get_logger, log_api_operation
from core.database import DatabaseManager, init_database
from core.exceptions import TodoAppError, handle_exception, DateConversionError

# サービス（絶対インポートに変更）
from services.project_service import ProjectService
from services.task_service import TaskService

# システムプロンプト準拠：適切なログレベルでの統一ログ機能
setup_logging(config.log_level, config.log_file)
logger = get_logger(__name__)

# データベースマネージャー
db_manager = DatabaseManager()

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

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# サービスインスタンス
project_service = ProjectService(db_manager)
task_service = TaskService(db_manager)

# Pydanticモデル
class ProjectCreate(BaseModel):
    name: str
    color: str
    collapsed: bool = False

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    collapsed: Optional[bool] = None

class TaskCreate(BaseModel):
    name: str
    project_id: str
    parent_id: Optional[str] = None
    completed: bool = False
    start_date: datetime
    due_date: datetime
    notes: str = ""
    assignee: str = "自分"
    level: int = 0
    collapsed: bool = False

class TaskUpdate(BaseModel):
    name: Optional[str] = None
    project_id: Optional[str] = None
    parent_id: Optional[str] = None
    completed: Optional[bool] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None
    notes: Optional[str] = None
    assignee: Optional[str] = None
    level: Optional[int] = None
    collapsed: Optional[bool] = None

class BatchTaskOperation(BaseModel):
    operation: str
    task_ids: List[str]

# システムプロンプト準拠：統一例外処理（強化版）
@app.exception_handler(TodoAppError)
async def todo_app_error_handler(request: Request, exc: TodoAppError):
    """アプリケーション例外ハンドラー"""
    # エラータイプに応じた適切なログレベル
    if isinstance(exc, DateConversionError):
        logger.warn(f"Date conversion error: {exc.message}", exc_info=True)
        status_code = 400
    else:
        logger.error(f"Todo app error: {exc.message}", exc_info=True)
        status_code = 400
    
    # API操作ログ
    log_api_operation(
        logger,
        request.method,
        str(request.url.path),
        False,
        context={'error_type': exc.__class__.__name__, 'error_message': exc.message}
    )
    
    return JSONResponse(
        status_code=status_code,
        content=exc.to_dict()
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """一般例外ハンドラー"""
    app_error = handle_exception(exc)
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    # API操作ログ
    log_api_operation(
        logger,
        request.method,
        str(request.url.path),
        False,
        context={'error_type': type(exc).__name__, 'error_message': str(exc)}
    )
    
    return JSONResponse(
        status_code=500,
        content=app_error.to_dict()
    )

# ヘルスチェック
@app.get("/api/health")
async def health_check():
    """アプリケーションヘルスチェック"""
    logger.debug("Health check requested")
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

# プロジェクト関連エンドポイント
@app.get("/api/projects")
async def get_projects():
    """プロジェクト一覧取得"""
    start_time = datetime.now()
    try:
        projects = project_service.get_all_projects()
        
        # API操作ログ
        duration = (datetime.now() - start_time).total_seconds() * 1000
        log_api_operation(logger, "GET", "/api/projects", True, duration)
        
        logger.info(f"Retrieved {len(projects)} projects")
        return projects
    except Exception as e:
        log_api_operation(logger, "GET", "/api/projects", False)
        logger.error(f"Failed to get projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/projects")
async def create_project(project: ProjectCreate):
    """プロジェクト作成"""
    start_time = datetime.now()
    try:
        created_project = project_service.create_project(project.dict())
        
        # API操作ログ
        duration = (datetime.now() - start_time).total_seconds() * 1000
        log_api_operation(logger, "POST", "/api/projects", True, duration)
        
        logger.info(f"Created project: {created_project['name']} ({created_project['id']})")
        return created_project
    except Exception as e:
        log_api_operation(logger, "POST", "/api/projects", False)
        logger.error(f"Failed to create project: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/projects/{project_id}")
async def get_project(project_id: str):
    """プロジェクト詳細取得"""
    start_time = datetime.now()
    try:
        project = project_service.get_project_by_id(project_id)
        
        # API操作ログ
        duration = (datetime.now() - start_time).total_seconds() * 1000
        log_api_operation(logger, "GET", f"/api/projects/{project_id}", True, duration)
        
        logger.debug(f"Retrieved project: {project_id}")
        return project
    except Exception as e:
        log_api_operation(logger, "GET", f"/api/projects/{project_id}", False)
        logger.error(f"Failed to get project {project_id}: {e}")
        raise HTTPException(status_code=404, detail=str(e))

@app.put("/api/projects/{project_id}")
async def update_project(project_id: str, project: ProjectUpdate):
    """プロジェクト更新"""
    start_time = datetime.now()
    try:
        updated_project = project_service.update_project(
            project_id, 
            project.dict(exclude_unset=True)
        )
        
        # API操作ログ
        duration = (datetime.now() - start_time).total_seconds() * 1000
        log_api_operation(logger, "PUT", f"/api/projects/{project_id}", True, duration)
        
        logger.info(f"Updated project: {updated_project['name']} ({project_id})")
        return updated_project
    except Exception as e:
        log_api_operation(logger, "PUT", f"/api/projects/{project_id}", False)
        logger.error(f"Failed to update project {project_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: str):
    """プロジェクト削除"""
    start_time = datetime.now()
    try:
        project_service.delete_project(project_id)
        
        # API操作ログ
        duration = (datetime.now() - start_time).total_seconds() * 1000
        log_api_operation(logger, "DELETE", f"/api/projects/{project_id}", True, duration)
        
        logger.info(f"Deleted project: {project_id}")
        return {"message": "Project deleted successfully"}
    except Exception as e:
        log_api_operation(logger, "DELETE", f"/api/projects/{project_id}", False)
        logger.error(f"Failed to delete project {project_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# タスク関連エンドポイント
@app.get("/api/tasks")
async def get_tasks(projectId: Optional[str] = None):
    """タスク一覧取得"""
    start_time = datetime.now()
    try:
        tasks = task_service.get_tasks(projectId)
        
        # API操作ログ
        duration = (datetime.now() - start_time).total_seconds() * 1000
        log_api_operation(logger, "GET", "/api/tasks", True, duration)
        
        logger.info(f"Retrieved {len(tasks)} tasks" + 
                   (f" for project {projectId}" if projectId else ""))
        return tasks
    except Exception as e:
        log_api_operation(logger, "GET", "/api/tasks", False)
        logger.error(f"Failed to get tasks: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tasks")
async def create_task(task: TaskCreate):
    """タスク作成"""
    start_time = datetime.now()
    try:
        # システムプロンプト準拠：日付フィールドの明示的な変換
        task_dict = task.dict()
        if task_dict.get('start_date'):
            task_dict['start_date'] = task_dict['start_date'].isoformat()
        if task_dict.get('due_date'):
            task_dict['due_date'] = task_dict['due_date'].isoformat()
        if task_dict.get('completion_date'):
            task_dict['completion_date'] = task_dict['completion_date'].isoformat()
        
        created_task = task_service.create_task(task_dict)
        
        # API操作ログ
        duration = (datetime.now() - start_time).total_seconds() * 1000
        log_api_operation(logger, "POST", "/api/tasks", True, duration)
        
        logger.info(f"Created task: {created_task['name']} ({created_task['id']})")
        return created_task
    except Exception as e:
        log_api_operation(logger, "POST", "/api/tasks", False)
        logger.error(f"Failed to create task: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/tasks/{task_id}")
async def get_task(task_id: str):
    """タスク詳細取得"""
    start_time = datetime.now()
    try:
        task = task_service.get_task_by_id(task_id)
        
        # API操作ログ
        duration = (datetime.now() - start_time).total_seconds() * 1000
        log_api_operation(logger, "GET", f"/api/tasks/{task_id}", True, duration)
        
        logger.debug(f"Retrieved task: {task_id}")
        return task
    except Exception as e:
        log_api_operation(logger, "GET", f"/api/tasks/{task_id}", False)
        logger.error(f"Failed to get task {task_id}: {e}")
        raise HTTPException(status_code=404, detail=str(e))

@app.put("/api/tasks/{task_id}")
async def update_task(task_id: str, task: TaskUpdate):
    """タスク更新"""
    start_time = datetime.now()
    try:
        # システムプロンプト準拠：日付フィールドの明示的な変換
        task_dict = task.dict(exclude_unset=True)
        for date_field in ['start_date', 'due_date', 'completion_date']:
            if date_field in task_dict and task_dict[date_field] is not None:
                task_dict[date_field] = task_dict[date_field].isoformat()
        
        updated_task = task_service.update_task(task_id, task_dict)
        
        # API操作ログ
        duration = (datetime.now() - start_time).total_seconds() * 1000
        log_api_operation(logger, "PUT", f"/api/tasks/{task_id}", True, duration)
        
        logger.info(f"Updated task: {updated_task['name']} ({task_id})")
        return updated_task
    except Exception as e:
        log_api_operation(logger, "PUT", f"/api/tasks/{task_id}", False)
        logger.error(f"Failed to update task {task_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: str):
    """タスク削除"""
    start_time = datetime.now()
    try:
        task_service.delete_task(task_id)
        
        # API操作ログ
        duration = (datetime.now() - start_time).total_seconds() * 1000
        log_api_operation(logger, "DELETE", f"/api/tasks/{task_id}", True, duration)
        
        logger.info(f"Deleted task: {task_id}")
        return {"message": "Task deleted successfully"}
    except Exception as e:
        log_api_operation(logger, "DELETE", f"/api/tasks/{task_id}", False)
        logger.error(f"Failed to delete task {task_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/tasks/batch")
async def batch_update_tasks(operation: BatchTaskOperation):
    """タスク一括操作"""
    start_time = datetime.now()
    try:
        result = task_service.batch_update_tasks(operation.operation, operation.task_ids)
        
        # API操作ログ
        duration = (datetime.now() - start_time).total_seconds() * 1000
        log_api_operation(logger, "POST", "/api/tasks/batch", result['success'], duration)
        
        if result['success']:
            logger.info(f"Batch operation '{operation.operation}' completed successfully", {
                'affected_count': result['affected_count'],
                'task_count': len(operation.task_ids)
            })
            return {
                "message": f"Batch operation '{operation.operation}' completed successfully",
                "affected_count": result['affected_count'],
                "task_ids": operation.task_ids
            }
        else:
            logger.error(f"Batch operation '{operation.operation}' failed", {
                'error': result.get('error'),
                'task_count': len(operation.task_ids)
            })
            raise HTTPException(status_code=400, detail=result.get('error', 'Batch operation failed'))
            
    except Exception as e:
        log_api_operation(logger, "POST", "/api/tasks/batch", False)
        logger.error(f"Failed to execute batch operation '{operation.operation}': {e}")
        raise HTTPException(status_code=400, detail=str(e))

# 新規追加：タスク階層取得エンドポイント
@app.get("/api/tasks/{task_id}/hierarchy")
async def get_task_hierarchy(task_id: str):
    """タスクの階層構造取得（子タスク含む）"""
    start_time = datetime.now()
    try:
        hierarchy = task_service.get_task_hierarchy(task_id)
        
        # API操作ログ
        duration = (datetime.now() - start_time).total_seconds() * 1000
        log_api_operation(logger, "GET", f"/api/tasks/{task_id}/hierarchy", True, duration)
        
        logger.debug(f"Retrieved hierarchy for task: {task_id}")
        return hierarchy
    except Exception as e:
        log_api_operation(logger, "GET", f"/api/tasks/{task_id}/hierarchy", False)
        logger.error(f"Failed to get task hierarchy {task_id}: {e}")
        raise HTTPException(status_code=404, detail=str(e))

# 新規追加：パフォーマンス情報取得エンドポイント
@app.get("/api/stats")
async def get_application_stats():
    """アプリケーション統計情報取得"""
    start_time = datetime.now()
    try:
        stats = {}
        
        # プロジェクト統計
        projects = project_service.get_all_projects()
        stats['projects'] = {
            'total': len(projects),
            'active': len([p for p in projects if not p.get('collapsed', False)])
        }
        
        # タスク統計
        tasks = task_service.get_tasks()
        stats['tasks'] = {
            'total': len(tasks),
            'completed': len([t for t in tasks if t.get('completed', False)]),
            'pending': len([t for t in tasks if not t.get('completed', False)]),
            'root_tasks': len([t for t in tasks if not t.get('parent_id')]),
            'child_tasks': len([t for t in tasks if t.get('parent_id')])
        }
        
        # API操作ログ
        duration = (datetime.now() - start_time).total_seconds() * 1000
        log_api_operation(logger, "GET", "/api/stats", True, duration)
        
        logger.debug("Retrieved application statistics")
        return stats
        
    except Exception as e:
        log_api_operation(logger, "GET", "/api/stats", False)
        logger.error(f"Failed to get application stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # システムプロンプト準拠：統一設定による起動
    logger.info(f"Starting server on {config.host}:{config.port}")
    logger.info(f"Debug mode: {config.debug}")
    
    uvicorn.run(
        "app:app",
        host=config.host,
        port=config.port,
        reload=config.debug,
        log_level=config.log_level.lower()
    )
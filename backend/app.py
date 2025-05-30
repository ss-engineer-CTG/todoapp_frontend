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
from core.logger import setup_logging, get_logger
from core.database import DatabaseManager, init_database
from core.exceptions import TodoAppError, handle_exception

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

# システムプロンプト準拠：統一例外処理
@app.exception_handler(TodoAppError)
async def todo_app_error_handler(request: Request, exc: TodoAppError):
    """アプリケーション例外ハンドラー"""
    logger.error(f"Todo app error: {exc.message}", exc_info=True)
    return JSONResponse(
        status_code=400,
        content=exc.to_dict()
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """一般例外ハンドラー"""
    app_error = handle_exception(exc)
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
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
    try:
        projects = project_service.get_all_projects()
        logger.info(f"Retrieved {len(projects)} projects")
        return projects
    except Exception as e:
        logger.error(f"Failed to get projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/projects")
async def create_project(project: ProjectCreate):
    """プロジェクト作成"""
    try:
        created_project = project_service.create_project(project.dict())
        logger.info(f"Created project: {created_project['name']} ({created_project['id']})")
        return created_project
    except Exception as e:
        logger.error(f"Failed to create project: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/projects/{project_id}")
async def get_project(project_id: str):
    """プロジェクト詳細取得"""
    try:
        project = project_service.get_project_by_id(project_id)
        logger.debug(f"Retrieved project: {project_id}")
        return project
    except Exception as e:
        logger.error(f"Failed to get project {project_id}: {e}")
        raise HTTPException(status_code=404, detail=str(e))

@app.put("/api/projects/{project_id}")
async def update_project(project_id: str, project: ProjectUpdate):
    """プロジェクト更新"""
    try:
        updated_project = project_service.update_project(
            project_id, 
            project.dict(exclude_unset=True)
        )
        logger.info(f"Updated project: {updated_project['name']} ({project_id})")
        return updated_project
    except Exception as e:
        logger.error(f"Failed to update project {project_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: str):
    """プロジェクト削除"""
    try:
        project_service.delete_project(project_id)
        logger.info(f"Deleted project: {project_id}")
        return {"message": "Project deleted successfully"}
    except Exception as e:
        logger.error(f"Failed to delete project {project_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# タスク関連エンドポイント
@app.get("/api/tasks")
async def get_tasks(projectId: Optional[str] = None):
    """タスク一覧取得"""
    try:
        tasks = task_service.get_tasks(projectId)
        logger.info(f"Retrieved {len(tasks)} tasks" + 
                   (f" for project {projectId}" if projectId else ""))
        return tasks
    except Exception as e:
        logger.error(f"Failed to get tasks: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tasks")
async def create_task(task: TaskCreate):
    """タスク作成"""
    try:
        created_task = task_service.create_task(task.dict())
        logger.info(f"Created task: {created_task['name']} ({created_task['id']})")
        return created_task
    except Exception as e:
        logger.error(f"Failed to create task: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/tasks/{task_id}")
async def get_task(task_id: str):
    """タスク詳細取得"""
    try:
        task = task_service.get_task_by_id(task_id)
        logger.debug(f"Retrieved task: {task_id}")
        return task
    except Exception as e:
        logger.error(f"Failed to get task {task_id}: {e}")
        raise HTTPException(status_code=404, detail=str(e))

@app.put("/api/tasks/{task_id}")
async def update_task(task_id: str, task: TaskUpdate):
    """タスク更新"""
    try:
        updated_task = task_service.update_task(
            task_id, 
            task.dict(exclude_unset=True)
        )
        logger.info(f"Updated task: {updated_task['name']} ({task_id})")
        return updated_task
    except Exception as e:
        logger.error(f"Failed to update task {task_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: str):
    """タスク削除"""
    try:
        task_service.delete_task(task_id)
        logger.info(f"Deleted task: {task_id}")
        return {"message": "Task deleted successfully"}
    except Exception as e:
        logger.error(f"Failed to delete task {task_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/tasks/batch")
async def batch_update_tasks(operation: BatchTaskOperation):
    """タスク一括操作"""
    try:
        task_service.batch_update_tasks(operation.operation, operation.task_ids)
        logger.info(f"Batch operation '{operation.operation}' completed for {len(operation.task_ids)} tasks")
        return {"message": f"Batch operation '{operation.operation}' completed successfully"}
    except Exception as e:
        logger.error(f"Failed to execute batch operation '{operation.operation}': {e}")
        raise HTTPException(status_code=400, detail=str(e))

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
"""
新しいメインアプリケーション（リファクタリング後）
システムプロンプト準拠：DRY原則、統一ログ機能、統一例外処理
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

# Pydanticモデル（既存のスキーマを流用）
from pydantic import BaseModel

# ログ設定
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

# FastAPIアプリケーション作成
app = FastAPI(
    title="Hierarchical Todo List API",
    version="1.0.0",
    description="階層型ToDoリストアプリケーション API",
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

# 例外ハンドラー
@app.exception_handler(TodoAppError)
async def todo_app_exception_handler(request: Request, exc: TodoAppError):
    """アプリケーション例外統一ハンドラー"""
    logger.error(f"Application error: {exc.message}", context=exc.context)
    
    status_code = 400
    if "NotFound" in exc.__class__.__name__:
        status_code = 404
    elif "Validation" in exc.__class__.__name__:
        status_code = 422
    elif "Database" in exc.__class__.__name__:
        status_code = 500
    
    return JSONResponse(
        status_code=status_code,
        content=exc.to_dict()
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """一般例外ハンドラー"""
    app_error = handle_exception(exc, {"endpoint": str(request.url)})
    logger.error(f"Unhandled error: {app_error.message}", context=app_error.context)
    
    return JSONResponse(
        status_code=500,
        content=app_error.to_dict()
    )

# 依存関係
def get_project_service() -> ProjectService:
    """プロジェクトサービス取得"""
    return ProjectService(db_manager)

def get_task_service() -> TaskService:
    """タスクサービス取得"""
    return TaskService(db_manager)

# Pydanticモデル（簡略化）
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
    completion_date: Optional[datetime] = None
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

class BatchOperation(BaseModel):
    operation: str
    task_ids: List[str]

# ルートエンドポイント
@app.get("/")
async def root():
    """ルートエンドポイント"""
    return {
        "message": "Hierarchical Todo List API",
        "version": "1.0.0",
        "status": "running"
    }

# ヘルスチェック
@app.get("/api/health")
@app.head("/api/health")
async def health_check():
    """ヘルスチェック"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "version": "1.0.0"
    }

# プロジェクトAPI
@app.get("/api/projects")
async def get_projects(service: ProjectService = Depends(get_project_service)):
    """プロジェクト一覧取得"""
    return service.get_all_projects()

@app.post("/api/projects")
async def create_project(
    project: ProjectCreate,
    service: ProjectService = Depends(get_project_service)
):
    """プロジェクト作成"""
    return service.create_project(project.dict())

@app.get("/api/projects/{project_id}")
async def get_project(
    project_id: str,
    service: ProjectService = Depends(get_project_service)
):
    """プロジェクト取得"""
    return service.get_project_by_id(project_id)

@app.put("/api/projects/{project_id}")
async def update_project(
    project_id: str,
    project: ProjectUpdate,
    service: ProjectService = Depends(get_project_service)
):
    """プロジェクト更新"""
    return service.update_project(project_id, project.dict(exclude_unset=True))

@app.delete("/api/projects/{project_id}")
async def delete_project(
    project_id: str,
    service: ProjectService = Depends(get_project_service)
):
    """プロジェクト削除"""
    service.delete_project(project_id)
    return {"message": "Project deleted successfully"}

# タスクAPI
@app.get("/api/tasks")
async def get_tasks(
    project_id: Optional[str] = None,
    service: TaskService = Depends(get_task_service)
):
    """タスク一覧取得"""
    return service.get_tasks(project_id)

@app.post("/api/tasks")
async def create_task(
    task: TaskCreate,
    service: TaskService = Depends(get_task_service)
):
    """タスク作成"""
    return service.create_task(task.dict())

@app.get("/api/tasks/{task_id}")
async def get_task(
    task_id: str,
    service: TaskService = Depends(get_task_service)
):
    """タスク取得"""
    return service.get_task_by_id(task_id)

@app.put("/api/tasks/{task_id}")
async def update_task(
    task_id: str,
    task: TaskUpdate,
    service: TaskService = Depends(get_task_service)
):
    """タスク更新"""
    return service.update_task(task_id, task.dict(exclude_unset=True))

@app.delete("/api/tasks/{task_id}")
async def delete_task(
    task_id: str,
    service: TaskService = Depends(get_task_service)
):
    """タスク削除"""
    service.delete_task(task_id)
    return {"message": "Task deleted successfully"}

@app.post("/api/tasks/batch")
async def batch_update_tasks(
    operation: BatchOperation,
    service: TaskService = Depends(get_task_service)
):
    """タスク一括操作"""
    service.batch_update_tasks(operation.operation, operation.task_ids)
    return {"message": f"{operation.operation} operation executed successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=config.host,
        port=config.port,
        reload=config.debug,
        log_level=config.log_level.lower()
    )
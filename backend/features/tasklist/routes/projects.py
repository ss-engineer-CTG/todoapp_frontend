"""
プロジェクト関連APIルート
システムプロンプト準拠：KISS原則、統一例外処理
"""
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException

from core.database import DatabaseManager
from core.logger import get_logger, log_api_operation
from ..services.project_service import ProjectService
from ..schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse

router = APIRouter(prefix="/projects", tags=["projects"])
logger = get_logger(__name__)

def get_project_service() -> ProjectService:
    """プロジェクトサービスの依存性注入"""
    return ProjectService(DatabaseManager())

@router.get("/", response_model=List[ProjectResponse])
async def get_projects(
    service: ProjectService = Depends(get_project_service)
):
    """プロジェクト一覧取得"""
    start_time = datetime.now()
    try:
        projects = service.get_all_projects()
        
        # API操作ログ
        duration = (datetime.now() - start_time).total_seconds() * 1000
        log_api_operation(logger, "GET", "/projects", True, duration)
        
        return projects
    except Exception as e:
        log_api_operation(logger, "GET", "/projects", False)
        logger.error(f"Failed to get projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate,
    service: ProjectService = Depends(get_project_service)
):
    """プロジェクト作成"""
    start_time = datetime.now()
    try:
        created_project = service.create_project(project.dict())
        
        # API操作ログ
        duration = (datetime.now() - start_time).total_seconds() * 1000
        log_api_operation(logger, "POST", "/projects", True, duration)
        
        return created_project
    except Exception as e:
        log_api_operation(logger, "POST", "/projects", False)
        logger.error(f"Failed to create project: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    service: ProjectService = Depends(get_project_service)
):
    """プロジェクト詳細取得"""
    start_time = datetime.now()
    try:
        project = service.get_project_by_id(project_id)
        
        # API操作ログ
        duration = (datetime.now() - start_time).total_seconds() * 1000
        log_api_operation(logger, "GET", f"/projects/{project_id}", True, duration)
        
        return project
    except Exception as e:
        log_api_operation(logger, "GET", f"/projects/{project_id}", False)
        logger.error(f"Failed to get project {project_id}: {e}")
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project: ProjectUpdate,
    service: ProjectService = Depends(get_project_service)
):
    """プロジェクト更新"""
    start_time = datetime.now()
    try:
        updated_project = service.update_project(
            project_id, 
            project.dict(exclude_unset=True)
        )
        
        # API操作ログ
        duration = (datetime.now() - start_time).total_seconds() * 1000
        log_api_operation(logger, "PUT", f"/projects/{project_id}", True, duration)
        
        return updated_project
    except Exception as e:
        log_api_operation(logger, "PUT", f"/projects/{project_id}", False)
        logger.error(f"Failed to update project {project_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    service: ProjectService = Depends(get_project_service)
):
    """プロジェクト削除"""
    start_time = datetime.now()
    try:
        service.delete_project(project_id)
        
        # API操作ログ
        duration = (datetime.now() - start_time).total_seconds() * 1000
        log_api_operation(logger, "DELETE", f"/projects/{project_id}", True, duration)
        
        return {"message": "Project deleted successfully"}
    except Exception as e:
        log_api_operation(logger, "DELETE", f"/projects/{project_id}", False)
        logger.error(f"Failed to delete project {project_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))
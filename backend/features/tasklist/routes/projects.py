"""
プロジェクト関連APIルート
システムプロンプト準拠：KISS原則、シンプルな標準ロギング
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException

from core.database import DatabaseManager
from core.logger import get_logger
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
    try:
        projects = service.get_all_projects()
        logger.info("Projects retrieved successfully")
        return projects
    except Exception as e:
        logger.error(f"Failed to get projects: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate,
    service: ProjectService = Depends(get_project_service)
):
    """プロジェクト作成"""
    try:
        created_project = service.create_project(project.dict())
        logger.info(f"Project created successfully: {created_project.id}")
        return created_project
    except Exception as e:
        logger.error(f"Failed to create project: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    service: ProjectService = Depends(get_project_service)
):
    """プロジェクト詳細取得"""
    try:
        project = service.get_project_by_id(project_id)
        logger.info(f"Project retrieved successfully: {project_id}")
        return project
    except Exception as e:
        logger.error(f"Failed to get project {project_id}: {e}")
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project: ProjectUpdate,
    service: ProjectService = Depends(get_project_service)
):
    """プロジェクト更新"""
    try:
        updated_project = service.update_project(
            project_id, 
            project.dict(exclude_unset=True)
        )
        logger.info(f"Project updated successfully: {project_id}")
        return updated_project
    except Exception as e:
        logger.error(f"Failed to update project {project_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    service: ProjectService = Depends(get_project_service)
):
    """プロジェクト削除"""
    try:
        service.delete_project(project_id)
        logger.info(f"Project deleted successfully: {project_id}")
        return {"message": "Project deleted successfully"}
    except Exception as e:
        logger.error(f"Failed to delete project {project_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))
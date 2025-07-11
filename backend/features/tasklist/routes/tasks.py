"""
タスク関連APIルート
システムプロンプト準拠：KISS原則、シンプルな標準ロギング
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from core.database import DatabaseManager
from core.logger import get_logger
from ..services.task_service import TaskService
from ..schemas.task import TaskCreate, TaskUpdate, TaskResponse, BatchTaskOperation, BatchDateShiftOperation

router = APIRouter(prefix="/tasks", tags=["tasks"])
logger = get_logger(__name__)

def get_task_service() -> TaskService:
    """タスクサービスの依存性注入"""
    return TaskService(DatabaseManager())

@router.get("/", response_model=List[TaskResponse])
async def get_tasks(
    projectId: Optional[str] = Query(None),
    service: TaskService = Depends(get_task_service)
):
    """タスク一覧取得"""
    try:
        tasks = service.get_tasks(projectId)
        if projectId:
            logger.info(f"Tasks retrieved successfully for project: {projectId}")
        else:
            logger.info("All tasks retrieved successfully")
        return tasks
    except Exception as e:
        logger.error(f"Failed to get tasks: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=TaskResponse)
async def create_task(
    task: TaskCreate,
    service: TaskService = Depends(get_task_service)
):
    """タスク作成"""
    try:
        # 日付フィールドの明示的な変換
        task_dict = task.dict()
        if task_dict.get('start_date'):
            task_dict['start_date'] = task_dict['start_date'].isoformat()
        if task_dict.get('due_date'):
            task_dict['due_date'] = task_dict['due_date'].isoformat()
        if task_dict.get('completion_date'):
            task_dict['completion_date'] = task_dict['completion_date'].isoformat()
        
        created_task_dict = service.create_task(task_dict)
        
        # 辞書からTaskResponseモデルに変換
        created_task = TaskResponse(**created_task_dict)
        
        logger.info(f"Task created successfully: {created_task.id}")
        return created_task
    except Exception as e:
        logger.error(f"Failed to create task: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    service: TaskService = Depends(get_task_service)
):
    """タスク詳細取得"""
    try:
        task = service.get_task_by_id(task_id)
        logger.info(f"Task retrieved successfully: {task_id}")
        return task
    except Exception as e:
        logger.error(f"Failed to get task {task_id}: {e}")
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task: TaskUpdate,
    service: TaskService = Depends(get_task_service)
):
    """タスク更新"""
    try:
        # 日付フィールドの明示的な変換
        task_dict = task.dict(exclude_unset=True)
        for date_field in ['start_date', 'due_date', 'completion_date']:
            if date_field in task_dict and task_dict[date_field] is not None:
                task_dict[date_field] = task_dict[date_field].isoformat()
        
        updated_task = service.update_task(task_id, task_dict)
        logger.info(f"Task updated successfully: {task_id}")
        return updated_task
    except Exception as e:
        logger.error(f"Failed to update task {task_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    service: TaskService = Depends(get_task_service)
):
    """タスク削除"""
    try:
        service.delete_task(task_id)
        logger.info(f"Task deleted successfully: {task_id}")
        return {"message": "Task deleted successfully"}
    except Exception as e:
        logger.error(f"Failed to delete task {task_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/batch")
async def batch_update_tasks(
    operation: BatchTaskOperation,
    service: TaskService = Depends(get_task_service)
):
    """タスク一括操作"""
    try:
        result = service.batch_update_tasks(operation.operation, operation.task_ids)
        
        if result['success']:
            logger.info(f"Batch operation '{operation.operation}' completed successfully for {len(operation.task_ids)} tasks")
            return {
                "message": f"Batch operation '{operation.operation}' completed successfully",
                "affected_count": result['affected_count'],
                "task_ids": operation.task_ids
            }
        else:
            logger.error(f"Batch operation '{operation.operation}' failed: {result.get('error', 'Unknown error')}")
            raise HTTPException(status_code=400, detail=result.get('error', 'Batch operation failed'))
            
    except Exception as e:
        logger.error(f"Failed to execute batch operation '{operation.operation}': {e}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/batch-shift-dates")
async def batch_shift_task_dates(
    operation: BatchDateShiftOperation,
    service: TaskService = Depends(get_task_service)
):
    """タスクの日付を一括でずらす"""
    try:
        result = service.batch_shift_dates(
            operation.task_ids,
            operation.shift_type,
            operation.direction,
            operation.days
        )
        
        if result['success']:
            logger.info(f"Batch date shift completed successfully for {len(operation.task_ids)} tasks")
            return {
                "message": result['message'],
                "affected_count": result['affected_count'],
                "task_ids": operation.task_ids
            }
        else:
            logger.error(f"Batch date shift failed: {result.get('error', 'Unknown error')}")
            raise HTTPException(status_code=400, detail=result.get('error', 'Batch date shift failed'))
            
    except Exception as e:
        logger.error(f"Failed to execute batch date shift: {e}")
        raise HTTPException(status_code=400, detail=str(e))
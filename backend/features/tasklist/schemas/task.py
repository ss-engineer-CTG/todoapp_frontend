"""
タスク関連Pydanticスキーマ
システムプロンプト準拠：型安全性、バリデーション
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class TaskBase(BaseModel):
    """タスク基底スキーマ"""
    name: str = Field(..., min_length=1, max_length=200, description="タスク名")
    project_id: str = Field(..., description="プロジェクトID")
    parent_id: Optional[str] = Field(None, description="親タスクID")
    completed: bool = Field(default=False, description="完了状態")
    start_date: datetime = Field(..., description="開始日")
    due_date: datetime = Field(..., description="期限日")
    completion_date: Optional[datetime] = Field(None, description="完了日")
    notes: str = Field(default="", max_length=1000, description="メモ")
    assignee: str = Field(default="自分", max_length=50, description="担当者")
    level: int = Field(default=0, ge=0, le=10, description="階層レベル")
    collapsed: bool = Field(default=False, description="折りたたみ状態")

class TaskCreate(TaskBase):
    """タスク作成スキーマ"""
    pass

class TaskUpdate(BaseModel):
    """タスク更新スキーマ"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    project_id: Optional[str] = None
    parent_id: Optional[str] = None
    completed: Optional[bool] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=1000)
    assignee: Optional[str] = Field(None, max_length=50)
    level: Optional[int] = Field(None, ge=0, le=10)
    collapsed: Optional[bool] = None

class TaskResponse(TaskBase):
    """タスクレスポンススキーマ"""
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class BatchTaskOperation(BaseModel):
    """タスク一括操作スキーマ"""
    operation: str = Field(..., regex="^(complete|incomplete|delete|copy)$", description="操作種別")
    task_ids: List[str] = Field(..., min_items=1, description="対象タスクIDリスト")
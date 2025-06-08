"""
プロジェクト関連Pydanticスキーマ
システムプロンプト準拠：型安全性、バリデーション
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ProjectBase(BaseModel):
    """プロジェクト基底スキーマ"""
    name: str = Field(..., min_length=1, max_length=100, description="プロジェクト名")
    color: str = Field(..., pattern=r"^#[0-9A-Fa-f]{6}$", description="プロジェクトカラー")
    collapsed: bool = Field(default=False, description="折りたたみ状態")

class ProjectCreate(ProjectBase):
    """プロジェクト作成スキーマ"""
    pass

class ProjectUpdate(BaseModel):
    """プロジェクト更新スキーマ"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    collapsed: Optional[bool] = None

class ProjectResponse(ProjectBase):
    """プロジェクトレスポンススキーマ"""
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }
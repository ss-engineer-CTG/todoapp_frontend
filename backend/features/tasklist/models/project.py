"""
プロジェクトデータモデル
システムプロンプト準拠：KISS原則、データ構造の明確化
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class Project:
    """プロジェクトデータモデル"""
    id: str
    name: str
    color: str
    collapsed: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    def to_dict(self) -> dict:
        """辞書形式に変換"""
        return {
            'id': self.id,
            'name': self.name,
            'color': self.color,
            'collapsed': self.collapsed,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'Project':
        """辞書から作成"""
        created_at = None
        if data.get('created_at'):
            created_at = datetime.fromisoformat(data['created_at'].replace('Z', '+00:00'))
        
        updated_at = None
        if data.get('updated_at'):
            updated_at = datetime.fromisoformat(data['updated_at'].replace('Z', '+00:00'))
        
        return cls(
            id=data['id'],
            name=data['name'],
            color=data['color'],
            collapsed=data.get('collapsed', False),
            created_at=created_at,
            updated_at=updated_at
        )
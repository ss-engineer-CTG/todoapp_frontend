"""
タスクデータモデル
システムプロンプト準拠：KISS原則、データ構造の明確化
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class Task:
    """タスクデータモデル"""
    id: str
    name: str
    project_id: str
    parent_id: Optional[str] = None
    completed: bool = False
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None
    notes: str = ""
    assignee: str = "自分"
    level: int = 0
    collapsed: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    def to_dict(self) -> dict:
        """辞書形式に変換"""
        return {
            'id': self.id,
            'name': self.name,
            'project_id': self.project_id,
            'parent_id': self.parent_id,
            'completed': self.completed,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'completion_date': self.completion_date.isoformat() if self.completion_date else None,
            'notes': self.notes,
            'assignee': self.assignee,
            'level': self.level,
            'collapsed': self.collapsed,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'Task':
        """辞書から作成"""
        def parse_datetime(date_str):
            if not date_str:
                return None
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        
        return cls(
            id=data['id'],
            name=data['name'],
            project_id=data['project_id'],
            parent_id=data.get('parent_id'),
            completed=data.get('completed', False),
            start_date=parse_datetime(data.get('start_date')),
            due_date=parse_datetime(data.get('due_date')),
            completion_date=parse_datetime(data.get('completion_date')),
            notes=data.get('notes', ''),
            assignee=data.get('assignee', '自分'),
            level=data.get('level', 0),
            collapsed=data.get('collapsed', False),
            created_at=parse_datetime(data.get('created_at')),
            updated_at=parse_datetime(data.get('updated_at'))
        )
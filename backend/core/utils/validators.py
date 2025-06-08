"""
共通バリデーション機能
システムプロンプト準拠：DRY原則、統一バリデーション
"""
from typing import Dict, Any, List
from datetime import datetime

from ..exceptions import ValidationError

def validate_required_fields(data: Dict[str, Any], required_fields: List[str]) -> None:
    """必須フィールドの検証"""
    missing_fields = []
    
    for field in required_fields:
        if field not in data or not data[field]:
            missing_fields.append(field)
    
    if missing_fields:
        raise ValidationError(f"Missing required fields: {', '.join(missing_fields)}")

def validate_date_string(date_string: str, field_name: str) -> datetime:
    """日付文字列の検証と変換"""
    try:
        return datetime.fromisoformat(date_string.replace('Z', '+00:00'))
    except ValueError as e:
        raise ValidationError(f"Invalid date format in {field_name}: {date_string}")

def validate_task_data(task_data: Dict[str, Any]) -> None:
    """タスクデータの包括的検証"""
    # 必須フィールド検証
    validate_required_fields(task_data, ['name', 'project_id'])
    
    # 名前の検証
    if not task_data.get('name', '').strip():
        raise ValidationError("Task name cannot be empty")
    
    # 日付フィールドの検証
    if 'start_date' in task_data and task_data['start_date']:
        validate_date_string(task_data['start_date'], 'start_date')
    
    if 'due_date' in task_data and task_data['due_date']:
        validate_date_string(task_data['due_date'], 'due_date')

def validate_project_data(project_data: Dict[str, Any]) -> None:
    """プロジェクトデータの包括的検証"""
    # 必須フィールド検証
    validate_required_fields(project_data, ['name', 'color'])
    
    # 名前の検証
    if not project_data.get('name', '').strip():
        raise ValidationError("Project name cannot be empty")
    
    # カラーの検証
    color = project_data.get('color', '')
    if not color.startswith('#') or len(color) != 7:
        raise ValidationError(f"Invalid color format: {color}")
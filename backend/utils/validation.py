"""
バリデーション共通化（DRY原則適用）
"""
import re
from datetime import datetime
from typing import Dict, Any, List, Optional
from core.exceptions import ValidationError

def validate_required_fields(data: Dict[str, Any], required_fields: List[str]) -> None:
    """必須フィールド検証"""
    missing_fields = []
    
    for field in required_fields:
        if field not in data or data[field] is None or data[field] == "":
            missing_fields.append(field)
    
    if missing_fields:
        raise ValidationError(
            f"Required fields missing: {', '.join(missing_fields)}",
            code="MISSING_REQUIRED_FIELDS",
            context={"missing_fields": missing_fields}
        )

def validate_string_length(value: str, field_name: str, min_length: int = 1, max_length: int = 255) -> None:
    """文字列長検証"""
    if not isinstance(value, str):
        raise ValidationError(
            f"{field_name} must be a string",
            code="INVALID_TYPE",
            context={"field": field_name, "type": type(value).__name__}
        )
    
    if len(value) < min_length:
        raise ValidationError(
            f"{field_name} must be at least {min_length} characters",
            code="STRING_TOO_SHORT",
            context={"field": field_name, "min_length": min_length, "actual": len(value)}
        )
    
    if len(value) > max_length:
        raise ValidationError(
            f"{field_name} must be no more than {max_length} characters",
            code="STRING_TOO_LONG",
            context={"field": field_name, "max_length": max_length, "actual": len(value)}
        )

def validate_color_format(color: str) -> None:
    """カラーコード検証"""
    color_pattern = r'^#[0-9a-fA-F]{6}$'
    if not re.match(color_pattern, color):
        raise ValidationError(
            "Invalid color format. Expected format: #RRGGBB",
            code="INVALID_COLOR_FORMAT",
            context={"color": color}
        )

def validate_datetime(date_value: Any, field_name: str) -> datetime:
    """日時検証"""
    if isinstance(date_value, datetime):
        return date_value
    
    if isinstance(date_value, str):
        try:
            return datetime.fromisoformat(date_value.replace('Z', '+00:00'))
        except ValueError:
            pass
    
    raise ValidationError(
        f"Invalid datetime format for {field_name}",
        code="INVALID_DATETIME",
        context={"field": field_name, "value": str(date_value)}
    )

def validate_project_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """プロジェクトデータ検証"""
    # 必須フィールド検証
    validate_required_fields(data, ["name", "color"])
    
    # 名前検証
    validate_string_length(data["name"], "name", min_length=1, max_length=100)
    
    # カラー検証
    validate_color_format(data["color"])
    
    # collapsed フィールド検証
    if "collapsed" in data and not isinstance(data["collapsed"], bool):
        raise ValidationError(
            "collapsed must be a boolean",
            code="INVALID_TYPE",
            context={"field": "collapsed", "type": type(data["collapsed"]).__name__}
        )
    
    return {
        "name": data["name"].strip(),
        "color": data["color"],
        "collapsed": data.get("collapsed", False)
    }

def validate_task_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """タスクデータ検証"""
    # 必須フィールド検証
    validate_required_fields(data, ["name", "project_id", "start_date", "due_date"])
    
    # 名前検証
    validate_string_length(data["name"], "name", min_length=1, max_length=255)
    
    # プロジェクトID検証
    validate_string_length(data["project_id"], "project_id", min_length=1, max_length=50)
    
    # 日時検証
    start_date = validate_datetime(data["start_date"], "start_date")
    due_date = validate_datetime(data["due_date"], "due_date")
    
    # 期限日は開始日より後でなければならない
    if due_date < start_date:
        raise ValidationError(
            "Due date must be after start date",
            code="INVALID_DATE_RANGE",
            context={"start_date": start_date.isoformat(), "due_date": due_date.isoformat()}
        )
    
    # オプションフィールド検証
    validated_data = {
        "name": data["name"].strip(),
        "project_id": data["project_id"],
        "start_date": start_date,
        "due_date": due_date,
        "parent_id": data.get("parent_id"),
        "completed": data.get("completed", False),
        "notes": data.get("notes", ""),
        "assignee": data.get("assignee", "自分"),
        "level": data.get("level", 0),
        "collapsed": data.get("collapsed", False)
    }
    
    # レベル検証
    if not isinstance(validated_data["level"], int) or validated_data["level"] < 0:
        raise ValidationError(
            "Level must be a non-negative integer",
            code="INVALID_LEVEL",
            context={"level": validated_data["level"]}
        )
    
    # ノート長さ検証
    if len(validated_data["notes"]) > 1000:
        raise ValidationError(
            "Notes must be no more than 1000 characters",
            code="NOTES_TOO_LONG",
            context={"length": len(validated_data["notes"])}
        )
    
    return validated_data
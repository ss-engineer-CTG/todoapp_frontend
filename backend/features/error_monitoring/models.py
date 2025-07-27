"""
エラーモニタリング用データモデル
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum
from dataclasses import dataclass

class ErrorSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ErrorCategory(Enum):
    NETWORK = "network"
    DATABASE = "database"
    API = "api"
    VALIDATION = "validation"
    AUTHENTICATION = "authentication"
    AUTHORIZATION = "authorization"
    BUSINESS_LOGIC = "business_logic"
    SYSTEM = "system"
    PERFORMANCE = "performance"
    UNKNOWN = "unknown"

class ErrorStatus(Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    IGNORED = "ignored"

@dataclass
class ErrorReport:
    id: str
    fingerprint: str
    message: str
    category: ErrorCategory
    severity: ErrorSeverity
    status: ErrorStatus
    first_occurrence: datetime
    last_occurrence: datetime
    occurrence_count: int
    affected_users: List[str]
    stack_trace: Optional[str] = None
    context: Optional[Dict[str, Any]] = None
    resolution_notes: Optional[str] = None
    assigned_to: Optional[str] = None

@dataclass
class ErrorOccurrence:
    id: str
    error_report_id: str
    timestamp: datetime
    user_id: Optional[str]
    session_id: Optional[str]
    request_id: Optional[str]
    url: Optional[str]
    user_agent: Optional[str]
    context: Optional[Dict[str, Any]] = None

@dataclass
class ErrorStatistics:
    total_errors: int
    error_rate: float  # errors per minute
    errors_by_category: Dict[ErrorCategory, int]
    errors_by_severity: Dict[ErrorSeverity, int]
    top_errors: List[ErrorReport]
    trend_data: List[Dict[str, Any]]  # time series data
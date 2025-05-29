"""
ID生成ユーティリティ（DRY原則：重複排除）
"""
import time
import uuid
import random
import string
from typing import Optional

def generate_id(prefix: str = "", length: int = 8) -> str:
    """
    ユニークID生成（重複回避）
    """
    timestamp = int(time.time() * 1000)  # ミリ秒タイムスタンプ
    random_part = ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))
    
    if prefix:
        return f"{prefix}{timestamp}_{random_part}"
    else:
        return f"{timestamp}_{random_part}"

def generate_transaction_id() -> str:
    """
    トランザクションID生成（ログ用）
    """
    return f"txn_{int(time.time())}_{str(uuid.uuid4())[:8]}"

def generate_project_id() -> str:
    """プロジェクトID生成"""
    return generate_id("p", 6)

def generate_task_id() -> str:
    """タスクID生成"""
    return generate_id("t", 8)

def is_valid_id(id_value: str, prefix: Optional[str] = None) -> bool:
    """ID形式検証"""
    if not id_value or not isinstance(id_value, str):
        return False
    
    if prefix and not id_value.startswith(prefix):
        return False
    
    # 基本的な形式チェック
    if len(id_value) < 3:
        return False
    
    # 危険な文字のチェック
    dangerous_chars = ['<', '>', '"', "'", '&', ';', '(', ')', '|', '`']
    if any(char in id_value for char in dangerous_chars):
        return False
    
    return True
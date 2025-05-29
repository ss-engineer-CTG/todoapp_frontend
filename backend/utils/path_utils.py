"""
パス操作ユーティリティ（システムプロンプト準拠：専用関数使用）
"""
import os
from pathlib import Path
from typing import Union, List

def join_path(*segments: Union[str, Path]) -> str:
    """
    パス結合専用関数（「+」や「文字列テンプレート」による結合禁止）
    """
    if not segments:
        return ""
    
    # 最初のセグメントをベースとする
    result = Path(segments[0])
    
    # 残りのセグメントを順次結合
    for segment in segments[1:]:
        if segment:  # 空文字列をスキップ
            result = result / segment
    
    return str(result).replace('\\', '/')  # Windows対応

def normalize_path(path: Union[str, Path]) -> str:
    """パス正規化関数"""
    if not path:
        return ""
    
    # Path オブジェクトを使用して正規化
    normalized = Path(path).resolve()
    return str(normalized).replace('\\', '/')

def is_safe_path(path: Union[str, Path], base_path: Union[str, Path] = None) -> bool:
    """パス安全性検証"""
    try:
        path_obj = Path(path).resolve()
        
        # 基準パスが指定されている場合、その範囲内かチェック
        if base_path:
            base_obj = Path(base_path).resolve()
            try:
                path_obj.relative_to(base_obj)
            except ValueError:
                return False
        
        # 相対パス攻撃をチェック
        if '..' in str(path_obj):
            return False
        
        # 危険な文字をチェック
        dangerous_chars = ['<', '>', ':', '"', '|', '?', '*', '\x00']
        if any(char in str(path_obj) for char in dangerous_chars):
            return False
        
        return True
    except (TypeError, ValueError, OSError):
        return False

def get_file_extension(path: Union[str, Path]) -> str:
    """ファイル拡張子取得"""
    return Path(path).suffix.lower()

def ensure_path_exists(path: Union[str, Path], is_file: bool = False) -> Path:
    """パス存在確認・作成"""
    path_obj = Path(path)
    
    if not is_safe_path(path_obj):
        raise ValueError(f"Unsafe path: {path_obj}")
    
    if is_file:
        # ファイルの場合、親ディレクトリを作成
        path_obj.parent.mkdir(parents=True, exist_ok=True)
    else:
        # ディレクトリの場合、そのまま作成
        path_obj.mkdir(parents=True, exist_ok=True)
    
    return path_obj
"""
Core module for the Todo application.
Provides centralized configuration, logging, database, and exception handling.
"""

from .config import config
from .logger import setup_logging, get_logger
from .database import DatabaseManager, init_database
from .exceptions import TodoAppError, handle_exception

__all__ = [
    'config',
    'setup_logging',
    'get_logger', 
    'DatabaseManager',
    'init_database',
    'TodoAppError',
    'handle_exception'
]
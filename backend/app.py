import sqlite3
import os
from datetime import datetime
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# パス設定
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_PATH = os.path.join(BASE_DIR, "todo.db")
SCHEMA_PATH = os.path.join(BASE_DIR, "schema.sql")


def get_db():
    """データベース接続を取得"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.Error as e:
        print(f"Database connection error: {e}")
        raise HTTPException(status_code=500, detail="Database connection error")


def init_database():
    """データベース初期化"""
    try:
        if not os.path.exists(SCHEMA_PATH):
            print(f"Schema file not found: {SCHEMA_PATH}")
            raise FileNotFoundError(f"Schema file not found: {SCHEMA_PATH}")
        
        with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
            schema = f.read()
        
        conn = get_db()
        conn.executescript(schema)
        conn.commit()
        conn.close()
        
        print(f"Database initialized successfully at: {DATABASE_PATH}")
    except Exception as e:
        print(f"Database initialization error: {e}")
        raise


@asynccontextmanager
async def lifespan(app: FastAPI):
    """アプリケーションのライフサイクル管理"""
    # 起動時の処理
    print("Starting application...")
    print(f"Base directory: {BASE_DIR}")
    print(f"Database path: {DATABASE_PATH}")
    print(f"Schema path: {SCHEMA_PATH}")
    
    try:
        init_database()
        print("Application startup completed")
    except Exception as e:
        print(f"Application startup failed: {e}")
        raise
    
    yield
    
    # 終了時の処理
    print("Shutting down application...")


# FastAPIアプリケーションの作成
app = FastAPI(
    title="Hierarchical Todo List API", 
    version="1.0.0",
    lifespan=lifespan
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydanticモデル
class ProjectBase(BaseModel):
    name: str
    color: str
    collapsed: bool = False


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    collapsed: Optional[bool] = None


class Project(ProjectBase):
    id: str
    created_at: datetime
    updated_at: datetime


class TaskBase(BaseModel):
    name: str
    project_id: str
    parent_id: Optional[str] = None
    completed: bool = False
    start_date: datetime
    due_date: datetime
    completion_date: Optional[datetime] = None
    notes: str = ""
    assignee: str = "自分"
    level: int = 0
    collapsed: bool = False


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    name: Optional[str] = None
    project_id: Optional[str] = None
    parent_id: Optional[str] = None
    completed: Optional[bool] = None
    start_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    completion_date: Optional[datetime] = None
    notes: Optional[str] = None
    assignee: Optional[str] = None
    level: Optional[int] = None
    collapsed: Optional[bool] = None


class Task(TaskBase):
    id: str
    created_at: datetime
    updated_at: datetime


class BatchOperation(BaseModel):
    operation: str
    task_ids: List[str]


# ユーティリティ関数
def row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    """sqlite3.Rowを辞書に変換"""
    return dict(row)


def generate_id(prefix: str) -> str:
    """IDを生成"""
    import time
    return f"{prefix}{int(time.time() * 1000)}"


# ルートエンドポイント
@app.get("/")
async def root():
    """ルートエンドポイント"""
    return {"message": "Hierarchical Todo List API", "status": "running"}


# プロジェクト関連API
@app.get("/api/projects", response_model=List[Project])
async def get_projects(db: sqlite3.Connection = Depends(get_db)):
    """プロジェクト一覧取得"""
    try:
        cursor = db.execute("SELECT * FROM projects ORDER BY created_at")
        projects = [row_to_dict(row) for row in cursor.fetchall()]
        db.close()
        print(f"Retrieved {len(projects)} projects")
        return projects
    except Exception as e:
        print(f"Error retrieving projects: {e}")
        db.close()
        raise HTTPException(status_code=500, detail="Failed to retrieve projects")


@app.post("/api/projects", response_model=Project)
async def create_project(project: ProjectCreate, db: sqlite3.Connection = Depends(get_db)):
    """プロジェクト作成"""
    try:
        project_id = generate_id("p")
        now = datetime.now()
        
        db.execute(
            """INSERT INTO projects (id, name, color, collapsed, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (project_id, project.name, project.color, project.collapsed, now, now)
        )
        db.commit()
        
        cursor = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        created_project = row_to_dict(cursor.fetchone())
        db.close()
        
        print(f"Created project: {created_project['name']}")
        return created_project
    except Exception as e:
        print(f"Error creating project: {e}")
        db.close()
        raise HTTPException(status_code=500, detail="Failed to create project")


@app.get("/api/projects/{project_id}", response_model=Project)
async def get_project(project_id: str, db: sqlite3.Connection = Depends(get_db)):
    """プロジェクト取得"""
    try:
        cursor = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        project = cursor.fetchone()
        db.close()
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return row_to_dict(project)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error retrieving project: {e}")
        db.close()
        raise HTTPException(status_code=500, detail="Failed to retrieve project")


@app.put("/api/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, project: ProjectUpdate, db: sqlite3.Connection = Depends(get_db)):
    """プロジェクト更新"""
    try:
        cursor = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        if not cursor.fetchone():
            db.close()
            raise HTTPException(status_code=404, detail="Project not found")
        
        update_fields = []
        values = []
        
        for field, value in project.dict(exclude_unset=True).items():
            update_fields.append(f"{field} = ?")
            values.append(value)
        
        if update_fields:
            update_fields.append("updated_at = ?")
            values.append(datetime.now())
            values.append(project_id)
            
            query = f"UPDATE projects SET {', '.join(update_fields)} WHERE id = ?"
            db.execute(query, values)
            db.commit()
        
        cursor = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        updated_project = row_to_dict(cursor.fetchone())
        db.close()
        
        print(f"Updated project: {updated_project['name']}")
        return updated_project
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating project: {e}")
        db.close()
        raise HTTPException(status_code=500, detail="Failed to update project")


@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: str, db: sqlite3.Connection = Depends(get_db)):
    """プロジェクト削除"""
    try:
        cursor = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        if not cursor.fetchone():
            db.close()
            raise HTTPException(status_code=404, detail="Project not found")
        
        db.execute("DELETE FROM projects WHERE id = ?", (project_id,))
        db.commit()
        db.close()
        
        print(f"Deleted project: {project_id}")
        return {"message": "Project deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting project: {e}")
        db.close()
        raise HTTPException(status_code=500, detail="Failed to delete project")


# タスク関連API
@app.get("/api/tasks", response_model=List[Task])
async def get_tasks(project_id: Optional[str] = None, db: sqlite3.Connection = Depends(get_db)):
    """タスク一覧取得"""
    try:
        if project_id:
            cursor = db.execute(
                "SELECT * FROM tasks WHERE project_id = ? ORDER BY level, created_at",
                (project_id,)
            )
        else:
            cursor = db.execute("SELECT * FROM tasks ORDER BY project_id, level, created_at")
        
        tasks = [row_to_dict(row) for row in cursor.fetchall()]
        db.close()
        
        print(f"Retrieved {len(tasks)} tasks")
        return tasks
    except Exception as e:
        print(f"Error retrieving tasks: {e}")
        db.close()
        raise HTTPException(status_code=500, detail="Failed to retrieve tasks")


@app.post("/api/tasks", response_model=Task)
async def create_task(task: TaskCreate, db: sqlite3.Connection = Depends(get_db)):
    """タスク作成"""
    try:
        task_id = generate_id("t")
        now = datetime.now()
        
        db.execute(
            """INSERT INTO tasks (id, name, project_id, parent_id, completed, start_date, due_date,
                                completion_date, notes, assignee, level, collapsed, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (task_id, task.name, task.project_id, task.parent_id, task.completed,
             task.start_date, task.due_date, task.completion_date, task.notes,
             task.assignee, task.level, task.collapsed, now, now)
        )
        db.commit()
        
        cursor = db.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        created_task = row_to_dict(cursor.fetchone())
        db.close()
        
        print(f"Created task: {created_task['name']}")
        return created_task
    except Exception as e:
        print(f"Error creating task: {e}")
        db.close()
        raise HTTPException(status_code=500, detail="Failed to create task")


@app.get("/api/tasks/{task_id}", response_model=Task)
async def get_task(task_id: str, db: sqlite3.Connection = Depends(get_db)):
    """タスク取得"""
    try:
        cursor = db.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        task = cursor.fetchone()
        db.close()
        
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return row_to_dict(task)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error retrieving task: {e}")
        db.close()
        raise HTTPException(status_code=500, detail="Failed to retrieve task")


@app.put("/api/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, task: TaskUpdate, db: sqlite3.Connection = Depends(get_db)):
    """タスク更新"""
    try:
        cursor = db.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        if not cursor.fetchone():
            db.close()
            raise HTTPException(status_code=404, detail="Task not found")
        
        update_fields = []
        values = []
        
        for field, value in task.dict(exclude_unset=True).items():
            update_fields.append(f"{field} = ?")
            values.append(value)
        
        if update_fields:
            update_fields.append("updated_at = ?")
            values.append(datetime.now())
            values.append(task_id)
            
            query = f"UPDATE tasks SET {', '.join(update_fields)} WHERE id = ?"
            db.execute(query, values)
            db.commit()
        
        cursor = db.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        updated_task = row_to_dict(cursor.fetchone())
        db.close()
        
        print(f"Updated task: {updated_task['name']}")
        return updated_task
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating task: {e}")
        db.close()
        raise HTTPException(status_code=500, detail="Failed to update task")


@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: str, db: sqlite3.Connection = Depends(get_db)):
    """タスク削除"""
    try:
        cursor = db.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        if not cursor.fetchone():
            db.close()
            raise HTTPException(status_code=404, detail="Task not found")
        
        db.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        db.commit()
        db.close()
        
        print(f"Deleted task: {task_id}")
        return {"message": "Task deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting task: {e}")
        db.close()
        raise HTTPException(status_code=500, detail="Failed to delete task")


@app.post("/api/tasks/batch")
async def batch_update_tasks(operation: BatchOperation, db: sqlite3.Connection = Depends(get_db)):
    """複数タスクの一括操作"""
    try:
        if operation.operation == "complete":
            now = datetime.now()
            placeholders = ",".join(["?" for _ in operation.task_ids])
            db.execute(
                f"UPDATE tasks SET completed = ?, completion_date = ?, updated_at = ? WHERE id IN ({placeholders})",
                [True, now, now] + operation.task_ids
            )
        elif operation.operation == "incomplete":
            placeholders = ",".join(["?" for _ in operation.task_ids])
            db.execute(
                f"UPDATE tasks SET completed = ?, completion_date = ?, updated_at = ? WHERE id IN ({placeholders})",
                [False, None, datetime.now()] + operation.task_ids
            )
        elif operation.operation == "delete":
            placeholders = ",".join(["?" for _ in operation.task_ids])
            db.execute(f"DELETE FROM tasks WHERE id IN ({placeholders})", operation.task_ids)
        else:
            db.close()
            raise HTTPException(status_code=400, detail="Invalid operation")
        
        db.commit()
        db.close()
        
        print(f"Batch operation executed: {operation.operation}, targets: {len(operation.task_ids)}")
        return {"message": f"{operation.operation} operation executed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Batch operation error: {e}")
        db.close()
        raise HTTPException(status_code=500, detail="Batch operation failed")


# ヘルスチェック
@app.get("/api/health")
@app.head("/api/health")
async def health_check():
    """ヘルスチェック"""
    return {"status": "healthy", "timestamp": datetime.now()}


if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
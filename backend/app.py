import sqlite3
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="階層型ToDoリストAPI", version="1.0.0")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# データベース設定
DATABASE_PATH = "todo.db"

def get_db():
    """データベース接続を取得"""
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.Error as e:
        logger.error(f"データベース接続エラー: {e}")
        raise HTTPException(status_code=500, detail="データベース接続エラー")

def init_database():
    """データベース初期化"""
    try:
        with open("schema.sql", "r", encoding="utf-8") as f:
            schema = f.read()
        
        conn = get_db()
        conn.executescript(schema)
        conn.commit()
        conn.close()
        
        logger.info("データベースを初期化しました")
    except Exception as e:
        logger.error(f"データベース初期化エラー: {e}")
        raise

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

# プロジェクト関連API
@app.get("/api/projects", response_model=List[Project])
async def get_projects(db: sqlite3.Connection = Depends(get_db)):
    """プロジェクト一覧取得"""
    try:
        cursor = db.execute(
            "SELECT * FROM projects ORDER BY created_at"
        )
        projects = [row_to_dict(row) for row in cursor.fetchall()]
        db.close()
        
        logger.info(f"プロジェクト一覧取得: {len(projects)}件")
        return projects
    except Exception as e:
        logger.error(f"プロジェクト一覧取得エラー: {e}")
        db.close()
        raise HTTPException(status_code=500, detail="プロジェクト取得に失敗しました")

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
        
        # 作成されたプロジェクトを取得
        cursor = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        created_project = row_to_dict(cursor.fetchone())
        db.close()
        
        logger.info(f"プロジェクト作成: {created_project['name']}")
        return created_project
    except Exception as e:
        logger.error(f"プロジェクト作成エラー: {e}")
        db.close()
        raise HTTPException(status_code=500, detail="プロジェクト作成に失敗しました")

@app.get("/api/projects/{project_id}", response_model=Project)
async def get_project(project_id: str, db: sqlite3.Connection = Depends(get_db)):
    """プロジェクト取得"""
    try:
        cursor = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        project = cursor.fetchone()
        db.close()
        
        if not project:
            raise HTTPException(status_code=404, detail="プロジェクトが見つかりません")
        
        return row_to_dict(project)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"プロジェクト取得エラー: {e}")
        db.close()
        raise HTTPException(status_code=500, detail="プロジェクト取得に失敗しました")

@app.put("/api/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, project: ProjectUpdate, db: sqlite3.Connection = Depends(get_db)):
    """プロジェクト更新"""
    try:
        # 存在確認
        cursor = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        if not cursor.fetchone():
            db.close()
            raise HTTPException(status_code=404, detail="プロジェクトが見つかりません")
        
        # 更新フィールドを構築
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
        
        # 更新されたプロジェクトを取得
        cursor = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        updated_project = row_to_dict(cursor.fetchone())
        db.close()
        
        logger.info(f"プロジェクト更新: {updated_project['name']}")
        return updated_project
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"プロジェクト更新エラー: {e}")
        db.close()
        raise HTTPException(status_code=500, detail="プロジェクト更新に失敗しました")

@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: str, db: sqlite3.Connection = Depends(get_db)):
    """プロジェクト削除"""
    try:
        # 存在確認
        cursor = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        if not cursor.fetchone():
            db.close()
            raise HTTPException(status_code=404, detail="プロジェクトが見つかりません")
        
        # プロジェクトを削除（関連タスクも自動削除される）
        db.execute("DELETE FROM projects WHERE id = ?", (project_id,))
        db.commit()
        db.close()
        
        logger.info(f"プロジェクト削除: {project_id}")
        return {"message": "プロジェクトを削除しました"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"プロジェクト削除エラー: {e}")
        db.close()
        raise HTTPException(status_code=500, detail="プロジェクト削除に失敗しました")

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
        
        logger.info(f"タスク一覧取得: {len(tasks)}件")
        return tasks
    except Exception as e:
        logger.error(f"タスク一覧取得エラー: {e}")
        db.close()
        raise HTTPException(status_code=500, detail="タスク取得に失敗しました")

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
        
        # 作成されたタスクを取得
        cursor = db.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        created_task = row_to_dict(cursor.fetchone())
        db.close()
        
        logger.info(f"タスク作成: {created_task['name']}")
        return created_task
    except Exception as e:
        logger.error(f"タスク作成エラー: {e}")
        db.close()
        raise HTTPException(status_code=500, detail="タスク作成に失敗しました")

@app.get("/api/tasks/{task_id}", response_model=Task)
async def get_task(task_id: str, db: sqlite3.Connection = Depends(get_db)):
    """タスク取得"""
    try:
        cursor = db.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        task = cursor.fetchone()
        db.close()
        
        if not task:
            raise HTTPException(status_code=404, detail="タスクが見つかりません")
        
        return row_to_dict(task)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"タスク取得エラー: {e}")
        db.close()
        raise HTTPException(status_code=500, detail="タスク取得に失敗しました")

@app.put("/api/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, task: TaskUpdate, db: sqlite3.Connection = Depends(get_db)):
    """タスク更新"""
    try:
        # 存在確認
        cursor = db.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        if not cursor.fetchone():
            db.close()
            raise HTTPException(status_code=404, detail="タスクが見つかりません")
        
        # 更新フィールドを構築
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
        
        # 更新されたタスクを取得
        cursor = db.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        updated_task = row_to_dict(cursor.fetchone())
        db.close()
        logger.info(f"タスク更新: {updated_task['name']}")
        return updated_task
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"タスク更新エラー: {e}")
        db.close()
        raise HTTPException(status_code=500, detail="タスク更新に失敗しました")

@app.delete("/api/tasks/{task_id}")
async def delete_task(task_id: str, db: sqlite3.Connection = Depends(get_db)):
    """タスク削除"""
    try:
        # 存在確認
        cursor = db.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        if not cursor.fetchone():
            db.close()
            raise HTTPException(status_code=404, detail="タスクが見つかりません")
        
        # タスクを削除（子タスクも自動削除される）
        db.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        db.commit()
        db.close()
        
        logger.info(f"タスク削除: {task_id}")
        return {"message": "タスクを削除しました"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"タスク削除エラー: {e}")
        db.close()
        raise HTTPException(status_code=500, detail="タスク削除に失敗しました")

@app.post("/api/tasks/batch")
async def batch_update_tasks(operation: BatchOperation, db: sqlite3.Connection = Depends(get_db)):
    """複数タスクの一括操作"""
    try:
        if operation.operation == "complete":
            # タスクを完了状態にする
            now = datetime.now()
            placeholders = ",".join(["?" for _ in operation.task_ids])
            db.execute(
                f"UPDATE tasks SET completed = ?, completion_date = ?, updated_at = ? WHERE id IN ({placeholders})",
                [True, now, now] + operation.task_ids
            )
        elif operation.operation == "incomplete":
            # タスクを未完了状態にする
            placeholders = ",".join(["?" for _ in operation.task_ids])
            db.execute(
                f"UPDATE tasks SET completed = ?, completion_date = ?, updated_at = ? WHERE id IN ({placeholders})",
                [False, None, datetime.now()] + operation.task_ids
            )
        elif operation.operation == "delete":
            # タスクを削除
            placeholders = ",".join(["?" for _ in operation.task_ids])
            db.execute(f"DELETE FROM tasks WHERE id IN ({placeholders})", operation.task_ids)
        else:
            db.close()
            raise HTTPException(status_code=400, detail="無効な操作です")
        
        db.commit()
        db.close()
        
        logger.info(f"一括操作実行: {operation.operation}, 対象: {len(operation.task_ids)}件")
        return {"message": f"{operation.operation}操作を実行しました"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"一括操作エラー: {e}")
        db.close()
        raise HTTPException(status_code=500, detail="一括操作に失敗しました")

# ヘルスチェック
@app.get("/api/health")
async def health_check():
    """ヘルスチェック"""
    return {"status": "healthy", "timestamp": datetime.now()}

# アプリケーション起動時の処理
@app.on_event("startup")
async def startup_event():
    """アプリケーション起動時の初期化処理"""
    logger.info("アプリケーションを起動しています...")
    init_database()
    logger.info("アプリケーションの起動が完了しました")

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
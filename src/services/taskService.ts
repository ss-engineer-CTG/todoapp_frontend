import { v4 as uuidv4 } from 'uuid';
import { Task, TaskInput } from '../models/task';

/**
 * タスクデータ操作サービス
 * ローカルストレージを使用してタスクデータを管理
 */
export const taskService = {
  /**
   * すべてのタスクを取得
   */
  getAllTasks(): Task[] {
    try {
      const tasksJson = localStorage.getItem('tasks');
      if (!tasksJson) return [];
      
      const tasks = JSON.parse(tasksJson);
      
      // 日付文字列をDateオブジェクトに変換
      return tasks.map((task: any) => ({
        ...task,
        startDate: new Date(task.startDate),
        endDate: new Date(task.endDate),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined
      }));
    } catch (error) {
      console.error('Error getting tasks from localStorage:', error);
      return [];
    }
  },
  
  /**
   * タスクを保存
   */
  saveTasks(tasks: Task[]): void {
    try {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks to localStorage:', error);
    }
  },
  
  /**
   * タスクを追加
   */
  addTask(taskInput: TaskInput): Task {
    const tasks = this.getAllTasks();
    
    const newTask: Task = {
      id: uuidv4(),
      title: taskInput.title,
      startDate: taskInput.startDate,
      endDate: taskInput.endDate,
      completed: taskInput.completed || false,
      parentId: taskInput.parentId || null,
      noteContent: taskInput.noteContent || '',
      assignee: taskInput.assignee,
      projectId: taskInput.projectId
    };
    
    tasks.push(newTask);
    this.saveTasks(tasks);
    
    return newTask;
  },
  
  /**
   * タスクを更新
   */
  updateTask(updatedTask: Task): Task {
    const tasks = this.getAllTasks();
    const index = tasks.findIndex(task => task.id === updatedTask.id);
    
    if (index !== -1) {
      tasks[index] = updatedTask;
      this.saveTasks(tasks);
    }
    
    return updatedTask;
  },
  
  /**
   * タスクを削除
   */
  deleteTask(taskId: string): void {
    const tasks = this.getAllTasks();
    const filteredTasks = tasks.filter(task => task.id !== taskId);
    
    // 子タスクも削除
    const childTasks = tasks.filter(task => task.parentId === taskId);
    childTasks.forEach(child => {
      this.deleteTask(child.id);
    });
    
    this.saveTasks(filteredTasks);
  },
  
  /**
   * タスク完了状態を切り替え
   */
  toggleTaskCompletion(taskId: string): Task | null {
    const tasks = this.getAllTasks();
    const index = tasks.findIndex(task => task.id === taskId);
    
    if (index !== -1) {
      const task = tasks[index];
      task.completed = !task.completed;
      task.completedAt = task.completed ? new Date() : undefined;
      
      this.saveTasks(tasks);
      return task;
    }
    
    return null;
  },
  
  /**
   * タスクノート更新
   */
  updateTaskNote(taskId: string, noteContent: string): Task | null {
    const tasks = this.getAllTasks();
    const index = tasks.findIndex(task => task.id === taskId);
    
    if (index !== -1) {
      tasks[index].noteContent = noteContent;
      this.saveTasks(tasks);
      return tasks[index];
    }
    
    return null;
  },
  
  /**
   * タスクを検索
   */
  searchTasks(query: string): Task[] {
    const tasks = this.getAllTasks();
    if (!query.trim()) return tasks;
    
    const lowerQuery = query.toLowerCase();
    return tasks.filter(task => 
      task.title.toLowerCase().includes(lowerQuery) ||
      (task.noteContent && task.noteContent.toLowerCase().includes(lowerQuery))
    );
  },
  
  /**
   * 特定の期間のタスクを取得
   */
  getTasksByDateRange(startDate: Date, endDate: Date): Task[] {
    const tasks = this.getAllTasks();
    
    return tasks.filter(task => {
      // タスクの期間が指定期間と重複しているかをチェック
      return (
        (task.startDate >= startDate && task.startDate <= endDate) ||
        (task.endDate >= startDate && task.endDate <= endDate) ||
        (task.startDate <= startDate && task.endDate >= endDate)
      );
    });
  },
  
  /**
   * 親タスクに属する子タスクを取得
   */
  getChildTasks(parentId: string): Task[] {
    const tasks = this.getAllTasks();
    return tasks.filter(task => task.parentId === parentId);
  },
  
  /**
   * タスク階層構造を取得
   */
  getTaskHierarchy(): Task[] {
    const tasks = this.getAllTasks();
    const result: Task[] = [];
    
    // ルートタスク（親を持たないタスク）
    const rootTasks = tasks.filter(task => !task.parentId);
    
    // 再帰的に子タスクを追加する関数
    const addTasksRecursively = (currentTasks: Task[]) => {
      currentTasks.forEach(task => {
        result.push(task);
        const children = this.getChildTasks(task.id);
        addTasksRecursively(children);
      });
    };
    
    addTasksRecursively(rootTasks);
    
    return result;
  }
};

export default taskService;
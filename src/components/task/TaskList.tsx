import React, { useState } from 'react';
import { Task } from '../../models/task';
import { useTaskContext } from '../../contexts/TaskContext';
import TaskItem from './TaskItem';
import TaskForm from './TaskForm';
import TaskNote from './TaskNote';

/**
 * タスク一覧表示コンポーネント
 * タスクの階層構造を表示し、追加・編集・削除などの操作を提供
 */
const TaskList: React.FC = () => {
  const { tasks, getChildTasks, getTaskHierarchy } = useTaskContext();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [noteTask, setNoteTask] = useState<Task | null>(null);
  
  // ルートタスク（親を持たないタスク）の取得
  const rootTasks = tasks.filter(task => !task.parentId);
  
  // タスク階層の再帰的レンダリング
  const renderTaskHierarchy = (taskIds: string[], depth = 0) => {
    return taskIds.map(taskId => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return null;
      
      const childTaskIds = getChildTasks(taskId).map(t => t.id);
      
      return (
        <React.Fragment key={task.id}>
          <TaskItem 
            task={task} 
            depth={depth} 
            onEdit={handleEditTask}
            onNoteOpen={handleOpenNote}
          />
          {childTaskIds.length > 0 && renderTaskHierarchy(childTaskIds, depth + 1)}
        </React.Fragment>
      );
    });
  };
  
  // タスク追加フォームの表示/非表示切り替え
  const handleAddTask = () => {
    setShowAddForm(true);
    setEditingTask(null);
  };
  
  // タスク編集
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowAddForm(false);
  };
  
  // タスクノートを開く
  const handleOpenNote = (task: Task) => {
    setNoteTask(task);
  };
  
  // フォーム送信後の処理
  const handleFormSubmit = () => {
    setShowAddForm(false);
    setEditingTask(null);
  };
  
  // フォームキャンセルの処理
  const handleFormCancel = () => {
    setShowAddForm(false);
    setEditingTask(null);
  };
  
  // タスクノートを閉じる
  const handleCloseNote = () => {
    setNoteTask(null);
  };

  // タスク階層構造の取得
  const taskHierarchy = getTaskHierarchy();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">タスク一覧</h2>
        <button
          onClick={handleAddTask}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded hover:bg-blue-600"
        >
          タスク追加
        </button>
      </div>
      
      {/* タスク追加フォーム */}
      {showAddForm && (
        <TaskForm
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}
      
      {/* タスク編集フォーム */}
      {editingTask && (
        <TaskForm
          task={editingTask}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}
      
      {/* タスク一覧 */}
      <div className="space-y-2">
        {renderTaskHierarchy(taskHierarchy.map(t => t.id))}
      </div>
      
      {/* タスクが一つもない場合 */}
      {tasks.length === 0 && !showAddForm && (
        <div className="text-center py-10 text-gray-500">
          <p>タスクがまだありません。「タスク追加」ボタンから新しいタスクを作成しましょう。</p>
        </div>
      )}
      
      {/* タスクノートモーダル */}
      {noteTask && (
        <TaskNote task={noteTask} onClose={handleCloseNote} />
      )}
    </div>
  );
};

export default TaskList;
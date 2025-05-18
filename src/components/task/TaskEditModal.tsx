import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X } from 'lucide-react';
import { RootState } from '../../store/reducers';
import { createTask, updateTask } from '../../store/slices/tasksSlice';
import { closeTaskEditModal } from '../../store/slices/uiSlice';
import { useFeedback } from '../../hooks/useFeedback';
import { Task, SubTask } from '../../types/task';

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TaskEditModal: React.FC<TaskEditModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { mode, projectId, taskId, subtaskId } = useSelector((state: RootState) => state.ui.taskEditModal);
  const { projects } = useSelector((state: RootState) => state.projects);
  const { showFeedback } = useFeedback();

  const [activeTab, setActiveTab] = useState('basic');
  const [taskName, setTaskName] = useState('');
  const [taskStatus, setTaskStatus] = useState('not-started');
  const [taskStart, setTaskStart] = useState<Date>(new Date());
  const [taskEnd, setTaskEnd] = useState<Date>(new Date());
  const [taskNotes, setTaskNotes] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [parentTaskId, setParentTaskId] = useState<string | null>(null);
  const [isSubtask, setIsSubtask] = useState(false);

  // 編集モードの場合、既存データを読み込む
  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'edit' && projectId) {
      setSelectedProjectId(projectId);
      
      const project = projects.find(p => p.id === projectId);
      if (!project) {
        onClose();
        return;
      }
      
      if (taskId) {
        const task = project.tasks.find(t => t.id === taskId);
        if (!task) {
          onClose();
          return;
        }
        
        if (subtaskId) {
          // サブタスク編集
          const subtask = task.subtasks.find(st => st.id === subtaskId);
          if (!subtask) {
            onClose();
            return;
          }
          
          setTaskName(subtask.name);
          setTaskStatus(subtask.status);
          setTaskStart(new Date(subtask.start));
          setTaskEnd(new Date(subtask.end));
          setTaskNotes(subtask.notes || '');
          setParentTaskId(taskId);
          setIsSubtask(true);
        } else {
          // 親タスク編集
          setTaskName(task.name);
          setTaskStatus(task.status);
          setTaskStart(new Date(task.start));
          setTaskEnd(new Date(task.end));
          setTaskNotes(task.notes || '');
          setParentTaskId(null);
          setIsSubtask(false);
        }
      }
    } else {
      // 新規作成モード
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);
      
      setTaskName('');
      setTaskStatus('not-started');
      setTaskStart(now);
      setTaskEnd(tomorrow);
      setTaskNotes('');
      setSelectedProjectId(projectId || (projects.length > 0 ? projects[0].id : ''));
      setParentTaskId(null);
      setIsSubtask(false);
    }
    
    // 最初のタブを表示
    setActiveTab('basic');
  }, [isOpen, mode, projectId, taskId, subtaskId, projects, onClose]);
  
  // タスク保存処理
  const handleSaveTask = () => {
    // 名前が空でないことを確認
    if (!taskName.trim()) {
      showFeedback('タスク名を入力してください', 'error');
      return;
    }
    
    // 開始日が終了日より後でないことを確認
    if (taskStart > taskEnd) {
      showFeedback('開始日は終了日より前にしてください', 'error');
      return;
    }
    
    const taskData = {
      name: taskName,
      start: taskStart.toISOString(),
      end: taskEnd.toISOString(),
      status: taskStatus,
      notes: taskNotes
    };
    
    if (mode === 'edit') {
      // 既存タスクの更新
      dispatch(updateTask({
        projectId: selectedProjectId,
        taskId: taskId as string,
        subtaskId,
        task: taskData
      }));
      showFeedback(`タスク「${taskName}」を更新しました`, 'success');
    } else {
      // 新規タスク追加
      dispatch(createTask({
        projectId: selectedProjectId,
        parentTaskId,
        task: taskData
      }));
      showFeedback(`新規タスク「${taskName}」を追加しました`, 'success');
    }
    
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {mode === 'create' ? '新規タスク' : 'タスクを編集'}
          </h2>
          <button 
            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
            onClick={onClose}
          >
            <span className="sr-only">閉じる</span>
            <X size={20} />
          </button>
        </div>
        
        {/* タブナビゲーション */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button 
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'basic' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => setActiveTab('basic')}
          >
            基本情報
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'notes' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => setActiveTab('notes')}
          >
            ノート
          </button>
        </div>
        
        <div className="p-4">
          {/* 基本情報タブ */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              {/* プロジェクト選択（新規作成時のみ） */}
              {mode === 'create' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">プロジェクト</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* 親タスク選択（新規作成時のみ） */}
              {mode === 'create' && selectedProjectId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={isSubtask}
                      onChange={(e) => {
                        setIsSubtask(e.target.checked);
                        if (!e.target.checked) setParentTaskId(null);
                      }}
                      className="mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 dark:border-gray-600"
                    />
                    サブタスクとして作成
                  </label>
                  
                  {isSubtask && (
                    <select
                      value={parentTaskId || ''}
                      onChange={(e) => setParentTaskId(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    >
                      <option value="">-- 親タスクを選択 --</option>
                      {projects.find(p => p.id === selectedProjectId)?.tasks.map(task => (
                        <option key={task.id} value={task.id}>{task.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">タスク名</label>
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">開始日</label>
                  <input
                    type="date"
                    value={taskStart.toISOString().split('T')[0]}
                    onChange={(e) => setTaskStart(new Date(e.target.value))}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">終了日</label>
                  <input
                    type="date"
                    value={taskEnd.toISOString().split('T')[0]}
                    onChange={(e) => setTaskEnd(new Date(e.target.value))}
                    className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ステータス</label>
                <select
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="not-started">未開始</option>
                  <option value="in-progress">進行中</option>
                  <option value="completed">完了</option>
                  <option value="overdue">遅延</option>
                </select>
              </div>
            </div>
          )}
          
          {/* ノートタブ */}
          {activeTab === 'notes' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">タスクノート</label>
              <textarea
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-40"
                placeholder="タスクに関するメモや詳細情報を入力してください..."
              />
            </div>
          )}
        </div>
        
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-right flex justify-end space-x-2 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
            onClick={onClose}
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSaveTask}
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskEditModal;
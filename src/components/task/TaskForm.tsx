import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Task } from '../../models/task';
import { useTaskContext } from '../../contexts/TaskContext';

interface TaskFormProps {
  task?: Task; // 編集時は既存タスクを受け取る
  parentId?: string | null; // 親タスクID (子タスク作成時)
  onSubmit?: () => void; // フォーム送信後のコールバック
  onCancel?: () => void; // キャンセル時のコールバック
}

/**
 * タスク追加・編集フォームコンポーネント
 * タスクの作成と更新の両方に対応
 */
const TaskForm: React.FC<TaskFormProps> = ({ task, parentId = null, onSubmit, onCancel }) => {
  const { addTask, updateTask } = useTaskContext();
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  // フォームの状態管理
  const [title, setTitle] = useState(task?.title || '');
  const [startDate, setStartDate] = useState(task?.startDate || new Date());
  const [endDate, setEndDate] = useState(task?.endDate || new Date());
  const [showCalendar, setShowCalendar] = useState<'start' | 'end' | null>(null);
  
  // 初回レンダリング時にタイトル入力欄にフォーカス
  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, []);

  // フォーム送信処理
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      return; // タイトルが空の場合は送信しない
    }
    
    // 開始日が終了日より後の場合、終了日を開始日に合わせる
    const validEndDate = startDate > endDate ? startDate : endDate;
    
    if (task) {
      // 既存タスクの更新
      updateTask({
        ...task,
        title,
        startDate,
        endDate: validEndDate,
      });
    } else {
      // 新規タスクの追加
      addTask({
        title,
        startDate,
        endDate: validEndDate,
        completed: false,
        parentId,
      });
    }
    
    // コールバック実行
    onSubmit?.();
  };

  // キーボード操作のハンドラー
  const handleKeyDown = (e: React.KeyboardEvent, field: 'title' | 'startDate' | 'endDate') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (field === 'title') {
        // タイトル入力からEnterで開始日入力へ
        setShowCalendar('start');
      } else if (field === 'startDate') {
        // 開始日入力からEnterで終了日入力へ
        setShowCalendar('end');
      } else if (field === 'endDate') {
        // 終了日入力からEnterでフォーム送信
        handleSubmit(e as unknown as React.FormEvent);
      }
    } else if (e.key === 'Escape') {
      // Escapeでカレンダーを閉じる、またはフォームをキャンセル
      if (showCalendar) {
        setShowCalendar(null);
      } else {
        onCancel?.();
      }
    }
  };

  // シンプルなカレンダー表示（実際のアプリケーションではより洗練されたカレンダーコンポーネントを使用する）
  const renderCalendar = () => {
    // このサンプルでは簡易的なカレンダーとして日付選択フィールドを表示
    return (
      <div className="calendar-wrapper p-2 bg-white shadow-lg rounded border">
        <input 
          type="date" 
          className="w-full p-2 border rounded"
          value={format(showCalendar === 'start' ? startDate : endDate, 'yyyy-MM-dd')}
          onChange={(e) => {
            const date = new Date(e.target.value);
            if (showCalendar === 'start') {
              setStartDate(date);
            } else {
              setEndDate(date);
            }
          }}
          onKeyDown={(e) => handleKeyDown(e, showCalendar === 'start' ? 'startDate' : 'endDate')}
          autoFocus
        />
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded shadow">
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          タスク名
        </label>
        <input
          ref={titleInputRef}
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, 'title')}
          className="w-full p-2 border rounded"
          placeholder="タスク名を入力..."
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
            開始日
          </label>
          <div className="relative">
            <input
              id="startDate"
              type="text"
              value={format(startDate, 'yyyy/MM/dd')}
              onClick={() => setShowCalendar('start')}
              className="w-full p-2 border rounded cursor-pointer bg-gray-50"
              readOnly
            />
            {showCalendar === 'start' && renderCalendar()}
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
            終了日
          </label>
          <div className="relative">
            <input
              id="endDate"
              type="text"
              value={format(endDate, 'yyyy/MM/dd')}
              onClick={() => setShowCalendar('end')}
              className="w-full p-2 border rounded cursor-pointer bg-gray-50"
              readOnly
            />
            {showCalendar === 'end' && renderCalendar()}
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
        >
          {task ? '更新' : '追加'}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
import React, { useState, useEffect, useCallback } from 'react';
import { addDays, differenceInDays, isSameDay } from 'date-fns';
import { useTaskContext } from '../../contexts/TaskContext';
import { useTimelineContext } from '../../contexts/TimelineContext';
import TimelineHeader from './TimelineHeader';
import TimelineDayHeader from './TimelineDayHeader';
import TimelineItemList from './TimelineItemList';
import TaskForm from '../task/TaskForm';
import TaskNote from '../task/TaskNote';
import { Task } from '../../models/task';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

interface TimelineViewProps {
  className?: string;
}

/**
 * タイムラインビューのルートコンポーネント
 * タイムラインの全体的な構造と状態管理を提供
 */
const TimelineView: React.FC<TimelineViewProps> = ({ className = '' }) => {
  // コンテキストから状態と関数を取得
  const { tasks, toggleTaskCompletion, deleteTask } = useTaskContext();
  const { 
    viewMode, 
    startDate, 
    endDate, 
    zoomLevel,
    showCompletedTasks,
    setStartDate,
    setEndDate
  } = useTimelineContext();
  
  // 内部状態
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [noteTask, setNoteTask] = useState<Task | null>(null);
  
  // 表示するタスクのフィルタリング
  const filteredTasks = tasks.filter(task => {
    // 完了タスクの表示/非表示
    if (!showCompletedTasks && task.completed) {
      return false;
    }
    
    return true;
  });
  
  // タスク選択
  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(prev => prev === taskId ? null : taskId);
  };
  
  // タスク編集の開始
  const handleEditTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setEditingTask(task);
    }
  };
  
  // タスク編集の終了
  const handleEditDone = () => {
    setEditingTask(null);
  };
  
  // タスクノートを開く
  const handleOpenNote = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setNoteTask(task);
    }
  };
  
  // タスクノートを閉じる
  const handleCloseNote = () => {
    setNoteTask(null);
  };
  
  // タスク完了状態のトグル
  const handleToggleTaskCompletion = (taskId: string) => {
    toggleTaskCompletion(taskId);
  };
  
  // タスク削除
  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('このタスクを削除してもよろしいですか？')) {
      deleteTask(taskId);
      if (selectedTaskId === taskId) {
        setSelectedTaskId(null);
      }
    }
  };
  
  // タスクドラッグ開始
  const handleTaskDragStart = (args: { taskId: string, type: 'start' | 'end' | 'move' }) => {
    setDraggingTaskId(args.taskId);
  };
  
  // タスクドラッグ終了
  const handleTaskDragEnd = () => {
    setDraggingTaskId(null);
  };
  
  // 1日あたりの幅を計算
  const calculateDayWidth = () => {
    const baseWidth = viewMode === 'day' ? 50 : viewMode === 'week' ? 30 : 20;
    return baseWidth * (zoomLevel / 100);
  };
  
  // 選択されたタスクに対するキーボード操作
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!selectedTaskId) return;
    
    // スペースキーでタスク完了状態の切り替え
    if (e.code === 'Space') {
      e.preventDefault();
      handleToggleTaskCompletion(selectedTaskId);
    }
    
    // Deleteキーでタスク削除
    if (e.code === 'Delete') {
      e.preventDefault();
      handleDeleteTask(selectedTaskId);
    }
    
    // Ctrl+Nでノート表示
    if (e.ctrlKey && e.code === 'KeyN') {
      e.preventDefault();
      handleOpenNote(selectedTaskId);
    }
    
    // Enterキーでタスク編集
    if (e.code === 'Enter') {
      e.preventDefault();
      handleEditTask(selectedTaskId);
    }
  }, [selectedTaskId]);
  
  // グローバルキーボードショートカットの設定
  useKeyboardShortcuts({
    'Space': () => {
      if (selectedTaskId) handleToggleTaskCompletion(selectedTaskId);
    },
    'Delete': () => {
      if (selectedTaskId) handleDeleteTask(selectedTaskId);
    },
    'Ctrl+N': () => {
      if (selectedTaskId) handleOpenNote(selectedTaskId);
    },
    'Enter': () => {
      if (selectedTaskId) handleEditTask(selectedTaskId);
    }
  }, [selectedTaskId]);
  
  // タイムラインの日付範囲を今日を含むように調整
  useEffect(() => {
    const today = new Date();
    const visibleDays = differenceInDays(endDate, startDate) + 1;
    
    // 今日が表示範囲に含まれていない場合、今日を中心に表示範囲を調整
    if (today < startDate || today > endDate) {
      const newStartDate = addDays(today, -Math.floor(visibleDays / 2));
      setStartDate(newStartDate);
      setEndDate(addDays(newStartDate, visibleDays - 1));
    }
  }, []);

  // HTMLからのキーイベント取得（フォーカスに関係なく動作させる）
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // 現在の日付を取得
  const today = new Date();
  
  // 今日が表示範囲内にあるかチェック
  const isTodayVisible = today >= startDate && today <= endDate;

  return (
    <div className={`timeline-view overflow-hidden flex flex-col border rounded bg-white ${className}`}>
      <TimelineHeader />
      
      <div className="timeline-content flex-1 overflow-auto">
        <TimelineDayHeader
          startDate={startDate}
          endDate={endDate}
          dayWidth={calculateDayWidth()}
          todayIndicator
          highlightWeekends
        />
        
        <TimelineItemList
          tasks={filteredTasks}
          startDate={startDate}
          dayWidth={calculateDayWidth()}
          onTaskSelect={handleTaskSelect}
          onTaskDragStart={handleTaskDragStart}
          onTaskDragEnd={handleTaskDragEnd}
          selectedTaskId={selectedTaskId}
          draggingTaskId={draggingTaskId}
          onEdit={handleEditTask}
          onNote={handleOpenNote}
          onToggleCompletion={handleToggleTaskCompletion}
          onDelete={handleDeleteTask}
        />
        
        {/* 今日が表示範囲内にある場合、今日の位置にインジケータを表示 */}
        {isTodayVisible && (
          <div
            className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
            style={{
              left: `${differenceInDays(today, startDate) * calculateDayWidth() + (TimelineItemList.LABEL_WIDTH || 200)}px`,
              pointerEvents: 'none'
            }}
          />
        )}
      </div>
      
      {/* タスク編集モーダル */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-4">
              <h3 className="text-lg font-medium mb-4">タスク編集</h3>
              <TaskForm
                task={editingTask}
                onSubmit={handleEditDone}
                onCancel={handleEditDone}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* タスクノートモーダル */}
      {noteTask && (
        <TaskNote task={noteTask} onClose={handleCloseNote} />
      )}
    </div>
  );
};

export default TimelineView;
import React, { useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import TimelineHeader from './TimelineHeader';
import TimelineDayHeader from './TimelineDayHeader';
import TimelineItemList from './TimelineItemList';
import TaskEditModal from '../task/TaskEditModal';
import QuickAddForm from '../task/QuickAddForm';
import TaskDetailPopover from './TaskDetailPopover';
import BatchOperationPanel from './BatchOperationPanel';
import TaskList from '../task/TaskList';
import { RootState } from '../../store/reducers';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { resetHoverInfo, setTimelineEnd, setTimelineStart } from '../../store/slices/timelineSlice';
import { closeDeleteConfirmation, closeTaskEditModal, setQuickAddActive } from '../../store/slices/uiSlice';
import ConfirmDialog from '../common/ConfirmDialog';
import { deleteTask, deleteMultipleTasks } from '../../store/slices/tasksSlice';

const TimelineView: React.FC = () => {
  const dispatch = useDispatch();
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineContentRef = useRef<HTMLDivElement>(null);
  
  // 状態を取得
  const { 
    timelineStart, 
    timelineEnd, 
    timelineScale, 
    zoomLevel, 
    hoverInfo, 
    today 
  } = useSelector((state: RootState) => state.timeline);
  
  const { 
    taskEditModal, 
    quickAddActive, 
    selectedTasks, 
    showBatchPanel, 
    deleteConfirmation 
  } = useSelector((state: RootState) => state.ui);
  
  // キーボードナビゲーションの設定
  useKeyboardNavigation();
  
  // 今日の位置までスクロール
  useEffect(() => {
    if (timelineContentRef.current) {
      // タイムライン上の今日の位置を計算
      const dayWidth = 34 * (zoomLevel / 100);
      const timelineStartTime = timelineStart.getTime();
      const todayTime = today.getTime();
      const diffDays = Math.floor((todayTime - timelineStartTime) / (1000 * 60 * 60 * 24));
      const todayPosition = diffDays * dayWidth;
      
      // 初期スクロール位置は今日の日付が見えるように調整
      timelineContentRef.current.scrollLeft = Math.max(0, todayPosition - timelineContentRef.current.clientWidth / 2);
    }
  }, [timelineStart, today, zoomLevel]);
  
  // タスク削除確認ダイアログでの削除処理
  const handleDeleteConfirm = () => {
    const { projectId, taskId, subtaskId, batchMode } = deleteConfirmation;
    
    if (batchMode) {
      // 複数タスク削除
      dispatch(deleteMultipleTasks(selectedTasks));
    } else {
      // 単一タスク削除
      dispatch(deleteTask({ projectId, taskId, subtaskId }));
    }
    
    // ダイアログを閉じる
    dispatch(closeDeleteConfirmation());
  };
  
  return (
    <div className="flex flex-col h-full overflow-hidden" data-testid="timeline-view">
      {/* タイムラインコントロールヘッダー */}
      <TimelineHeader />
      
      {/* タイムラインビュー全体 */}
      <div className="flex-1 overflow-auto" ref={timelineRef}>
        <div className="flex min-h-full">
          {/* プロジェクト・タスク一覧 */}
          <TaskList />
          
          {/* タイムライングリッド */}
          <div 
            className="flex-1 relative overflow-auto"
            ref={timelineContentRef}
            onMouseLeave={() => dispatch(resetHoverInfo())}
          >
            {/* タイムラインヘッダー（日付） */}
            <TimelineDayHeader />
            
            {/* タスクのタイムライン表示 */}
            <TimelineItemList />
            
            {/* 今日の日付線 */}
            <TodayIndicator />
          </div>
        </div>
      </div>
      
      {/* タスク詳細ポップアップ */}
      <TaskDetailPopover info={hoverInfo} />
      
      {/* タスク編集モーダル */}
      <TaskEditModal
        isOpen={taskEditModal.isOpen}
        onClose={() => dispatch(closeTaskEditModal())}
      />
      
      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        isOpen={deleteConfirmation.isOpen}
        title="削除の確認"
        message={
          deleteConfirmation.batchMode 
            ? `${selectedTasks.length}個のタスクを削除してもよろしいですか？この操作は取り消せません。` 
            : `このタスクを削除してもよろしいですか？この操作は取り消せません。`
        }
        confirmText="削除"
        confirmVariant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => dispatch(closeDeleteConfirmation())}
      />
      
      {/* クイック追加フォーム */}
      {quickAddActive && <QuickAddForm />}
      
      {/* 一括操作パネル */}
      {showBatchPanel && selectedTasks.length > 0 && <BatchOperationPanel />}
    </div>
  );
};

// 今日の日付を示すインジケーター
const TodayIndicator: React.FC = () => {
  const { timelineStart, today, zoomLevel } = useSelector((state: RootState) => state.timeline);
  
  // 今日の位置を計算
  const calculateTodayPosition = () => {
    const dayWidth = 34 * (zoomLevel / 100);
    const timelineStartTime = timelineStart.getTime();
    const todayTime = today.getTime();
    const diffDays = Math.floor((todayTime - timelineStartTime) / (1000 * 60 * 60 * 24));
    return diffDays * dayWidth;
  };
  
  const todayPosition = calculateTodayPosition();
  
  return (
    <div 
      className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
      style={{ left: `${todayPosition}px` }}
    ></div>
  );
};

export default TimelineView;
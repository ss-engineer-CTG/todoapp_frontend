import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import TimelineHeader from './TimelineHeader';
import TimelineDayHeader from './TimelineDayHeader';
import TimelineItemList from './TimelineItemList';
import TaskEditModal from '../task/TaskEditModal';
import TaskDetailPopover from './TaskDetailPopover';
import BatchOperationPanel from './BatchOperationPanel';
import TaskList from '../task/TaskList';
import { RootState } from '../../store/reducers';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { resetHoverInfo } from '../../store/slices/timelineSlice';
import { closeDeleteConfirmation, closeTaskEditModal } from '../../store/slices/uiSlice';
import { deleteTask, deleteMultipleTasks } from '../../store/slices/tasksSlice';
import ConfirmDialog from '../common/ConfirmDialog';

// 共通で使用するタイムライングリッドのコンテキスト
export const TimelineGridContext = React.createContext<{
  gridDates: Date[];
  dayWidth: number;
  scaleFactor: number;
}>({
  gridDates: [],
  dayWidth: 34,
  scaleFactor: 1
});

const TimelineView: React.FC = () => {
  const dispatch = useDispatch();
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineContentRef = useRef<HTMLDivElement>(null);
  
  // 状態を取得
  const { 
    today,
    timelineStart,
    timelineEnd,
    timelineScale,
    zoomLevel,
    hoverInfo
  } = useSelector((state: RootState) => state.timeline);
  
  const { 
    taskEditModal, 
    selectedTasks, 
    showBatchPanel, 
    deleteConfirmation 
  } = useSelector((state: RootState) => state.ui);

  // タイムライングリッド用のデータを作成
  const [gridContext, setGridContext] = useState({
    gridDates: [] as Date[],
    dayWidth: 34 * (zoomLevel / 100),
    scaleFactor: getScaleFactor(timelineScale)
  });
  
  // スケールファクターを取得
  function getScaleFactor(scale: 'day' | 'week' | 'month'): number {
    if (scale === 'day') return 1;
    if (scale === 'week') return 7;
    if (scale === 'month') {
      const date = new Date(timelineStart);
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    }
    return 1;
  }

  // タイムラインの日付を生成
  useEffect(() => {
    const generateTimelineDates = () => {
      const dates = [];
      let currentDate = new Date(timelineStart);
      
      if (timelineScale === 'day') {
        // 日単位
        const timelineDays = Math.ceil(
          (new Date(timelineEnd).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        for (let i = 0; i <= timelineDays; i++) {
          dates.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else if (timelineScale === 'week') {
        // 週単位
        while (currentDate <= new Date(timelineEnd)) {
          dates.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 7);
        }
      } else if (timelineScale === 'month') {
        // 月単位
        while (currentDate <= new Date(timelineEnd)) {
          dates.push(new Date(currentDate));
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
      }
      
      return dates;
    };

    const dayWidth = 34 * (zoomLevel / 100);
    const scaleFactor = getScaleFactor(timelineScale);
    const gridDates = generateTimelineDates();
    
    setGridContext({
      gridDates,
      dayWidth,
      scaleFactor
    });
    
  }, [timelineStart, timelineEnd, timelineScale, zoomLevel]);
  
  // キーボードナビゲーションの設定
  useKeyboardNavigation();
  
  // 今日の位置までスクロール
  useEffect(() => {
    if (timelineContentRef.current && gridContext.gridDates.length > 0) {
      // タイムライン上の今日の位置を計算
      const dayWidth = gridContext.dayWidth;
      const timelineStartTime = new Date(timelineStart).getTime();
      const todayTime = today.getTime();
      const diffDays = Math.floor((todayTime - timelineStartTime) / (1000 * 60 * 60 * 24));
      const todayPosition = diffDays * dayWidth;
      
      // 初期スクロール位置は今日の日付が見えるように調整
      timelineContentRef.current.scrollLeft = Math.max(0, todayPosition - timelineContentRef.current.clientWidth / 2);
    }
  }, [timelineStart, today, gridContext]);
  
  // タスク削除確認ダイアログでの削除処理
  const handleDeleteConfirm = () => {
    const { projectId, taskId, subtaskId, batchMode } = deleteConfirmation;
    
    if (batchMode) {
      // 複数タスク削除
      dispatch(deleteMultipleTasks(selectedTasks));
    } else if (projectId && taskId) {
      // 単一タスク削除
      dispatch(deleteTask({ projectId, taskId, subtaskId }));
    }
    
    // ダイアログを閉じる
    dispatch(closeDeleteConfirmation());
  };
  
  return (
    <TimelineGridContext.Provider value={gridContext}>
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
              className="flex-1 relative overflow-auto timeline-content"
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
        {hoverInfo && <TaskDetailPopover info={hoverInfo} />}
        
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
        
        {/* 一括操作パネル */}
        {showBatchPanel && selectedTasks.length > 0 && <BatchOperationPanel />}
      </div>
    </TimelineGridContext.Provider>
  );
};

// 今日の日付を示すインジケーター
const TodayIndicator: React.FC = () => {
  const { timelineStart, today } = useSelector((state: RootState) => state.timeline);
  const { dayWidth } = React.useContext(TimelineGridContext);
  
  // 今日の位置を計算
  const calculateTodayPosition = () => {
    const timelineStartTime = new Date(timelineStart).getTime();
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
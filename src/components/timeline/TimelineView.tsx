import React, { useRef, useEffect, useState, createContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import TimelineHeader from './TimelineHeader';
import TimelineDayHeader from './TimelineDayHeader';
import TimelineItemList from './TimelineItemList';
import TaskEditModal from '../task/TaskEditModal';
import TaskDetailPopover from './TaskDetailPopover';
import BatchOperationPanel from './BatchOperationPanel';
import TaskList from '../task/TaskList';
import { RootState } from '../../store/reducers';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { updateVisibleDateRange } from '../../store/slices/timelineSlice';
import { closeDeleteConfirmation, closeTaskEditModal } from '../../store/slices/uiSlice';
import { deleteTask, deleteMultipleTasks } from '../../store/slices/tasksSlice';
import ConfirmDialog from '../common/ConfirmDialog';
import { addDays } from '../../utils/dateUtils';

// 共通で使用するタイムライングリッドのコンテキスト
// totalGridWidthプロパティを追加
export const TimelineGridContext = createContext<{
  visibleDates: Date[];
  dayWidth: number;
  getDatePosition: (date: Date) => number;
  totalGridWidth: number; // タイムライン全体の幅を追加
}>({
  visibleDates: [],
  dayWidth: 34,
  getDatePosition: () => 0,
  totalGridWidth: 0
});

const TimelineView: React.FC = () => {
  const dispatch = useDispatch();
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // 状態を取得
  const { 
    today,
    timelineStart,
    timelineEnd,
    zoomLevel,
    hoverInfo
  } = useSelector((state: RootState) => state.timeline);
  
  const { 
    taskEditModal, 
    selectedTasks, 
    showBatchPanel, 
    deleteConfirmation 
  } = useSelector((state: RootState) => state.ui);

  // 表示中の日付範囲を管理
  const [visibleDateRange, setVisibleDateRange] = useState({
    start: new Date(timelineStart),
    end: new Date(timelineEnd)
  });

  // 初期化フラグを追加（スクロールポジションのリセット防止用）
  const [initialized, setInitialized] = useState(false);

  // 一度に表示する日数
  const VISIBLE_DAYS_BUFFER = 90;
  
  // 表示中の日付一覧
  const [visibleDates, setVisibleDates] = useState<Date[]>([]);
  
  // 日付のポジションを計算する関数（スクロール位置に応じて調整）
  const getDatePosition = (date: Date): number => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const startDate = new Date(visibleDateRange.start);
    startDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.round((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays * dayWidth;
  };

  // 現在の日付ズームレベルに基づく日付幅
  const dayWidth = 34 * (zoomLevel / 100);

  // タイムライン全体の幅を計算
  const totalGridWidth = visibleDates.length * dayWidth;

  // スクロールイベントハンドラー
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollLeft, scrollWidth, clientWidth } = e.currentTarget;
    const scrollEnd = scrollWidth - clientWidth;
    
    // スクロール位置が端に近づいたら日付範囲を拡張
    if (scrollLeft < 100) {
      // 左端に近づいた場合、過去の日付を追加
      const newStart = addDays(visibleDateRange.start, -VISIBLE_DAYS_BUFFER);
      setVisibleDateRange(prev => ({
        ...prev,
        start: newStart
      }));
    } else if (scrollEnd - scrollLeft < 100) {
      // 右端に近づいた場合、未来の日付を追加
      const newEnd = addDays(visibleDateRange.end, VISIBLE_DAYS_BUFFER);
      setVisibleDateRange(prev => ({
        ...prev,
        end: newEnd
      }));
    }
    
    // 可視範囲をReduxストアに更新
    const visibleStartDay = Math.floor(scrollLeft / dayWidth);
    const visibleEndDay = Math.ceil((scrollLeft + clientWidth) / dayWidth);
    
    const visibleStartDate = addDays(visibleDateRange.start, visibleStartDay);
    const visibleEndDate = addDays(visibleDateRange.start, visibleEndDay);
    
    dispatch(updateVisibleDateRange({
      start: visibleStartDate,
      end: visibleEndDate
    }));
  };

  // 可視日付を生成
  useEffect(() => {
    const start = new Date(visibleDateRange.start);
    const end = new Date(visibleDateRange.end);
    const dates = [];

    let currentDate = new Date(start);
    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    setVisibleDates(dates);
  }, [visibleDateRange, zoomLevel]);

  // 初期化時に1年前から1年後の日付範囲を設定
  useEffect(() => {
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const oneYearLater = new Date(today);
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    
    setVisibleDateRange({
      start: oneYearAgo,
      end: oneYearLater
    });
  }, [today]);
  
  // 今日の位置までスクロール（初回のみ）
  useEffect(() => {
    if (timelineRef.current && visibleDates.length > 0 && !initialized) {
      // タイムライン上の今日の位置を計算
      const todayPosition = getDatePosition(today);
      
      // 初期スクロール位置は今日の日付が見えるように調整
      timelineRef.current.scrollLeft = Math.max(0, todayPosition - timelineRef.current.clientWidth / 2);
      
      // 初期化完了フラグをセット
      setInitialized(true);
    }
  }, [visibleDates, today, getDatePosition, initialized]);
  
  // キーボードナビゲーションの設定
  useKeyboardNavigation();
  
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
  
  // 今日の日付を示すインジケーター
  const TodayIndicator = () => {
    const todayPosition = getDatePosition(today);
    
    return (
      <div 
        className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
        style={{ left: `${todayPosition}px` }}
      ></div>
    );
  };
  
  return (
    <TimelineGridContext.Provider value={{
      visibleDates,
      dayWidth,
      getDatePosition,
      totalGridWidth
    }}>
      <div className="flex flex-col h-full overflow-hidden" data-testid="timeline-view">
        {/* タイムラインコントロールヘッダー */}
        <TimelineHeader />
        
        {/* タイムラインビュー全体 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 左側のプロジェクト・タスク一覧 */}
          <TaskList />
          
          {/* 右側のタイムライングリッド */}
          <div 
            className="flex-1 relative overflow-auto timeline-content"
            ref={timelineRef}
            onScroll={handleScroll}
          >
            {/* 日付ヘッダー */}
            <TimelineDayHeader />
            
            {/* タスクのタイムライン表示 */}
            <TimelineItemList />
            
            {/* 今日の日付線 */}
            <TodayIndicator />
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

export default TimelineView;
import React, { useRef, useEffect, useState, createContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import TimelineHeader from './TimelineHeader';
import TaskEditModal from '../task/TaskEditModal';
import TaskDetailPopover from './TaskDetailPopover';
import BatchOperationPanel from './BatchOperationPanel';
import TaskList from '../task/TaskList';
import ProjectLabelColumn from './ProjectLabelColumn';
import TimelineContent from './TimelineContent';
import { RootState } from '../../store/reducers';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { resetHoverInfo, updateVisibleDateRange } from '../../store/slices/timelineSlice';
import { closeDeleteConfirmation, closeTaskEditModal } from '../../store/slices/uiSlice';
import { deleteTask, deleteMultipleTasks } from '../../store/slices/tasksSlice';
import ConfirmDialog from '../common/ConfirmDialog';
import { addDays } from '../../utils/dateUtils';

// 共通で使用するタイムライングリッドのコンテキスト
export const TimelineGridContext = createContext<{
  visibleDates: Date[];
  dayWidth: number;
  getDatePosition: (date: Date) => number;
}>({
  visibleDates: [],
  dayWidth: 34,
  getDatePosition: () => 0
});

const TimelineView: React.FC = () => {
  const dispatch = useDispatch();
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineContentRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  
  // 状態を取得
  const { 
    today,
    timelineStart,
    timelineEnd,
    zoomLevel,
    hoverInfo
  } = useSelector((state: RootState) => state.timeline);
  
  const {
    projects
  } = useSelector((state: RootState) => state.projects);
  
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

  // プロジェクト展開時の処理
  const handleProjectToggle = () => {
    // プロジェクト展開時に必要な処理があれば実装
  };

  // スクロール同期処理
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);
    
    // 横スクロールのロジックも維持
    const { scrollLeft, scrollWidth, clientWidth } = target;
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
  
  return (
    <TimelineGridContext.Provider value={{
      visibleDates,
      dayWidth,
      getDatePosition
    }}>
      <div className="flex flex-col h-full overflow-hidden" data-testid="timeline-view">
        {/* タイムラインコントロールヘッダー */}
        <TimelineHeader />
        
        {/* タイムラインビュー全体 */}
        <div className="flex-1 overflow-auto" ref={timelineRef}>
          <div className="flex min-h-full">
            {/* プロジェクト・タスク一覧 */}
            <TaskList />
            
            {/* タイムライングリッド - 新しい構造 */}
            <div className="flex-1 flex overflow-hidden">
              {/* 固定プロジェクト名カラム */}
              <ProjectLabelColumn 
                projects={projects} 
                scrollTop={scrollTop}
                onProjectToggle={handleProjectToggle}
                containerRef={timelineRef}
              />
              
              {/* スクロール可能なタイムラインコンテンツ */}
              <TimelineContent
                onScroll={handleScroll}
                contentRef={timelineContentRef}
              />
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

export default TimelineView;
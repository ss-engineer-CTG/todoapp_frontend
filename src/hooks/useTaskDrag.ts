import { useCallback, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/reducers';
import { 
  startDrag,
  updateDrag,
  endDrag
} from '../store/slices/timelineSlice';
import { updateTaskDates } from '../store/slices/tasksSlice';
import { useFeedback } from './useFeedback';

export const useTaskDrag = () => {
  const dispatch = useDispatch();
  const { showFeedback } = useFeedback();
  const { dragInfo, zoomLevel } = useSelector((state: RootState) => state.timeline);
  const dragRef = useRef<HTMLDivElement>(null);
  
  // ドラッグの開始
  const handleDragStart = useCallback((
    projectId: string, 
    taskId: string, 
    subtaskId: string | null, 
    type: 'move' | 'resize-start' | 'resize-end',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    e.preventDefault();
    
    // タスクデータの取得
    const { projects } = dispatch(startDrag({
      projectId,
      taskId,
      subtaskId,
      type,
      initialX: e.clientX,
      startX: e.clientX,
      taskStart: null, // タスクの開始日はstoreで取得
      taskEnd: null,   // タスクの終了日はstoreで取得
      daysDelta: 0
    })) as any; // Redux Toolkitのtypingの問題を回避
    
    // グローバルイベントハンドラを追加
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    
    // カーソルスタイルを変更
    document.body.style.cursor = type === 'move' ? 'grabbing' : 'ew-resize';
    
    return projects;
  }, [dispatch]);
  
  // ドラッグ中の動き
  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!dragInfo) return;
    
    // スムーズなドラッグのためにrequestAnimationFrameを使用
    requestAnimationFrame(() => {
      // ドラッグ距離からの日数変化を計算
      const dayWidth = 34 * (zoomLevel / 100);
      const deltaX = e.clientX - dragInfo.initialX;
      const daysDelta = Math.round(deltaX / dayWidth);
      
      if (daysDelta !== dragInfo.daysDelta) {
        dispatch(updateDrag({
          currentX: e.clientX,
          daysDelta
        }));
      }
      
      // タイムラインの自動スクロール
      const timelineContent = document.querySelector('.timeline-content') as HTMLElement;
      if (timelineContent) {
        const rect = timelineContent.getBoundingClientRect();
        const scrollSpeed = 10;
        
        // 右端に近づいた場合、右にスクロール
        if (e.clientX > rect.right - 50) {
          timelineContent.scrollLeft += scrollSpeed;
        }
        
        // 左端に近づいた場合、左にスクロール
        if (e.clientX < rect.left + 50) {
          timelineContent.scrollLeft -= scrollSpeed;
        }
      }
    });
  }, [dragInfo, zoomLevel, dispatch]);
  
  // ドラッグ終了
  const handleDragEnd = useCallback(() => {
    // グローバルイベントハンドラを削除
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    
    // カーソルスタイルを元に戻す
    document.body.style.cursor = '';
    
    if (!dragInfo) return;
    
    const { projectId, taskId, subtaskId, type, daysDelta } = dragInfo;
    
    if (daysDelta !== 0) {
      // タスクの日付を更新
      dispatch(updateTaskDates({
        projectId,
        taskId,
        subtaskId,
        type,
        daysDelta
      }));
      
      // フィードバック表示
      const feedbackMessage = 
        type === 'move' ? 'タスクの日程を更新しました' :
        type === 'resize-start' ? 'タスクの開始日を更新しました' :
        'タスクの終了日を更新しました';
      
      showFeedback(feedbackMessage, 'success');
    }
    
    dispatch(endDrag());
  }, [dragInfo, dispatch, showFeedback]);
  
  // コンポーネントがアンマウントされたときのクリーンアップ
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.body.style.cursor = '';
    };
  }, [handleDragMove, handleDragEnd]);
  
  return {
    handleDragStart,
    dragRef,
    isDragging: !!dragInfo
  };
};
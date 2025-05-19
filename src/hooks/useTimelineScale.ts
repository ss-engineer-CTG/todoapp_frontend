import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/reducers';
import { 
  zoomIn, 
  zoomOut, 
  navigateTimeline 
} from '../store/slices/timelineSlice';
import { useFeedback } from './useFeedback';

export const useTimelineScale = () => {
  const dispatch = useDispatch();
  const { showFeedback } = useFeedback();
  const { 
    zoomLevel, 
    timelineStart, 
    timelineEnd,
    visibleStart,
    visibleEnd 
  } = useSelector((state: RootState) => state.timeline);
  
  // ズームイン
  const handleZoomIn = useCallback(() => {
    if (zoomLevel < 200) {
      dispatch(zoomIn());
      showFeedback('ズームイン', 'success');
    }
  }, [dispatch, zoomLevel, showFeedback]);
  
  // ズームアウト
  const handleZoomOut = useCallback(() => {
    if (zoomLevel > 50) {
      dispatch(zoomOut());
      showFeedback('ズームアウト', 'success');
    }
  }, [dispatch, zoomLevel, showFeedback]);
  
  // 期間ナビゲーション
  const navigate = useCallback((direction: 'prev' | 'next' | 'today') => {
    dispatch(navigateTimeline(direction));
    
    const directionLabels = {
      'prev': '前の期間へ移動しました',
      'next': '次の期間へ移動しました',
      'today': '今日を中心に表示しました'
    };
    
    showFeedback(directionLabels[direction], 'success');
  }, [dispatch, showFeedback]);
  
  // 表示期間の計算
  const displayRange = useCallback(() => {
    // 全体の期間
    const timelineStartDate = new Date(timelineStart);
    const timelineEndDate = new Date(timelineEnd);
    const totalDays = Math.round((timelineEndDate.getTime() - timelineStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // 現在表示中の期間
    const visibleStartDate = new Date(visibleStart || timelineStart);
    const visibleEndDate = new Date(visibleEnd || timelineEnd);
    const visibleDays = Math.round((visibleEndDate.getTime() - visibleStartDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      total: {
        start: timelineStartDate,
        end: timelineEndDate,
        days: totalDays
      },
      visible: {
        start: visibleStartDate,
        end: visibleEndDate,
        days: visibleDays
      }
    };
  }, [timelineStart, timelineEnd, visibleStart, visibleEnd]);
  
  return {
    zoomLevel,
    handleZoomIn,
    handleZoomOut,
    navigate,
    displayRange,
    timelineStart,
    timelineEnd,
    visibleStart,
    visibleEnd
  };
};
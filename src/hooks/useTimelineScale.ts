import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/reducers';
import { 
  setTimelineScale, 
  zoomIn, 
  zoomOut, 
  navigateTimeline 
} from '../store/slices/timelineSlice';
import { useFeedback } from './useFeedback';

export const useTimelineScale = () => {
  const dispatch = useDispatch();
  const { showFeedback } = useFeedback();
  const { 
    timelineScale, 
    zoomLevel, 
    timelineStart, 
    timelineEnd 
  } = useSelector((state: RootState) => state.timeline);
  
  // タイムラインスケール（日/週/月）の変更
  const changeScale = useCallback((scale: 'day' | 'week' | 'month') => {
    dispatch(setTimelineScale(scale));
    
    const scaleLabels = {
      'day': '日',
      'week': '週',
      'month': '月'
    };
    
    showFeedback(`${scaleLabels[scale]}表示に切り替えました`, 'success');
  }, [dispatch, showFeedback]);
  
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
    const start = new Date(timelineStart);
    const end = new Date(timelineEnd);
    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      start,
      end,
      days: diffDays
    };
  }, [timelineStart, timelineEnd]);
  
  return {
    timelineScale,
    zoomLevel,
    changeScale,
    handleZoomIn,
    handleZoomOut,
    navigate,
    displayRange,
    timelineStart,
    timelineEnd
  };
};
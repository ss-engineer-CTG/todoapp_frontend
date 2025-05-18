import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { showFeedbackMessage } from '../store/slices/uiSlice';

type FeedbackType = 'success' | 'error' | 'warning' | 'info';

export const useFeedback = () => {
  const dispatch = useDispatch();
  
  // フィードバックメッセージを表示
  const showFeedback = useCallback((
    message: string, 
    type: FeedbackType = 'info'
  ) => {
    dispatch(showFeedbackMessage({ message, type }));
    
    // 3秒後に自動的に消えるのはuiSliceのフィードバック設定で実装
  }, [dispatch]);
  
  return { showFeedback };
};
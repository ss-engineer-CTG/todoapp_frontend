import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X } from 'lucide-react';
import { RootState } from '../../store/reducers';
import { clearFeedbackMessage } from '../../store/slices/uiSlice';

const FeedbackToast: React.FC = () => {
  const { message, type } = useSelector((state: RootState) => state.ui.feedback);
  const [isVisible, setIsVisible] = useState(false);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (message) {
      // 既存のタイマーがあればクリア
      if (timerId) {
        clearTimeout(timerId);
        setTimerId(null);
      }
      
      // トーストを表示
      setIsVisible(true);
      
      // 3秒後に自動的に閉じる
      const timer = setTimeout(() => {
        setIsVisible(false);
        dispatch(clearFeedbackMessage());
      }, 3000);
      
      setTimerId(timer);
      
      // クリーンアップ
      return () => {
        if (timer) clearTimeout(timer);
      };
    }
  }, [message, type, dispatch]);

  // トーストを閉じる
  const handleClose = () => {
    setIsVisible(false);
    if (timerId) {
      clearTimeout(timerId);
      setTimerId(null);
    }
    dispatch(clearFeedbackMessage());
  };

  // メッセージがない場合は何も表示しない
  if (!message) return null;

  // 表示状態でなければ何も表示しない
  if (!isVisible) return null;

  // トースト種類に応じたスタイルを取得
  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 text-white';
      case 'error':
        return 'bg-red-600 text-white';
      case 'warning':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-black bg-opacity-80 text-white';
    }
  };

  return (
    <div 
      className={`fixed top-4 right-4 px-4 py-2 rounded-md shadow-lg z-50 transition-opacity duration-300 flex items-center ${getToastStyles()}`}
      role="alert"
    >
      <span className="text-sm font-medium">{message}</span>
      <button 
        className="ml-3 text-white opacity-70 hover:opacity-100 transition-opacity"
        onClick={handleClose}
        aria-label="閉じる"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default FeedbackToast;
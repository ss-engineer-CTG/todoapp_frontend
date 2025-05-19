import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { clearFeedbackMessage } from '../../store/slices/uiSlice';

// シンプルなトースト通知フック
export interface ToastState {
  open: boolean;
  message: string | null;
  type: 'success' | 'error' | 'warning' | 'info';
}

export interface ToastOptions {
  duration?: number;
  type?: 'success' | 'error' | 'warning' | 'info';
}

export interface UseToastReturn {
  toast: (message: string, options?: ToastOptions) => void;
  toastState: ToastState;
  setToastState: React.Dispatch<React.SetStateAction<ToastState>>;
}

export const useToast = (): UseToastReturn => {
  const dispatch = useDispatch();
  const [toastState, setToastState] = useState<ToastState>({
    open: false,
    message: null,
    type: 'info'
  });

  const toast = (message: string, options: ToastOptions = {}) => {
    const { duration = 3000, type = 'info' } = options;

    setToastState({
      open: true,
      message,
      type
    });

    // 一定時間後に自動的に閉じる
    setTimeout(() => {
      setToastState(state => ({ ...state, open: false }));
      dispatch(clearFeedbackMessage());
    }, duration);
  };

  return { toast, toastState, setToastState };
};
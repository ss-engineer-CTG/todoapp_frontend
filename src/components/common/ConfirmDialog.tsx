import React from 'react';
import { X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = '確認',
  cancelText = 'キャンセル',
  confirmVariant = 'default',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  // 確認ボタンのスタイル
  const confirmButtonStyle = confirmVariant === 'destructive'
    ? 'py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
    : 'py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500';

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center" onClick={onCancel}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h2>
          <button 
            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
            onClick={onCancel}
          >
            <span className="sr-only">閉じる</span>
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {message}
          </p>
        </div>
        
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-right flex justify-end space-x-2 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={confirmButtonStyle}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
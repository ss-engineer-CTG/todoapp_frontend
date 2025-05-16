import React, { useState, useEffect, useRef } from 'react';
import { Task } from '../../models/task';
import { useTaskContext } from '../../contexts/TaskContext';

interface TaskNoteProps {
  task: Task;
  onClose: () => void;
}

/**
 * タスクノート機能コンポーネント
 * タスクごとにノートを表示・編集する機能を提供
 */
const TaskNote: React.FC<TaskNoteProps> = ({ task, onClose }) => {
  const { updateTaskNote } = useTaskContext();
  const [noteContent, setNoteContent] = useState(task.noteContent || '');
  const [isDirty, setIsDirty] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // 初回レンダリング時にテキストエリアにフォーカス
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(noteContent.length, noteContent.length);
    }
  }, []);
  
  // ノート内容の変更時
  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNoteContent(e.target.value);
    setIsDirty(true);
  };
  
  // ノートの保存
  const handleSave = () => {
    if (isDirty) {
      updateTaskNote(task.id, noteContent);
      setIsDirty(false);
    }
    onClose();
  };
  
  // キーボード操作のハンドラー
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Sで保存
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    
    // Escでダイアログを閉じる
    if (e.key === 'Escape') {
      e.preventDefault();
      // 内容が変更されている場合は確認
      if (isDirty) {
        if (window.confirm('変更を保存せずに閉じますか？')) {
          onClose();
        }
      } else {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-full flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            {task.title} - ノート
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <textarea
            ref={textareaRef}
            value={noteContent}
            onChange={handleNoteChange}
            onKeyDown={handleKeyDown}
            className="w-full h-full p-4 text-gray-700 focus:outline-none resize-none"
            placeholder="タスクに関するメモやノートを入力してください..."
            style={{ minHeight: '300px' }}
          />
        </div>
        
        <div className="px-6 py-4 border-t flex justify-end">
          <div className="text-sm text-gray-500 mr-4 flex items-center">
            {isDirty ? '変更あり *' : '変更なし'}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded hover:bg-gray-200 mr-2"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
            disabled={!isDirty}
          >
            保存
          </button>
        </div>
        
        <div className="px-6 py-2 bg-gray-50 text-xs text-gray-500 rounded-b-lg">
          ショートカット: Ctrl+S で保存、Esc で閉じる
        </div>
      </div>
    </div>
  );
};

export default TaskNote;
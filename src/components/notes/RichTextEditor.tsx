import React, { useRef, useState } from 'react';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Link, 
  Image 
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange,
  placeholder = 'タスクに関するメモや詳細情報を入力してください...'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  
  // フォーマット適用
  const applyFormat = (format: string) => {
    document.execCommand(format, false);
    if (editorRef.current) {
      // エディターのコンテンツを取得して更新
      onChange(editorRef.current.innerHTML);
    }
  };
  
  // リンク追加
  const addLink = () => {
    const url = prompt('URLを入力してください:');
    if (url) {
      document.execCommand('createLink', false, url);
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    }
  };
  
  // 入力変更時
  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };
  
  return (
    <div className="flex flex-col border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
      {/* ツールバー */}
      <div className="flex items-center space-x-1 p-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
        <button
          type="button"
          className="p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
          onClick={() => applyFormat('bold')}
          aria-label="太字"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          className="p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
          onClick={() => applyFormat('italic')}
          aria-label="斜体"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          className="p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
          onClick={() => applyFormat('insertUnorderedList')}
          aria-label="箇条書き"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          className="p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
          onClick={() => applyFormat('insertOrderedList')}
          aria-label="番号付きリスト"
        >
          <ListOrdered size={16} />
        </button>
        <button
          type="button"
          className="p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
          onClick={addLink}
          aria-label="リンク"
        >
          <Link size={16} />
        </button>
      </div>
      
      {/* エディター本体 */}
      <div
        ref={editorRef}
        className="p-3 min-h-[150px] max-h-[400px] overflow-y-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        contentEditable
        dangerouslySetInnerHTML={{ __html: value }}
        onInput={handleInput}
        placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;
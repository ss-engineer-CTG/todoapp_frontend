import React, { useState } from 'react';
import { Paperclip, File, X, Download, Image } from 'lucide-react';

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

interface NoteAttachmentsProps {
  attachments: Attachment[];
  onAddAttachment: (file: File) => void;
  onRemoveAttachment: (id: string) => void;
}

const NoteAttachments: React.FC<NoteAttachmentsProps> = ({
  attachments,
  onAddAttachment,
  onRemoveAttachment
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // ファイル選択ダイアログを開く
  const handleOpenFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // ファイル選択時の処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onAddAttachment(files[0]);
    }
    
    // 同じファイルを連続で選択できるようにinputをリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // ファイルサイズのフォーマット
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // ファイルタイプに応じたアイコンを取得
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image size={20} />;
    return <File size={20} />;
  };
  
  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">添付ファイル</h3>
        <button
          type="button"
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center"
          onClick={handleOpenFileDialog}
        >
          <Paperclip size={14} className="mr-1" />
          ファイルを添付
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      
      {attachments.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 dark:bg-gray-700 rounded-md border border-dashed border-gray-300 dark:border-gray-600">
          <Paperclip size={24} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ファイルをドラッグ&ドロップするか、
            <button
              type="button"
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
              onClick={handleOpenFileDialog}
            >
              クリックして選択
            </button>
            してください
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-md">
          {attachments.map(attachment => (
            <li key={attachment.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-center">
                <div className="text-gray-500 dark:text-gray-400 mr-3">
                  {getFileIcon(attachment.type)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{attachment.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(attachment.size)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  aria-label="ダウンロード"
                >
                  <Download size={16} />
                </button>
                <button
                  type="button"
                  className="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
                  onClick={() => onRemoveAttachment(attachment.id)}
                  aria-label="削除"
                >
                  <X size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NoteAttachments;
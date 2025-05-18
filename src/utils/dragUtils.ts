import { DragEvent } from 'react';

// ドラッグイベントの処理ユーティリティ

// ドラッグ中のデータを設定
export const setDragData = (
  e: DragEvent<HTMLElement>, 
  data: any, 
  effect: 'move' | 'copy' = 'move'
) => {
  try {
    e.dataTransfer.setData('text/plain', JSON.stringify(data));
    e.dataTransfer.effectAllowed = effect;
  } catch (error) {
    console.error('Error setting drag data:', error);
  }
};

// ドラッグデータの取得
export const getDragData = (e: DragEvent<HTMLElement>) => {
  try {
    const data = e.dataTransfer.getData('text/plain');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting drag data:', error);
    return null;
  }
};

// タスクドラッグ用のカスタムイベントハンドラー
export const taskDragHandlers = {
  // ドラッグ開始
  onDragStart: (
    e: DragEvent<HTMLElement>, 
    projectId: string, 
    taskId: string, 
    subtaskId?: string
  ) => {
    const element = e.currentTarget;
    
    // ドラッグ開始時の視覚効果
    setTimeout(() => {
      element.classList.add('opacity-50', 'scale-105');
    }, 0);
    
    // ドラッグデータの設定
    setDragData(e, { projectId, taskId, subtaskId, type: 'task' });
    
    // ドラッグイメージの設定（任意）
    // const dragImage = document.createElement('div');
    // dragImage.textContent = element.textContent || 'Task';
    // dragImage.className = 'bg-white p-2 border rounded shadow text-sm opacity-80';
    // document.body.appendChild(dragImage);
    // e.dataTransfer.setDragImage(dragImage, 10, 10);
    // setTimeout(() => document.body.removeChild(dragImage), 0);
  },
  
  // ドラッグ終了
  onDragEnd: (e: DragEvent<HTMLElement>) => {
    const element = e.currentTarget;
    element.classList.remove('opacity-50', 'scale-105');
  },
  
  // ドラッグ中（ドロップ先の処理）
  onDragOver: (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-indigo-50', 'dark:bg-indigo-900/20');
  },
  
  // ドラッグ離脱（ドロップ先の処理）
  onDragLeave: (e: DragEvent<HTMLElement>) => {
    e.currentTarget.classList.remove('bg-indigo-50', 'dark:bg-indigo-900/20');
  },
  
  // ドロップ（ドロップ先の処理）
  onDrop: (
    e: DragEvent<HTMLElement>,
    onTaskDrop: (data: any, targetDate?: Date) => void
  ) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-indigo-50', 'dark:bg-indigo-900/20');
    
    const data = getDragData(e);
    if (data && data.type === 'task') {
      // ドロップ位置から日付を計算（例：タイムラインの場合）
      // ここでは日付計算は行わないので、targetDateはundefinedのまま
      onTaskDrop(data);
    }
  }
};
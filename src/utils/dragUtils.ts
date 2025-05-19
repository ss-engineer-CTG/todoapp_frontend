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
    
    // ゴーストイメージの設定
    if (e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const ghostElement = document.createElement('div');
      ghostElement.style.width = `${rect.width}px`;
      ghostElement.style.height = `${rect.height}px`;
      ghostElement.style.background = 'rgba(99, 102, 241, 0.3)';
      ghostElement.style.border = '2px solid rgb(79, 70, 229)';
      ghostElement.style.borderRadius = '4px';
      ghostElement.style.position = 'absolute';
      ghostElement.style.top = '-1000px';
      ghostElement.style.left = '-1000px';
      
      document.body.appendChild(ghostElement);
      e.dataTransfer.setDragImage(ghostElement, 10, 10);
      
      // ゴースト要素の遅延削除
      setTimeout(() => {
        document.body.removeChild(ghostElement);
      }, 0);
    }
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
      element.classList.add('opacity-50', 'ring-2', 'ring-indigo-500');
    }, 0);
    
    // ドラッグデータの設定
    setDragData(e, { projectId, taskId, subtaskId, type: 'task' });
  },
  
  // ドラッグ終了
  onDragEnd: (e: DragEvent<HTMLElement>) => {
    const element = e.currentTarget;
    element.classList.remove('opacity-50', 'ring-2', 'ring-indigo-500');
  },
  
  // ドラッグ中（ドロップ先の処理）
  onDragOver: (e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('bg-indigo-50', 'dark:bg-indigo-900/20');
    
    // カスタムカーソルでドロップ可能を示す
    e.dataTransfer.dropEffect = 'move';
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
    e.stopPropagation();
    e.currentTarget.classList.remove('bg-indigo-50', 'dark:bg-indigo-900/20');
    
    const data = getDragData(e);
    if (data && data.type === 'task') {
      // ドロップ位置から日付を計算（タイムラインの場合）
      const targetDate = getTargetDateFromDrop(e);
      onTaskDrop(data, targetDate);
    }
  }
};

// ドロップ位置から日付を計算するヘルパー関数
export const getTargetDateFromDrop = (e: DragEvent<HTMLElement>): Date | undefined => {
  const timelineElement = document.querySelector('.timeline-content');
  if (!timelineElement) return undefined;
  
  const timelineRect = timelineElement.getBoundingClientRect();
  const scrollLeft = (timelineElement as HTMLElement).scrollLeft;
  
  // ドロップ位置のX座標
  const dropPositionX = e.clientX - timelineRect.left + scrollLeft;
  
  // 現在の日単位の幅を取得
  const dayWidthElement = document.querySelector('.timeline-grid-cell');
  if (!dayWidthElement) return undefined;
  
  const dayWidth = dayWidthElement.getBoundingClientRect().width;
  
  // タイムラインの開始日を取得
  const timelineStartDateElem = document.querySelector('[data-timeline-start]');
  if (!timelineStartDateElem) return undefined;
  
  const timelineStartDateStr = timelineStartDateElem.getAttribute('data-timeline-start');
  if (!timelineStartDateStr) return undefined;
  
  const timelineStartDate = new Date(timelineStartDateStr);
  
  // ドロップ位置から日数を計算
  const daysDiff = Math.floor(dropPositionX / dayWidth);
  
  // 開始日に日数を加算して目標日付を取得
  const targetDate = new Date(timelineStartDate);
  targetDate.setDate(timelineStartDate.getDate() + daysDiff);
  
  return targetDate;
};
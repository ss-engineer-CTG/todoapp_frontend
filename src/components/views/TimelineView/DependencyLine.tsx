// src/components/views/TimelineView/DependencyLine.tsx
import React from "react";
import { Task } from "../../../types/Task";

interface DependencyLineProps {
  fromTask: Task;
  toTask: Task;
  startDate: string; // タイムライン表示の開始日
  dayWidth: number;  // 1日あたりの幅
  rowHeight: number; // 行の高さ
  topOffset: number; // 上部のオフセット（ヘッダーなど）
  draggingTaskId?: number; // ドラッグ中のタスクID
  dragPreview?: {
    taskId: number;
    startDate: string;
    dueDate: string;
  };
}

export default function DependencyLine({
  fromTask,
  toTask,
  startDate,
  dayWidth,
  rowHeight,
  topOffset,
  draggingTaskId,
  dragPreview
}: DependencyLineProps) {
  // タスク位置の計算
  const getTaskPosition = (task: Task) => {
    // ドラッグ中のタスクの場合はプレビュー位置を使用
    if (dragPreview && draggingTaskId === task.id) {
      const draggedStartDate = dragPreview.startDate;
      const draggedDueDate = dragPreview.dueDate;
      
      // 開始位置の計算
      const startDiff = getDateDiff(startDate, draggedStartDate);
      const startX = startDiff * dayWidth;
      
      // 終了位置の計算
      const endDiff = getDateDiff(startDate, draggedDueDate);
      const endX = endDiff * dayWidth;
      
      return { startX, endX };
    }
    
    // 通常のタスク位置計算
    const startDiff = getDateDiff(startDate, task.startDate);
    const endDiff = getDateDiff(startDate, task.dueDate);
    
    return {
      startX: startDiff * dayWidth,
      endX: endDiff * dayWidth
    };
  };
  
  // 日付の差分を日数で取得
  const getDateDiff = (dateA: string, dateB: string) => {
    const a = new Date(dateA);
    const b = new Date(dateB);
    return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  };
  
  // 行インデックスの取得（仮実装 - 実際の実装ではタスクリストのインデックスに基づいて計算）
  const getTaskRowIndex = (task: Task) => {
    return task.id; // 仮実装 - 実際のインデックスは呼び出し元から渡す必要があります
  };
  
  // fromTaskとtoTaskの位置を計算
  const fromPos = getTaskPosition(fromTask);
  const toPos = getTaskPosition(toTask);
  
  // fromTaskの右端からtoTaskの左端に線を引く
  const fromX = fromPos.endX;
  const toX = toPos.startX;
  
  // Y座標の計算
  const fromRowIndex = getTaskRowIndex(fromTask);
  const toRowIndex = getTaskRowIndex(toTask);
  const fromY = topOffset + (fromRowIndex * rowHeight) + (rowHeight / 2);
  const toY = topOffset + (toRowIndex * rowHeight) + (rowHeight / 2);
  
  // 接続点の表示位置
  const midX = fromX + (toX - fromX) / 2;
  
  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
      <defs>
        <marker
          id="arrowhead"
          markerWidth="6"
          markerHeight="6"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L6,3 L0,0" fill="#9333ea" />
        </marker>
      </defs>
      
      {/* 横線 */}
      <line
        x1={fromX}
        y1={fromY}
        x2={midX}
        y2={fromY}
        stroke="#9333ea"
        strokeWidth="2"
        strokeDasharray="4"
      />
      
      {/* 縦線 */}
      <line
        x1={midX}
        y1={fromY}
        x2={midX}
        y2={toY}
        stroke="#9333ea"
        strokeWidth="2"
        strokeDasharray="4"
      />
      
      {/* 横線（矢印付き） */}
      <line
        x1={midX}
        y1={toY}
        x2={toX}
        y2={toY}
        stroke="#9333ea"
        strokeWidth="2"
        strokeDasharray="4"
        markerEnd="url(#arrowhead)"
      />
      
      {/* 接続ポイント（開始） */}
      <circle
        cx={fromX}
        cy={fromY}
        r="3"
        fill="#9333ea"
      />
      
      {/* 接続ポイント（終了） */}
      <circle
        cx={toX}
        cy={toY}
        r="3"
        fill="#9333ea"
      />
    </svg>
  );
}
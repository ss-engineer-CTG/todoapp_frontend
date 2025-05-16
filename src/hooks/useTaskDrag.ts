import { useState, useCallback, useRef } from 'react';
import { addDays } from 'date-fns';
import { Task } from '../models/task';
import { useTaskContext } from '../contexts/TaskContext';

interface DragState {
  taskId: string | null;
  type: 'start' | 'end' | 'move' | null;
  initialX: number;
  initialDate: Date | null;
  initialEndDate: Date | null;
}

interface UseTaskDragOptions {
  dayWidth: number;
  onDragStart?: (taskId: string, type: 'start' | 'end' | 'move') => void;
  onDragEnd?: (taskId: string, newStartDate: Date, newEndDate: Date) => void;
}

/**
 * カスタムフック: タスクのドラッグ操作を管理
 * 
 * タイムライン上でのタスクのドラッグ＆ドロップ操作を処理する
 */
export const useTaskDrag = ({ dayWidth, onDragStart, onDragEnd }: UseTaskDragOptions) => {
  const { updateTask, tasks } = useTaskContext();
  
  // ドラッグの状態
  const [dragState, setDragState] = useState<DragState>({
    taskId: null,
    type: null,
    initialX: 0,
    initialDate: null,
    initialEndDate: null
  });
  
  // ドラッグ中かどうか
  const isDragging = Boolean(dragState.taskId);
  
  // 前回の日数差分を保持するためのref
  const lastDiffDaysRef = useRef(0);
  
  // ドラッグ開始
  const startDrag = useCallback((
    taskId: string,
    type: 'start' | 'end' | 'move',
    clientX: number
  ) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    setDragState({
      taskId,
      type,
      initialX: clientX,
      initialDate: new Date(task.startDate),
      initialEndDate: new Date(task.endDate)
    });
    
    lastDiffDaysRef.current = 0;
    
    // コールバックを呼び出し
    onDragStart?.(taskId, type);
  }, [tasks, onDragStart]);
  
  // ドラッグ中
  const onDrag = useCallback((clientX: number) => {
    if (!dragState.taskId || !dragState.type || !dragState.initialDate) return;
    
    // X方向の移動量（ピクセル）
    const deltaX = clientX - dragState.initialX;
    
    // 日数に変換（四捨五入して整数の日数にする）
    const diffDays = Math.round(deltaX / dayWidth);
    
    // 前回と同じ日数差分なら何もしない
    if (diffDays === lastDiffDaysRef.current) return;
    lastDiffDaysRef.current = diffDays;
    
    // 対象タスクを取得
    const task = tasks.find(t => t.id === dragState.taskId);
    if (!task) return;
    
    // 新しい日付を計算
    let newStartDate: Date;
    let newEndDate: Date;
    
    if (dragState.type === 'start') {
      // 開始日のドラッグ
      newStartDate = addDays(dragState.initialDate, diffDays);
      
      // 開始日が終了日より後にならないように制約
      if (newStartDate > task.endDate) {
        newStartDate = new Date(task.endDate);
      }
      newEndDate = new Date(task.endDate);
    } else if (dragState.type === 'end') {
      // 終了日のドラッグ
      newEndDate = addDays(dragState.initialEndDate!, diffDays);
      
      // 終了日が開始日より前にならないように制約
      if (newEndDate < task.startDate) {
        newEndDate = new Date(task.startDate);
      }
      newStartDate = new Date(task.startDate);
    } else {
      // タスク全体の移動
      newStartDate = addDays(dragState.initialDate, diffDays);
      newEndDate = addDays(dragState.initialEndDate!, diffDays);
    }
    
    // タスクを更新
    updateTask({
      ...task,
      startDate: newStartDate,
      endDate: newEndDate
    });
  }, [dragState, dayWidth, tasks, updateTask]);
  
  // ドラッグ終了
  const endDrag = useCallback(() => {
    if (dragState.taskId) {
      const task = tasks.find(t => t.id === dragState.taskId);
      if (task) {
        // コールバックを呼び出し
        onDragEnd?.(task.id, task.startDate, task.endDate);
      }
    }
    
    // 状態をリセット
    setDragState({
      taskId: null,
      type: null,
      initialX: 0,
      initialDate: null,
      initialEndDate: null
    });
    
    lastDiffDaysRef.current = 0;
  }, [dragState.taskId, tasks, onDragEnd]);
  
  return {
    isDragging,
    dragTaskId: dragState.taskId,
    dragType: dragState.type,
    startDrag,
    onDrag,
    endDrag
  };
};

export default useTaskDrag;
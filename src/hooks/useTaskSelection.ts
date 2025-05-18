import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/reducers';
import { 
  toggleTaskSelection, 
  clearSelectedTasks, 
  setShowBatchPanel,
  moveTaskFocus
} from '../store/slices/uiSlice';
import { getAllTaskKeys } from '../utils/taskUtils';

export const useTaskSelection = () => {
  const dispatch = useDispatch();
  const { selectedTasks, focusedTaskKey } = useSelector((state: RootState) => state.ui);
  const { projects } = useSelector((state: RootState) => state.projects);
  
  // タスク選択の切り替え
  const toggleSelection = useCallback((
    taskKey: string, 
    options: { ctrlKey?: boolean; shiftKey?: boolean } = {}
  ) => {
    const { ctrlKey = false, shiftKey = false } = options;
    
    dispatch(toggleTaskSelection({ taskKey, ctrlKey, shiftKey }));
    
    // 選択されたタスクがある場合、一括操作パネルを表示
    if (selectedTasks.length > 0 || !selectedTasks.includes(taskKey)) {
      dispatch(setShowBatchPanel(true));
    }
    
    // フォーカスの更新（Shift選択以外）
    if (!shiftKey) {
      dispatch(moveTaskFocus(taskKey));
    }
  }, [dispatch, selectedTasks]);
  
  // 範囲選択（Shift + クリック）
  const selectRange = useCallback((endTaskKey: string) => {
    if (!focusedTaskKey) return;
    
    const allTaskKeys = getAllTaskKeys(projects);
    const startIdx = allTaskKeys.indexOf(focusedTaskKey);
    const endIdx = allTaskKeys.indexOf(endTaskKey);
    
    if (startIdx === -1 || endIdx === -1) return;
    
    const start = Math.min(startIdx, endIdx);
    const end = Math.max(startIdx, endIdx);
    const keysInRange = allTaskKeys.slice(start, end + 1);
    
    // 現在の選択を保持して範囲を追加
    keysInRange.forEach(key => {
      if (!selectedTasks.includes(key)) {
        dispatch(toggleTaskSelection({ 
          taskKey: key, 
          ctrlKey: true, 
          shiftKey: false 
        }));
      }
    });
    
    dispatch(setShowBatchPanel(true));
  }, [dispatch, focusedTaskKey, selectedTasks, projects]);
  
  // 全選択解除
  const clearSelection = useCallback(() => {
    dispatch(clearSelectedTasks());
    dispatch(setShowBatchPanel(false));
  }, [dispatch]);
  
  return {
    selectedTasks,
    focusedTaskKey,
    toggleSelection,
    selectRange,
    clearSelection,
    isSelected: (taskKey: string) => selectedTasks.includes(taskKey),
    isFocused: (taskKey: string) => focusedTaskKey === taskKey
  };
};
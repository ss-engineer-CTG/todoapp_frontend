import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/reducers';
import { 
  openTaskEditModal, 
  setProjectFormActive, 
  toggleTaskSelection, 
  moveTaskFocus, 
  clearSelectedTasks,
  openDeleteConfirmation
} from '../store/slices/uiSlice';
import { 
  updateTaskStatus, 
  duplicateTask 
} from '../store/slices/tasksSlice';
import { 
  zoomIn, 
  zoomOut
} from '../store/slices/timelineSlice';
import { getAllTaskKeys } from '../utils/taskUtils';
import { useFeedback } from './useFeedback';

export const useKeyboardNavigation = () => {
  const dispatch = useDispatch();
  const { showFeedback } = useFeedback();
  
  const { 
    taskEditModal, 
    projectFormActive, 
    selectedTasks, 
    deleteConfirmation,
    inlineEditTask
  } = useSelector((state: RootState) => state.ui);
  
  const { projects } = useSelector((state: RootState) => state.projects);
  
  // キーボードイベントハンドラー
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // モーダルやポップアップが開いている場合は特定のキーのみ処理
      if (taskEditModal.isOpen || deleteConfirmation.isOpen || projectFormActive || inlineEditTask) {
        // ESCキーで各種モーダルやポップアップを閉じる
        if (e.key === 'Escape') {
          e.preventDefault();
          return;
        }
        return;
      }
      
      // Enterキーでプロジェクト作成フォーム起動
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        dispatch(setProjectFormActive(true));
        return;
      }
      
      // Shift+Enterキーで詳細入力モード起動
      if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        dispatch(openTaskEditModal({ mode: 'create' }));
        return;
      }
      
      // タスクが選択されている場合の操作
      if (selectedTasks.length > 0) {
        const [projectId, taskId, subtaskId] = selectedTasks[0].split('-');
        
        // Spaceキーでタスク完了状態の切り替え
        if (e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          
          const task = findTaskById(projects, projectId, taskId, subtaskId);
          if (task) {
            dispatch(updateTaskStatus({
              projectId, 
              taskId, 
              subtaskId, 
              status: task.status === 'completed' ? 'not-started' : 'completed'
            }));
          }
          return;
        }
        
        // Deleteキーでタスク削除
        if (e.key === 'Delete') {
          e.preventDefault();
          
          dispatch(openDeleteConfirmation({
            projectId,
            taskId,
            subtaskId,
            batchMode: selectedTasks.length > 1
          }));
          return;
        }
        
        // Ctrl+Dでタスク複製
        if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          dispatch(duplicateTask({ projectId, taskId, subtaskId }));
          showFeedback('タスクを複製しました', 'success');
          return;
        }
      }
      
      // +/-キーでズームイン/ズームアウト
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        dispatch(zoomIn());
        showFeedback('ズームイン', 'success');
        return;
      }
      
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        dispatch(zoomOut());
        showFeedback('ズームアウト', 'success');
        return;
      }
      
      // 矢印キーによるタスク移動
      if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        
        const allTaskKeys = getAllTaskKeys(projects);
        
        // 何も選択されていない場合、最初のタスクを選択
        if (selectedTasks.length === 0) {
          if (allTaskKeys.length > 0) {
            dispatch(toggleTaskSelection({
              taskKey: allTaskKeys[0],
              ctrlKey: false,
              shiftKey: false
            }));
          }
          return;
        }
        
        const currentTaskKey = selectedTasks[0];
        const currentIndex = allTaskKeys.indexOf(currentTaskKey);
        
        if (currentIndex === -1) return;
        
        let newIndex = currentIndex;
        
        if (e.key === 'ArrowUp' && currentIndex > 0) {
          newIndex = currentIndex - 1;
        } else if (e.key === 'ArrowDown' && currentIndex < allTaskKeys.length - 1) {
          newIndex = currentIndex + 1;
        }
        
        if (newIndex !== currentIndex) {
          const newTaskKey = allTaskKeys[newIndex];
          
          if (e.shiftKey) {
            // Shift+矢印キーで範囲選択
            dispatch(toggleTaskSelection({
              taskKey: newTaskKey,
              ctrlKey: true,
              shiftKey: true
            }));
          } else {
            // 通常の矢印キーで単一選択
            dispatch(clearSelectedTasks());
            dispatch(toggleTaskSelection({
              taskKey: newTaskKey,
              ctrlKey: false,
              shiftKey: false
            }));
          }
          
          dispatch(moveTaskFocus(newTaskKey));
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    dispatch, 
    projects, 
    selectedTasks, 
    taskEditModal.isOpen, 
    deleteConfirmation.isOpen, 
    projectFormActive,
    inlineEditTask,
    showFeedback
  ]);
};

// ヘルパー関数: ID からタスクを検索
const findTaskById = (
  projects: any[], 
  projectId: string, 
  taskId: string, 
  subtaskId?: string
) => {
  const project = projects.find(p => p.id === projectId);
  if (!project) return null;
  
  const task = project.tasks.find((t: any) => t.id === taskId);
  if (!task) return null;
  
  if (subtaskId) {
    return task.subtasks.find((st: any) => st.id === subtaskId) || null;
  }
  
  return task;
};
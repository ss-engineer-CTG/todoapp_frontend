import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Check, Trash, X, Calendar, ChevronRight } from 'lucide-react';
import { RootState } from '../../store/reducers';
import { updateMultipleTaskStatus } from '../../store/slices/tasksSlice';
import { clearSelectedTasks, openDeleteConfirmation } from '../../store/slices/uiSlice';

const BatchOperationPanel: React.FC = () => {
  const dispatch = useDispatch();
  const { selectedTasks } = useSelector((state: RootState) => state.ui);

  // 一括完了処理
  const handleBatchComplete = () => {
    dispatch(updateMultipleTaskStatus({ 
      taskKeys: selectedTasks, 
      status: 'completed' 
    }));
  };
  
  // 一括未完了処理
  const handleBatchNotStarted = () => {
    dispatch(updateMultipleTaskStatus({ 
      taskKeys: selectedTasks, 
      status: 'not-started' 
    }));
  };
  
  // 一括削除処理
  const handleBatchDelete = () => {
    dispatch(openDeleteConfirmation({ batchMode: true }));
  };
  
  if (selectedTasks.length === 0) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-40">
      <div className="flex items-center p-2">
        <div className="px-2 font-medium text-sm text-gray-700 dark:text-gray-300">
          {selectedTasks.length}個のタスクを選択中
        </div>
        <div className="border-l border-gray-200 dark:border-gray-700 pl-2 flex">
          <button 
            className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded mr-1 flex items-center text-xs font-medium"
            onClick={handleBatchComplete}
          >
            <Check size={14} className="mr-1 text-green-500" />
            完了
          </button>
          <button 
            className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded mr-1 flex items-center text-xs font-medium"
            onClick={handleBatchNotStarted}
          >
            <Check size={14} className="mr-1 text-gray-400" />
            未完了
          </button>
          <button 
            className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded mr-1 flex items-center text-xs font-medium"
            onClick={handleBatchDelete}
          >
            <Trash size={14} className="mr-1 text-red-500" />
            削除
          </button>
          <button 
            className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center text-xs font-medium"
            onClick={() => dispatch(clearSelectedTasks())}
          >
            <X size={14} className="mr-1" />
            選択解除
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchOperationPanel;
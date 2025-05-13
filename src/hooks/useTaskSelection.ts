import { useContext } from "react"
import { TaskContext } from "../contexts/TaskContext"
import { UIContext } from "../contexts/UIContext"
import { useFilterAndSort } from "./useFilterAndSort"
import { getParentTask, getDirectChildTasks } from "../utils/taskUtils"
import { logInfo } from "../utils/logUtils"

export function useTaskSelection() {
  const { tasks } = useContext(TaskContext)
  const { selectedTaskId, setSelectedTaskId, taskRefs } = useContext(UIContext)
  const { getVisibleTasks } = useFilterAndSort()

  // 選択されたタスクへフォーカスを移動
  const focusSelectedTask = () => {
    if (selectedTaskId && taskRefs.current[selectedTaskId]) {
      const element = taskRefs.current[selectedTaskId];
      
      if (element) {
        // スクロール位置を調整して要素を表示
        const rect = element.getBoundingClientRect();
        const isInView = (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= window.innerHeight &&
          rect.right <= window.innerWidth
        );
        
        if (!isInView) {
          // スムーズスクロールで要素を表示
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        // フォーカスとビジュアルフィードバック
        element.focus();
        
        // 視覚的なフィードバック（フラッシュエフェクト）
        element.classList.add('bg-blue-200');
        setTimeout(() => {
          element.classList.remove('bg-blue-200');
        }, 300);
      }
    }
  }

  // 上下の隣接するタスクに移動 - 表示されているタスクのみ
  const navigateToAdjacentTask = (taskId: number, direction: "up" | "down") => {
    const visibleTasks = getVisibleTasks();
    const currentIndex = visibleTasks.findIndex((t) => t.id === taskId);

    if (currentIndex === -1) return;

    const targetIndex =
      direction === "up" 
        ? Math.max(0, currentIndex - 1) 
        : Math.min(visibleTasks.length - 1, currentIndex + 1);

    if (targetIndex !== currentIndex) {
      const targetTask = visibleTasks[targetIndex];
      setSelectedTaskId(targetTask.id);
      logInfo(`${direction === "up" ? "上" : "下"}のタスクに移動しました: ${targetTask.name}`);
    }
  }

  // 親タスクへ移動 - 明示的な親参照を使用
  const navigateToParentTask = (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.level === 0) return;

    // 親タスクを取得
    const parent = getParentTask(task, tasks);
    if (parent) {
      setSelectedTaskId(parent.id);
      logInfo(`親タスクに移動しました: ${parent.name}`);
      return;
    }
    
    logInfo("親タスクが見つかりません");
  }

  // 子タスクへ移動 - 明示的な親子関係を使用
  const navigateToChildTask = (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // 子タスクを直接検索
    const childTasks = getDirectChildTasks(task, tasks);
    if (childTasks.length > 0) {
      // 最初の子タスクを選択
      setSelectedTaskId(childTasks[0].id);
      logInfo(`子タスクに移動しました: ${childTasks[0].name}`);
    } else {
      logInfo("子タスクがありません");
    }
  }

  // このタスクに子タスクがあるかチェック
  const hasChildTasks = (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return false;

    return getDirectChildTasks(task, tasks).length > 0;
  }

  return {
    focusSelectedTask,
    navigateToAdjacentTask,
    navigateToParentTask,
    navigateToChildTask,
    hasChildTasks
  }
}
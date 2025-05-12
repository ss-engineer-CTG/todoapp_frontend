// src/hooks/useKeyboardShortcuts.ts
import { useEffect, useContext, useCallback } from "react";
import { UIContext } from "../contexts/UIContext";
import { TaskContext } from "../contexts/TaskContext";
import { useTasks } from "./useTasks";
import { useTaskSelection } from "./useTaskSelection";
import { showKeyboardShortcutFeedback } from "../utils/notificationUtils";
import { KEYBOARD_SHORTCUTS } from "../constants/keyboardShortcuts";
import { logDebug, logInfo, logWarning } from "../utils/logUtils";

// フォーカス要素かどうかを判定する (検索ボックスなど)
const isFormElement = (element: Element | null): boolean => {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  );
};

export function useKeyboardShortcuts() {
  const { 
    isTaskDialogOpen, 
    isNoteDialogOpen, 
    isProjectDialogOpen, 
    isDeleteConfirmOpen, 
    isImportExportOpen,
    setIsAdvancedSearchOpen,
    setIsHelpOpen,
    setActiveView,
    selectedTaskId,
    setSelectedTaskId
  } = useContext(UIContext);

  const { tasks } = useContext(TaskContext);
  
  const { 
    createNewProject, 
    pasteTask,
    saveAllData, 
    openImportExport,
    addNewTask,
    confirmDeleteTask,
    openNotes,
    copyTask,
    copyTaskToClipboard,
    cutTask,
    editTask,
    toggleTaskCompletion,
    increasePriority,
    decreasePriority
  } = useTasks();

  const {
    navigateToAdjacentTask,
    navigateToParentTask,
    navigateToChildTask,
    focusSelectedTask
  } = useTaskSelection();

  // タスク追加処理 (Enter)
  const handleAddTask = useCallback(() => {
    if (!selectedTaskId) return false;
    
    const selectedTask = tasks.find(t => t.id === selectedTaskId);
    if (!selectedTask) return false;
    
    const taskIndex = tasks.findIndex(t => t.id === selectedTaskId);
    
    // 同じレベルのタスクを追加
    addNewTask(selectedTask.level, selectedTask.projectId, selectedTask.projectName, taskIndex);
    showKeyboardShortcutFeedback("Enter", "新規タスク追加");
    return true;
  }, [selectedTaskId, tasks, addNewTask]);

  // 子タスク追加処理 (Tab)
  const handleAddChildTask = useCallback(() => {
    if (!selectedTaskId) return false;
    
    const selectedTask = tasks.find(t => t.id === selectedTaskId);
    if (!selectedTask || selectedTask.isProject) return false;
    
    const taskIndex = tasks.findIndex(t => t.id === selectedTaskId);
    
    // 子タスク（レベル+1）を追加
    addNewTask(selectedTask.level + 1, selectedTask.projectId, selectedTask.projectName, taskIndex);
    showKeyboardShortcutFeedback("Tab", "新規子タスク追加");
    return true;
  }, [selectedTaskId, tasks, addNewTask]);

  // キーボードショートカットハンドラ
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // ダイアログが開いている場合はショートカットを無効化
    if (isTaskDialogOpen || isNoteDialogOpen || isProjectDialogOpen || 
        isDeleteConfirmOpen || isImportExportOpen) {
      return;
    }

    // フォーム要素内でのショートカットを無効化 (検索ボックスなど)
    if (isFormElement(document.activeElement)) {
      if (e.key === "Escape") {
        (document.activeElement as HTMLElement).blur();
      }
      return;
    }

    // ショートカットキーの処理
    // 1. Enter: 新規タスク追加
    if (e.key === "Enter" && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      if (handleAddTask()) {
        e.preventDefault();
        return;
      }
    }

    // 2. Tab: 新規子タスク追加
    if (e.key === "Tab" && !e.ctrlKey && !e.altKey) {
      if (handleAddChildTask()) {
        e.preventDefault();
        return;
      }
    }

    // 3. Delete: タスク削除
    if (e.key === "Delete" && selectedTaskId) {
      e.preventDefault();
      confirmDeleteTask(selectedTaskId);
      showKeyboardShortcutFeedback("Delete", "タスク削除");
      return;
    }

    // 4. Ctrl+N: メモを開く
    if (e.key === "n" && e.ctrlKey && !e.shiftKey && selectedTaskId) {
      e.preventDefault();
      openNotes(selectedTaskId);
      showKeyboardShortcutFeedback("Ctrl+N", "メモを開く");
      return;
    }

    // 5. Ctrl+Shift+C: タスクコピー
    if (e.key === "c" && e.ctrlKey && e.shiftKey && selectedTaskId) {
      e.preventDefault();
      copyTask(selectedTaskId);
      showKeyboardShortcutFeedback("Ctrl+Shift+C", "タスクコピー");
      return;
    }

    // 6. Ctrl+C: クリップボードにコピー (タスク選択時のみ)
    if (e.key === "c" && e.ctrlKey && !e.shiftKey && selectedTaskId && 
        !window.getSelection()?.toString()) {
      e.preventDefault();
      copyTaskToClipboard(selectedTaskId);
      showKeyboardShortcutFeedback("Ctrl+C", "クリップボードにコピー");
      return;
    }

    // 7. Ctrl+X: タスク切り取り
    if (e.key === "x" && e.ctrlKey && !e.shiftKey && selectedTaskId && 
        !window.getSelection()?.toString()) {
      e.preventDefault();
      cutTask(selectedTaskId);
      showKeyboardShortcutFeedback("Ctrl+X", "タスク切り取り");
      return;
    }

    // 8. Ctrl+V: クリップボードからペースト
    if (e.key === "v" && e.ctrlKey && selectedTaskId) {
      e.preventDefault();
      pasteTask();
      showKeyboardShortcutFeedback("Ctrl+V", "タスクをペースト");
      return;
    }

    // 9. Ctrl+E: タスク編集
    if (e.key === "e" && e.ctrlKey && !e.shiftKey && selectedTaskId) {
      e.preventDefault();
      editTask(selectedTaskId);
      showKeyboardShortcutFeedback("Ctrl+E", "タスク編集");
      return;
    }

    // 10. Space: 完了/未完了切替
    if (e.key === " " && !e.ctrlKey && !e.altKey && selectedTaskId) {
      e.preventDefault();
      toggleTaskCompletion(selectedTaskId);
      showKeyboardShortcutFeedback("Space", "完了/未完了切替");
      return;
    }

    // 11. +/=: 優先度を上げる
    if ((e.key === "+" || e.key === "=") && selectedTaskId) {
      e.preventDefault();
      increasePriority(selectedTaskId);
      showKeyboardShortcutFeedback("+", "優先度を上げる");
      return;
    }

    // 12. -: 優先度を下げる
    if (e.key === "-" && selectedTaskId) {
      e.preventDefault();
      decreasePriority(selectedTaskId);
      showKeyboardShortcutFeedback("-", "優先度を下げる");
      return;
    }

    // 13-16. 矢印キー: タスク間の移動
    // 上へ移動
    if (e.key === "ArrowUp" && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      if (selectedTaskId) {
        navigateToAdjacentTask(selectedTaskId, "up");
        setTimeout(focusSelectedTask, 10);
      } else if (tasks.length > 0) {
        // タスク未選択時は最後のタスクを選択
        setSelectedTaskId(tasks[tasks.length - 1].id);
        setTimeout(focusSelectedTask, 10);
      }
      showKeyboardShortcutFeedback("↑", "上へ移動");
      return;
    }

    // 下へ移動
    if (e.key === "ArrowDown" && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      if (selectedTaskId) {
        navigateToAdjacentTask(selectedTaskId, "down");
        setTimeout(focusSelectedTask, 10);
      } else if (tasks.length > 0) {
        // タスク未選択時は最初のタスクを選択
        setSelectedTaskId(tasks[0].id);
        setTimeout(focusSelectedTask, 10);
      }
      showKeyboardShortcutFeedback("↓", "下へ移動");
      return;
    }

    // 親へ移動
    if (e.key === "ArrowLeft" && !e.ctrlKey && !e.altKey && selectedTaskId) {
      e.preventDefault();
      navigateToParentTask(selectedTaskId);
      setTimeout(focusSelectedTask, 10);
      showKeyboardShortcutFeedback("←", "親へ移動");
      return;
    }

    // 子へ移動
    if (e.key === "ArrowRight" && !e.ctrlKey && !e.altKey && selectedTaskId) {
      e.preventDefault();
      navigateToChildTask(selectedTaskId);
      setTimeout(focusSelectedTask, 10);
      showKeyboardShortcutFeedback("→", "子へ移動");
      return;
    }

    // 17. Ctrl+Shift+N: 新規プロジェクト
    if (e.key === "n" && e.ctrlKey && e.shiftKey) {
      e.preventDefault();
      createNewProject();
      showKeyboardShortcutFeedback("Ctrl+Shift+N", "新規プロジェクト作成");
      return;
    }

    // 18. Ctrl+F: 検索
    if (e.key === "f" && e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.focus();
        showKeyboardShortcutFeedback("Ctrl+F", "検索");
      } else {
        logWarning("検索入力欄が見つかりません");
      }
      return;
    }

    // 19. Ctrl+S: データ保存
    if (e.key === "s" && e.ctrlKey) {
      e.preventDefault();
      saveAllData();
      showKeyboardShortcutFeedback("Ctrl+S", "データ保存");
      return;
    }

    // 20. Ctrl+Shift+F: 高度な検索
    if (e.key === "f" && e.ctrlKey && e.shiftKey) {
      e.preventDefault();
      setIsAdvancedSearchOpen(true);
      showKeyboardShortcutFeedback("Ctrl+Shift+F", "高度な検索");
      return;
    }

    // 21. Ctrl+Shift+E: インポート/エクスポート
    if (e.key === "e" && e.ctrlKey && e.shiftKey) {
      e.preventDefault();
      openImportExport();
      showKeyboardShortcutFeedback("Ctrl+Shift+E", "インポート/エクスポート");
      return;
    }

    // 22. F1: ヘルプ
    if (e.key === "F1") {
      e.preventDefault();
      setIsHelpOpen(true);
      showKeyboardShortcutFeedback("F1", "ヘルプを表示");
      return;
    }

    // 23-27. 1-5: ビュー切り替え
    if (e.key >= "1" && e.key <= "5" && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      const viewMap: Record<string, string> = {
        "1": "project",
        "2": "timeline",
        "3": "table",
        "4": "today",
        "5": "kanban",
      };
      
      const newView = viewMap[e.key];
      if (newView) {
        e.preventDefault();
        setActiveView(newView);
        const viewNames: Record<string, string> = {
          "project": "プロジェクト",
          "timeline": "タイムライン",
          "table": "テーブル",
          "today": "今日のタスク",
          "kanban": "かんばん",
        };
        showKeyboardShortcutFeedback(e.key, `${viewNames[newView]}ビューに切り替え`);
        return;
      }
    }
  }, [
    isTaskDialogOpen, isNoteDialogOpen, isProjectDialogOpen, isDeleteConfirmOpen, isImportExportOpen,
    selectedTaskId, tasks, setSelectedTaskId,
    handleAddTask, handleAddChildTask,
    confirmDeleteTask, openNotes, copyTask, copyTaskToClipboard, cutTask, 
    pasteTask, editTask, toggleTaskCompletion, increasePriority, decreasePriority,
    navigateToAdjacentTask, navigateToParentTask, navigateToChildTask, focusSelectedTask,
    createNewProject, saveAllData, openImportExport,
    setIsAdvancedSearchOpen, setIsHelpOpen, setActiveView
  ]);

  // キーボードイベントリスナーの設定
  useEffect(() => {
    logInfo("キーボードショートカット機能を初期化しました");
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      logInfo("キーボードショートカット機能を終了しました");
    };
  }, [handleKeyDown]);

  // デバッグ情報
  useEffect(() => {
    logDebug(`利用可能なキーボードショートカット: ${KEYBOARD_SHORTCUTS.length}個`);
  }, []);
}
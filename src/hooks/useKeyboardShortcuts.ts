import { useEffect, useContext } from "react"
import { UIContext } from "../contexts/UIContext"
import { useTasks } from "./useTasks"
import { toast } from "@/components/ui/use-toast"

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
  } = useContext(UIContext)
  
  const { 
    createNewProject, 
    pasteTask, 
    saveAllData, 
    openImportExport, 
    clipboard 
  } = useTasks()

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // ダイアログが開いている場合はショートカットを無効化
      if (isTaskDialogOpen || isNoteDialogOpen || isProjectDialogOpen || isDeleteConfirmOpen || isImportExportOpen) {
        return
      }

      // Ctrl+Shift+N: 新規プロジェクト作成
      if (e.key === "n" && e.ctrlKey && e.shiftKey) {
        e.preventDefault()
        createNewProject()
        
        // 視覚的なフィードバック
        showKeyboardShortcutFeedback("Ctrl+Shift+N", "新規プロジェクト作成")
      }

      // Ctrl+V: クリップボードからペースト
      if (e.key === "v" && e.ctrlKey && clipboard && selectedTaskId) {
        e.preventDefault()
        pasteTask()
        
        // 視覚的なフィードバック
        showKeyboardShortcutFeedback("Ctrl+V", "タスクをペースト")
      }
      
      // Ctrl+F: 検索フォーカス
      if (e.key === "f" && e.ctrlKey && !e.shiftKey) {
        e.preventDefault()
        document.getElementById('search-input')?.focus()
        
        // 視覚的なフィードバック
        showKeyboardShortcutFeedback("Ctrl+F", "検索")
      }
      
      // Ctrl+S: データ保存
      if (e.key === "s" && e.ctrlKey) {
        e.preventDefault()
        saveAllData()
        
        // 視覚的なフィードバック
        showKeyboardShortcutFeedback("Ctrl+S", "データ保存")
      }
      
      // Ctrl+Shift+F: 高度な検索
      if (e.key === "f" && e.ctrlKey && e.shiftKey) {
        e.preventDefault()
        setIsAdvancedSearchOpen(true)
        
        // 視覚的なフィードバック
        showKeyboardShortcutFeedback("Ctrl+Shift+F", "高度な検索")
      }
      
      // Ctrl+Shift+E: エクスポート/インポート
      if (e.key === "e" && e.ctrlKey && e.shiftKey) {
        e.preventDefault()
        openImportExport()
        
        // 視覚的なフィードバック
        showKeyboardShortcutFeedback("Ctrl+Shift+E", "インポート/エクスポート")
      }
      
      // F1: ヘルプ
      if (e.key === "F1") {
        e.preventDefault()
        setIsHelpOpen(true)
        
        // 視覚的なフィードバック
        showKeyboardShortcutFeedback("F1", "ヘルプを表示")
      }
      
      // 1-5: ビュー切り替え
      if (e.key >= "1" && e.key <= "5" && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        const viewMap: Record<string, string> = {
          "1": "project",
          "2": "timeline",
          "3": "table",
          "4": "today",
          "5": "kanban",
        }
        
        const newView = viewMap[e.key]
        if (newView) {
          e.preventDefault()
          setActiveView(newView)
          
          // 視覚的なフィードバック
          showKeyboardShortcutFeedback(e.key, `${newView}ビューに切り替え`)
        }
      }
    }

    document.addEventListener("keydown", handleGlobalKeyDown)
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown)
    }
  }, [
    clipboard, 
    isTaskDialogOpen, 
    isNoteDialogOpen, 
    isProjectDialogOpen, 
    isDeleteConfirmOpen, 
    isImportExportOpen, 
    selectedTaskId,
    createNewProject,
    pasteTask,
    saveAllData,
    openImportExport,
    setIsAdvancedSearchOpen,
    setIsHelpOpen,
    setActiveView
  ])

  // キーボードショートカット使用時の視覚的フィードバック
  const showKeyboardShortcutFeedback = (shortcut: string, action: string) => {
    toast({
      title: `${shortcut}`,
      description: action,
      duration: 2000,
    })
  }
}
"use client"

import { useContext, useState } from "react"
import { Database, Plus, Calendar, Download, HelpCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { UIContext } from "../../contexts/UIContext"
import { TaskContext } from "../../contexts/TaskContext"
import { useTasks } from "../../hooks/useTasks"
import { showInfoToast } from "../../utils/notificationUtils"
import ConfirmDialog from "../common/ConfirmDialog"

export default function Header() {
  const { setActiveView, setIsProjectDialogOpen, setIsImportExportOpen, setIsHelpOpen } = useContext(UIContext)
  const { tasks, resetToInitialData, isLoading } = useContext(TaskContext)
  const { createNewProject, saveAllData } = useTasks()
  const [isResetting, setIsResetting] = useState(false)
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)

  // 今日のタスク数を取得
  const getTodayTasksCount = () => {
    const today = new Date().toISOString().split("T")[0]
    return tasks.filter((task) => 
      !task.isProject && 
      !task.completed && 
      task.startDate <= today && 
      task.dueDate >= today
    ).length
  }

  // 初期データにリセットする
  const handleReset = async () => {
    setIsResetting(true)
    try {
      await resetToInitialData()
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <>
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center">
            <Database size={22} className="mr-2" />
            理想的なToDoリスト
          </h1>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white" onClick={() => setActiveView("today")}>
                    <Calendar size={18} className="mr-1" />
                    <span className="bg-white text-blue-600 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {getTodayTasksCount()}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>今日のタスク</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white" onClick={createNewProject} disabled={isLoading}>
                    <Plus size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>新規プロジェクト (Ctrl+Shift+N)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-white" 
                    onClick={() => {
                      saveAllData()
                      showInfoToast("データを保存しました", "すべてのデータが保存されました")
                    }} 
                    disabled={isLoading}
                  >
                    <Database size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>データ保存 (Ctrl+S)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white" onClick={() => setIsImportExportOpen(true)} disabled={isLoading}>
                    <Download size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>インポート/エクスポート (Ctrl+Shift+E)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white" onClick={() => setIsHelpOpen(true)}>
                    <HelpCircle size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>ヘルプ (F1)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {/* リセットボタン */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-white" 
                    onClick={() => setIsResetConfirmOpen(true)}
                    disabled={isLoading || isResetting}
                  >
                    <RefreshCw size={18} className={isResetting ? "animate-spin" : ""} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>初期データにリセット</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </header>

      {/* リセット確認ダイアログ */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleReset}
        title="データをリセットしますか？"
        description="全てのデータを初期状態にリセットします。この操作は元に戻せません。"
        confirmText="リセット"
        cancelText="キャンセル"
      />
    </>
  )
}
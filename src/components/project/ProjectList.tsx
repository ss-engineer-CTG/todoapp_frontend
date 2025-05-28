import React from 'react'
import { ChevronDown, ChevronRight, Plus, MoreHorizontal, Edit, Trash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useProjects } from '@/hooks/useProjects'
import { useTasks } from '@/hooks/useTasks'
import { useApp } from '@/hooks/useApp'
import ProjectForm from '@/components/project/ProjectForm'
import ErrorMessage from '@/components/common/ErrorMessage'
import LoadingSpinner from '@/components/common/LoadingSpinner'

const ProjectList: React.FC = () => {
  const { 
    projects, 
    selectedProjectId, 
    isEditingProject,
    editingProjectId,
    setSelectedProjectId, 
    toggleProject, 
    startEditProject, 
    deleteProject 
  } = useProjects()
  
  const { clearTaskSelection, error: taskError } = useTasks()
  const { activeArea, setActiveArea } = useApp()
  
  const [isAddingProject, setIsAddingProject] = React.useState(false)
  const [operationError, setOperationError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleProjectSelect = async (projectId: string) => {
    try {
      setIsLoading(true)
      setOperationError(null)

      if (!projectId) {
        setOperationError('プロジェクトIDが無効です')
        return
      }

      const result = setSelectedProjectId(projectId)
      if (!result.success) {
        setOperationError(result.message)
        return
      }

      const clearResult = clearTaskSelection()
      if (!clearResult.success) {
        console.warn('Failed to clear task selection:', clearResult.message)
      }

      setActiveArea('projects')
    } catch (error) {
      console.error('Error selecting project:', error)
      setOperationError('プロジェクトの選択中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddProject = () => {
    try {
      setOperationError(null)
      setIsAddingProject(true)
    } catch (error) {
      console.error('Error starting add project:', error)
      setOperationError('プロジェクト追加の開始中にエラーが発生しました')
    }
  }

  const handleProjectAdded = () => {
    try {
      setIsAddingProject(false)
      setOperationError(null)
    } catch (error) {
      console.error('Error finishing add project:', error)
      setOperationError('プロジェクト追加の完了中にエラーが発生しました')
    }
  }

  const handleProjectCanceled = () => {
    try {
      setIsAddingProject(false)
      setOperationError(null)
    } catch (error) {
      console.error('Error canceling add project:', error)
    }
  }

  const handleToggleProject = async (projectId: string, event: React.MouseEvent) => {
    try {
      event.stopPropagation()
      setOperationError(null)

      if (!projectId) {
        setOperationError('プロジェクトIDが無効です')
        return
      }

      const result = toggleProject(projectId)
      if (!result.success) {
        setOperationError(result.message)
      }
    } catch (error) {
      console.error('Error toggling project:', error)
      setOperationError('プロジェクトの展開切り替え中にエラーが発生しました')
    }
  }

  const handleEditProject = async (projectId: string, event: React.MouseEvent) => {
    try {
      event.stopPropagation()
      setOperationError(null)

      if (!projectId) {
        setOperationError('プロジェクトIDが無効です')
        return
      }

      const result = startEditProject(projectId)
      if (!result.success) {
        setOperationError(result.message)
      }
    } catch (error) {
      console.error('Error starting edit project:', error)
      setOperationError('プロジェクトの編集開始中にエラーが発生しました')
    }
  }

  const handleDeleteProject = async (projectId: string, event: React.MouseEvent) => {
    try {
      event.stopPropagation()
      setOperationError(null)

      if (!projectId) {
        setOperationError('プロジェクトIDが無効です')
        return
      }

      // 削除確認
      const confirmDelete = window.confirm('このプロジェクトを削除しますか？\n関連するタスクも削除されます。')
      if (!confirmDelete) {
        return
      }

      setIsLoading(true)
      const result = deleteProject(projectId)
      if (!result.success) {
        setOperationError(result.message)
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      setOperationError('プロジェクトの削除中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => {
    setOperationError(null)
  }

  if (projects.length === 0 && !isAddingProject) {
    return (
      <div className="w-64 border-r p-4 flex flex-col h-full bg-background">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">プロジェクト</h2>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-muted-foreground mb-4">
            プロジェクトがありません
          </p>
          <Button onClick={handleAddProject} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            最初のプロジェクトを作成
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "w-64 border-r p-4 flex flex-col h-full transition-colors",
        activeArea === 'projects' ? "bg-accent/40" : "bg-background"
      )}
      onClick={() => setActiveArea('projects')}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">プロジェクト</h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleAddProject} 
          title="新規プロジェクト追加"
          disabled={isAddingProject || isLoading}
        >
          {isLoading ? (
            <LoadingSpinner size="sm" showMessage={false} />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* エラー表示 */}
      {(operationError || taskError) && (
        <div className="mb-4">
          <ErrorMessage
            type="error"
            message={operationError || taskError || ''}
            onClose={clearError}
            className="text-sm"
          />
        </div>
      )}

      {/* 新規プロジェクト追加フォーム */}
      {isAddingProject && (
        <div className="mb-4">
          <ProjectForm 
            onSave={handleProjectAdded} 
            onCancel={handleProjectCanceled} 
          />
        </div>
      )}

      {/* プロジェクト一覧 */}
      <div className="space-y-1 overflow-y-auto flex-grow">
        {projects.map((project) => (
          <div key={project.id}>
            {/* プロジェクト項目 */}
            <div
              className={cn(
                "flex items-center p-2 rounded-md cursor-pointer group transition-colors",
                selectedProjectId === project.id 
                  ? "bg-accent ring-1 ring-primary" 
                  : "hover:bg-accent/50",
                isLoading && "opacity-50 pointer-events-none"
              )}
              onClick={() => handleProjectSelect(project.id)}
              style={{
                borderLeft: `4px solid ${project.color}`,
              }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 mr-1 flex-shrink-0"
                onClick={(e) => handleToggleProject(project.id, e)}
                disabled={isLoading}
                title={project.expanded ? "プロジェクトを折りたたむ" : "プロジェクトを展開"}
              >
                {project.expanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>

              <span className="flex-grow truncate font-medium" title={project.name}>
                {project.name}
              </span>

              {/* プロジェクトメニュー */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                    disabled={isLoading}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={(e) => handleEditProject(project.id, e)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    編集
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => handleDeleteProject(project.id, e)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    削除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* 編集フォーム */}
            {isEditingProject && editingProjectId === project.id && (
              <div className="ml-6 mt-2 mb-2">
                <ProjectForm 
                  projectId={project.id}
                  onSave={handleProjectAdded} 
                  onCancel={handleProjectCanceled} 
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* フッター情報 */}
      <div className="mt-4 pt-4 border-t">
        <div className="text-xs text-muted-foreground">
          {projects.length}個のプロジェクト
        </div>
      </div>
    </div>
  )
}

export default ProjectList
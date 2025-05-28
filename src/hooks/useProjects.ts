import { useProjectContext } from '@/context/ProjectContext'
import { useTaskContext } from '@/context/TaskContext'
import type { ProjectFormData } from '@/types/project'
import { validateProject } from '@/utils/projectUtils'

export function useProjects() {
  const { state: projectState, dispatch: projectDispatch } = useProjectContext()
  const { dispatch: taskDispatch } = useTaskContext()

  const addProject = (data: ProjectFormData) => {
    try {
      // バリデーション
      const validation = validateProject(data)
      if (!validation.isValid) {
        console.warn('Project validation failed:', validation.errors)
        return { success: false, message: validation.errors[0]?.message || 'プロジェクトの情報が正しくありません' }
      }

      projectDispatch({ type: 'ADD_PROJECT', payload: data })
      return { success: true, message: 'プロジェクトを作成しました' }
    } catch (error) {
      console.error('Error adding project:', error)
      return { success: false, message: 'プロジェクトの作成中にエラーが発生しました' }
    }
  }

  const updateProject = (id: string, updates: Partial<ProjectFormData>) => {
    try {
      if (!id) {
        console.warn('updateProject: id is required')
        return { success: false, message: 'プロジェクトIDが指定されていません' }
      }

      // プロジェクトの存在チェック
      const projectExists = projectState.projects.some(p => p.id === id)
      if (!projectExists) {
        console.warn('updateProject: project not found:', id)
        return { success: false, message: 'プロジェクトが見つかりません' }
      }

      // バリデーション（更新データに対して）
      if (updates.name !== undefined || updates.description !== undefined) {
        const currentProject = projectState.projects.find(p => p.id === id)
        const dataToValidate = {
          name: updates.name || currentProject?.name || '',
          color: updates.color || currentProject?.color || '#f97316',
          description: updates.description || currentProject?.description || ''
        }
        
        const validation = validateProject(dataToValidate)
        if (!validation.isValid) {
          console.warn('Project update validation failed:', validation.errors)
          return { success: false, message: validation.errors[0]?.message || 'プロジェクトの情報が正しくありません' }
        }
      }

      projectDispatch({ type: 'UPDATE_PROJECT', payload: { id, updates } })
      return { success: true, message: 'プロジェクトを更新しました' }
    } catch (error) {
      console.error('Error updating project:', error)
      return { success: false, message: 'プロジェクトの更新中にエラーが発生しました' }
    }
  }

  const deleteProject = (id: string) => {
    try {
      if (!id) {
        console.warn('deleteProject: id is required')
        return { success: false, message: 'プロジェクトIDが指定されていません' }
      }

      // プロジェクトの存在チェック
      const projectExists = projectState.projects.some(p => p.id === id)
      if (!projectExists) {
        console.warn('deleteProject: project not found:', id)
        return { success: false, message: 'プロジェクトが見つかりません' }
      }

      // 最後のプロジェクトの削除を防ぐ
      if (projectState.projects.length <= 1) {
        return { success: false, message: '最後のプロジェクトは削除できません' }
      }

      // プロジェクトに関連するタスクも削除
      // TODO: タスクの削除確認ダイアログを表示する仕組みを追加
      taskDispatch({ type: 'DELETE_TASKS', payload: [] }) // 実装時にプロジェクトIDでフィルタ

      projectDispatch({ type: 'DELETE_PROJECT', payload: id })
      return { success: true, message: 'プロジェクトを削除しました' }
    } catch (error) {
      console.error('Error deleting project:', error)
      return { success: false, message: 'プロジェクトの削除中にエラーが発生しました' }
    }
  }

  const setSelectedProjectId = (id: string) => {
    try {
      if (!id) {
        console.warn('setSelectedProjectId: id is required')
        return { success: false, message: 'プロジェクトIDが指定されていません' }
      }

      // プロジェクトの存在チェック
      const projectExists = projectState.projects.some(p => p.id === id)
      if (!projectExists) {
        console.warn('setSelectedProjectId: project not found:', id)
        return { success: false, message: 'プロジェクトが見つかりません' }
      }

      projectDispatch({ type: 'SET_SELECTED_PROJECT', payload: id })
      // タスク選択をクリア
      taskDispatch({ type: 'CLEAR_TASK_SELECTION' })
      return { success: true, message: 'プロジェクトを選択しました' }
    } catch (error) {
      console.error('Error setting selected project:', error)
      return { success: false, message: 'プロジェクトの選択中にエラーが発生しました' }
    }
  }

  const toggleProject = (id: string) => {
    try {
      if (!id) {
        console.warn('toggleProject: id is required')
        return { success: false, message: 'プロジェクトIDが指定されていません' }
      }

      // プロジェクトの存在チェック
      const projectExists = projectState.projects.some(p => p.id === id)
      if (!projectExists) {
        console.warn('toggleProject: project not found:', id)
        return { success: false, message: 'プロジェクトが見つかりません' }
      }

      projectDispatch({ type: 'TOGGLE_PROJECT', payload: id })
      return { success: true, message: 'プロジェクトの展開状態を切り替えました' }
    } catch (error) {
      console.error('Error toggling project:', error)
      return { success: false, message: 'プロジェクトの展開切り替え中にエラーが発生しました' }
    }
  }

  const startEditProject = (id: string) => {
    try {
      if (!id) {
        console.warn('startEditProject: id is required')
        return { success: false, message: 'プロジェクトIDが指定されていません' }
      }

      // プロジェクトの存在チェック
      const projectExists = projectState.projects.some(p => p.id === id)
      if (!projectExists) {
        console.warn('startEditProject: project not found:', id)
        return { success: false, message: 'プロジェクトが見つかりません' }
      }

      projectDispatch({ type: 'START_EDIT_PROJECT', payload: id })
      return { success: true, message: 'プロジェクトの編集を開始しました' }
    } catch (error) {
      console.error('Error starting project edit:', error)
      return { success: false, message: 'プロジェクトの編集開始中にエラーが発生しました' }
    }
  }

  const stopEditProject = () => {
    try {
      projectDispatch({ type: 'STOP_EDIT_PROJECT' })
      return { success: true, message: 'プロジェクトの編集を終了しました' }
    } catch (error) {
      console.error('Error stopping project edit:', error)
      return { success: false, message: 'プロジェクトの編集終了中にエラーが発生しました' }
    }
  }

  // タスクの展開/折りたたみ（タイムライン表示用）
  const toggleTask = (projectId: string, taskId: string) => {
    try {
      if (!projectId || !taskId) {
        console.warn('toggleTask: both projectId and taskId are required')
        return { success: false, message: 'プロジェクトIDとタスクIDが必要です' }
      }

      // TaskContextを通じてタスクの展開状態を切り替え
      taskDispatch({ 
        type: 'UPDATE_TASK', 
        payload: { 
          id: taskId, 
          updates: { expanded: true } // TODO: 現在の状態を取得して切り替え
        } 
      })
      
      return { success: true, message: 'タスクの展開状態を切り替えました' }
    } catch (error) {
      console.error('Error toggling task:', error)
      return { success: false, message: 'タスクの展開切り替え中にエラーが発生しました' }
    }
  }

  // プロジェクトの統計情報を取得
  const getProjectStats = (projectId: string) => {
    try {
      // TODO: TaskContextからタスク情報を取得して統計を計算
      return {
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        overdueComboTasks: 0,
        completionRate: 0
      }
    } catch (error) {
      console.error('Error getting project stats:', error)
      return null
    }
  }

  return {
    projects: projectState.projects,
    selectedProjectId: projectState.selectedProjectId,
    isEditingProject: projectState.isEditingProject,
    editingProjectId: projectState.editingProjectId,
    addProject,
    updateProject,
    deleteProject,
    setSelectedProjectId,
    toggleProject,
    startEditProject,
    stopEditProject,
    toggleTask,
    getProjectStats,
  }
}
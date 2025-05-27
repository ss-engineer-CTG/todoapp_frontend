import { useProjectContext } from '@/context/ProjectContext'
import { useTaskContext } from '@/context/TaskContext'
import type { ProjectFormData } from '@/types/project'

export function useProjects() {
  const { state: projectState, dispatch: projectDispatch } = useProjectContext()
  const { dispatch: taskDispatch } = useTaskContext()

  const addProject = (data: ProjectFormData) => {
    projectDispatch({ type: 'ADD_PROJECT', payload: data })
  }

  const updateProject = (id: string, updates: Partial<ProjectFormData>) => {
    projectDispatch({ type: 'UPDATE_PROJECT', payload: { id, updates } })
  }

  const deleteProject = (id: string) => {
    // プロジェクトに関連するタスクも削除
    taskDispatch({ type: 'DELETE_TASKS', payload: [] }) // TODO: プロジェクトIDでフィルタ
    projectDispatch({ type: 'DELETE_PROJECT', payload: id })
  }

  const setSelectedProjectId = (id: string) => {
    projectDispatch({ type: 'SET_SELECTED_PROJECT', payload: id })
    // タスク選択をクリア
    taskDispatch({ type: 'CLEAR_TASK_SELECTION' })
  }

  const toggleProject = (id: string) => {
    projectDispatch({ type: 'TOGGLE_PROJECT', payload: id })
  }

  const startEditProject = (id: string) => {
    projectDispatch({ type: 'START_EDIT_PROJECT', payload: id })
  }

  const stopEditProject = () => {
    projectDispatch({ type: 'STOP_EDIT_PROJECT' })
  }

  // タスクの展開/折りたたみ（タイムライン表示用）
  const toggleTask = (projectId: string, taskId: string) => {
    // TaskContextを通じてタスクの展開状態を切り替え
    // TODO: 実装
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
  }
}
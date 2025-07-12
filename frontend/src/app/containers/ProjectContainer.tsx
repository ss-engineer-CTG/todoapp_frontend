// システムプロンプト準拠：プロジェクト関連ロジック統合（リファクタリング：責任分離）
// リファクタリング対象：AppContainer.tsx からプロジェクト関連処理を抽出

// React is not directly used in this container hook
import { Project } from '@core/types'
import { logger } from '@core/utils'

export interface ProjectContainerProps {
  projects: Project[]
  selectedProjectId: string
  onProjectSelect: (projectId: string) => void
  onToggleProject: (projectId: string) => Promise<void>
  apiActions: {
    createProject: any
    updateProject: any
    deleteProject: any
  }
}

export interface ProjectContainerReturn {
  // プロジェクト操作ハンドラー
  handleProjectSelect: (projectId: string) => void
  handleToggleProject: (projectId: string) => Promise<void>
  
  // API Actions
  projectApiActions: {
    createProject: any
    updateProject: any
    deleteProject: any
  }
}

export const useProjectContainer = (props: ProjectContainerProps): ProjectContainerReturn => {
  const {
    projects,
    selectedProjectId,
    onProjectSelect,
    onToggleProject,
    apiActions
  } = props

  // ===== プロジェクト選択ハンドラー =====
  const handleProjectSelect = (projectId: string) => {
    logger.info('Project selection requested', { 
      from: selectedProjectId, 
      to: projectId 
    })
    onProjectSelect(projectId)
  }

  // ===== プロジェクト展開/縮小ハンドラー =====
  const handleToggleProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) {
      logger.warn('Project not found for toggle', { projectId })
      return
    }

    logger.info('Project toggle requested', { 
      projectId, 
      currentState: project.collapsed,
      newState: !project.collapsed
    })
    
    await onToggleProject(projectId)
  }

  return {
    // プロジェクト操作ハンドラー
    handleProjectSelect,
    handleToggleProject,
    
    // API Actions
    projectApiActions: apiActions
  }
}
// スマートプロジェクト選択フック
// 行選択状態に基づいて自動的にプロジェクトを選択し、シームレスなUXを提供

import { useState, useCallback, useEffect, useMemo } from 'react'
import { Task, Project } from '@core/types'
import { logger } from '@core/utils'
import { useProjectContext } from './useProjectContext'

export interface SmartProjectSelectionState {
  // 現在のアクティブプロジェクト
  activeProjectId: string | null
  activeProject: Project | null
  
  // 自動選択状態
  isAutoSelected: boolean
  selectionReason: 'manual' | 'row-selection' | 'last-active' | 'default'
  
  // 選択の信頼度
  confidence: 'high' | 'medium' | 'low'
  
  // 変更履歴
  lastActiveProjectId: string | null
  selectionHistory: Array<{
    projectId: string | null
    reason: string
    timestamp: Date
  }>
}

export interface UseSmartProjectSelectionProps {
  selectedTaskIds: Set<string>
  tasks: Task[]
  projects: Project[]
  initialActiveProjectId?: string | null
  onActiveProjectChange?: (projectId: string | null, reason: string) => void
}

export interface UseSmartProjectSelectionReturn {
  // 現在の状態
  state: SmartProjectSelectionState
  
  // プロジェクト操作
  setActiveProject: (projectId: string | null, reason?: string) => void
  resetToDefault: () => void
  
  // 自動選択制御
  enableAutoSelection: () => void
  disableAutoSelection: () => void
  
  // コンテキスト情報
  getContextInfo: () => {
    targetProject: Project | null
    contextDescription: string
    isValidContext: boolean
  }
  
  // 状態確認
  isReady: boolean
  shouldShowWarning: boolean
}

export const useSmartProjectSelection = (
  props: UseSmartProjectSelectionProps
): UseSmartProjectSelectionReturn => {
  const {
    selectedTaskIds,
    tasks,
    projects,
    initialActiveProjectId = null,
    onActiveProjectChange
  } = props
  
  // 内部状態
  const [state, setState] = useState<SmartProjectSelectionState>(() => ({
    activeProjectId: initialActiveProjectId,
    activeProject: initialActiveProjectId ? 
      projects.find(p => p.id === initialActiveProjectId) || null : null,
    isAutoSelected: false,
    selectionReason: initialActiveProjectId ? 'manual' : 'default',
    confidence: initialActiveProjectId ? 'high' : 'low',
    lastActiveProjectId: initialActiveProjectId,
    selectionHistory: []
  }))
  
  // プロジェクトコンテキスト情報を取得
  const projectContext = useProjectContext({
    selectedTaskIds,
    tasks,
    projects,
    lastActiveProjectId: state.lastActiveProjectId
  })
  
  // プロジェクト設定の更新
  const updateActiveProject = useCallback((
    projectId: string | null, 
    reason: SmartProjectSelectionState['selectionReason'],
    isAuto: boolean = false
  ) => {
    const project = projectId ? projects.find(p => p.id === projectId) || null : null
    
    setState(prev => ({
      ...prev,
      activeProjectId: projectId,
      activeProject: project,
      isAutoSelected: isAuto,
      selectionReason: reason,
      confidence: isAuto ? projectContext.contextInfo.confidence : 'high',
      lastActiveProjectId: projectId || prev.lastActiveProjectId,
      selectionHistory: [
        ...prev.selectionHistory.slice(-9), // 最新10件のみ保持
        {
          projectId,
          reason: `${reason}${isAuto ? ' (auto)' : ''}`,
          timestamp: new Date()
        }
      ]
    }))
    
    logger.info('Active project updated', {
      projectId,
      projectName: project?.name,
      reason,
      isAuto,
      confidence: isAuto ? projectContext.contextInfo.confidence : 'high'
    })
    
    // 外部コールバック通知
    if (onActiveProjectChange) {
      onActiveProjectChange(projectId, reason)
    }
  }, [projects, projectContext.contextInfo.confidence, onActiveProjectChange])
  
  // 手動プロジェクト設定
  const setActiveProject = useCallback((projectId: string | null, reason: string = 'manual') => {
    updateActiveProject(projectId, 'manual', false)
  }, [updateActiveProject])
  
  // デフォルトリセット
  const resetToDefault = useCallback(() => {
    const defaultProject = projects[0] || null
    updateActiveProject(defaultProject?.id || null, 'default', false)
  }, [projects, updateActiveProject])
  
  // 自動選択機能
  const [autoSelectionEnabled, setAutoSelectionEnabled] = useState(true)
  
  const enableAutoSelection = useCallback(() => {
    setAutoSelectionEnabled(true)
    logger.info('Auto selection enabled')
  }, [])
  
  const disableAutoSelection = useCallback(() => {
    setAutoSelectionEnabled(false)
    logger.info('Auto selection disabled')
  }, [])
  
  // 行選択変更時の自動プロジェクト更新
  useEffect(() => {
    if (!autoSelectionEnabled) return
    
    const detectedProject = projectContext.getTargetProjectForTaskCreation()
    const currentProjectId = state.activeProjectId
    
    // プロジェクトが変更された場合のみ更新
    if (detectedProject && detectedProject.id !== currentProjectId) {
      // 信頼度が高い場合のみ自動更新
      if (projectContext.contextInfo.confidence === 'high' || 
          projectContext.contextInfo.confidence === 'medium') {
        updateActiveProject(detectedProject.id, 'row-selection', true)
      }
    }
    
    // 選択がなくなった場合、最後のアクティブプロジェクトを維持
    else if (selectedTaskIds.size === 0 && !currentProjectId && state.lastActiveProjectId) {
      updateActiveProject(state.lastActiveProjectId, 'last-active', true)
    }
  }, [
    selectedTaskIds, 
    projectContext, 
    state.activeProjectId, 
    state.lastActiveProjectId,
    autoSelectionEnabled,
    updateActiveProject
  ])
  
  // プロジェクト一覧変更時の整合性チェック
  useEffect(() => {
    if (state.activeProjectId && !projects.find(p => p.id === state.activeProjectId)) {
      logger.warn('Active project no longer exists, resetting to default')
      resetToDefault()
    }
  }, [projects, state.activeProjectId, resetToDefault])
  
  // コンテキスト情報の取得
  const getContextInfo = useCallback(() => {
    const targetProject = projectContext.getTargetProjectForTaskCreation()
    return {
      targetProject: targetProject || state.activeProject,
      contextDescription: projectContext.getContextDescription(),
      isValidContext: projectContext.isValidContext()
    }
  }, [projectContext, state.activeProject])
  
  // 状態確認
  const isReady = useMemo(() => {
    return projects.length > 0 && (state.activeProject !== null || projectContext.contextInfo.targetProject !== null)
  }, [projects.length, state.activeProject, projectContext.contextInfo.targetProject])
  
  const shouldShowWarning = useMemo(() => {
    return projectContext.contextInfo.confidence === 'low' || 
           (selectedTaskIds.size > 0 && !projectContext.isValidContext())
  }, [projectContext, selectedTaskIds.size])
  
  return {
    state,
    setActiveProject,
    resetToDefault,
    enableAutoSelection,
    disableAutoSelection,
    getContextInfo,
    isReady,
    shouldShowWarning
  }
}
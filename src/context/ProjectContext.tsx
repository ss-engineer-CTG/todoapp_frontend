import React, { createContext, useContext, useReducer } from 'react'
import type { Project, ProjectState, ProjectAction } from '@/types/project'
import { generateId } from '@/utils/taskUtils'

const initialState: ProjectState = {
  projects: [
    {
      id: 'p1',
      name: '仕事',
      color: '#f97316',
      expanded: true,
      collapsed: false,
    },
    {
      id: 'p2',
      name: '個人',
      color: '#8b5cf6',
      expanded: true,
      collapsed: false,
    },
    {
      id: 'p3',
      name: '学習',
      color: '#10b981',
      expanded: true,
      collapsed: false,
    },
  ],
  selectedProjectId: 'p1',
  isEditingProject: false,
  editingProjectId: null,
}

function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  try {
    switch (action.type) {
      case 'SET_PROJECTS':
        if (!Array.isArray(action.payload)) {
          console.warn('SET_PROJECTS: payload is not an array:', action.payload)
          return state
        }
        return { ...state, projects: action.payload }

      case 'ADD_PROJECT':
        if (!action.payload?.name) {
          console.warn('ADD_PROJECT: invalid payload:', action.payload)
          return state
        }
        const newProject: Project = {
          id: generateId('p'),
          name: action.payload.name.trim(),
          color: action.payload.color || '#f97316',
          expanded: true,
          collapsed: false,
          description: action.payload.description || '',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        return {
          ...state,
          projects: [...state.projects, newProject],
          selectedProjectId: newProject.id,
        }

      case 'UPDATE_PROJECT':
        if (!action.payload?.id) {
          console.warn('UPDATE_PROJECT: invalid payload:', action.payload)
          return state
        }
        return {
          ...state,
          projects: state.projects.map(project =>
            project.id === action.payload.id
              ? { 
                  ...project, 
                  ...action.payload.updates,
                  updatedAt: new Date()
                }
              : project
          ),
        }

      case 'DELETE_PROJECT':
        if (!action.payload) {
          console.warn('DELETE_PROJECT: invalid payload:', action.payload)
          return state
        }
        const remainingProjects = state.projects.filter(project => project.id !== action.payload)
        const newSelectedId = state.selectedProjectId === action.payload
          ? (remainingProjects[0]?.id || '')
          : state.selectedProjectId
        
        return {
          ...state,
          projects: remainingProjects,
          selectedProjectId: newSelectedId,
        }

      case 'SET_SELECTED_PROJECT':
        if (!action.payload) {
          console.warn('SET_SELECTED_PROJECT: invalid payload:', action.payload)
          return state
        }
        // プロジェクトが存在するかチェック
        const projectExists = state.projects.some(p => p.id === action.payload)
        if (!projectExists) {
          console.warn('SET_SELECTED_PROJECT: project does not exist:', action.payload)
          return state
        }
        return { ...state, selectedProjectId: action.payload }

      case 'TOGGLE_PROJECT':
        if (!action.payload) {
          console.warn('TOGGLE_PROJECT: invalid payload:', action.payload)
          return state
        }
        return {
          ...state,
          projects: state.projects.map(project =>
            project.id === action.payload
              ? { ...project, expanded: !project.expanded, updatedAt: new Date() }
              : project
          ),
        }

      case 'START_EDIT_PROJECT':
        if (!action.payload) {
          console.warn('START_EDIT_PROJECT: invalid payload:', action.payload)
          return state
        }
        // プロジェクトが存在するかチェック
        const editProjectExists = state.projects.some(p => p.id === action.payload)
        if (!editProjectExists) {
          console.warn('START_EDIT_PROJECT: project does not exist:', action.payload)
          return state
        }
        return {
          ...state,
          isEditingProject: true,
          editingProjectId: action.payload,
        }

      case 'STOP_EDIT_PROJECT':
        return {
          ...state,
          isEditingProject: false,
          editingProjectId: null,
        }

      default:
        console.warn('projectReducer: unknown action type:', (action as any).type)
        return state
    }
  } catch (error) {
    console.error('Error in projectReducer:', error)
    return state
  }
}

interface ProjectContextType {
  state: ProjectState
  dispatch: React.Dispatch<ProjectAction>
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(projectReducer, initialState)

  // エラーハンドリング強化
  const enhancedDispatch = React.useCallback((action: ProjectAction) => {
    try {
      dispatch(action)
    } catch (error) {
      console.error('Error dispatching project action:', error)
    }
  }, [])

  const contextValue = React.useMemo(() => ({
    state,
    dispatch: enhancedDispatch,
  }), [state, enhancedDispatch])

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjectContext() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    const errorMessage = 'useProjectContext must be used within a ProjectProvider'
    console.error(errorMessage)
    throw new Error(errorMessage)
  }
  return context
}
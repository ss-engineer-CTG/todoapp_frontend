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
  switch (action.type) {
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload }
    case 'ADD_PROJECT':
      const newProject: Project = {
        id: generateId('p'),
        name: action.payload.name,
        color: action.payload.color,
        expanded: true,
        collapsed: false,
      }
      return {
        ...state,
        projects: [...state.projects, newProject],
        selectedProjectId: newProject.id,
      }
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id
            ? { ...project, ...action.payload.updates }
            : project
        ),
      }
    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
        selectedProjectId: state.selectedProjectId === action.payload
          ? (state.projects[0]?.id || '')
          : state.selectedProjectId,
      }
    case 'SET_SELECTED_PROJECT':
      return { ...state, selectedProjectId: action.payload }
    case 'TOGGLE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload
            ? { ...project, expanded: !project.expanded }
            : project
        ),
      }
    case 'START_EDIT_PROJECT':
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

  return (
    <ProjectContext.Provider value={{ state, dispatch }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProjectContext() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider')
  }
  return context
}
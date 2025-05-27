export interface Project {
    id: string
    name: string
    color: string
    expanded: boolean
    collapsed: boolean
    description?: string
    createdAt?: Date
    updatedAt?: Date
  }
  
  export interface ProjectFormData {
    name: string
    color: string
    description?: string
  }
  
  export interface ProjectState {
    projects: Project[]
    selectedProjectId: string
    isEditingProject: boolean
    editingProjectId: string | null
  }
  
  export type ProjectAction =
    | { type: 'SET_PROJECTS'; payload: Project[] }
    | { type: 'ADD_PROJECT'; payload: ProjectFormData }
    | { type: 'UPDATE_PROJECT'; payload: { id: string; updates: Partial<ProjectFormData> } }
    | { type: 'DELETE_PROJECT'; payload: string }
    | { type: 'SET_SELECTED_PROJECT'; payload: string }
    | { type: 'TOGGLE_PROJECT'; payload: string }
    | { type: 'START_EDIT_PROJECT'; payload: string }
    | { type: 'STOP_EDIT_PROJECT' }
  
  export interface ProjectContextType {
    state: ProjectState
    dispatch: React.Dispatch<ProjectAction>
  }
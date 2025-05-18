import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Project } from '../../types/project';
import { generateId } from '../../utils/taskUtils';

// プロジェクトの初期状態
const initialProjects: Project[] = [
  {
    id: 'p1',
    name: 'ウェブサイトリニューアル',
    color: '#3B82F6', // blue-500
    expanded: true,
    tasks: [
      {
        id: 't1',
        name: 'デザイン作成',
        start: new Date('2025-05-15').toISOString(),
        end: new Date('2025-05-25').toISOString(),
        status: 'in-progress',
        expanded: true,
        notes: 'デザインはモダンで使いやすさを重視する。カラーパレットは企業カラーを基調とする。',
        subtasks: [
          {
            id: 'st1',
            name: 'ワイヤーフレーム作成',
            start: new Date('2025-05-15').toISOString(),
            end: new Date('2025-05-18').toISOString(),
            status: 'completed',
            notes: ''
          },
          {
            id: 'st2',
            name: 'カラーパレット選定',
            start: new Date('2025-05-18').toISOString(),
            end: new Date('2025-05-20').toISOString(),
            status: 'completed',
            notes: ''
          },
          {
            id: 'st3',
            name: 'モックアップデザイン',
            start: new Date('2025-05-20').toISOString(),
            end: new Date('2025-05-25').toISOString(),
            status: 'in-progress',
            notes: 'レスポンシブデザインを必ず考慮すること'
          }
        ]
      },
      {
        id: 't2',
        name: 'フロントエンド実装',
        start: new Date('2025-05-25').toISOString(),
        end: new Date('2025-06-10').toISOString(),
        status: 'not-started',
        expanded: false,
        notes: '',
        subtasks: [
          {
            id: 'st4',
            name: 'HTMLコーディング',
            start: new Date('2025-05-25').toISOString(),
            end: new Date('2025-05-30').toISOString(),
            status: 'not-started',
            notes: ''
          },
          {
            id: 'st5',
            name: 'CSSスタイリング',
            start: new Date('2025-05-30').toISOString(),
            end: new Date('2025-06-05').toISOString(),
            status: 'not-started',
            notes: ''
          },
          {
            id: 'st6',
            name: 'JavaScriptインタラクション',
            start: new Date('2025-06-05').toISOString(),
            end: new Date('2025-06-10').toISOString(),
            status: 'not-started',
            notes: ''
          }
        ]
      }
    ]
  },
  {
    id: 'p2',
    name: 'マーケティングキャンペーン',
    color: '#8B5CF6', // purple-500
    expanded: false,
    tasks: [
      {
        id: 't3',
        name: 'コンテンツ企画',
        start: new Date('2025-05-20').toISOString(),
        end: new Date('2025-05-30').toISOString(),
        status: 'in-progress',
        expanded: false,
        notes: '',
        subtasks: [
          {
            id: 'st7',
            name: 'ターゲット分析',
            start: new Date('2025-05-20').toISOString(),
            end: new Date('2025-05-23').toISOString(),
            status: 'completed',
            notes: ''
          },
          {
            id: 'st8',
            name: 'キーメッセージ策定',
            start: new Date('2025-05-23').toISOString(),
            end: new Date('2025-05-30').toISOString(),
            status: 'in-progress',
            notes: ''
          }
        ]
      }
    ]
  },
  {
    id: 'p3',
    name: 'モバイルアプリ開発',
    color: '#10B981', // green-500
    expanded: false,
    tasks: [
      {
        id: 't4',
        name: '要件定義',
        start: new Date('2025-05-10').toISOString(),
        end: new Date('2025-05-20').toISOString(),
        status: 'completed',
        expanded: false,
        notes: '',
        subtasks: []
      },
      {
        id: 't5',
        name: 'UI/UXデザイン',
        start: new Date('2025-05-20').toISOString(),
        end: new Date('2025-06-05').toISOString(),
        status: 'not-started',
        expanded: false,
        notes: '',
        subtasks: []
      }
    ]
  }
];

// プロジェクトステートのインターフェース
interface ProjectsState {
  projects: Project[];
}

// 初期ステート
const initialState: ProjectsState = {
  projects: initialProjects,
};

// プロジェクトスライス
const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    // プロジェクトの初期化
    initializeProjects: (state) => {
      if (state.projects.length === 0) {
        state.projects = initialProjects;
      }
    },
    
    // プロジェクトの追加
    addProject: (state, action: PayloadAction<Omit<Project, 'id'>>) => {
      const newProject: Project = {
        id: generateId(),
        ...action.payload,
        tasks: [],
        expanded: true
      };
      state.projects.push(newProject);
    },
    
    // プロジェクトの更新
    updateProject: (state, action: PayloadAction<{ id: string; project: Partial<Project> }>) => {
      const { id, project } = action.payload;
      const index = state.projects.findIndex(p => p.id === id);
      
      if (index !== -1) {
        state.projects[index] = { ...state.projects[index], ...project };
      }
    },
    
    // プロジェクトの削除
    deleteProject: (state, action: PayloadAction<string>) => {
      state.projects = state.projects.filter(project => project.id !== action.payload);
    },
    
    // プロジェクトの展開/折りたたみ
    toggleProject: (state, action: PayloadAction<string>) => {
      const project = state.projects.find(p => p.id === action.payload);
      if (project) {
        project.expanded = !project.expanded;
      }
    },
  },
});

// アクションエクスポート
export const { 
  initializeProjects, 
  addProject, 
  updateProject, 
  deleteProject, 
  toggleProject 
} = projectsSlice.actions;

export default projectsSlice.reducer;
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Project } from '../../types/project';
import { generateId } from '../../utils/taskUtils';

// プロジェクトの初期状態（調整後のモックデータ）
const initialProjects: Project[] = [
  // プロジェクト1: ウェブサイトリニューアル（現在進行中）
  {
    id: 'p1',
    name: 'ウェブサイトリニューアル',
    color: '#3B82F6', // blue-500
    expanded: true,
    description: '企業サイトの全面リニューアルプロジェクト',
    startDate: new Date(2025, 4, 10).toISOString(), // 5月10日
    endDate: new Date(2025, 5, 20).toISOString(),   // 6月20日
    tasks: [
      {
        id: 't1',
        name: 'デザイン作成',
        start: new Date(2025, 4, 15).toISOString(), // 5月15日
        end: new Date(2025, 4, 25).toISOString(),   // 5月25日
        status: 'in-progress',
        expanded: true,
        notes: 'デザインはモダンで使いやすさを重視する。カラーパレットは企業カラーを基調とする。',
        priority: 'high',
        subtasks: [
          {
            id: 'st1',
            name: 'ワイヤーフレーム作成',
            start: new Date(2025, 4, 15).toISOString(), // 5月15日
            end: new Date(2025, 4, 18).toISOString(),   // 5月18日
            status: 'completed',
            notes: 'ユーザーフローを考慮した設計にする'
          },
          {
            id: 'st2',
            name: 'カラーパレット選定',
            start: new Date(2025, 4, 18).toISOString(), // 5月18日
            end: new Date(2025, 4, 20).toISOString(),   // 5月20日
            status: 'completed',
            notes: '企業ブランドガイドラインに沿ったカラーを使用'
          },
          {
            id: 'st3',
            name: 'モックアップデザイン',
            start: new Date(2025, 4, 20).toISOString(), // 5月20日
            end: new Date(2025, 4, 25).toISOString(),   // 5月25日
            status: 'in-progress',
            notes: 'レスポンシブデザインを必ず考慮すること'
          }
        ]
      },
      {
        id: 't2',
        name: 'フロントエンド実装',
        start: new Date(2025, 4, 25).toISOString(), // 5月25日
        end: new Date(2025, 5, 10).toISOString(),   // 6月10日
        status: 'not-started',
        expanded: false,
        notes: 'React.jsとTailwind CSSを使用して実装する',
        priority: 'medium',
        subtasks: [
          {
            id: 'st4',
            name: 'HTMLコーディング',
            start: new Date(2025, 4, 25).toISOString(), // 5月25日
            end: new Date(2025, 4, 30).toISOString(),   // 5月30日
            status: 'not-started',
            notes: 'セマンティックなHTMLを意識する'
          }
        ]
      }
    ]
  },
  
  // プロジェクト2: マーケティングキャンペーン（一部遅延あり）
  {
    id: 'p2',
    name: 'マーケティングキャンペーン',
    color: '#8B5CF6', // purple-500
    expanded: false,
    description: '夏季販売促進キャンペーン',
    startDate: new Date(2025, 4, 1).toISOString(),   // 5月1日
    endDate: new Date(2025, 6, 15).toISOString(),    // 7月15日
    tasks: [
      {
        id: 't3',
        name: 'コンテンツ企画',
        start: new Date(2025, 4, 1).toISOString(),  // 5月1日
        end: new Date(2025, 4, 15).toISOString(),   // 5月15日
        status: 'completed',
        expanded: false,
        notes: 'ターゲット層に響くコンテンツを企画する',
        priority: 'high',
        subtasks: [
          {
            id: 'st5',
            name: 'ターゲット分析',
            start: new Date(2025, 4, 1).toISOString(), // 5月1日
            end: new Date(2025, 4, 5).toISOString(),   // 5月5日
            status: 'completed',
            notes: '顧客データの分析'
          },
          {
            id: 'st6',
            name: 'キーメッセージ策定',
            start: new Date(2025, 4, 5).toISOString(),  // 5月5日
            end: new Date(2025, 4, 10).toISOString(),   // 5月10日
            status: 'completed',
            notes: 'ブランドボイスを統一する'
          }
        ]
      },
      {
        id: 't4',
        name: 'クリエイティブ制作',
        start: new Date(2025, 4, 10).toISOString(), // 5月10日
        end: new Date(2025, 4, 25).toISOString(),   // 5月25日（遅延）
        status: 'overdue',
        expanded: false,
        notes: '締め切りが過ぎているため早急に対応が必要',
        priority: 'high',
        subtasks: [
          {
            id: 'st7',
            name: 'バナー・画像制作',
            start: new Date(2025, 4, 10).toISOString(), // 5月10日
            end: new Date(2025, 4, 17).toISOString(),   // 5月17日
            status: 'in-progress',
            notes: '各SNS向けのサイズ別制作'
          },
          {
            id: 'st8',
            name: '動画コンテンツ制作',
            start: new Date(2025, 4, 15).toISOString(), // 5月15日
            end: new Date(2025, 4, 25).toISOString(),   // 5月25日
            status: 'overdue',
            notes: 'プロモーション動画の撮影・編集'
          }
        ]
      }
    ]
  },
  
  // プロジェクト3: 営業資料作成プロジェクト（すでに完了）
  {
    id: 'p3',
    name: '営業資料作成プロジェクト',
    color: '#F59E0B', // amber-500
    expanded: false,
    description: '新規営業向けプレゼン資料・提案書のテンプレート作成',
    startDate: new Date(2025, 0, 10).toISOString(),   // 1月10日
    endDate: new Date(2025, 2, 15).toISOString(),     // 3月15日
    tasks: [
      {
        id: 't5',
        name: '資料構成策定',
        start: new Date(2025, 0, 10).toISOString(),   // 1月10日
        end: new Date(2025, 0, 20).toISOString(),     // 1月20日
        status: 'completed',
        expanded: false,
        notes: '営業部からのヒアリングに基づき基本構成を決定',
        priority: 'medium',
        subtasks: [
          {
            id: 'st9',
            name: '営業部ヒアリング',
            start: new Date(2025, 0, 10).toISOString(), // 1月10日
            end: new Date(2025, 0, 15).toISOString(),   // 1月15日
            status: 'completed',
            notes: '各営業担当者の要望を集約'
          }
        ]
      }
    ]
  },
  
  // プロジェクト4: 海外進出計画（将来のプロジェクト）
  {
    id: 'p4',
    name: '海外進出計画',
    color: '#6366F1', // indigo-500
    expanded: false,
    description: 'アジア市場への事業展開の戦略策定と実行',
    startDate: new Date(2025, 6, 1).toISOString(),    // 7月1日
    endDate: new Date(2025, 11, 31).toISOString(),    // 12月31日
    tasks: [
      {
        id: 't6',
        name: '市場調査・戦略立案',
        start: new Date(2025, 6, 1).toISOString(),    // 7月1日
        end: new Date(2025, 7, 31).toISOString(),     // 8月31日
        status: 'not-started',
        expanded: false,
        notes: 'アジア主要国の市場調査と進出戦略の策定',
        priority: 'high',
        subtasks: [
          {
            id: 'st10',
            name: '市場規模・競合調査',
            start: new Date(2025, 6, 1).toISOString(),  // 7月1日
            end: new Date(2025, 6, 20).toISOString(),   // 7月20日
            status: 'not-started',
            notes: '各国の市場規模と主要競合の調査'
          },
          {
            id: 'st11',
            name: '規制・法律調査',
            start: new Date(2025, 6, 20).toISOString(), // 7月20日
            end: new Date(2025, 7, 10).toISOString(),   // 8月10日
            status: 'not-started',
            notes: '各国の法規制・輸入規制の調査'
          }
        ]
      }
    ]
  },
  
  // プロジェクト5: IT基盤刷新プロジェクト（今日から始まる）
  {
    id: 'p5',
    name: 'IT基盤刷新プロジェクト',
    color: '#F97316', // orange-500
    expanded: false,
    description: '社内IT環境のクラウド移行と業務効率化',
    startDate: new Date(2025, 4, 19).toISOString(),   // 5月19日（今日）
    endDate: new Date(2025, 9, 30).toISOString(),     // 10月30日
    tasks: [
      {
        id: 't7',
        name: '現状評価・計画策定',
        start: new Date(2025, 4, 19).toISOString(),   // 5月19日（今日）
        end: new Date(2025, 5, 15).toISOString(),     // 6月15日
        status: 'not-started',
        expanded: false,
        notes: '現在のIT環境の評価と移行計画の策定',
        priority: 'medium',
        subtasks: [
          {
            id: 'st12',
            name: 'ITインフラ調査',
            start: new Date(2025, 4, 19).toISOString(), // 5月19日（今日）
            end: new Date(2025, 4, 31).toISOString(),   // 5月31日
            status: 'not-started',
            notes: '現行システムの調査・課題洗い出し'
          }
        ]
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
    addProject: (state, action: PayloadAction<Omit<Project, 'id' | 'tasks'>>) => {
      const newProject: Project = {
        id: generateId(),
        tasks: [],
        ...action.payload
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
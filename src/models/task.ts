/**
 * タスクのステータス
 * - delayed: 遅延（終了日が過ぎているが未完了）
 * - active: 進行中（今日が開始日と終了日の間）
 * - future: 未来（開始日がまだ来ていない）
 * - completed: 完了
 */
export type TaskStatus = 'delayed' | 'active' | 'future' | 'completed';

/**
 * 優先度
 */
export type TaskPriority = 'low' | 'medium' | 'high';

/**
 * タスクデータモデル
 */
export interface Task {
  id: string;                    // タスク一意識別子
  title: string;                 // タスク名
  startDate: Date;               // 開始日
  endDate: Date;                 // 終了日
  completed: boolean;            // 完了状態
  completedAt?: Date;            // 完了日時
  parentId?: string | null;      // 親タスクID（nullの場合はルートタスク）
  noteContent?: string;          // ノートの内容
  assignee?: string;             // 担当者名
  projectId?: string;            // プロジェクトID
}

/**
 * タスク入力データ（新規作成時）
 */
export interface TaskInput {
  title: string;                 // タスク名
  startDate: Date;               // 開始日
  endDate: Date;                 // 終了日
  completed?: boolean;           // 完了状態（省略時はfalse）
  parentId?: string | null;      // 親タスクID（省略時はnull）
  noteContent?: string;          // ノートの内容（省略時は空文字）
  assignee?: string;             // 担当者名
  projectId?: string;            // プロジェクトID
}

/**
 * タスクノートモデル
 */
export interface TaskNote {
  taskId: string;                // タスクID
  content: string;               // ノートの内容
  updatedAt: Date;               // 最終更新日時
}

/**
 * プロジェクトモデル
 */
export interface Project {
  id: string;                    // プロジェクト一意識別子
  name: string;                  // プロジェクト名
  description?: string;          // プロジェクト説明
  color?: string;                // プロジェクト表示色
}

/**
 * ユーザーモデル
 */
export interface User {
  id: string;                    // ユーザー一意識別子
  name: string;                  // ユーザー名
  avatarUrl?: string;            // アバター画像URL
}
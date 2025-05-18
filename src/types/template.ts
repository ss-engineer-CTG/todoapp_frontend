// テンプレートの情報
export interface Template {
    id: string;
    name: string;
    description: string;
    sourceType: 'selection' | 'project';
    sourceId?: string;         // プロジェクトベースの場合のプロジェクトID
    taskKeys?: string[];       // 選択ベースの場合のタスクキー配列
    taskCount: number;         // 含まれるタスクの数
    createdAt: string;         // ISO形式の日付文字列
    updatedAt: string;         // ISO形式の日付文字列
    icon?: string;             // テンプレートのアイコン
    tags?: string[];           // タグ
  }
  
  // テンプレート適用オプション
  export interface TemplateApplyOptions {
    targetProjectId: string;   // 適用先プロジェクトID
    startDate?: Date;          // 開始日（指定しない場合は今日）
    shiftDates?: boolean;      // 日付をシフトするか
    clearAssignees?: boolean;  // 担当者をクリアするか
    includeCompleted?: boolean; // 完了タスクも含めるか
  }
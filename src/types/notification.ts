// 通知の情報
export interface Notification {
    id: string;
    text: string;
    read: boolean;
    createdAt: string; // ISO形式の日付文字列
    type?: 'info' | 'warning' | 'error' | 'success';
    actionUrl?: string; // 通知クリック時に移動するURL
    relatedId?: string; // 関連するタスクやプロジェクトのID
  }
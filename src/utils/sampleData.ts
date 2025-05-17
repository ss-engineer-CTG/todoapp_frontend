import { v4 as uuidv4 } from 'uuid';
import { addDays, subDays } from 'date-fns';
import { Task } from '../models/task';

/**
 * サンプルデータを生成するユーティリティ
 * 
 * アプリケーション初期化時にタスクがない場合にサンプルデータを提供する
 */
export const generateSampleTasks = (): Task[] => {
  const today = new Date();
  
  // サンプルタスク
  const sampleTasks: Task[] = [
    // プロジェクト計画タスク（親タスク）
    {
      id: uuidv4(),
      title: "プロジェクト計画を作成",
      startDate: subDays(today, 3),
      endDate: addDays(today, 1),
      completed: false,
      parentId: null,
      noteContent: "プロジェクトの全体計画と予算を作成し、チームに共有する。主要なマイルストーンを定義すること。",
    },
    
    // 計画タスクの子タスク
    {
      id: uuidv4(),
      title: "要件定義",
      startDate: subDays(today, 3),
      endDate: subDays(today, 1),
      completed: true,
      completedAt: subDays(today, 1),
      parentId: null, // 実際の実装では上記の親タスクのIDを設定
      noteContent: "主要な機能要件と非機能要件をリストアップする。",
    },
    
    // 別の親タスク
    {
      id: uuidv4(),
      title: "デザイン作成",
      startDate: today,
      endDate: addDays(today, 4),
      completed: false,
      parentId: null,
      noteContent: "ユーザーインターフェースのデザインを作成する。",
    },
    
    // 遅延しているタスク
    {
      id: uuidv4(),
      title: "環境セットアップ",
      startDate: subDays(today, 5),
      endDate: subDays(today, 2),
      completed: false,
      parentId: null,
      noteContent: "開発環境と本番環境のセットアップを完了する。",
    },
    
    // 未来のタスク
    {
      id: uuidv4(),
      title: "テスト計画策定",
      startDate: addDays(today, 5),
      endDate: addDays(today, 7),
      completed: false,
      parentId: null,
      noteContent: "テスト計画とテストケースを作成する。",
    },
    
    // 完了したタスク
    {
      id: uuidv4(),
      title: "キックオフミーティング",
      startDate: subDays(today, 7),
      endDate: subDays(today, 7),
      completed: true,
      completedAt: subDays(today, 7),
      parentId: null,
      noteContent: "プロジェクトのキックオフミーティングを開催し、チームメンバーに役割を割り当てる。",
    }
  ];
  
  return sampleTasks;
};

/**
 * ローカルストレージにサンプルデータが存在しない場合に初期化する
 */
export const initializeSampleData = (): void => {
  try {
    const existingTasks = localStorage.getItem('tasks');
    
    // タスクが存在しない場合はサンプルデータを生成して保存
    if (!existingTasks || JSON.parse(existingTasks).length === 0) {
      const sampleTasks = generateSampleTasks();
      localStorage.setItem('tasks', JSON.stringify(sampleTasks));
      console.log('サンプルデータを初期化しました');
    }
  } catch (error) {
    console.error('サンプルデータの初期化中にエラーが発生しました:', error);
  }
};

export default {
  generateSampleTasks,
  initializeSampleData
};
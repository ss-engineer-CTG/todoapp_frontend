import { Task } from '../models/task';

/**
 * タスク木構造操作ユーティリティ関数群
 * フラット配列+インデックス方式を使用して効率的に木構造を処理
 */

/**
 * 木構造のノード
 */
export interface TreeNode<T> {
  id: string;
  parentId?: string | null;
  data: T;
  children: TreeNode<T>[];
  depth: number;
}

/**
 * フラット配列からツリー構造を構築する
 */
export const buildTree = <T extends { id: string; parentId?: string | null }>(
  items: T[]
): TreeNode<T>[] => {
  // ID をキーとした項目のマップを作成
  const itemMap = new Map<string, TreeNode<T>>();
  
  // 全ての項目に対してノードを作成し、マップに追加
  items.forEach(item => {
    itemMap.set(item.id, {
      id: item.id,
      parentId: item.parentId,
      data: item,
      children: [],
      depth: 0
    });
  });
  
  // ルートノード配列
  const rootNodes: TreeNode<T>[] = [];
  
  // 親子関係を構築
  itemMap.forEach(node => {
    if (node.parentId) {
      // 親ノードが存在する場合は子として追加
      const parentNode = itemMap.get(node.parentId);
      if (parentNode) {
        parentNode.children.push(node);
        // 深さを親のdepth + 1に設定
        node.depth = parentNode.depth + 1;
      } else {
        // 親が見つからない場合はルートノードとして扱う
        rootNodes.push(node);
      }
    } else {
      // 親を持たないノードはルートノード
      rootNodes.push(node);
    }
  });
  
  return rootNodes;
};

/**
 * ツリー構造からフラット配列を生成（階層順に整列）
 */
export const flattenTree = <T>(rootNodes: TreeNode<T>[]): TreeNode<T>[] => {
  const result: TreeNode<T>[] = [];
  
  // 深さ優先探索でノードを追加
  const addNodeRecursively = (node: TreeNode<T>) => {
    result.push(node);
    node.children.forEach(addNodeRecursively);
  };
  
  rootNodes.forEach(addNodeRecursively);
  
  return result;
};

/**
 * 特定のノードの子孫ノードをすべて取得
 */
export const getAllDescendants = <T>(
  node: TreeNode<T>,
  includeNode: boolean = false
): TreeNode<T>[] => {
  const result: TreeNode<T>[] = includeNode ? [node] : [];
  
  node.children.forEach(child => {
    result.push(...getAllDescendants(child, true));
  });
  
  return result;
};

/**
 * 特定のノードの祖先ノードを取得
 */
export const getAncestors = <T>(
  node: TreeNode<T>,
  tree: TreeNode<T>[],
  includeNode: boolean = false
): TreeNode<T>[] => {
  const result: TreeNode<T>[] = includeNode ? [node] : [];
  
  if (!node.parentId) return result;
  
  const parentNode = tree.find(n => n.id === node.parentId);
  if (parentNode) {
    result.push(...getAncestors(parentNode, tree, true));
  }
  
  return result;
};

/**
 * タスクのフラット配列から階層構造を反映したタスク配列を生成
 */
export const buildTaskHierarchy = (tasks: Task[]): Task[] => {
  // ルートノード（親タスクを持たないタスク）を取得
  const rootTasks = tasks.filter(task => !task.parentId);
  
  // 階層構造を反映した結果配列
  const result: Task[] = [];
  
  // 再帰的に子タスクを追加する関数
  const addTasksRecursively = (currentTasks: Task[]) => {
    currentTasks.forEach(task => {
      result.push(task);
      
      // このタスクの子タスクを取得
      const childTasks = tasks.filter(t => t.parentId === task.id);
      
      if (childTasks.length > 0) {
        addTasksRecursively(childTasks);
      }
    });
  };
  
  // ルートタスクから処理開始
  addTasksRecursively(rootTasks);
  
  return result;
};

/**
 * タスクのインデントレベル（深さ）を計算
 */
export const calculateTaskDepth = (task: Task, tasks: Task[]): number => {
  if (!task.parentId) return 0;
  
  let depth = 0;
  let currentParentId = task.parentId;
  
  while (currentParentId) {
    depth++;
    const parentTask = tasks.find(t => t.id === currentParentId);
    if (!parentTask) break;
    currentParentId = parentTask.parentId || null;
  }
  
  return depth;
};

/**
 * タスクの子タスクを取得
 */
export const getChildTasks = (taskId: string, tasks: Task[]): Task[] => {
  return tasks.filter(task => task.parentId === taskId);
};

/**
 * 特定のタスクとその子孫タスクをすべて取得
 */
export const getTaskWithDescendants = (taskId: string, tasks: Task[]): Task[] => {
  const result: Task[] = [];
  const targetTask = tasks.find(task => task.id === taskId);
  
  if (!targetTask) return result;
  
  result.push(targetTask);
  
  // 子タスクを再帰的に追加
  const addChildrenRecursively = (parentId: string) => {
    const children = getChildTasks(parentId, tasks);
    
    children.forEach(child => {
      result.push(child);
      addChildrenRecursively(child.id);
    });
  };
  
  addChildrenRecursively(taskId);
  
  return result;
};

/**
 * タスクの移動（親タスクの変更）
 */
export const moveTask = (
  taskId: string,
  newParentId: string | null,
  tasks: Task[]
): Task[] => {
  return tasks.map(task => {
    if (task.id === taskId) {
      return { ...task, parentId: newParentId };
    }
    return task;
  });
};

/**
 * タスクの順序を変更
 */
export const reorderTasks = (
  taskIds: string[],
  tasks: Task[]
): Task[] => {
  // 入力タスクの検証
  if (taskIds.length !== new Set(taskIds).size) {
    throw new Error('タスクIDに重複があります');
  }
  
  // taskIds に含まれるタスクがすべて同じ親を持つことを確認
  const tasksToReorder = taskIds.map(id => tasks.find(t => t.id === id)).filter(Boolean) as Task[];
  
  if (tasksToReorder.length === 0) return tasks;
  
  const firstParentId = tasksToReorder[0].parentId;
  const allSameParent = tasksToReorder.every(task => task.parentId === firstParentId);
  
  if (!allSameParent) {
    throw new Error('同じ親を持つタスクのみ並べ替えることができます');
  }
  
  // パフォーマンスのためにIDとインデックスのマップを作成
  const orderMap = new Map<string, number>();
  taskIds.forEach((id, index) => {
    orderMap.set(id, index);
  });
  
  // 対象のタスクを新しい順序でソート
  const reorderedTasks = [...tasks].sort((a, b) => {
    const aOrder = orderMap.has(a.id) ? orderMap.get(a.id)! : Number.MAX_SAFE_INTEGER;
    const bOrder = orderMap.has(b.id) ? orderMap.get(b.id)! : Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder;
  });
  
  return reorderedTasks;
};
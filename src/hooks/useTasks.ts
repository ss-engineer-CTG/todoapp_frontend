import { useContext } from "react"
import { TaskContext } from "../contexts/TaskContext"
import { UIContext } from "../contexts/UIContext"
import { toast } from "@/hooks/use-toast"
import { getRandomColor } from "../utils/colorUtils"
import { Task } from "../types/Task"
import { 
  generateNewTaskId, 
  calculateNewTaskOrder,
  getChildTaskInfo,
  getSiblingTaskInfo
} from "../utils/taskOperationUtils"
import { 
  getDirectChildTasks,
  getTaskWithDescendants,
  calculateTaskInsertPosition 
} from "../utils/taskUtils"
import { logError, logInfo, logWarning } from "../utils/logUtils"
import { showSuccessToast, showErrorToast, showInfoToast } from "../utils/notificationUtils"

export function useTasks() {
  const { 
    tasks, 
    setTasks, 
    setClipboard, 
    clipboard, 
    currentTask, 
    dbServiceRef
  } = useContext(TaskContext)
  
  const { 
    setIsTaskDialogOpen, 
    setIsProjectDialogOpen, 
    setIsNoteDialogOpen, 
    setCurrentTask, 
    setNoteContent, 
    setSelectedTaskId, 
    setTaskToDelete, 
    setIsDeleteConfirmOpen, 
    setIsImportExportOpen, 
    selectedTaskId
  } = useContext(UIContext)

  // 新しいタスクを追加 - 改善版
  const addNewTask = (
    level: number,
    parentId: number | null, 
    projectId: number, 
    projectName: string
  ): number => {
    // 挿入位置を計算
    const afterIndex = calculateTaskInsertPosition(tasks, parentId, level);
    
    // プロジェクトの存在確認
    const projectExists = tasks.some(t => t.isProject && t.projectId === projectId);
    if (!projectExists) {
      logWarning(`指定されたプロジェクトID ${projectId} が存在しません。`);
      
      // 最初のプロジェクトを代替として使用
      const firstProject = tasks.find(t => t.isProject);
      if (firstProject) {
        projectId = firstProject.projectId;
        projectName = firstProject.name;
        logInfo(`代わりにプロジェクト "${projectName}" (ID: ${projectId}) を使用します。`);
      } else {
        logError("有効なプロジェクトが見つかりません。タスクを追加できません。");
        return 0; // 失敗を示す値を返す
      }
    }
    
    // 新しいIDを生成
    const newId = generateNewTaskId(tasks);
    const today = new Date().toISOString().split("T")[0];

    // 新しいタスクオブジェクトを作成
    const newTask: Task = {
      id: newId,
      name: "",  // 空の名前で作成し、ダイアログで編集させる
      level,
      isProject: level === 0,
      startDate: today,
      dueDate: today,
      completed: false,
      assignee: "",
      notes: "",
      expanded: false,
      projectId,
      projectName,
      priority: "medium",
      tags: [],
      parentId, // 明示的に親IDを設定
      order: calculateNewTaskOrder(tasks, level, projectId, afterIndex, parentId),
    };

    // タスクリストを更新
    const updatedTasks = [...tasks];
    updatedTasks.splice(afterIndex + 1, 0, newTask);
    setTasks(updatedTasks);
    
    logInfo(`新しいタスクを追加しました: ID=${newId}, レベル=${level}, プロジェクト="${projectName}"`);
    
    // 新タスクを選択して編集ダイアログを表示
    setSelectedTaskId(newId);
    setCurrentTask(newTask);
    setIsTaskDialogOpen(true);
    
    // 作成したタスクのIDを返す
    return newId;
  };

  // タスク追加の簡略化インターフェイス（子タスク）
  const addChildTask = (parentTaskId: number): number => {
    try {
      const info = getChildTaskInfo(tasks, parentTaskId);
      return addNewTask(info.level, info.parentId, info.projectId, info.projectName);
    } catch (error) {
      logError(`子タスク追加に失敗しました: ${error}`);
      showErrorToast("エラー", "子タスクの追加に失敗しました");
      return 0;
    }
  };

  // タスク追加の簡略化インターフェイス（兄弟タスク）
  const addSiblingTask = (siblingTaskId: number): number => {
    try {
      const info = getSiblingTaskInfo(tasks, siblingTaskId);
      return addNewTask(info.level, info.parentId, info.projectId, info.projectName);
    } catch (error) {
      logError(`兄弟タスク追加に失敗しました: ${error}`);
      showErrorToast("エラー", "兄弟タスクの追加に失敗しました");
      return 0;
    }
  };

  // 今日のタスクとして追加するための補助関数
  const addTodayTask = (projectId: number, projectName: string): number => {
    const today = new Date().toISOString().split("T")[0];
    
    // タスクを追加
    const taskId = addNewTask(1, null, projectId, projectName);
    
    if (taskId) {
      // 追加したタスクを探して日付を更新
      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            startDate: today,
            dueDate: today
          };
        }
        return task;
      });
      
      setTasks(updatedTasks);
      logInfo(`タスク ${taskId} を今日のタスクとして設定しました: ${today}`);
    }
    
    return taskId;
  };

  // 削除の確認
  const confirmDeleteTask = (taskId: number) => {
    setTaskToDelete(taskId)
    setIsDeleteConfirmOpen(true)
  }

  // タスクとその子孫タスクを削除
  const deleteTask = (taskId: number) => {
    const taskIndex = tasks.findIndex((t) => t.id === taskId)
    if (taskIndex === -1) {
      logWarning(`タスク ID=${taskId} は存在しません。`);
      return;
    }

    const task = tasks[taskIndex];
    
    // 削除対象のタスクを取得（自身と子孫すべて）
    const tasksToDelete = getTaskWithDescendants(task, tasks).map(t => t.id);

    try {
      // データベースからタスクを削除
      tasksToDelete.forEach(id => {
        dbServiceRef.current.deleteTask(id);
      });

      // 状態を更新
      setTasks(tasks.filter((task) => !tasksToDelete.includes(task.id)));
      
      if (selectedTaskId && tasksToDelete.includes(selectedTaskId)) {
        setSelectedTaskId(null);
      }

      showSuccessToast("タスクを削除しました", `${tasksToDelete.length}個のタスクを削除しました`);
      logInfo(`${tasksToDelete.length}個のタスクを削除しました: ${tasksToDelete.join(", ")}`);
    } catch (error) {
      logError(`タスク削除中にエラーが発生しました: ${error}`);
      showErrorToast("削除エラー", "タスクの削除中にエラーが発生しました");
    }
  }

  // タスクをコピー
  const copyTask = (taskId: number) => {
    const taskToCopy = tasks.find((t) => t.id === taskId)
    if (!taskToCopy) {
      logWarning(`コピーするタスク ID=${taskId} が見つかりません。`);
      return;
    }

    const newId = generateNewTaskId(tasks);
    const newTask = { 
      ...taskToCopy, 
      id: newId, 
      name: `${taskToCopy.name} (コピー)`,
      order: calculateNewTaskOrder(
        tasks, 
        taskToCopy.level, 
        taskToCopy.projectId, 
        tasks.findIndex(t => t.id === taskId),
        taskToCopy.parentId
      )
    };

    try {
      const taskIndex = tasks.findIndex((t) => t.id === taskId)
      const updatedTasks = [...tasks]
      updatedTasks.splice(taskIndex + 1, 0, newTask)
      setTasks(updatedTasks)
      setSelectedTaskId(newId)

      // データベースにタスクを保存
      dbServiceRef.current.saveTask(newTask)

      showSuccessToast("タスクをコピーしました", `"${taskToCopy.name}"のコピーを作成しました`);
      logInfo(`タスク "${taskToCopy.name}" をコピーしました (ID=${newId})`);
    } catch (error) {
      logError(`タスクコピー中にエラーが発生しました: ${error}`);
      showErrorToast("コピーエラー", "タスクのコピー中にエラーが発生しました");
    }
  }

  // タスクをコピー（子タスクも含めて）
  const copyTaskWithChildren = (taskId: number) => {
    const taskToCopy = tasks.find((t) => t.id === taskId);
    if (!taskToCopy) {
      logWarning(`コピーするタスク ID=${taskId} が見つかりません。`);
      return;
    }

    try {
      // 元のタスクとその子孫を取得
      const sourceWithDescendants = getTaskWithDescendants(taskToCopy, tasks);
      
      // 新しいIDを割り当てるためのマップ
      const idMap = new Map<number, number>();
      
      // 最初のタスク（親）のIDを生成
      const newRootId = generateNewTaskId(tasks);
      idMap.set(taskToCopy.id, newRootId);
      
      // すべての子タスクの新しいIDを生成
      for (let i = 1; i < sourceWithDescendants.length; i++) {
        const task = sourceWithDescendants[i];
        idMap.set(task.id, generateNewTaskId(tasks) + i);
      }
      
      // 新しいタスクを作成
      const newTasks = sourceWithDescendants.map(task => {
        const newId = idMap.get(task.id)!;
        const newParentId = task.parentId !== null && task.parentId !== undefined 
          ? idMap.get(task.parentId) || null 
          : null;
          
        return {
          ...task,
          id: newId,
          name: task === taskToCopy ? `${task.name} (コピー)` : task.name,
          parentId: newParentId
        };
      });
      
      // タスクリストにコピーしたタスクを追加
      const taskIndex = tasks.findIndex((t) => t.id === taskId);
      const updatedTasks = [...tasks];
      updatedTasks.splice(taskIndex + 1, 0, ...newTasks);
      setTasks(updatedTasks);
      setSelectedTaskId(newRootId);
      
      // データベースに保存
      newTasks.forEach(task => {
        dbServiceRef.current.saveTask(task);
      });
      
      showSuccessToast(
        "タスクをコピーしました", 
        `"${taskToCopy.name}"とその子タスク (計${newTasks.length}個) をコピーしました`
      );
      logInfo(`タスク "${taskToCopy.name}" とその子タスク (計${newTasks.length}個) をコピーしました`);
    } catch (error) {
      logError(`タスクとその子タスクのコピー中にエラーが発生しました: ${error}`);
      showErrorToast("コピーエラー", "タスクのコピー中にエラーが発生しました");
    }
  }

  // タスクをクリップボードにコピー
  const copyTaskToClipboard = (taskId: number) => {
    const taskToCopy = tasks.find((t) => t.id === taskId)
    if (!taskToCopy) {
      logWarning(`クリップボードにコピーするタスク ID=${taskId} が見つかりません。`);
      return;
    }

    setClipboard(taskToCopy)
    showSuccessToast("クリップボードにコピーしました", `"${taskToCopy.name}"をクリップボードにコピーしました`);
    logInfo(`タスク "${taskToCopy.name}" をクリップボードにコピーしました`);
  }

  // タスクをクリップボードに切り取り
  const cutTask = (taskId: number) => {
    const taskToCut = tasks.find((t) => t.id === taskId)
    if (!taskToCut) {
      logWarning(`切り取るタスク ID=${taskId} が見つかりません。`);
      return;
    }

    setClipboard(taskToCut)
    
    // 子タスクを含めて切り取るために削除関数を使用
    deleteTask(taskId)
    
    showSuccessToast("タスクを切り取りました", `"${taskToCut.name}"を切り取りました`);
    logInfo(`タスク "${taskToCut.name}" を切り取りました`);
  }

  // クリップボードからタスクをペースト
  const pasteTask = () => {
    if (!clipboard) {
      logWarning("クリップボードが空です。");
      return;
    }
    
    if (!selectedTaskId) {
      logWarning("ペースト先のタスクが選択されていません。");
      return;
    }

    try {
      const selectedTaskIndex = tasks.findIndex((t) => t.id === selectedTaskId)
      if (selectedTaskIndex === -1) {
        logWarning(`選択されたタスク ID=${selectedTaskId} が見つかりません。`);
        return;
      }

      const selectedTask = tasks[selectedTaskIndex];
      const newId = generateNewTaskId(tasks);
      
      // 親IDを設定
      let parentId = null;
      if (clipboard.level > selectedTask.level) {
        // 選択タスクが親になる場合
        parentId = selectedTaskId;
      } else {
        // 兄弟タスクになる場合は親を共有
        parentId = selectedTask.parentId;
      }
      
      const newTask = {
        ...clipboard,
        id: newId,
        name: `${clipboard.name} (コピー)`,
        // 選択されたタスクと同じプロジェクトに所属させる
        projectId: selectedTask.projectId,
        projectName: selectedTask.projectName,
        parentId,
        order: calculateNewTaskOrder(
          tasks, 
          clipboard.level, 
          selectedTask.projectId, 
          selectedTaskIndex,
          parentId
        )
      };

      const updatedTasks = [...tasks]
      updatedTasks.splice(selectedTaskIndex + 1, 0, newTask)
      setTasks(updatedTasks)
      setSelectedTaskId(newId)

      // データベースにタスクを保存
      dbServiceRef.current.saveTask(newTask)

      showSuccessToast("タスクをペーストしました", `"${clipboard.name}"のコピーを作成しました`);
      logInfo(`タスク "${clipboard.name}" をペーストしました (新ID=${newId})`);
    } catch (error) {
      logError(`タスクペースト中にエラーが発生しました: ${error}`);
      showErrorToast("ペーストエラー", "タスクのペースト中にエラーが発生しました");
    }
  }

  // 優先度を上げる
  const increasePriority = (taskId: number) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const priorityMap: Record<string, "low" | "medium" | "high"> = {
          "low": "medium",
          "medium": "high",
          "high": "high",
          "undefined": "low"
        }
        const newPriority = priorityMap[task.priority || "undefined"]
        const updatedTask = { ...task, priority: newPriority }
        
        // データベースにタスクを保存
        dbServiceRef.current.saveTask(updatedTask)
        
        logInfo(`タスク "${task.name}" の優先度を ${task.priority || "未設定"} から ${newPriority} に変更しました`);
        return updatedTask
      }
      return task
    })
    
    setTasks(updatedTasks)
    showSuccessToast("優先度を上げました", "タスクの優先度が上がりました");
  }

  // 優先度を下げる
  const decreasePriority = (taskId: number) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        const priorityMap: Record<string, "low" | "medium" | "high"> = {
          "low": "low",
          "medium": "low",
          "high": "medium",
          "undefined": "low"
        }
        const newPriority = priorityMap[task.priority || "undefined"]
        const updatedTask = { ...task, priority: newPriority }
        
        // データベースにタスクを保存
        dbServiceRef.current.saveTask(updatedTask)
        
        logInfo(`タスク "${task.name}" の優先度を ${task.priority || "未設定"} から ${newPriority} に変更しました`);
        return updatedTask
      }
      return task
    })
    
    setTasks(updatedTasks)
    showSuccessToast("優先度を下げました", "タスクの優先度が下がりました");
  }

  // メモダイアログを開く
  const openNotes = (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) {
      logWarning(`メモを開くタスク ID=${taskId} が見つかりません。`);
      return;
    }

    setCurrentTask(task)
    setNoteContent(task.notes)
    setIsNoteDialogOpen(true)
    logInfo(`タスク "${task.name}" のメモを開きました`);
  }

  // メモを保存
  const saveNotes = (taskId: number, content: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) {
      logWarning(`メモを保存するタスク ID=${taskId} が見つかりません。`);
      return;
    }

    try {
      const updatedTask = { ...task, notes: content }
      
      const updatedTasks = tasks.map((t) => (t.id === taskId ? updatedTask : t))
      setTasks(updatedTasks)
      
      // データベースにタスクを保存
      dbServiceRef.current.saveTask(updatedTask)

      showSuccessToast("メモを保存しました", `"${task.name}"のメモを更新しました`);
      logInfo(`タスク "${task.name}" のメモを保存しました`);
    } catch (error) {
      logError(`メモ保存中にエラーが発生しました: ${error}`);
      showErrorToast("保存エラー", "メモの保存中にエラーが発生しました");
    }
  }

  // タスク完了状態の切り替え
  const toggleTaskCompletion = (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      logWarning(`完了状態を切り替えるタスク ID=${taskId} が見つかりません。`);
      return;
    }

    try {
      const updatedTasks = tasks.map((task) => {
        if (task.id === taskId) {
          const completed = !task.completed
          const updatedTask = {
            ...task,
            completed,
            completionDate: completed ? new Date().toISOString().split("T")[0] : undefined,
          }
          
          // データベースにタスクを保存
          dbServiceRef.current.saveTask(updatedTask)
          
          logInfo(`タスク "${task.name}" の完了状態を ${task.completed ? "完了" : "未完了"} から ${completed ? "完了" : "未完了"} に変更しました`);
          return updatedTask
        }
        return task
      })
      
      setTasks(updatedTasks)
    } catch (error) {
      logError(`タスク完了状態の切り替え中にエラーが発生しました: ${error}`);
      showErrorToast("更新エラー", "タスク状態の更新中にエラーが発生しました");
    }
  }

  // 展開/折りたたみの切り替え
  const toggleExpand = (taskId: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      logWarning(`展開状態を切り替えるタスク ID=${taskId} が見つかりません。`);
      return;
    }

    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, expanded: !t.expanded }
      }
      return t
    })
    setTasks(updatedTasks)
    logInfo(`タスク "${task.name}" の展開状態を ${task.expanded ? "展開" : "折りたたみ"} から ${!task.expanded ? "展開" : "折りたたみ"} に変更しました`);
  }

  // 新しいプロジェクトを作成
  const createNewProject = () => {
    const newId = generateNewTaskId(tasks);
    const projectId = Math.max(...tasks.filter((t) => t.isProject).map((t) => t.projectId), 0) + 1
    const today = new Date().toISOString().split("T")[0]

    const newProject: Task = {
      id: newId,
      name: "新しいプロジェクト",
      level: 0,
      isProject: true,
      startDate: today,
      dueDate: today,
      completed: false,
      assignee: "",
      notes: "",
      expanded: true,
      projectId,
      projectName: "新しいプロジェクト",
      priority: "medium",
      tags: [],
      color: getRandomColor(),
      parentId: null // プロジェクトは親を持たない
    }

    try {
      // 追加: 先に状態を更新してからダイアログを開く
      setTasks([...tasks, newProject]);
      setSelectedTaskId(newId);
      setCurrentTask(newProject);
      
      // 少し遅延を入れてUIの更新を確実にする
      setTimeout(() => {
        setIsProjectDialogOpen(true);
        logInfo(`新しいプロジェクトを作成しました (ID=${newId}, プロジェクトID=${projectId})`);
      }, 50);
    } catch (error) {
      logError(`プロジェクト作成中にエラーが発生しました: ${error}`);
      showErrorToast("作成エラー", "プロジェクトの作成中にエラーが発生しました");
    }
  }

  // タスクを編集する関数
  const editTask = (taskId: number) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) {
      logWarning(`編集するタスク ID=${taskId} が見つかりません。`);
      return;
    }

    // 重要: currentTask を先に設定してからダイアログを開く
    setCurrentTask(task);
    
    // 少し遅延を入れてUIの更新を確実にする
    setTimeout(() => {
      if (task.isProject) {
        setIsProjectDialogOpen(true);
      } else {
        setIsTaskDialogOpen(true);
      }
      logInfo(`タスク "${task.name}" の編集を開始しました`);
    }, 50);
  }

  // タスク詳細を保存
  const saveTaskDetails = (updatedTask: Task) => {
    try {
      const updatedTasks = tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
      setTasks(updatedTasks)
      setIsTaskDialogOpen(false)
      
      // データベースにタスクを保存
      dbServiceRef.current.saveTask(updatedTask)

      showSuccessToast("タスクを保存しました", `"${updatedTask.name}"を更新しました`);
      logInfo(`タスク "${updatedTask.name}" の詳細を保存しました`);
    } catch (error) {
      logError(`タスク詳細の保存中にエラーが発生しました: ${error}`);
      showErrorToast("保存エラー", "タスクの保存中にエラーが発生しました");
    }
  }

  // プロジェクト詳細を保存
  const saveProjectDetails = (updatedProject: Task) => {
    try {
      // プロジェクト自体を更新
      const updatedTasks = tasks.map((task) => {
        if (task.id === updatedProject.id) {
          return updatedProject
        }
        // このプロジェクトに属するタスクのプロジェクト名も更新
        if (task.projectId === updatedProject.projectId) {
          return {
            ...task,
            projectName: updatedProject.name,
          }
        }
        return task
      })

      setTasks(updatedTasks)
      setIsProjectDialogOpen(false)
      
      // データベースにプロジェクトとタスクを保存
      dbServiceRef.current.saveProject(updatedProject)
      updatedTasks.forEach(task => {
        if (task.projectId === updatedProject.projectId && task.id !== updatedProject.id) {
          dbServiceRef.current.saveTask(task)
        }
      })

      showSuccessToast("プロジェクトを保存しました", `"${updatedProject.name}"を更新しました`);
      logInfo(`プロジェクト "${updatedProject.name}" の詳細を保存しました`);
    } catch (error) {
      logError(`プロジェクト詳細の保存中にエラーが発生しました: ${error}`);
      showErrorToast("保存エラー", "プロジェクトの保存中にエラーが発生しました");
    }
  }
  
  // すべてのデータを保存
  const saveAllData = async () => {
    try {
      const projectSavePromises = tasks
        .filter(task => task.isProject)
        .map(project => dbServiceRef.current.saveProject(project))
      
      const taskSavePromises = tasks
        .filter(task => !task.isProject)
        .map(task => dbServiceRef.current.saveTask(task))
      
      await Promise.all([...projectSavePromises, ...taskSavePromises])
      
      showSuccessToast("データを保存しました", "すべてのプロジェクトとタスクを保存しました");
      logInfo("すべてのデータを保存しました");
    } catch (error) {
      logError(`データの保存に失敗しました: ${error}`);
      showErrorToast("保存エラー", "データの保存に失敗しました");
    }
  }

  // 任意のタスクを更新
  const updateTask = (updatedTask: Task) => {
    try {
      const updatedTasks = tasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      )
      setTasks(updatedTasks)
      
      // データベースにタスクを保存
      dbServiceRef.current.saveTask(updatedTask)
      logInfo(`タスク "${updatedTask.name}" を更新しました`);
    } catch (error) {
      logError(`タスク更新中にエラーが発生しました: ${error}`);
      showErrorToast("更新エラー", "タスクの更新中にエラーが発生しました");
    }
  }
  
  // インポート/エクスポートダイアログを開く
  const openImportExport = () => {
    setIsImportExportOpen(true)
    logInfo("インポート/エクスポートダイアログを開きました");
  }
  
  // データをエクスポート
  const exportData = async () => {
    try {
      const exportedData = await dbServiceRef.current.exportData();
      logInfo("データを正常にエクスポートしました");
      return exportedData;
    } catch (error) {
      logError(`データのエクスポートに失敗しました: ${error}`);
      showErrorToast("エクスポートエラー", "データのエクスポートに失敗しました");
      throw error;
    }
  }
  
  // データをインポート
  const importDataFromText = async (data: string) => {
    try {
      const success = await dbServiceRef.current.importData(data);
      if (success) {
        // データを再読み込み
        const loadedTasks = await dbServiceRef.current.getTasks();
        setTasks(loadedTasks);
        showSuccessToast("データをインポートしました", "タスクとプロジェクトが正常にインポートされました");
        logInfo("データを正常にインポートしました");
        return true;
      }
      
      showErrorToast("インポートエラー", "データ形式が正しくありません");
      logWarning("インポートデータの形式が不正です");
      return false;
    } catch (error) {
      logError(`データのインポートに失敗しました: ${error}`);
      showErrorToast("インポートエラー", "データのインポートに失敗しました");
      throw error;
    }
  }

  return {
    addNewTask,
    addChildTask,
    addSiblingTask,
    addTodayTask,
    confirmDeleteTask,
    deleteTask,
    copyTask,
    copyTaskWithChildren,
    copyTaskToClipboard,
    cutTask,
    pasteTask,
    increasePriority,
    decreasePriority,
    openNotes,
    saveNotes,
    toggleTaskCompletion,
    toggleExpand,
    createNewProject,
    editTask,
    saveTaskDetails,
    saveProjectDetails,
    saveAllData,
    updateTask,
    openImportExport,
    exportData,
    importDataFromText
  }
}
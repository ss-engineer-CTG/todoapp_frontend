import { useState, useEffect } from 'react';

/**
 * カスタムフック: ローカルストレージにデータを保存・取得
 * 
 * 使用例:
 * const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', []);
 * const [settings, setSettings] = useLocalStorage<Settings>('settings', defaultSettings);
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // 初期値を取得する関数
  const getStoredValue = (): T => {
    try {
      // ローカルストレージからデータを取得
      const item = window.localStorage.getItem(key);
      
      // データが存在する場合はパースして返す
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // エラーが発生した場合は初期値を返す
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };
  
  // 状態を初期化
  const [storedValue, setStoredValue] = useState<T>(getStoredValue);
  
  // 値を設定する関数
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // 新しい値を計算
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // 状態を更新
      setStoredValue(valueToStore);
      
      // ローカルストレージに保存
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // エラーが発生した場合はログに記録
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };
  
  // ローカルストレージの変更を監視
  useEffect(() => {
    // ストレージイベントハンドラー
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        // 他のタブ/ウィンドウでの変更を反映
        setStoredValue(JSON.parse(event.newValue));
      } else if (event.key === key && event.newValue === null) {
        // 削除された場合は初期値に戻す
        setStoredValue(initialValue);
      }
    };
    
    // イベントリスナーを登録
    window.addEventListener('storage', handleStorageChange);
    
    // クリーンアップ関数
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);
  
  return [storedValue, setValue];
}

export default useLocalStorage;
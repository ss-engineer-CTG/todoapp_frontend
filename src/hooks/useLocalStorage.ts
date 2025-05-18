import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // ローカルストレージから値を取得するか、初期値を使用
  const readValue = (): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };
  
  // 実際の値を状態として保持
  const [storedValue, setStoredValue] = useState<T>(readValue);
  
  // 値を設定し、ローカルストレージに保存するラッパー関数を返す
  const setValue = (value: T | ((val: T) => T)): void => {
    try {
      // 関数として渡された場合は関数を実行して結果を使用
      const newValue = value instanceof Function ? value(storedValue) : value;
      
      // ローカルストレージに保存
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(newValue));
      }
      
      // 状態を更新
      setStoredValue(newValue);
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };
  
  // 他のウィンドウでの変更を監視
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        setStoredValue(JSON.parse(e.newValue));
      }
    };
    
    // イベントリスナーを追加
    window.addEventListener('storage', handleStorageChange);
    
    // クリーンアップ関数
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);
  
  return [storedValue, setValue] as const;
}
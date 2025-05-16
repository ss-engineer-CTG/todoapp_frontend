import { useEffect, useRef } from 'react';

type KeyCombination = string; // 'Ctrl+S', 'Alt+Shift+F', etc.
type KeyHandler = () => void;
type Dependencies = ReadonlyArray<unknown>;

interface ShortcutMap {
  [key: KeyCombination]: KeyHandler;
}

/**
 * カスタムフック: キーボードショートカットを管理
 * 
 * 使用例:
 * useKeyboardShortcuts({
 *   'Space': () => toggleTaskCompletion(),
 *   'Delete': () => deleteTask(),
 *   'Ctrl+N': () => openNote(),
 * }, [taskId]);
 */
export const useKeyboardShortcuts = (
  shortcuts: ShortcutMap,
  dependencies: Dependencies = []
) => {
  // ショートカットマップへの参照を保持
  const shortcutsRef = useRef<ShortcutMap>(shortcuts);
  
  // 依存配列が変更されたらショートカットマップを更新
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts, ...dependencies]);
  
  // キーイベントハンドラー
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 入力フィールドでのキー操作は処理しない
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof HTMLElement && event.target.isContentEditable)
      ) {
        return;
      }
      
      // 修飾キーの状態を取得
      const ctrlKey = event.ctrlKey || event.metaKey; // macOSの場合はmetaKeyも含める
      const altKey = event.altKey;
      const shiftKey = event.shiftKey;
      
      // キーの組み合わせを文字列化
      let keyCombo = '';
      
      if (ctrlKey) keyCombo += 'Ctrl+';
      if (altKey) keyCombo += 'Alt+';
      if (shiftKey) keyCombo += 'Shift+';
      
      // キーコードをキー名に変換
      let keyName = '';
      
      if (event.code.startsWith('Key')) {
        // KeyA, KeyB などの場合は最後の文字を取得
        keyName = event.code.substring(3);
      } else if (event.code.startsWith('Digit')) {
        // Digit1, Digit2 などの場合は最後の文字を取得
        keyName = event.code.substring(5);
      } else if (event.code === 'Space') {
        keyName = 'Space';
      } else if (event.code === 'Enter') {
        keyName = 'Enter';
      } else if (event.code === 'Escape') {
        keyName = 'Escape';
      } else if (event.code === 'Backspace') {
        keyName = 'Backspace';
      } else if (event.code === 'Delete') {
        keyName = 'Delete';
      } else if (event.code === 'Tab') {
        keyName = 'Tab';
      } else if (event.code.startsWith('Arrow')) {
        keyName = event.code;
      } else {
        keyName = event.code;
      }
      
      // 最終的なキーの組み合わせ
      keyCombo += keyName;
      
      // ショートカットが登録されていれば実行
      const handler = shortcutsRef.current[keyCombo];
      if (handler) {
        event.preventDefault();
        handler();
      }
    };
    
    // イベントリスナーを登録
    document.addEventListener('keydown', handleKeyDown);
    
    // クリーンアップ関数
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, dependencies); // 依存配列が変わったら再設定
};

export default useKeyboardShortcuts;
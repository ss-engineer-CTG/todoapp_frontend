/**
 * キーボード操作ユーティリティ関数群
 */

/**
 * キーの組み合わせを表す型
 * 'Ctrl+S', 'Shift+ArrowUp', 'Alt+Shift+F' など
 */
export type KeyCombination = string;

/**
 * キーボードイベントからキーの組み合わせ文字列を生成する
 */
export const getKeyCombination = (event: KeyboardEvent): KeyCombination => {
  const modifiers: string[] = [];
  
  if (event.ctrlKey || event.metaKey) modifiers.push('Ctrl');
  if (event.altKey) modifiers.push('Alt');
  if (event.shiftKey) modifiers.push('Shift');
  
  let key = '';
  
  // キーコードをキー名に変換
  if (event.code.startsWith('Key')) {
    // KeyA, KeyB などの場合は最後の文字を取得
    key = event.code.substring(3);
  } else if (event.code.startsWith('Digit')) {
    // Digit1, Digit2 などの場合は最後の文字を取得
    key = event.code.substring(5);
  } else if (event.code === 'Space') {
    key = 'Space';
  } else if (event.code === 'Enter') {
    key = 'Enter';
  } else if (event.code === 'Escape') {
    key = 'Escape';
  } else if (event.code === 'Backspace') {
    key = 'Backspace';
  } else if (event.code === 'Delete') {
    key = 'Delete';
  } else if (event.code === 'Tab') {
    key = 'Tab';
  } else if (event.code.startsWith('Arrow')) {
    key = event.code;
  } else {
    key = event.code;
  }
  
  if (modifiers.length > 0) {
    return `${modifiers.join('+')}+${key}`;
  }
  
  return key;
};

/**
 * キーの組み合わせが一致するかチェックする
 */
export const matchKeyCombination = (
  event: KeyboardEvent,
  combination: KeyCombination
): boolean => {
  return getKeyCombination(event) === combination;
};

/**
 * 修飾キーを含むかどうかをチェックする
 */
export const hasModifier = (event: KeyboardEvent): boolean => {
  return event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
};

/**
 * キーボードイベントが入力フィールドで発生したかどうかをチェックする
 */
export const isInputEvent = (event: KeyboardEvent): boolean => {
  const target = event.target as HTMLElement;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
};

/**
 * キーボードショートカットのハンドラを作成する
 */
export const createKeyboardHandler = (
  keyMap: Record<KeyCombination, () => void>,
  options: { preventDefault?: boolean; stopPropagation?: boolean } = {}
) => {
  return (event: KeyboardEvent) => {
    // 入力フィールドでの操作は処理しない
    if (isInputEvent(event)) return;
    
    const combination = getKeyCombination(event);
    const handler = keyMap[combination];
    
    if (handler) {
      if (options.preventDefault) {
        event.preventDefault();
      }
      if (options.stopPropagation) {
        event.stopPropagation();
      }
      handler();
    }
  };
};

/**
 * キー名を表示用の文字列に変換する
 */
export const formatKeyName = (key: string): string => {
  const keyMap: Record<string, string> = {
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    Space: 'Space',
    Enter: 'Enter',
    Escape: 'Esc',
    Delete: 'Del',
    Backspace: 'Backspace',
    Tab: 'Tab',
    Ctrl: '⌃',
    Alt: '⌥',
    Shift: '⇧',
    Meta: '⌘',
  };
  
  return keyMap[key] || key;
};

/**
 * キーの組み合わせを表示用の文字列に変換する
 */
export const formatKeyCombination = (combination: KeyCombination): string => {
  return combination
    .split('+')
    .map(formatKeyName)
    .join(' + ');
};
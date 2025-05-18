// キーイベントのユーティリティ関数

// 方向キーのコード
export const ARROW_KEYS = {
    UP: 'ArrowUp',
    DOWN: 'ArrowDown',
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight'
  };
  
  // 共通のキーコード
  export const KEYS = {
    ENTER: 'Enter',
    ESC: 'Escape',
    TAB: 'Tab',
    SPACE: ' ',
    DELETE: 'Delete',
    BACKSPACE: 'Backspace',
    PLUS: '+',
    MINUS: '-'
  };
  
  // 修飾キーが押されているかチェック
  export const hasModifier = (e: KeyboardEvent | React.KeyboardEvent): boolean => {
    return e.ctrlKey || e.altKey || e.metaKey || e.shiftKey;
  };
  
  // Ctrlキー（MacではCommandキー）のチェック
  export const isCtrlPressed = (e: KeyboardEvent | React.KeyboardEvent): boolean => {
    // MacではmetaKey、WindowsではctrlKey
    return navigator.platform.indexOf('Mac') !== -1 ? e.metaKey : e.ctrlKey;
  };
  
  // ショートカットキーのマッチングチェック
  export const matchesShortcut = (
    e: KeyboardEvent | React.KeyboardEvent, 
    key: string, 
    modifiers: { ctrl?: boolean; alt?: boolean; shift?: boolean; meta?: boolean } = {}
  ): boolean => {
    const { ctrl = false, alt = false, shift = false, meta = false } = modifiers;
    
    return e.key === key && 
           e.ctrlKey === ctrl && 
           e.altKey === alt && 
           e.shiftKey === shift && 
           e.metaKey === meta;
  };
  
  // キー操作のイベントハンドラー生成
  export const createKeyHandler = (
    keyHandlers: Record<string, (e: KeyboardEvent | React.KeyboardEvent) => void>
  ) => {
    return (e: KeyboardEvent | React.KeyboardEvent) => {
      if (keyHandlers[e.key]) {
        keyHandlers[e.key](e);
      }
    };
  };
  
  // 方向キーでフォーカス移動するためのハンドラー
  export const createArrowKeyHandler = (
    onArrowKey: (direction: 'up' | 'down' | 'left' | 'right', e: KeyboardEvent | React.KeyboardEvent) => void
  ) => {
    return (e: KeyboardEvent | React.KeyboardEvent) => {
      switch (e.key) {
        case ARROW_KEYS.UP:
          onArrowKey('up', e);
          break;
        case ARROW_KEYS.DOWN:
          onArrowKey('down', e);
          break;
        case ARROW_KEYS.LEFT:
          onArrowKey('left', e);
          break;
        case ARROW_KEYS.RIGHT:
          onArrowKey('right', e);
          break;
      }
    };
  };
  
  // 複数のキーボードハンドラーを結合
  export const combineKeyHandlers = (
    ...handlers: ((e: KeyboardEvent | React.KeyboardEvent) => void)[]
  ) => {
    return (e: KeyboardEvent | React.KeyboardEvent) => {
      for (const handler of handlers) {
        handler(e);
      }
    };
  };
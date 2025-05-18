/**
 * キーボード関連の定数
 */
export const keyConstants = {
    // 方向キー
    ARROW: {
      UP: 'ArrowUp',
      DOWN: 'ArrowDown',
      LEFT: 'ArrowLeft',
      RIGHT: 'ArrowRight'
    },
    
    // 制御キー
    CONTROL: {
      ENTER: 'Enter',
      TAB: 'Tab',
      ESCAPE: 'Escape',
      SPACE: ' ',
      BACKSPACE: 'Backspace',
      DELETE: 'Delete'
    },
    
    // 修飾キー
    MODIFIER: {
      SHIFT: 'Shift',
      CTRL: 'Control',
      ALT: 'Alt',
      META: 'Meta' // Windows/Commandキー
    },
    
    // 特殊キー
    SPECIAL: {
      PLUS: '+',
      MINUS: '-',
      EQUAL: '=',
      UNDERSCORE: '_'
    },
    
    // アルファベットキー（よく使われるショートカットキー）
    ALPHA: {
      A: 'a', // 全選択
      C: 'c', // コピー
      D: 'd', // 複製
      F: 'f', // 検索
      N: 'n', // 新規
      S: 's', // 保存
      T: 't', // テンプレート
      V: 'v', // 貼り付け
      X: 'x', // 切り取り
      Y: 'y', // やり直し
      Z: 'z'  // 元に戻す
    },
    
    // キーコンビネーション（ショートカット）
    COMBINATIONS: {
      // 基本操作
      NEW_TASK: 'Enter',
      NEW_TASK_DETAILED: 'Shift+Enter',
      ADD_CHILD_TASK: 'Tab',
      TASK_COMPLETE: 'Space',
      DELETE_TASK: 'Delete',
      
      // 編集操作
      COPY: 'Control+c',
      CUT: 'Control+x',
      PASTE: 'Control+v',
      DUPLICATE: 'Control+d',
      UNDO: 'Control+z',
      REDO: 'Control+y',
      SAVE: 'Control+s',
      
      // ナビゲーション
      SEARCH: 'Control+f',
      MOVE_UP: 'ArrowUp',
      MOVE_DOWN: 'ArrowDown',
      MOVE_LEFT: 'ArrowLeft',
      MOVE_RIGHT: 'ArrowRight',
      MOVE_TASK_UP: 'Shift+ArrowUp',
      MOVE_TASK_DOWN: 'Shift+ArrowDown',
      
      // タイムライン操作
      ZOOM_IN: '+',
      ZOOM_OUT: '-',
      TODAY: 't',
      
      // その他
      HELP: 'F1',
      CANCEL: 'Escape'
    },
    
    // キーコンビネーションのフォーマット（表示用）
    getKeyDisplay: (combination: string): string => {
      // macOSとそれ以外で表示を分ける
      const isMac = navigator.platform.indexOf('Mac') !== -1;
      
      // 'Control+' を macOS では '⌘+' に、Windows/Linux では 'Ctrl+' に置換
      return combination
        .replace('Control+', isMac ? '⌘+' : 'Ctrl+')
        .replace('Shift+', isMac ? '⇧+' : 'Shift+')
        .replace('Alt+', isMac ? '⌥+' : 'Alt+')
        .replace('Meta+', isMac ? '⌘+' : 'Win+');
    }
  };
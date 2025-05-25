// キーボードイベントのヘルパー関数

export const isInputElement = (element: EventTarget | null): boolean => {
    return element instanceof HTMLInputElement || 
           element instanceof HTMLTextAreaElement ||
           element instanceof HTMLSelectElement
  }
  
  export const isEditableElement = (element: EventTarget | null): boolean => {
    if (!element || !(element instanceof HTMLElement)) return false
    
    return element.isContentEditable ||
           element.tagName === 'INPUT' ||
           element.tagName === 'TEXTAREA' ||
           element.tagName === 'SELECT'
  }
  
  export const getKeyboardShortcutString = (event: KeyboardEvent): string => {
    const parts: string[] = []
    
    if (event.ctrlKey || event.metaKey) parts.push('Ctrl')
    if (event.altKey) parts.push('Alt')
    if (event.shiftKey) parts.push('Shift')
    
    const key = event.key
    if (key.length === 1) {
      parts.push(key.toUpperCase())
    } else {
      parts.push(key)
    }
    
    return parts.join(' + ')
  }
  
  export const isModifierKeyPressed = (event: KeyboardEvent): boolean => {
    return event.ctrlKey || event.metaKey || event.altKey || event.shiftKey
  }
  
  export const isMacOS = (): boolean => {
    return typeof navigator !== 'undefined' && 
           navigator.platform.toUpperCase().indexOf('MAC') >= 0
  }
  
  export const getModifierKey = (): string => {
    return isMacOS() ? 'Cmd' : 'Ctrl'
  }
  
  // キーボードショートカットの組み合わせチェック
  export const matchesShortcut = (
    event: KeyboardEvent,
    shortcut: {
      key: string
      ctrl?: boolean
      alt?: boolean
      shift?: boolean
      meta?: boolean
    }
  ): boolean => {
    const normalizedKey = event.key.toLowerCase()
    const normalizedShortcutKey = shortcut.key.toLowerCase()
    
    if (normalizedKey !== normalizedShortcutKey) return false
    
    const ctrlMatch = !!shortcut.ctrl === (event.ctrlKey || event.metaKey)
    const altMatch = !!shortcut.alt === event.altKey
    const shiftMatch = !!shortcut.shift === event.shiftKey
    const metaMatch = !!shortcut.meta === event.metaKey
    
    return ctrlMatch && altMatch && shiftMatch && metaMatch
  }
  
  // フォーカス可能な要素の取得
  export const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')
    
    return Array.from(container.querySelectorAll(focusableSelectors))
  }
  
  // フォーカストラップ（モーダル内でのフォーカス制御）
  export const trapFocus = (container: HTMLElement, event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return
    
    const focusableElements = getFocusableElements(container)
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    
    if (event.shiftKey) {
      // Shift + Tab (逆方向)
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement?.focus()
      }
    } else {
      // Tab (順方向)
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement?.focus()
      }
    }
  }
  
  // 次/前の要素にフォーカス移動
  export const moveFocus = (
    container: HTMLElement,
    direction: 'next' | 'previous'
  ): void => {
    const focusableElements = getFocusableElements(container)
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement)
    
    if (currentIndex === -1) {
      focusableElements[0]?.focus()
      return
    }
    
    let nextIndex: number
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % focusableElements.length
    } else {
      nextIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1
    }
    
    focusableElements[nextIndex]?.focus()
  }
  
  // エスケープキーのハンドリング
  export const handleEscapeKey = (
    event: KeyboardEvent,
    callbacks: Array<() => boolean | void>
  ): void => {
    if (event.key !== 'Escape') return
    
    for (const callback of callbacks) {
      const result = callback()
      if (result === true) {
        event.preventDefault()
        event.stopPropagation()
        break
      }
    }
  }
  
  // グローバルキーボードショートカットの登録
  export const registerGlobalShortcut = (
    shortcut: string,
    callback: () => void,
    options: {
      preventDefault?: boolean
      stopPropagation?: boolean
    } = {}
  ): (() => void) => {
    const handler = (event: KeyboardEvent) => {
      if (isInputElement(event.target)) return
      
      if (getKeyboardShortcutString(event) === shortcut) {
        if (options.preventDefault) event.preventDefault()
        if (options.stopPropagation) event.stopPropagation()
        callback()
      }
    }
    
    document.addEventListener('keydown', handler)
    
    // クリーンアップ関数を返す
    return () => {
      document.removeEventListener('keydown', handler)
    }
  }
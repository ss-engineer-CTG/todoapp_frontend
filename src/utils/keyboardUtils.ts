export interface KeyboardShortcut {
  key: string
  description: string
  category?: string
}

export function parseKeyboardEvent(event: KeyboardEvent): string {
  const keys: string[] = []

  if (event.ctrlKey || event.metaKey) keys.push('Ctrl')
  if (event.altKey) keys.push('Alt')
  if (event.shiftKey) keys.push('Shift')
  
  if (event.key !== 'Control' && event.key !== 'Meta' && event.key !== 'Alt' && event.key !== 'Shift') {
    keys.push(event.key)
  }

  return keys.join(' + ')
}

export function isInputFocused(): boolean {
  const activeElement = document.activeElement
  return Boolean(
    activeElement && (
      activeElement instanceof HTMLInputElement ||
      activeElement instanceof HTMLTextAreaElement ||
      activeElement instanceof HTMLSelectElement ||
      activeElement.getAttribute('contenteditable') === 'true'
    )
  )
}

export function preventDefault(event: KeyboardEvent): void {
  event.preventDefault()
  event.stopPropagation()
}

export function isModifierKey(key: string): boolean {
  return ['Control', 'Meta', 'Alt', 'Shift'].includes(key)
}

export function formatKeyboardShortcut(shortcut: string): string {
  return shortcut
    .split(' + ')
    .map(key => {
      switch (key.toLowerCase()) {
        case 'ctrl':
        case 'control':
          return 'Ctrl'
        case 'meta':
        case 'cmd':
          return 'Cmd'
        case 'alt':
          return 'Alt'
        case 'shift':
          return 'Shift'
        case 'arrowup':
          return '↑'
        case 'arrowdown':
          return '↓'
        case 'arrowleft':
          return '←'
        case 'arrowright':
          return '→'
        case ' ':
          return 'Space'
        case 'enter':
          return 'Enter'
        case 'escape':
          return 'Esc'
        case 'backspace':
          return 'Backspace'
        case 'delete':
          return 'Delete'
        case 'tab':
          return 'Tab'
        default:
          return key.charAt(0).toUpperCase() + key.slice(1)
      }
    })
    .join(' + ')
}
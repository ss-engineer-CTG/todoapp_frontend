import React from 'react'
import { KEYBOARD_SHORTCUTS } from '@/constants/shortcuts'

const KeyboardGuide: React.FC = () => {
  return (
    <div className="grid gap-4 py-4">
      <div className="space-y-3">
        {KEYBOARD_SHORTCUTS.map((shortcut) => (
          <div key={shortcut.key} className="flex items-center justify-between">
            <kbd className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted rounded border">
              {shortcut.key}
            </kbd>
            <span className="text-sm flex-1 ml-3">{shortcut.description}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default KeyboardGuide
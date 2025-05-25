"use client"

import React from "react"
import { KEYBOARD_SHORTCUTS } from "@/constants/keyboard-shortcuts"

export default function KeyboardShortcuts() {
  return (
    <div className="grid gap-4 py-4">
      <div className="space-y-4">
        {KEYBOARD_SHORTCUTS.map((section) => (
          <div key={section.section} className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase">
              {section.section}
            </h3>
            <div className="grid gap-2">
              {section.shortcuts.map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between">
                  <span className="text-sm">{shortcut.description}</span>
                  <kbd className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted rounded border">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
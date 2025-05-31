import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { HelpCircle } from 'lucide-react'
import { KEYBOARD_SHORTCUTS } from '../config/constants'
import { KeyboardShortcut } from '../types'

export const ShortcutGuideDialog: React.FC = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="ショートカットキーガイド">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>キーボードショートカット</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-3">
            {KEYBOARD_SHORTCUTS.map((shortcut: KeyboardShortcut, index: number) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <kbd className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted rounded-md border min-w-[120px] text-center">
                  {shortcut.key}
                </kbd>
                <span className="text-sm flex-1 ml-4">{shortcut.description}</span>
              </div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/50 rounded-md">
            <p><strong>ヒント:</strong></p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>詳細パネルでESCキーを押すとタスクパネルに戻ります</li>
              <li>カレンダーで同じ日付を選び直すことも可能です</li>
              <li>タスクの階層は Tab キーで作成し、矢印キーで移動できます</li>
              <li>詳細パネルでは Tab キーでフィールド間を移動できます</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
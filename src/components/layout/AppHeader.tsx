import React from 'react'
import { Factory, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import ThemeToggle from '@/components/layout/ThemeToggle'
import ViewModeToggle from '@/components/layout/ViewModeToggle'
import KeyboardGuide from '@/components/layout/KeyboardGuide'
import { useApp } from '@/hooks/useApp'

const AppHeader: React.FC = () => {
  const { viewMode } = useApp()

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <Factory className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-semibold">
            統合プロジェクト管理 - {viewMode === 'list' ? 'リスト表示' : 'タイムライン表示'}
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <ViewModeToggle />
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" title="ショートカットキーガイド">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>キーボードショートカット</DialogTitle>
              </DialogHeader>
              <KeyboardGuide />
            </DialogContent>
          </Dialog>

          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

export default AppHeader
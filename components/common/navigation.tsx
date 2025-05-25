"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { useViewContext } from "@/hooks/use-view-context"
import { 
  List, 
  Calendar, 
  Sun, 
  Moon, 
  HelpCircle,
  Settings,
  FileText
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import KeyboardShortcuts from "@/components/common/keyboard-shortcuts"

export default function Navigation() {
  const { theme, setTheme } = useTheme()
  const { currentView, setCurrentView } = useViewContext()

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        {/* アプリタイトル */}
        <div className="flex items-center space-x-2">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-semibold">統合ToDo管理</h1>
        </div>

        {/* ビュー切り替えボタン */}
        <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
          <Button
            variant={currentView === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('list')}
            className="flex items-center space-x-2"
          >
            <List className="h-4 w-4" />
            <span>リスト</span>
          </Button>
          <Button
            variant={currentView === 'timeline' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentView('timeline')}
            className="flex items-center space-x-2"
          >
            <Calendar className="h-4 w-4" />
            <span>タイムライン</span>
          </Button>
        </div>

        {/* 右側メニュー */}
        <div className="flex items-center space-x-2">
          {/* キーボードショートカットガイド */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" title="キーボードショートカット">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>キーボードショートカット</DialogTitle>
              </DialogHeader>
              <KeyboardShortcuts />
            </DialogContent>
          </Dialog>

          {/* 設定ボタン（将来の拡張用） */}
          <Button variant="ghost" size="icon" title="設定">
            <Settings className="h-4 w-4" />
          </Button>

          {/* テーマ切り替え */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={theme === "dark" ? "ライトモードに切り替え" : "ダークモードに切り替え"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  )
}
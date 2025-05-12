"use client"

import { useContext } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { UIContext } from "../../contexts/UIContext"
import ShortcutKey from "../common/ShortcutKey"

export default function HelpDialog() {
  const { isHelpOpen, setIsHelpOpen } = useContext(UIContext)

  return (
    <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>理想的なToDoリスト - ヘルプ</DialogTitle>
          <DialogDescription>
            このアプリケーションの使い方とヒント
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">基本機能</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <h4 className="font-medium">プロジェクト作成</h4>
                  <p>メインウィンドウ上部の「+」ボタンまたはキーボードショートカット Ctrl+Shift+N を使用。</p>
                </div>
                <div>
                  <h4 className="font-medium">タスク追加</h4>
                  <p>既存のタスクを選択して Enter キーを押すと同レベルのタスクを追加、Tab キーを押すと子タスクを追加。</p>
                </div>
                <div>
                  <h4 className="font-medium">タスク完了</h4>
                  <p>チェックボックスをクリックするか、タスクを選択して Space キーを押します。</p>
                </div>
                <div>
                  <h4 className="font-medium">タスク編集</h4>
                  <p>タスクを選択して Ctrl+E キーを押すか、編集アイコンをクリックします。</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">ビュー</h3>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div>
                  <h4 className="font-medium">プロジェクトビュー (1)</h4>
                  <p>プロジェクトごとにタスクをグループ化して表示します。各プロジェクトを展開/折りたたみできます。</p>
                </div>
                <div>
                  <h4 className="font-medium">タイムラインビュー (2)</h4>
                  <p>タスクをカレンダー形式で表示します。タスクバーをドラッグして日程を変更できます。</p>
                </div>
                <div>
                  <h4 className="font-medium">テーブルビュー (3)</h4>
                  <p>すべてのタスクを表形式で表示します。列ごとの並べ替えやフィルタリングが可能です。</p>
                </div>
                <div>
                  <h4 className="font-medium">今日のタスクビュー (4)</h4>
                  <p>今日が開始日と期限日の間にあるタスクのみを表示します。</p>
                </div>
                <div>
                  <h4 className="font-medium">かんばんビュー (5)</h4>
                  <p>タスクをかんばんボード形式で表示します。カードをドラッグ＆ドロップで移動できます。</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">キーボードショートカット</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span>新規プロジェクト作成</span>
                  <ShortcutKey keys="Ctrl+Shift+N" />
                </div>
                <div className="flex justify-between items-center">
                  <span>タスクの追加</span>
                  <ShortcutKey keys="Enter" />
                </div>
                <div className="flex justify-between items-center">
                  <span>子タスクの追加</span>
                  <ShortcutKey keys="Tab" />
                </div>
                <div className="flex justify-between items-center">
                  <span>検索</span>
                  <ShortcutKey keys="Ctrl+F" />
                </div>
                <div className="flex justify-between items-center">
                  <span>高度な検索</span>
                  <ShortcutKey keys="Ctrl+Shift+F" />
                </div>
                <div className="flex justify-between items-center">
                  <span>データ保存</span>
                  <ShortcutKey keys="Ctrl+S" />
                </div>
                <div className="flex justify-between items-center">
                  <span>優先度を上げる/下げる</span>
                  <div className="flex gap-1">
                    <ShortcutKey keys="+" />
                    <ShortcutKey keys="-" />
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">データ管理</h3>
              <div className="text-sm space-y-2">
                <p>
                  このアプリケーションはデータをブラウザのローカルストレージに保存します。
                  将来的にはSQLiteデータベース「projects.db」に保存される予定です。
                </p>
                <p>
                  <strong>データのバックアップ:</strong> インポート/エクスポート機能を使用して、
                  データをJSONファイルとしてエクスポートし、バックアップできます。
                </p>
                <p>
                  <strong>データの復元:</strong> エクスポートしたJSONファイルを使用して、
                  データを復元できます。
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">ヒントとコツ</h3>
              <div className="text-sm space-y-2">
                <p>
                  <strong>タスクの整理:</strong> プロジェクト {'>'} タスク {'>'} サブタスクの
                  階層構造を使用して作業を整理しましょう。
                </p>
                <p>
                  <strong>優先度の設定:</strong> タスクに優先度を設定して、重要なタスクに集中しましょう。
                  「+」キーと「-」キーを使用して素早く優先度を変更できます。
                </p>
                <p>
                  <strong>タグの活用:</strong> タグを使用してタスクを分類し、フィルタリングに役立てましょう。
                </p>
                <p>
                  <strong>定期的なバックアップ:</strong> 重要なタスクデータは定期的にエクスポートしてバックアップしましょう。
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={() => setIsHelpOpen(false)}>
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
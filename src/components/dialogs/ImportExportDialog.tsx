"use client"

import { useContext, useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UIContext } from "../../contexts/UIContext"
import { useTasks } from "../../hooks/useTasks"
import { toast } from "@/components/ui/use-toast"

export default function ImportExportDialog() {
  const { isImportExportOpen, setIsImportExportOpen } = useContext(UIContext)
  const { exportData: getExportData, importDataFromText } = useTasks()
  const [exportData, setExportData] = useState("")
  const [importData, setImportData] = useState("")

  useEffect(() => {
    if (isImportExportOpen) {
      const fetchExportData = async () => {
        try {
          const data = await getExportData()
          setExportData(data)
        } catch (error) {
          console.error("データのエクスポートに失敗しました:", error)
          toast({
            title: "エラー",
            description: "データのエクスポートに失敗しました",
          })
        }
      }
      
      fetchExportData()
      setImportData("")
    }
  }, [isImportExportOpen, getExportData])

  const handleImport = async () => {
    try {
      const success = await importDataFromText(importData)
      if (success) {
        setIsImportExportOpen(false)
        
        toast({
          title: "データをインポートしました",
          description: "タスクとプロジェクトを正常にインポートしました",
        })
      } else {
        toast({
          title: "インポートエラー",
          description: "データ形式が正しくありません",
        })
      }
    } catch (error) {
      console.error("データのインポートに失敗しました:", error)
      toast({
        title: "エラー",
        description: "データのインポートに失敗しました",
      })
    }
  }

  return (
    <Dialog open={isImportExportOpen} onOpenChange={setIsImportExportOpen}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>データのインポート/エクスポート</DialogTitle>
          <DialogDescription>
            タスクとプロジェクトのデータをJSONファイルとしてエクスポートしたり、インポートしたりできます。
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="export">
          <TabsList className="mb-4">
            <TabsTrigger value="export">エクスポート</TabsTrigger>
            <TabsTrigger value="import">インポート</TabsTrigger>
          </TabsList>
          
          <TabsContent value="export">
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                下記のJSONデータをコピーして保存してください。このデータを使用して、後でタスクとプロジェクトを復元できます。
              </p>
              <div className="relative">
                <Textarea
                  value={exportData}
                  readOnly
                  className="font-mono text-xs h-60"
                />
                <Button
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    navigator.clipboard.writeText(exportData)
                    toast({
                      title: "コピーしました",
                      description: "データがクリップボードにコピーされました",
                    })
                  }}
                >
                  コピー
                </Button>
              </div>
              <Button
                onClick={() => {
                  const blob = new Blob([exportData], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  const date = new Date().toISOString().split('T')[0]
                  a.href = url
                  a.download = `todo-app-data-${date}.json`
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  URL.revokeObjectURL(url)
                }}
              >
                JSONファイルとしてダウンロード
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="import">
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                以前エクスポートしたJSONデータを貼り付けてインポートしてください。現在のデータはすべて置き換えられます。
              </p>
              <Textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="ここにJSONデータを貼り付けてください..."
                className="font-mono text-xs h-60"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setImportData("")}>
                  クリア
                </Button>
                <Button onClick={handleImport} disabled={!importData.trim()}>
                  インポート
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
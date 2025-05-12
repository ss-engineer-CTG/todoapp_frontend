import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import ConfirmDialog from "./ConfirmDialog"

interface ErrorDisplayProps {
  message: string
  onReset?: () => void
}

export default function ErrorDisplay({ message, onReset }: ErrorDisplayProps) {
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)

  return (
    <>
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>エラーが発生しました</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>{message}</p>
          {onReset && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsResetConfirmOpen(true)}
            >
              初期データにリセット
            </Button>
          )}
        </AlertDescription>
      </Alert>

      {/* リセット確認ダイアログ */}
      {onReset && (
        <ConfirmDialog
          isOpen={isResetConfirmOpen}
          onClose={() => setIsResetConfirmOpen(false)}
          onConfirm={onReset}
          title="データをリセットしますか？"
          description="全てのデータを初期状態にリセットします。この操作は元に戻せません。"
          confirmText="リセット"
          cancelText="キャンセル"
        />
      )}
    </>
  )
}
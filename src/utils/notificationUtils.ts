import { toast } from "@/components/ui/use-toast"

// 成功通知を表示
export function showSuccessToast(title: string, description?: string) {
  toast({
    title,
    description,
    duration: 3000,
  })
}

// エラー通知を表示
export function showErrorToast(title: string, description?: string) {
  toast({
    title,
    description,
    duration: 5000,
    variant: "destructive"
  })
}

// 警告通知を表示
export function showWarningToast(title: string, description?: string) {
  toast({
    title,
    description,
    duration: 4000,
  })
}

// 情報通知を表示
export function showInfoToast(title: string, description?: string) {
  toast({
    title,
    description,
    duration: 3000,
  })
}

// キーボードショートカットフィードバックを表示
export function showKeyboardShortcutFeedback(shortcut: string, action: string) {
  toast({
    title: shortcut,
    description: action,
    duration: 2000,
  })
}
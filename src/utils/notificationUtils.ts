// src/utils/notificationUtils.ts
import { toast } from "@/hooks/use-toast";
import { logInfo } from "./logUtils";

// 重複通知を防ぐためのマップ
const recentNotifications = new Map<string, number>();
const NOTIFICATION_COOLDOWN = 2000; // ミリ秒

// 成功通知を表示
export function showSuccessToast(title: string, description?: string, options?: { duration?: number }) {
  const key = `success:${title}`;
  const now = Date.now();
  
  // 同じ通知が短時間に繰り返されるのを防止
  if (recentNotifications.has(key)) {
    const lastTime = recentNotifications.get(key) || 0;
    if (now - lastTime < NOTIFICATION_COOLDOWN) {
      return; // クールダウン中は表示しない
    }
  }
  
  recentNotifications.set(key, now);
  
  toast({
    title,
    description,
    duration: options?.duration || 3000,
  });
  
  logInfo(`成功通知: ${title} ${description || ''}`);
}

// エラー通知を表示
export function showErrorToast(title: string, description?: string, options?: { duration?: number }) {
  const key = `error:${title}`;
  recentNotifications.set(key, Date.now());
  
  toast({
    title,
    description,
    duration: options?.duration || 5000,
    variant: "destructive"
  });
  
  logInfo(`エラー通知: ${title} ${description || ''}`);
}

// 警告通知を表示
export function showWarningToast(title: string, description?: string, options?: { duration?: number }) {
  const key = `warning:${title}`;
  recentNotifications.set(key, Date.now());
  
  toast({
    title,
    description,
    duration: options?.duration || 4000,
  });
  
  logInfo(`警告通知: ${title} ${description || ''}`);
}

// 情報通知を表示
export function showInfoToast(title: string, description?: string, options?: { duration?: number }) {
  const key = `info:${title}`;
  const now = Date.now();
  
  // 同じ通知が短時間に繰り返されるのを防止
  if (recentNotifications.has(key)) {
    const lastTime = recentNotifications.get(key) || 0;
    if (now - lastTime < NOTIFICATION_COOLDOWN) {
      return; // クールダウン中は表示しない
    }
  }
  
  recentNotifications.set(key, now);
  
  toast({
    title,
    description,
    duration: options?.duration || 3000,
  });
  
  logInfo(`情報通知: ${title} ${description || ''}`);
}

// グローバル通知変数
let activeShortcutNotification: { id: string; timeoutId: number } | null = null;

// キーボードショートカットフィードバックを表示
export function showKeyboardShortcutFeedback(shortcut: string, action: string) {
  // アクティブな通知がある場合はキャンセル
  if (activeShortcutNotification) {
    clearTimeout(activeShortcutNotification.timeoutId);
    
    // この時点で既にトーストが消えている可能性があるが、念のため
    try {
      toast.dismiss(activeShortcutNotification.id);
    } catch (e) {
      // エラーは無視
    }
  }
  
  // 新しい通知を表示
  const notification = toast({
    title: shortcut,
    description: action,
    duration: 2000,
  });
  
  // タイムアウトIDを保存
  activeShortcutNotification = {
    id: notification.id,
    timeoutId: window.setTimeout(() => {
      activeShortcutNotification = null;
    }, 2000)
  };
  
  logInfo(`ショートカット実行: ${shortcut} - ${action}`);
}
"use client"

import type { TodoState } from "@/types/todo"

// ストレージキー定数
const STORAGE_KEYS = {
  TODO_DATA: 'todo-app-data',
  USER_PREFERENCES: 'todo-app-preferences',
  BACKUP_PREFIX: 'todo-app-backup-'
} as const

// ローカルストレージ操作
export class StorageService {
  // データの保存
  static saveTodoData(data: TodoState): boolean {
    try {
      const serializedData = JSON.stringify({
        ...data,
        // 日付オブジェクトを文字列に変換
        tasks: data.tasks.map(task => ({
          ...task,
          startDate: task.startDate.toISOString(),
          dueDate: task.dueDate.toISOString(),
          completionDate: task.completionDate?.toISOString() || null
        }))
      })
      
      localStorage.setItem(STORAGE_KEYS.TODO_DATA, serializedData)
      return true
    } catch (error) {
      console.error('Failed to save todo data:', error)
      return false
    }
  }

  // データの読み込み
  static loadTodoData(): TodoState | null {
    try {
      const serializedData = localStorage.getItem(STORAGE_KEYS.TODO_DATA)
      if (!serializedData) return null

      const data = JSON.parse(serializedData)
      
      // 日付文字列をDateオブジェクトに変換
      return {
        ...data,
        tasks: data.tasks.map((task: any) => ({
          ...task,
          startDate: new Date(task.startDate),
          dueDate: new Date(task.dueDate),
          completionDate: task.completionDate ? new Date(task.completionDate) : null
        }))
      }
    } catch (error) {
      console.error('Failed to load todo data:', error)
      return null
    }
  }

  // データのバックアップ
  static createBackup(): boolean {
    try {
      const currentData = this.loadTodoData()
      if (!currentData) return false

      const timestamp = new Date().toISOString()
      const backupKey = `${STORAGE_KEYS.BACKUP_PREFIX}${timestamp}`
      
      localStorage.setItem(backupKey, JSON.stringify(currentData))
      
      // 古いバックアップを削除（最新5件を保持）
      this.cleanupOldBackups()
      
      return true
    } catch (error) {
      console.error('Failed to create backup:', error)
      return false
    }
  }

  // 古いバックアップの削除
  static cleanupOldBackups(): void {
    try {
      const backupKeys = Object.keys(localStorage)
        .filter(key => key.startsWith(STORAGE_KEYS.BACKUP_PREFIX))
        .sort()
        .reverse()

      // 最新5件を残して削除
      if (backupKeys.length > 5) {
        backupKeys.slice(5).forEach(key => {
          localStorage.removeItem(key)
        })
      }
    } catch (error) {
      console.error('Failed to cleanup old backups:', error)
    }
  }

  // バックアップ一覧の取得
  static getBackupList(): Array<{ key: string; date: Date }> {
    try {
      return Object.keys(localStorage)
        .filter(key => key.startsWith(STORAGE_KEYS.BACKUP_PREFIX))
        .map(key => ({
          key,
          date: new Date(key.replace(STORAGE_KEYS.BACKUP_PREFIX, ''))
        }))
        .sort((a, b) => b.date.getTime() - a.date.getTime())
    } catch (error) {
      console.error('Failed to get backup list:', error)
      return []
    }
  }

  // バックアップからの復元
  static restoreFromBackup(backupKey: string): TodoState | null {
    try {
      const backupData = localStorage.getItem(backupKey)
      if (!backupData) return null

      const data = JSON.parse(backupData)
      
      // 復元前に現在のデータをバックアップ
      this.createBackup()
      
      // データを復元
      return data
    } catch (error) {
      console.error('Failed to restore from backup:', error)
      return null
    }
  }

  // データのクリア
  static clearAllData(): boolean {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        if (key.includes('backup')) {
          // バックアップ関連のキーは個別に削除
          Object.keys(localStorage)
            .filter(storageKey => storageKey.startsWith(key))
            .forEach(storageKey => localStorage.removeItem(storageKey))
        } else {
          localStorage.removeItem(key)
        }
      })
      return true
    } catch (error) {
      console.error('Failed to clear data:', error)
      return false
    }
  }

  // ストレージ使用量の取得
  static getStorageUsage(): { used: number; total: number; percentage: number } {
    try {
      let used = 0
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length
        }
      }
      
      // 一般的なブラウザのlocalStorageの制限は5MB
      const total = 5 * 1024 * 1024
      const percentage = (used / total) * 100
      
      return { used, total, percentage }
    } catch (error) {
      console.error('Failed to get storage usage:', error)
      return { used: 0, total: 0, percentage: 0 }
    }
  }
}
// Electronパス管理（システムプロンプト準拠）
import * as path from 'path'
import { app } from 'electron'

// パス定数一元管理
export const ELECTRON_PATHS = {
  // アプリケーション
  APP_ROOT: path.dirname(__dirname),
  
  // リソース
  RESOURCES: process.resourcesPath,
  
  // アセット
  ASSETS: path.join(__dirname, '..', 'assets'),
  
  // ユーザーデータ
  USER_DATA: app?.getPath('userData') || path.join(__dirname, '..', 'userData'),
  
  // ログ
  LOGS: path.join(__dirname, '..', '..', 'logs'),
  
  // 設定
  CONFIG: path.join(__dirname, '..', 'config')
} as const

/**
 * パス結合専用関数（システムプロンプト準拠）
 */
export function resolvePath(...segments: string[]): string {
  if (segments.length === 0) return ''
  
  // path.join を使用してクロスプラットフォーム対応
  return path.resolve(path.join(...segments))
}

/**
 * パス検証関数
 */
export function validatePath(targetPath: string): boolean {
  try {
    // 相対パス攻撃チェック
    const resolved = path.resolve(targetPath)
    const normalized = path.normalize(targetPath)
    
    // 危険なパターンをチェック
    if (normalized.includes('..')) {
      return false
    }
    
    // 危険な文字をチェック
    const dangerousChars = /[<>:"|?*\x00-\x1f]/
    if (dangerousChars.test(targetPath)) {
      return false
    }
    
    return true
  } catch {
    return false
  }
}

/**
 * 安全なファイルパス取得
 */
export function getSafeFilePath(basePath: string, fileName: string): string {
  if (!validatePath(fileName)) {
    throw new Error(`Unsafe file name: ${fileName}`)
  }
  
  return resolvePath(basePath, fileName)
}
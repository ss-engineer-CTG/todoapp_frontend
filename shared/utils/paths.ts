// パス操作共通関数（システムプロンプト準拠：パス結合専用関数）
import type { PathResolver, PathValidator, PathNormalizer } from '../types/paths'

/**
 * パス結合専用関数（「+」や「文字列テンプレート」による結合禁止）
 */
export const resolvePath: PathResolver = (...segments: string[]): string => {
  if (segments.length === 0) return ''
  
  return segments
    .filter(segment => segment && segment.trim() !== '')
    .map(segment => segment.replace(/^\/+|\/+$/g, ''))
    .join('/')
    .replace(/\/+/g, '/')
}

/**
 * パス正規化関数
 */
export const normalizePath: PathNormalizer = (path: string): string => {
  if (!path) return ''
  
  return path
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '') || '/'
}

/**
 * パス検証関数
 */
export const validatePath: PathValidator = (path: string): boolean => {
  if (!path || typeof path !== 'string') return false
  
  // 危険な文字をチェック
  const dangerousChars = /[<>:"|?*\x00-\x1f]/
  if (dangerousChars.test(path)) return false
  
  // 相対パス攻撃をチェック
  if (path.includes('..')) return false
  
  return true
}

/**
 * ベースパスからの相対パス取得
 */
export const getRelativePath = (basePath: string, targetPath: string): string => {
  if (!validatePath(basePath) || !validatePath(targetPath)) {
    throw new Error('Invalid path provided')
  }
  
  const normalizedBase = normalizePath(basePath)
  const normalizedTarget = normalizePath(targetPath)
  
  if (normalizedTarget.startsWith(normalizedBase)) {
    return normalizedTarget.substring(normalizedBase.length + 1)
  }
  
  return normalizedTarget
}
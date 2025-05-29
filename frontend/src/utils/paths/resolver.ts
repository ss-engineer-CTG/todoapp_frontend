// パス結合専用関数（文字列結合禁止）
import { resolvePath, normalizePath, validatePath } from '../../../shared/utils/paths'

/**
 * フロントエンド用パス解決
 */
export const resolveAssetPath = (...segments: string[]): string => {
  const resolved = resolvePath(...segments)
  
  if (!validatePath(resolved)) {
    throw new Error(`Invalid asset path: ${resolved}`)
  }
  
  return normalizePath(resolved)
}

/**
 * APIエンドポイントパス構築
 */
export const buildApiPath = (baseUrl: string, ...pathSegments: string[]): string => {
  if (!baseUrl) {
    throw new Error('Base URL is required')
  }
  
  const cleanBase = baseUrl.replace(/\/$/, '')
  const path = resolvePath(...pathSegments)
  
  return `${cleanBase}/${path}`
}

/**
 * 動的インポートパス構築
 */
export const buildDynamicImportPath = (basePath: string, moduleName: string): string => {
  const path = resolvePath(basePath, `${moduleName}.tsx`)
  
  if (!validatePath(path)) {
    throw new Error(`Invalid module path: ${path}`)
  }
  
  return normalizePath(path)
}
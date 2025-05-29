// パス検証・正規化関数
import { validatePath as baseValidatePath, normalizePath } from '../../../shared/utils/paths'

/**
 * フロントエンド固有のパス検証
 */
export const validateFrontendPath = (path: string): boolean => {
  if (!baseValidatePath(path)) return false
  
  // フロントエンド固有の検証ルール
  const allowedExtensions = ['.tsx', '.ts', '.css', '.json', '.svg', '.png', '.jpg', '.jpeg']
  const hasValidExtension = allowedExtensions.some(ext => path.endsWith(ext)) || !path.includes('.')
  
  if (!hasValidExtension) return false
  
  // React固有のパス検証
  if (path.includes('/src/') && !path.startsWith('/src/')) return false
  
  return true
}

/**
 * コンポーネントパス検証
 */
export const validateComponentPath = (path: string): boolean => {
  if (!validateFrontendPath(path)) return false
  
  return path.includes('/components/') && (path.endsWith('.tsx') || path.endsWith('.ts'))
}

/**
 * アセットパス正規化
 */
export const normalizeAssetPath = (path: string): string => {
  const normalized = normalizePath(path)
  
  // アセット用の先頭スラッシュを保証
  return normalized.startsWith('/') ? normalized : `/${normalized}`
}
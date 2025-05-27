/**
 * パス結合専用関数（セキュリティ考慮）
 * DRY原則に基づき、文字列結合ではなく専用関数を使用
 */

export function joinPaths(...segments: string[]): string {
    return segments
      .map(segment => segment.replace(/^\/+|\/+$/g, '')) // 先頭と末尾のスラッシュを除去
      .filter(segment => segment.length > 0) // 空文字列を除去
      .join('/')
  }
  
  export function normalizePath(path: string): string {
    return path
      .replace(/\/+/g, '/') // 連続するスラッシュを1つに
      .replace(/\/$/, '') // 末尾のスラッシュを除去
      .replace(/^\//, '') // 先頭のスラッシュを除去
  }
  
  export function isValidPath(path: string): boolean {
    // 危険な文字列パターンをチェック
    const dangerousPatterns = [
      /\.\./,  // ディレクトリトラバーサル
      /~/, // ホームディレクトリ参照
      /\$/, // 環境変数
      /[<>:"|?*]/, // 無効な文字
    ]
  
    return !dangerousPatterns.some(pattern => pattern.test(path))
  }
  
  export function getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.')
    return lastDotIndex > 0 ? filename.substring(lastDotIndex + 1).toLowerCase() : ''
  }
  
  export function getFileName(path: string): string {
    return path.split('/').pop() || ''
  }
  
  export function getDirectoryPath(path: string): string {
    const segments = path.split('/')
    return segments.slice(0, -1).join('/')
  }
  
  /**
   * APIエンドポイント用のURL構築
   */
  export function buildApiUrl(baseUrl: string, endpoint: string, params?: Record<string, string>): string {
    const url = joinPaths(baseUrl, endpoint)
    
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params)
      return `${url}?${searchParams.toString()}`
    }
    
    return url
  }
  
  /**
   * 静的リソース用のパス構築
   */
  export function buildAssetPath(basePath: string, ...segments: string[]): string {
    return joinPaths(basePath, ...segments)
  }
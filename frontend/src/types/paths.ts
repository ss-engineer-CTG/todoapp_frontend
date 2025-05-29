// フロントエンド用パス関連型定義
export {
    type PathConfig,
    type ResolvedPath,
    type PathResolver,
    type PathValidator,
    type PathNormalizer
  } from '../../shared/types/paths'
  
  // フロントエンド固有の型
  export interface AssetPath {
    path: string
    type: 'image' | 'style' | 'script' | 'font' | 'other'
    size?: number
    lastModified?: Date
  }
  
  export interface ComponentPath {
    path: string
    componentName: string
    isDefault: boolean
    exports?: string[]
  }
  
  export interface RoutePath {
    path: string
    component: string
    exact?: boolean
    params?: Record<string, string>
  }
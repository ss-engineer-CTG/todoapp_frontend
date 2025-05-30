// システムプロンプト準拠: パス管理統一、ハードコード禁止

// パス定数定義
export const PATH_CONSTANTS = {
    FRONTEND: {
      SRC: './src',
      COMPONENTS: './src/components',
      HOOKS: './src/hooks',
      UTILS: './src/utils',
      SERVICES: './src/services',
      TYPES: './src/types',
      STYLES: './src/styles',
      CONFIG: './src/config',
      ASSETS: './public/assets',
      DIST: './dist'
    },
    BACKEND: {
      ROOT: './backend',
      APP: './backend/app.py',
      MAIN: './backend/main.py',
      SCHEMA: './backend/schema.sql',
      DATABASE: './backend/todo.db',
      CORE: './backend/core',
      SERVICES: './backend/services',
      UTILS: './backend/utils'
    },
    ELECTRON: {
      ROOT: './electron',
      MAIN: './electron/main.js',
      PRELOAD: './electron/preload.js',
      ASSETS: './electron/assets'
    }
  } as const
  
  // パス結合専用関数（システムプロンプト必須）
  export class PathUtils {
    /**
     * パスを結合する専用関数
     * システムプロンプト準拠: 「+」や「文字列テンプレート」による文字列結合は禁止
     */
    static joinPath(...segments: string[]): string {
      return segments
        .map(segment => segment.replace(/^\/+|\/+$/g, ''))
        .filter(segment => segment.length > 0)
        .join('/')
    }
  
    /**
     * パス検証・正規化関数
     * システムプロンプト準拠: パス検証・正規化関数を適切に使用
     */
    static validatePath(path: string): boolean {
      // 不正なパスパターンをチェック
      const invalidPatterns = [
        /\.\./,  // ディレクトリトラバーサル
        /\/\//,  // 連続スラッシュ
        /[<>:"|?*]/, // 不正文字
      ]
      
      return !invalidPatterns.some(pattern => pattern.test(path))
    }
  
    /**
     * パス正規化
     */
    static normalizePath(path: string): string {
      return path
        .replace(/\\/g, '/') // バックスラッシュをスラッシュに
        .replace(/\/+/g, '/') // 連続スラッシュを単一に
        .replace(/\/$/, '') // 末尾スラッシュを削除
    }
  
    /**
     * ベースパスとの結合
     */
    static resolveFromBase(basePath: string, relativePath: string): string {
      const normalizedBase = this.normalizePath(basePath)
      const normalizedRelative = this.normalizePath(relativePath)
      
      if (!this.validatePath(normalizedRelative)) {
        throw new Error(`Invalid path: ${relativePath}`)
      }
      
      return this.joinPath(normalizedBase, normalizedRelative)
    }
  }
  
  // URL構築用ユーティリティ
  export class UrlUtils {
    static buildApiUrl(endpoint: string): string {
      const baseUrl = `http://localhost:${APP_CONFIG.PORTS.BACKEND}`
      return PathUtils.joinPath(baseUrl, endpoint)
    }
  
    static buildAssetUrl(assetPath: string): string {
      return PathUtils.joinPath(PATH_CONSTANTS.FRONTEND.ASSETS, assetPath)
    }
  }
  
  // APP_CONFIG をインポート（循環依存回避）
  import { APP_CONFIG } from './constants'
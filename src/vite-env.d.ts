/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_TITLE: string
    readonly VITE_APP_VERSION: string
    readonly VITE_API_BASE_URL: string
    readonly VITE_ENABLE_ANALYTICS: string
    readonly VITE_DEBUG_MODE: string
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
  
  // グローバル型定義
  declare global {
    interface Window {
      // カスタムプロパティの型定義
      __APP_VERSION__?: string
      __BUILD_TIME__?: string
    }
  }
  
  // CSS Modules の型定義
  declare module '*.module.css' {
    const classes: { [key: string]: string }
    export default classes
  }
  
  declare module '*.module.scss' {
    const classes: { [key: string]: string }
    export default classes
  }
  
  // 画像ファイルの型定義
  declare module '*.svg' {
    import React = require('react')
    export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>
    const src: string
    export default src
  }
  
  declare module '*.png' {
    const src: string
    export default src
  }
  
  declare module '*.jpg' {
    const src: string
    export default src
  }
  
  declare module '*.jpeg' {
    const src: string
    export default src
  }
  
  declare module '*.gif' {
    const src: string
    export default src
  }
  
  declare module '*.webp' {
    const src: string
    export default src
  }
  
  // Webフォントの型定義
  declare module '*.woff' {
    const src: string
    export default src
  }
  
  declare module '*.woff2' {
    const src: string
    export default src
  }
  
  // その他のアセット
  declare module '*.json' {
    const value: any
    export default value
  }
  
  // Web Workersの型定義
  declare module '*?worker' {
    const workerConstructor: {
      new (): Worker
    }
    export default workerConstructor
  }
  
  declare module '*?worker&inline' {
    const workerConstructor: {
      new (): Worker
    }
    export default workerConstructor
  }
  
  // Vite固有の機能
  declare module 'virtual:*' {
    const result: any
    export default result
  }
  
  export {}
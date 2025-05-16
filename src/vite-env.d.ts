/// <reference types="vite/client" />

/**
 * Vite環境型定義
 */

// ReactコンポーネントでSVGをインポートするための型宣言
declare module '*.svg' {
    import React = require('react');
    export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
    const src: string;
    export default src;
  }
  
  // 画像ファイルをインポートするための型宣言
  declare module '*.png' {
    const content: string;
    export default content;
  }
  
  declare module '*.jpg' {
    const content: string;
    export default content;
  }
  
  declare module '*.jpeg' {
    const content: string;
    export default content;
  }
  
  declare module '*.gif' {
    const content: string;
    export default content;
  }
  
  // スタイルファイルをインポートするための型宣言
  declare module '*.css' {
    const content: { [className: string]: string };
    export default content;
  }
  
  declare module '*.scss' {
    const content: { [className: string]: string };
    export default content;
  }
  
  // 環境変数の型定義
  interface ImportMetaEnv {
    readonly VITE_APP_TITLE: string;
    // その他の環境変数
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
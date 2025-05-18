/**
 * パス関連の定数
 */
export const pathConstants = {
    // アプリケーションのルートパス
    ROOT: '/',
    
    // ルート相対パス（アプリケーションが特定のパスにデプロイされる場合に使用）
    // 例: Electronでは '/' だが、Webでサブディレクトリにデプロイされる場合は '/timeline-todo/' など
    BASE_PATH: '/',
    
    // アセットパス
    ASSETS: {
      ROOT: '/assets',
      IMAGES: '/assets/images',
      ICONS: '/assets/icons',
      THEMES: '/assets/themes',
      TEMPLATES: '/assets/templates'
    },
    
    // ローカルストレージパス（Electron用）
    LOCAL_STORAGE: {
      ROOT: './data',
      PROJECTS: './data/projects',
      SETTINGS: './data/settings',
      TEMPLATES: './data/templates',
      BACKUPS: './data/backups',
      EXPORTS: './data/exports'
    },
    
    // エクスポートファイル名テンプレート
    EXPORT_FILENAME: {
      JSON: 'timeline-todo-export-{date}.json',
      CSV: 'timeline-todo-export-{date}.csv',
      MARKDOWN: 'timeline-todo-export-{date}.md',
      HTML: 'timeline-todo-export-{date}.html'
    },
    
    // インポート/エクスポートのファイル拡張子
    FILE_EXTENSIONS: {
      JSON: '.json',
      CSV: '.csv',
      MARKDOWN: '.md',
      HTML: '.html'
    },
    
    // MIMEタイプ
    MIME_TYPES: {
      JSON: 'application/json',
      CSV: 'text/csv',
      MARKDOWN: 'text/markdown',
      HTML: 'text/html',
      TEXT: 'text/plain'
    },
    
    // テンプレートパス
    TEMPLATES: {
      PROJECT: '/templates/project',
      TASK: '/templates/task',
      REPORT: '/templates/report'
    },
    
    // アプリケーション内ルート
    ROUTES: {
      HOME: '/',
      TIMELINE: '/timeline',
      PROJECTS: '/projects',
      PROJECT_DETAIL: '/projects/:id',
      SETTINGS: '/settings',
      TEMPLATES: '/templates',
      HELP: '/help',
      REPORTS: '/reports'
    },
    
    // 外部リンク
    EXTERNAL_LINKS: {
      HELP: 'https://example.com/timeline-todo/help',
      DOCUMENTATION: 'https://example.com/timeline-todo/docs',
      GITHUB: 'https://github.com/example/timeline-todo',
      ISSUES: 'https://github.com/example/timeline-todo/issues'
    },
    
    // ファイルパスを生成（日付部分を現在日時で置換）
    getExportFilename: (type: 'JSON' | 'CSV' | 'MARKDOWN' | 'HTML'): string => {
      const date = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      return pathConstants.EXPORT_FILENAME[type].replace('{date}', date);
    },
    
    // ベースパス付きでURLを生成
    getUrl: (path: string): string => {
      const basePath = pathConstants.BASE_PATH.endsWith('/') 
        ? pathConstants.BASE_PATH.slice(0, -1) 
        : pathConstants.BASE_PATH;
      
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      return `${basePath}${normalizedPath}`;
    },
    
    // アセットURLを生成
    getAssetUrl: (path: string): string => {
      return pathConstants.getUrl(`${pathConstants.ASSETS.ROOT}/${path}`);
    }
  };
import path from 'path-browserify';

// パス操作のユーティリティ関数

// パスを結合する
export const joinPath = (...paths: string[]): string => {
  return path.join(...paths);
};

// 相対パスを解決する
export const resolvePath = (from: string, to: string): string => {
  return path.resolve(from, to);
};

// パスからファイル名を抽出する
export const getFileName = (filePath: string): string => {
  return path.basename(filePath);
};

// パスから拡張子を抽出する
export const getExtension = (filePath: string): string => {
  return path.extname(filePath);
};

// 拡張子を除いたファイル名を取得する
export const getBaseFileName = (filePath: string): string => {
  const fileName = getFileName(filePath);
  const extName = getExtension(filePath);
  return fileName.slice(0, fileName.length - extName.length);
};

// ディレクトリ部分を抽出する
export const getDirName = (filePath: string): string => {
  return path.dirname(filePath);
};

// パスを正規化する
export const normalizePath = (filePath: string): string => {
  return path.normalize(filePath);
};

// パスがルートパスかどうかを判定する
export const isAbsolute = (filePath: string): boolean => {
  return path.isAbsolute(filePath);
};

// URLからファイル名を抽出する
export const getFileNameFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return getFileName(urlObj.pathname);
  } catch (e) {
    // URLでない場合は普通のパスとして処理
    return getFileName(url);
  }
};

// アプリケーション内の相対パスにpublicパスを追加
export const getPublicPath = (relativePath: string): string => {
  const publicPath = process.env.PUBLIC_URL || '';
  return joinPath(publicPath, relativePath);
};

// ファイルのMIMEタイプを拡張子から推測
export const getMimeType = (filePath: string): string => {
  const ext = getExtension(filePath).toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.csv': 'text/csv',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
};
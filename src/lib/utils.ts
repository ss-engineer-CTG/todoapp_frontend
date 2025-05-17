import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * TailwindCSSのクラス名を結合するユーティリティ関数
 * clsxとtailwind-mergeを組み合わせて、条件付きのクラス名と
 * TailwindCSSのクラスの衝突を解決する
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 部分適用関数を作成するユーティリティ関数
 * 関数の一部の引数を固定した新しい関数を返す
 */
export function partial<T extends (...args: any[]) => any>(
  fn: T,
  ...args: Parameters<T> extends [...infer U, ...any[]] ? U : never
): (...args: Parameters<T> extends [...any[], ...infer V] ? V : never) => ReturnType<T> {
  return (...restArgs: any[]) => fn(...args, ...restArgs);
}

/**
 * ディープコピーを行うユーティリティ関数
 * JSON.parse/stringifyを使用した簡易的な実装
 */
export function deepCopy<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 配列をランダムにシャッフルするユーティリティ関数
 * Fisher-Yatesアルゴリズムを使用
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 非同期関数の実行を遅延させるユーティリティ関数
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 指定した範囲内の乱数を生成するユーティリティ関数
 */
export function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 文字列を指定の長さに切り詰めるユーティリティ関数
 */
export function truncate(str: string, length: number, ellipsis = '...'): string {
  if (str.length <= length) {
    return str;
  }
  return str.slice(0, length - ellipsis.length) + ellipsis;
}

/**
 * オブジェクトから指定したキーを除外した新しいオブジェクトを生成するユーティリティ関数
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  keys.forEach(key => {
    delete result[key];
  });
  return result;
}

/**
 * オブジェクトから指定したキーのみを抽出した新しいオブジェクトを生成するユーティリティ関数
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

/**
 * 重複を除いた配列を生成するユーティリティ関数
 */
export function uniq<T>(array: T[]): T[] {
  return [...new Set(array)];
}

/**
 * 値がnullまたはundefinedでないことを保証するユーティリティ関数
 */
export function ensure<T>(value: T | null | undefined, message = 'Value is null or undefined'): T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
  return value;
}
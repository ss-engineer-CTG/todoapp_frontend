import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * クラス名を結合してTailwindのクラス名の競合を解決する
 * shadcn/ui コンポーネントの利用に必須
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
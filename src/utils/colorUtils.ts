import { COLORS } from "../constants/colors"

// ランダムな色を生成
export function getRandomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)]
}

// 色の明るさを取得（コントラスト調整用）
export function getLuminance(hexColor: string): number {
  // 16進数の色コードをRGB値に変換
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255
  
  // 明るさを計算（W3Cのアルゴリズム）
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  
  return luminance
}

// コントラストに基づいてテキスト色を選択（明るい背景には暗いテキスト、暗い背景には明るいテキスト）
export function getTextColorForBackground(backgroundColor: string): string {
  const luminance = getLuminance(backgroundColor)
  return luminance > 0.5 ? '#000000' : '#ffffff'
}
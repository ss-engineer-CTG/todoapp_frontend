// 既存のconstants.tsから重複を排除し、新しいconfig/constants.tsを使用するように変更
export * from '../config/constants'

// 既存のファイルとの後方互換性を保つため、再エクスポート
export { PROJECT_COLORS, KEYBOARD_SHORTCUTS } from '../config/constants'
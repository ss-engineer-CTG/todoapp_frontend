import type { Project, Task } from "@/types/todo"

// プロジェクトバリデーション
export const validateProject = (project: Partial<Project>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  // 名前の検証
  if (!project.name || project.name.trim().length === 0) {
    errors.push("プロジェクト名は必須です")
  } else if (project.name.trim().length > 100) {
    errors.push("プロジェクト名は100文字以内で入力してください")
  }

  // カラーの検証
  if (!project.color) {
    errors.push("プロジェクトカラーを選択してください")
  } else if (!/^#[0-9A-Fa-f]{6}$/.test(project.color)) {
    errors.push("有効なカラーコードを指定してください")
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// タスクバリデーション
export const validateTask = (task: Partial<Task>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  // 名前の検証
  if (!task.name || task.name.trim().length === 0) {
    errors.push("タスク名は必須です")
  } else if (task.name.trim().length > 200) {
    errors.push("タスク名は200文字以内で入力してください")
  }

  // プロジェクトIDの検証
  if (!task.projectId) {
    errors.push("プロジェクトを選択してください")
  }

  // 日付の検証
  if (task.startDate && task.dueDate) {
    if (task.startDate > task.dueDate) {
      errors.push("開始日は期限日より前の日付を設定してください")
    }
  }

  if (!task.startDate || !isValidDate(task.startDate)) {
    errors.push("有効な開始日を設定してください")
  }

  if (!task.dueDate || !isValidDate(task.dueDate)) {
    errors.push("有効な期限日を設定してください")
  }

  // 担当者の検証
  if (!task.assignee || task.assignee.trim().length === 0) {
    errors.push("担当者を入力してください")
  } else if (task.assignee.trim().length > 50) {
    errors.push("担当者名は50文字以内で入力してください")
  }

  // メモの検証
  if (task.notes && task.notes.length > 1000) {
    errors.push("メモは1000文字以内で入力してください")
  }

  // レベルの検証
  if (task.level !== undefined && (task.level < 0 || task.level > 10)) {
    errors.push("タスクレベルは0-10の範囲で設定してください")
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// 日付の妥当性チェック
export const isValidDate = (date: any): date is Date => {
  return date instanceof Date && !isNaN(date.getTime())
}

// 文字列の長さチェック
export const validateStringLength = (
  value: string,
  minLength: number = 0,
  maxLength: number = Infinity,
  fieldName: string = "フィールド"
): { isValid: boolean; error?: string } => {
  const trimmedValue = value.trim()

  if (trimmedValue.length < minLength) {
    return {
      isValid: false,
      error: `${fieldName}は${minLength}文字以上で入力してください`
    }
  }

  if (trimmedValue.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName}は${maxLength}文字以内で入力してください`
    }
  }

  return { isValid: true }
}

// メールアドレスの検証
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!email.trim()) {
    return { isValid: false, error: "メールアドレスを入力してください" }
  }

  if (!emailRegex.test(email)) {
    return { isValid: false, error: "有効なメールアドレスを入力してください" }
  }

  return { isValid: true }
}

// URLの検証
export const validateURL = (url: string): { isValid: boolean; error?: string } => {
  if (!url.trim()) {
    return { isValid: false, error: "URLを入力してください" }
  }

  try {
    new URL(url)
    return { isValid: true }
  } catch {
    return { isValid: false, error: "有効なURLを入力してください" }
  }
}

// ファイルサイズの検証
export const validateFileSize = (
  file: File,
  maxSizeInMB: number
): { isValid: boolean; error?: string } => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024

  if (file.size > maxSizeInBytes) {
    return {
      isValid: false,
      error: `ファイルサイズは${maxSizeInMB}MB以下にしてください`
    }
  }

  return { isValid: true }
}

// ファイル拡張子の検証
export const validateFileExtension = (
  file: File,
  allowedExtensions: string[]
): { isValid: boolean; error?: string } => {
  const fileName = file.name.toLowerCase()
  const fileExtension = fileName.substring(fileName.lastIndexOf('.') + 1)

  if (!allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: `許可されているファイル形式: ${allowedExtensions.join(', ')}`
    }
  }

  return { isValid: true }
}

// 複数バリデーションの実行
export const runValidations = (
  validations: Array<() => { isValid: boolean; error?: string }>
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  for (const validation of validations) {
    const result = validation()
    if (!result.isValid && result.error) {
      errors.push(result.error)
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// フォームデータの一括検証
export const validateFormData = <T extends Record<string, any>>(
  data: T,
  rules: {
    [K in keyof T]?: {
      required?: boolean
      minLength?: number
      maxLength?: number
      pattern?: RegExp
      custom?: (value: T[K]) => { isValid: boolean; error?: string }
    }
  }
): { isValid: boolean; errors: { [K in keyof T]?: string } } => {
  const errors: { [K in keyof T]?: string } = {}

  for (const field in rules) {
    const rule = rules[field]
    const value = data[field]

    if (!rule) continue

    // 必須チェック
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      errors[field] = `${String(field)}は必須です`
      continue
    }

    // 文字列の場合のみ長さチェック
    if (typeof value === 'string') {
      if (rule.minLength && value.trim().length < rule.minLength) {
        errors[field] = `${String(field)}は${rule.minLength}文字以上で入力してください`
        continue
      }

      if (rule.maxLength && value.trim().length > rule.maxLength) {
        errors[field] = `${String(field)}は${rule.maxLength}文字以内で入力してください`
        continue
      }

      // パターンチェック
      if (rule.pattern && !rule.pattern.test(value)) {
        errors[field] = `${String(field)}の形式が正しくありません`
        continue
      }
    }

    // カスタムバリデーション
    if (rule.custom) {
      const result = rule.custom(value)
      if (!result.isValid && result.error) {
        errors[field] = result.error
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
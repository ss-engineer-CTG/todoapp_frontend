// タスク名の検証
export const validateTaskName = (name: string): boolean => {
    return name.trim().length > 0;
  };
  
  // 日付範囲の検証
  export const validateDateRange = (start: Date | string, end: Date | string): boolean => {
    const startDate = start instanceof Date ? start : new Date(start);
    const endDate = end instanceof Date ? end : new Date(end);
    
    // 開始日が終了日より後でないことを確認
    return startDate <= endDate;
  };
  
  // 繰り返しパターンの検証
  export const validateRepeatPattern = (
    pattern: string, 
    interval: number,
    endAfter?: number,
    endDate?: Date | string
  ): boolean => {
    // 有効なパターンか確認
    const validPatterns = ['daily', 'weekly', 'monthly', 'yearly', 'custom'];
    if (!validPatterns.includes(pattern)) {
      return false;
    }
    
    // 間隔が正の整数であることを確認
    if (interval <= 0 || !Number.isInteger(interval)) {
      return false;
    }
    
    // 終了条件の検証
    if (endAfter !== undefined && (endAfter <= 0 || !Number.isInteger(endAfter))) {
      return false;
    }
    
    if (endDate) {
      const date = endDate instanceof Date ? endDate : new Date(endDate);
      if (isNaN(date.getTime())) {
        return false;
      }
    }
    
    return true;
  };
  
  // プロジェクトカラーの検証
  export const validateColor = (color: string): boolean => {
    // 16進数カラーコード形式か確認（#FFFFFFなど）
    return /^#[0-9A-F]{6}$/i.test(color);
  };
  
  // メールアドレスの検証
  export const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  // パスワードの検証
  export const validatePassword = (password: string): boolean => {
    // 8文字以上で、少なくとも1つの数字、大文字、小文字を含む
    return password.length >= 8 && 
           /[0-9]/.test(password) && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password);
  };
  
  // フォームデータの検証
  export const validateForm = (
    form: Record<string, any>, 
    rules: Record<string, (value: any) => boolean>
  ): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};
    
    // 各フィールドをルールで検証
    for (const field in rules) {
      if (Object.prototype.hasOwnProperty.call(rules, field)) {
        const value = form[field];
        const isValid = rules[field](value);
        
        if (!isValid) {
          errors[field] = `${field} is invalid`;
        }
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
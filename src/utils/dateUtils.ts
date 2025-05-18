// 日付フォーマット関数
export const formatDate = (date: Date | string | null): string => {
    if (!date) return '';
    
    // 文字列の場合はDateオブジェクトに変換
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // 無効な日付の場合は空文字を返す
    if (isNaN(dateObj.getTime())) return '';
    
    return dateObj.toLocaleDateString('ja-JP', { 
      month: 'short', 
      day: 'numeric'
    });
  };
  
  // 日付の詳細フォーマット関数
  export const formatDateDetailed = (date: Date | string | null): string => {
    if (!date) return '';
    
    // 文字列の場合はDateオブジェクトに変換
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // 無効な日付の場合は空文字を返す
    if (isNaN(dateObj.getTime())) return '';
    
    return dateObj.toLocaleDateString('ja-JP', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    });
  };
  
  // 日付の差分を取得（日数）
  export const getDaysDiff = (startDate: Date | string, endDate: Date | string): number => {
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    
    // 時間部分を無視して日付だけの差分を計算
    const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
    const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
    
    return Math.floor((utcEnd - utcStart) / (1000 * 60 * 60 * 24)) + 1; // 終了日も含める
  };
  
  // 日付を指定した日数分移動
  export const addDays = (date: Date | string, days: number): Date => {
    const result = date instanceof Date ? new Date(date) : new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };
  
  // 今日の日付かどうかをチェック
  export const isToday = (date: Date | string): boolean => {
    const dateObj = date instanceof Date ? date : new Date(date);
    const today = new Date();
    
    return dateObj.getDate() === today.getDate() &&
           dateObj.getMonth() === today.getMonth() &&
           dateObj.getFullYear() === today.getFullYear();
  };
  
  // 週末かどうかをチェック
  export const isWeekend = (date: Date | string): boolean => {
    const dateObj = date instanceof Date ? date : new Date(date);
    const day = dateObj.getDay();
    
    return day === 0 || day === 6; // 日曜(0)または土曜(6)
  };
  
  // 日本の祝日かどうかをチェック（簡易版）
  export const isJapaneseHoliday = (date: Date | string): boolean => {
    const dateObj = date instanceof Date ? date : new Date(date);
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    
    // 主な祝日のみチェック（年によって変動する祝日は省略）
    const holidays = [
      { month: 1, day: 1 },    // 元日
      { month: 2, day: 11 },   // 建国記念日
      { month: 4, day: 29 },   // 昭和の日
      { month: 5, day: 3 },    // 憲法記念日
      { month: 5, day: 4 },    // みどりの日
      { month: 5, day: 5 },    // こどもの日
      { month: 8, day: 11 },   // 山の日
      { month: 11, day: 3 },   // 文化の日
      { month: 11, day: 23 },  // 勤労感謝の日
      { month: 12, day: 23 }   // 天皇誕生日
    ];
    
    return holidays.some(holiday => holiday.month === month && holiday.day === day);
  };
  
  // 日付から曜日名を取得
  export const getDayName = (date: Date | string, locale: string = 'ja-JP'): string => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString(locale, { weekday: 'short' });
  };
  
  // 文字列の日付表現（「今日」「明日」など）をDateオブジェクトに変換
  export const parseRelativeDate = (text: string): Date | null => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // 相対的な日付を変換
    if (text === '今日' || text.toLowerCase() === 'today') {
      return today;
    } else if (text === '明日' || text.toLowerCase() === 'tomorrow') {
      return tomorrow;
    } else if (text === '明後日') {
      return dayAfterTomorrow;
    } else if (text === '昨日' || text.toLowerCase() === 'yesterday') {
      return yesterday;
    } else if (text === '来週' || text.toLowerCase() === 'next week') {
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      return nextWeek;
    } else if (text === '来月' || text.toLowerCase() === 'next month') {
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);
      return nextMonth;
    }
    
    // 上記以外の場合は日付文字列としてパース
    const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
    if (dateMatch) {
      const month = parseInt(dateMatch[1]) - 1; // JavaScriptの月は0-11
      const day = parseInt(dateMatch[2]);
      
      let year = today.getFullYear();
      if (dateMatch[3]) {
        year = parseInt(dateMatch[3]);
        if (year < 100) {
          year += 2000; // 2桁の年は2000年代として解釈
        }
      }
      
      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    return null;
  };
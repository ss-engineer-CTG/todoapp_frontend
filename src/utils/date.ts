import {
    format,
    startOfDay,
    endOfDay,
    addDays,
    subDays,
    eachDayOfInterval,
    isSameDay,
    isWithinInterval,
    differenceInDays,
    addMonths,
    startOfMonth,
    endOfMonth,
    isAfter,
    isBefore,
    isWeekend
  } from 'date-fns';
  import { ja } from 'date-fns/locale';
  
  /**
   * 日付操作ユーティリティ関数群
   */
  
  /**
   * 日付を指定の形式でフォーマットする
   */
  export const formatDate = (date: Date, formatString = 'yyyy/MM/dd'): string => {
    return format(date, formatString, { locale: ja });
  };
  
  /**
   * 日付の時刻部分をリセットする（00:00:00）
   */
  export const normalizeDate = (date: Date): Date => {
    return startOfDay(date);
  };
  
  /**
   * 2つの日付間のすべての日付を配列で取得する
   */
  export const getDaysBetween = (startDate: Date, endDate: Date): Date[] => {
    return eachDayOfInterval({ start: startDate, end: endDate });
  };
  
  /**
   * 2つの日付が同じ日かどうか判定する
   */
  export const isSameDayDate = (date1: Date, date2: Date): boolean => {
    return isSameDay(date1, date2);
  };
  
  /**
   * 指定された日付が範囲内にあるかどうか判定する
   */
  export const isDateInRange = (date: Date, startDate: Date, endDate: Date): boolean => {
    return isWithinInterval(date, { start: startDate, end: endDate });
  };
  
  /**
   * 2つの日付間の日数を計算する
   */
  export const daysBetween = (startDate: Date, endDate: Date): number => {
    return differenceInDays(endDate, startDate) + 1; // 両端の日付を含めるために+1
  };
  
  /**
   * 月の初日を取得する
   */
  export const getMonthStart = (date: Date): Date => {
    return startOfMonth(date);
  };
  
  /**
   * 月の最終日を取得する
   */
  export const getMonthEnd = (date: Date): Date => {
    return endOfMonth(date);
  };
  
  /**
   * 指定された月数だけ先の日付を取得する
   */
  export const addMonthsToDate = (date: Date, months: number): Date => {
    return addMonths(date, months);
  };
  
  /**
   * 日付が過去かどうか判定する（今日は含まない）
   */
  export const isPastDate = (date: Date): boolean => {
    return isBefore(date, startOfDay(new Date()));
  };
  
  /**
   * 日付が未来かどうか判定する（今日は含まない）
   */
  export const isFutureDate = (date: Date): boolean => {
    return isAfter(date, endOfDay(new Date()));
  };
  
  /**
   * 日付が今日かどうか判定する
   */
  export const isToday = (date: Date): boolean => {
    return isSameDay(date, new Date());
  };
  
  /**
   * 日付が週末（土日）かどうか判定する
   */
  export const isWeekendDay = (date: Date): boolean => {
    return isWeekend(date);
  };
  
  /**
   * 表示モードに基づいて表示する日付範囲を計算する
   */
  export const calculateDateRange = (viewMode: 'day' | 'week' | 'month', baseDate: Date = new Date()): { startDate: Date; endDate: Date } => {
    const normalizedDate = normalizeDate(baseDate);
    
    switch (viewMode) {
      case 'day':
        // 1週間表示（3日前〜3日後）
        return {
          startDate: subDays(normalizedDate, 3),
          endDate: addDays(normalizedDate, 3)
        };
      case 'week':
        // 2週間表示（1週間前〜1週間後）
        return {
          startDate: subDays(normalizedDate, 7),
          endDate: addDays(normalizedDate, 7)
        };
      case 'month':
        // 1ヶ月表示（月の前後の日も含めて約31日）
        const monthStart = startOfMonth(normalizedDate);
        const monthEnd = endOfMonth(normalizedDate);
        const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
        const paddingDays = Math.floor((31 - daysInMonth) / 2);
        
        return {
          startDate: subDays(monthStart, paddingDays),
          endDate: addDays(monthEnd, paddingDays)
        };
      default:
        return {
          startDate: subDays(normalizedDate, 7),
          endDate: addDays(normalizedDate, 7)
        };
    }
  };
  
  /**
   * 月表示のためのラベル情報を生成する
   */
  export const getMonthLabels = (days: Date[]): { label: string; width: number }[] => {
    if (days.length === 0) return [];
    
    const result: { label: string; width: number }[] = [];
    let currentMonth = startOfMonth(days[0]);
    let startIndex = 0;
    
    days.forEach((day, index) => {
      const dayMonth = startOfMonth(day);
      
      // 新しい月の開始または最後の日
      if (!isSameDay(dayMonth, currentMonth) || index === days.length - 1) {
        // 前の月のラベルと幅を計算
        const width = index - startIndex;
        if (width > 0) {
          result.push({
            label: format(currentMonth, 'yyyy年 M月', { locale: ja }),
            width
          });
        }
        
        currentMonth = dayMonth;
        startIndex = index;
      }
    });
    
    // 最後の月を追加
    const lastWidth = days.length - startIndex;
    if (lastWidth > 0) {
      result.push({
        label: format(currentMonth, 'yyyy年 M月', { locale: ja }),
        width: lastWidth
      });
    }
    
    return result;
  };
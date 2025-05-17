import React from 'react';
import { format, addDays, isSameDay, isWeekend, startOfMonth, isSameMonth } from 'date-fns';
import { ja } from 'date-fns/locale';

interface TimelineDayHeaderProps {
  startDate: Date;
  endDate: Date;
  dayWidth: number;
  todayIndicator?: boolean;
  highlightWeekends?: boolean;
}

// 定数を別途宣言
const LABEL_WIDTH = 200;

/**
 * 日付と月表示を行うヘッダーコンポーネント
 * タイムラインのグリッド構造の基準となる
 */
const TimelineDayHeader: React.FC<TimelineDayHeaderProps> = ({
  startDate,
  endDate,
  dayWidth,
  todayIndicator = true,
  highlightWeekends = true
}) => {
  // 表示する日付の配列を生成
  const days: Date[] = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }
  
  // 今日の日付
  const today = new Date();
  
  // 月ラベル情報の生成
  const getMonthLabels = () => {
    const months: {
      date: Date;
      startIndex: number;
      endIndex: number;
      width: number;
    }[] = [];
    let currentMonth: Date | null = null;
    let monthStartIndex = 0;
    
    days.forEach((day, index) => {
      const dayMonth = startOfMonth(day);
      
      // 新しい月の開始または最初の日
      if (!currentMonth || !isSameMonth(day, currentMonth)) {
        if (currentMonth) {
          // 前の月の幅を計算
          const width = (index - monthStartIndex) * dayWidth;
          months.push({
            date: currentMonth,
            startIndex: monthStartIndex,
            endIndex: index - 1,
            width
          });
        }
        
        currentMonth = dayMonth;
        monthStartIndex = index;
      }
    });
    
    // 最後の月を追加
    if (currentMonth) {
      const width = (days.length - monthStartIndex) * dayWidth;
      months.push({
        date: currentMonth,
        startIndex: monthStartIndex,
        endIndex: days.length - 1,
        width
      });
    }
    
    return months;
  };
  
  const monthLabels = getMonthLabels();

  return (
    <div
      className="timeline-day-header sticky top-0 z-10 bg-white"
      style={{ marginLeft: `${LABEL_WIDTH}px` }}
    >
      {/* 月表示行 */}
      <div className="month-row flex border-b h-8">
        {monthLabels.map((month, i) => (
          <div
            key={`month-${i}`}
            className="month-label flex items-center justify-center text-sm font-medium text-gray-700 border-r"
            style={{ width: `${month.width}px` }}
          >
            {format(month.date, 'yyyy年 M月', { locale: ja })}
          </div>
        ))}
      </div>
      
      {/* 日付行 */}
      <div className="day-row flex border-b">
        {days.map((day, index) => {
          const isToday = isSameDay(day, today);
          const isWeekendDay = isWeekend(day);
          
          return (
            <div
              key={`day-${index}`}
              className={`
                day-column flex flex-col items-center justify-center py-1 border-r
                ${isToday && todayIndicator ? 'bg-red-50' : ''}
                ${isWeekendDay && highlightWeekends ? 'bg-gray-50' : ''}
              `}
              style={{ width: `${dayWidth}px` }}
            >
              <div className="day-number text-sm font-medium text-gray-800">
                {format(day, 'd')}
              </div>
              <div className={`
                day-name text-xs
                ${isWeekendDay ? 'text-red-500' : 'text-gray-500'}
              `}>
                {format(day, 'E', { locale: ja })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 静的プロパティを正しく型付けして追加
(TimelineDayHeader as any).LABEL_WIDTH = LABEL_WIDTH;

export default TimelineDayHeader;
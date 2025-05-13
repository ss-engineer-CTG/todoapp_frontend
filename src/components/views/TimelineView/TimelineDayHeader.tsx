// src/components/views/TimelineView/TimelineDayHeader.tsx
import React from "react";
import { isWeekend, formatDateDisplay } from "../../../utils/timelineUtils";

interface TimelineDayHeaderProps {
  startDate: string;
  daysCount: number;
  today: string;
  dayWidth: number;
}

export default function TimelineDayHeader({
  startDate,
  daysCount,
  today,
  dayWidth
}: TimelineDayHeaderProps) {
  // 日付の配列を生成
  const dates: string[] = [];
  const start = new Date(startDate);
  
  for (let i = 0; i < daysCount; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
      {/* 月表示（月の切り替わりを表示） */}
      <div className="flex border-b">
        {dates.map((date, index) => {
          const currentDate = new Date(date);
          // 月の初日または最初の日付の場合のみ月を表示
          const showMonth = index === 0 || currentDate.getDate() === 1;
          const monthStr = showMonth ? currentDate.toLocaleDateString('ja-JP', { month: 'long' }) : '';
          // 月が切り替わる場所を特定して幅を計算
          let monthWidth = 1; // デフォルトは1日分
          if (showMonth) {
            // この月の残りの日数または表示範囲までの日数を計算
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const remainingDays = daysInMonth - currentDate.getDate() + 1;
            monthWidth = Math.min(remainingDays, daysCount - index);
          }
          
          return showMonth ? (
            <div 
              key={`month-${date}`} 
              className="flex-shrink-0 px-1 py-1 text-center text-xs font-medium border-r border-gray-200"
              style={{ width: `${monthWidth * dayWidth}px` }}
            >
              {monthStr}
            </div>
          ) : null;
        })}
      </div>
      
      {/* 日表示 */}
      <div className="flex">
        {dates.map((date, index) => {
          const isToday = date === today;
          const isWeekendDay = isWeekend(date);
          const day = new Date(date).getDate();
          const weekday = new Date(date).toLocaleDateString('ja-JP', { weekday: 'short' });
          
          return (
            <div 
              key={`day-${date}`} 
              className={`flex-shrink-0 border-r border-gray-200 text-center 
                ${isToday ? 'bg-blue-100 font-bold' : isWeekendDay ? 'bg-gray-50 text-gray-500' : ''}`}
              style={{ width: `${dayWidth}px` }}
            >
              <div className="text-xs py-1">{day}</div>
              <div className={`text-xs pb-1 ${isWeekendDay ? 'text-red-500' : 'text-gray-500'}`}>
                {weekday}
              </div>
            </div>
          );
        })}
      </div>

      {/* 今日のマーカー */}
      {dates.includes(today) && (
        <div 
          className="absolute top-0 bottom-0 w-px bg-red-500 z-20"
          style={{
            left: `${dates.indexOf(today) * dayWidth + (dayWidth / 2)}px`
          }}
        />
      )}
    </div>
  );
}
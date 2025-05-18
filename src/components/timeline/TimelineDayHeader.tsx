import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/reducers';
import { formatDate } from '../../utils/dateUtils';

const TimelineDayHeader: React.FC = () => {
  const { 
    timelineStart, 
    timelineEnd, 
    timelineScale,
    zoomLevel,
    today 
  } = useSelector((state: RootState) => state.timeline);
  
  // タイムラインの日数を計算
  const calculateTimelineDays = () => {
    const oneDay = 24 * 60 * 60 * 1000; // ミリ秒単位での1日
    return Math.round(Math.abs((timelineEnd.getTime() - timelineStart.getTime()) / oneDay));
  };
  
  // ズームスケールに基づく1日あたりの幅を計算
  const dayWidth = 34 * (zoomLevel / 100);
  
  // スケールファクターを取得
  const getScaleFactor = () => {
    if (timelineScale === 'day') return 1;
    if (timelineScale === 'week') return 7;
    if (timelineScale === 'month') {
      const date = new Date(timelineStart);
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    }
    return 1;
  };
  
  // タイムラインの日付を生成
  const generateTimelineDates = () => {
    const dates = [];
    let currentDate = new Date(timelineStart);
    
    if (timelineScale === 'day') {
      // 日単位
      const timelineDays = calculateTimelineDays();
      for (let i = 0; i <= timelineDays; i++) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (timelineScale === 'week') {
      // 週単位
      while (currentDate <= timelineEnd) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 7);
      }
    } else if (timelineScale === 'month') {
      // 月単位
      while (currentDate <= timelineEnd) {
        dates.push(new Date(currentDate));
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }
    
    return dates;
  };
  
  const timelineDates = generateTimelineDates();
  const scaleFactor = getScaleFactor();
  
  // 曜日による背景色を取得
  const getDateCellColor = (date: Date) => {
    if (date.getDay() === 0) return 'timeline-grid-cell weekend-sun'; // 日曜日
    if (date.getDay() === 6) return 'timeline-grid-cell weekend-sat'; // 土曜日
    
    // 今日かどうか確認
    const isToday = date.toDateString() === today.toDateString();
    if (isToday) return 'timeline-grid-cell today';
    
    return 'timeline-grid-cell';
  };
  
  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex h-8">
        {timelineDates.map((date, index) => {
          // 月が変わる最初の日か確認
          const isFirstDayOfMonth = index === 0 || 
            (index > 0 && timelineDates[index - 1].getMonth() !== date.getMonth());
          
          // 今日の日付かどうか確認
          const isToday = date.toDateString() === today.toDateString();
          
          return (
            <div 
              key={index} 
              className={`text-center text-xs font-medium py-1 ${getDateCellColor(date)}`}
              style={{ 
                width: `${dayWidth * scaleFactor}px`,
                minWidth: `${dayWidth * scaleFactor}px`
              }}
            >
              <div className={`${date.getDay() === 0 ? 'text-red-500 dark:text-red-400' : date.getDay() === 6 ? 'text-blue-500 dark:text-blue-400' : ''}`}>
                {timelineScale === 'day' && (isFirstDayOfMonth 
                  ? `${date.getMonth() + 1}月${date.getDate()}日` 
                  : `${date.getDate()}日`)}
                {timelineScale === 'week' && `${date.getMonth() + 1}月${date.getDate()}日〜`}
                {timelineScale === 'month' && `${date.getMonth() + 1}月`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineDayHeader;
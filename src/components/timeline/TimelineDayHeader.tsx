import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/reducers';
import { formatDateShort } from '../../utils/dateUtils';
import { TimelineGridContext } from './TimelineView';

const TimelineDayHeader: React.FC = () => {
  const { today } = useSelector((state: RootState) => state.timeline);
  const timelineGrid = useContext(TimelineGridContext);
  
  // 曜日による背景色を取得
  const getDateCellColor = (date: Date) => {
    const todayDate = today.toDateString() === date.toDateString();
    
    if (todayDate) return 'timeline-grid-cell today';
    if (date.getDay() === 0) return 'timeline-grid-cell weekend-sun';
    if (date.getDay() === 6) return 'timeline-grid-cell weekend-sat';
    
    return 'timeline-grid-cell';
  };
  
  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex h-11">
        {timelineGrid.visibleDates.map((date, index) => {
          // 月が変わる最初の日か確認
          const isFirstDayOfMonth = index === 0 || 
            (index > 0 && timelineGrid.visibleDates[index - 1].getMonth() !== date.getMonth());
          
          return (
            <div 
              key={date.getTime()} 
              className={`text-center text-xs font-medium py-1 ${getDateCellColor(date)}`}
              style={{ 
                width: `${timelineGrid.dayWidth}px`,
                minWidth: `${timelineGrid.dayWidth}px`
              }}
            >
              <div className={`${date.getDay() === 0 ? 'text-red-500 dark:text-red-400' : date.getDay() === 6 ? 'text-blue-500 dark:text-blue-400' : ''}`}>
                {isFirstDayOfMonth 
                  ? formatDateShort(date, true)  // 月表示あり (例: 5/1)
                  : formatDateShort(date, false) // 月表示なし (例: 11)
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineDayHeader;
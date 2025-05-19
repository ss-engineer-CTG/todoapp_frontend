import React, { useContext, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/reducers';
import TimelineDayHeader from './TimelineDayHeader';
import TimelineItemList from './TimelineItemList';
import { TimelineGridContext } from './TimelineView';

interface TimelineContentProps {
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  contentRef: React.RefObject<HTMLDivElement>;
}

const TimelineContent: React.FC<TimelineContentProps> = ({ onScroll, contentRef }) => {
  const { today } = useSelector((state: RootState) => state.timeline);
  const timelineGrid = useContext(TimelineGridContext);
  
  // 今日の位置までスクロール
  useEffect(() => {
    if (contentRef.current && timelineGrid.visibleDates.length > 0) {
      // タイムライン上の今日の位置を計算
      const todayPosition = timelineGrid.getDatePosition(today);
      
      // 初期スクロール位置は今日の日付が見えるように調整
      contentRef.current.scrollLeft = Math.max(0, todayPosition - contentRef.current.clientWidth / 2);
    }
  }, [timelineGrid.visibleDates, today, contentRef, timelineGrid]);
  
  return (
    <div 
      className="flex-1 relative overflow-auto timeline-content"
      ref={contentRef}
      onScroll={onScroll}
    >
      {/* タイムラインヘッダー（日付） */}
      <TimelineDayHeader />
      
      {/* タスクのタイムライン表示 */}
      <TimelineItemList />
      
      {/* 今日の日付線 */}
      <TodayIndicator />
    </div>
  );
};

// 今日の日付を示すインジケーター
const TodayIndicator: React.FC = () => {
  const { today } = useSelector((state: RootState) => state.timeline);
  const { getDatePosition } = React.useContext(TimelineGridContext);
  
  // 今日の位置を計算
  const todayPosition = getDatePosition(today);
  
  return (
    <div 
      className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
      style={{ left: `${todayPosition}px` }}
    ></div>
  );
};

export default TimelineContent;
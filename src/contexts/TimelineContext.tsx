import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { addDays, subDays, differenceInDays } from 'date-fns';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { TimelineViewSettings } from '../models/timeline';

// デフォルトのタイムライン設定
const defaultSettings: TimelineViewSettings = {
  viewMode: 'week',
  zoomLevel: 100,
  showCompletedTasks: true,
  showDependencies: false,
  highlightToday: true,
  highlightWeekends: true
};

// ビューモードに基づいて表示日数を計算
const getVisibleDays = (viewMode: 'day' | 'week' | 'month'): number => {
  switch (viewMode) {
    case 'day':
      return 7;
    case 'week':
      return 14;
    case 'month':
      return 31;
    default:
      return 14;
  }
};

// コンテキストの型
interface TimelineContextType {
  viewMode: 'day' | 'week' | 'month';
  setViewMode: (mode: 'day' | 'week' | 'month') => void;
  zoomLevel: number;
  setZoomLevel: (level: number) => void;
  startDate: Date;
  setStartDate: (date: Date) => void;
  endDate: Date;
  setEndDate: (date: Date) => void;
  showCompletedTasks: boolean;
  setShowCompletedTasks: (show: boolean) => void;
  navigate: (direction: 'prev' | 'next' | 'today') => void;
}

// コンテキストの作成
const TimelineContext = createContext<TimelineContextType | undefined>(undefined);

// プロバイダーコンポーネント
interface TimelineProviderProps {
  children: ReactNode;
}

export const TimelineProvider: React.FC<TimelineProviderProps> = ({ children }) => {
  // 設定をローカルストレージから取得
  const [settings, setSettings] = useLocalStorage<TimelineViewSettings>(
    'timeline-settings',
    defaultSettings
  );
  
  // 状態
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>(settings.viewMode);
  const [zoomLevel, setZoomLevel] = useState(settings.zoomLevel);
  const [showCompletedTasks, setShowCompletedTasks] = useState(settings.showCompletedTasks);
  
  // 現在の日付を起点に表示範囲を計算
  const calculateInitialDateRange = useCallback(() => {
    const today = new Date();
    const visibleDays = getVisibleDays(viewMode);
    const start = subDays(today, Math.floor(visibleDays / 2));
    const end = addDays(start, visibleDays - 1);
    return { start, end };
  }, [viewMode]);
  
  // 表示範囲
  const [startDate, setStartDate] = useState<Date>(() => calculateInitialDateRange().start);
  const [endDate, setEndDate] = useState<Date>(() => calculateInitialDateRange().end);
  
  // 表示モード変更時に表示範囲を調整
  const handleViewModeChange = (newMode: 'day' | 'week' | 'month') => {
    const currentCenterDate = addDays(
      startDate,
      Math.floor(differenceInDays(endDate, startDate) / 2)
    );
    const visibleDays = getVisibleDays(newMode);
    const newStartDate = subDays(currentCenterDate, Math.floor(visibleDays / 2));
    const newEndDate = addDays(newStartDate, visibleDays - 1);
    
    setViewMode(newMode);
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    
    // 設定を保存
    setSettings(prev => ({ ...prev, viewMode: newMode }));
  };
  
  // ズームレベル変更時に設定を保存
  const handleZoomLevelChange = (level: number) => {
    setZoomLevel(level);
    setSettings(prev => ({ ...prev, zoomLevel: level }));
  };
  
  // 完了タスク表示設定変更時に設定を保存
  const handleShowCompletedTasksChange = (show: boolean) => {
    setShowCompletedTasks(show);
    setSettings(prev => ({ ...prev, showCompletedTasks: show }));
  };
  
  // 期間のナビゲーション
  const navigate = (direction: 'prev' | 'next' | 'today') => {
    const visibleDays = differenceInDays(endDate, startDate) + 1;
    
    if (direction === 'prev') {
      // 表示モードに応じた移動単位を計算
      const moveUnits = viewMode === 'day' ? 7 : viewMode === 'week' ? 14 : 30;
      const newStartDate = subDays(startDate, moveUnits);
      setStartDate(newStartDate);
      setEndDate(addDays(newStartDate, visibleDays - 1));
    } 
    else if (direction === 'next') {
      const moveUnits = viewMode === 'day' ? 7 : viewMode === 'week' ? 14 : 30;
      const newStartDate = addDays(startDate, moveUnits);
      setStartDate(newStartDate);
      setEndDate(addDays(newStartDate, visibleDays - 1));
    } 
    else if (direction === 'today') {
      // 今日を中心にした表示範囲を計算
      const today = new Date();
      const newStartDate = subDays(today, Math.floor(visibleDays / 2));
      setStartDate(newStartDate);
      setEndDate(addDays(newStartDate, visibleDays - 1));
    }
  };
  
  // コンテキスト値
  const value: TimelineContextType = {
    viewMode,
    setViewMode: handleViewModeChange,
    zoomLevel,
    setZoomLevel: handleZoomLevelChange,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    showCompletedTasks,
    setShowCompletedTasks: handleShowCompletedTasksChange,
    navigate
  };

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
};

// カスタムフック
export const useTimelineContext = (): TimelineContextType => {
  const context = useContext(TimelineContext);
  if (context === undefined) {
    throw new Error('useTimelineContext must be used within a TimelineProvider');
  }
  return context;
};
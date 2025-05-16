import { useState, useCallback, useEffect } from 'react';
import { addDays, subDays, differenceInDays } from 'date-fns';
import { TimelineViewSettings } from '../models/timeline';
import { useLocalStorage } from './useLocalStorage';

/**
 * カスタムフック: タイムラインビューの状態管理
 * 
 * タイムラインの表示モード、期間、ズームレベルなどの状態を管理
 */
export const useTimelineView = (initialSettings?: Partial<TimelineViewSettings>) => {
  // デフォルト設定
  const defaultSettings: TimelineViewSettings = {
    viewMode: 'week',
    zoomLevel: 100,
    showCompletedTasks: true,
    showDependencies: false,
    highlightToday: true,
    highlightWeekends: true,
    ...initialSettings
  };
  
  // 設定をローカルストレージから取得
  const [settings, setSettings] = useLocalStorage<TimelineViewSettings>(
    'timeline-settings',
    defaultSettings
  );
  
  // ビューモードに基づいて表示日数を計算
  const getVisibleDays = useCallback((viewMode: 'day' | 'week' | 'month'): number => {
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
  }, []);
  
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
  }, [viewMode, getVisibleDays]);
  
  // 表示範囲
  const [startDate, setStartDate] = useState<Date>(() => calculateInitialDateRange().start);
  const [endDate, setEndDate] = useState<Date>(() => calculateInitialDateRange().end);
  
  // 表示モード変更時に表示範囲を調整
  const handleViewModeChange = useCallback((newMode: 'day' | 'week' | 'month') => {
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
  }, [startDate, endDate, getVisibleDays, setSettings]);
  
  // ズームレベル変更時に設定を保存
  const handleZoomLevelChange = useCallback((level: number) => {
    // 最小50%、最大200%に制限
    const newLevel = Math.min(200, Math.max(50, level));
    setZoomLevel(newLevel);
    setSettings(prev => ({ ...prev, zoomLevel: newLevel }));
  }, [setSettings]);
  
  // 完了タスク表示設定変更時に設定を保存
  const handleShowCompletedTasksChange = useCallback((show: boolean) => {
    setShowCompletedTasks(show);
    setSettings(prev => ({ ...prev, showCompletedTasks: show }));
  }, [setSettings]);
  
  // 期間のナビゲーション
  const navigate = useCallback((direction: 'prev' | 'next' | 'today') => {
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
  }, [viewMode, startDate, endDate]);
  
  // 1日あたりの幅を計算
  const calculateDayWidth = useCallback(() => {
    const baseWidth = viewMode === 'day' ? 50 : viewMode === 'week' ? 30 : 20;
    return baseWidth * (zoomLevel / 100);
  }, [viewMode, zoomLevel]);
  
  // 設定変更時に状態を更新
  useEffect(() => {
    setViewMode(settings.viewMode);
    setZoomLevel(settings.zoomLevel);
    setShowCompletedTasks(settings.showCompletedTasks);
  }, [settings]);
  
  return {
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
    navigate,
    dayWidth: calculateDayWidth()
  };
};

export default useTimelineView;
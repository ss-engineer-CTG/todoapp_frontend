// src/hooks/useTimelineView.ts
import { useState, useMemo, useEffect } from "react";
import { Task } from "../types/Task";
import { formatDate } from "../utils/dateUtils";

export type TimelineViewMode = 'day' | 'week' | 'month';

interface DateRange {
  startDate: string;
  endDate: string;
}

export interface TimelinePeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  daysCount: number;
}

/**
 * タイムラインの表示に関するロジックを提供するフック
 */
export function useTimelineView(tasks: Task[]) {
  // 表示モード（日/週/月）
  const [viewMode, setViewMode] = useState<TimelineViewMode>('month');
  
  // 表示期間の範囲
  const [visibleRange, setVisibleRange] = useState<DateRange>(() => {
    const today = new Date();
    const startMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    
    return {
      startDate: formatDate(startMonth),
      endDate: formatDate(endMonth)
    };
  });
  
  // ズームレベル（%）
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  
  // 今日の日付
  const today = useMemo(() => formatDate(new Date()), []);

  // 表示範囲を拡張して全てのタスクが見えるようにする
  useEffect(() => {
    if (tasks.length === 0) return;
    
    // タスクの最早日付と最遅日付を取得
    const dates = tasks.flatMap(task => [task.startDate, task.dueDate]);
    const minDate = dates.reduce((min, date) => date < min ? date : min, dates[0]);
    const maxDate = dates.reduce((max, date) => date > max ? date : max, dates[0]);
    
    // 現在の表示範囲を取得
    const currentMin = visibleRange.startDate;
    const currentMax = visibleRange.endDate;
    
    // 必要に応じて表示範囲を拡張
    let needsUpdate = false;
    let newStartDate = currentMin;
    let newEndDate = currentMax;
    
    if (minDate < currentMin) {
      // 1ヶ月前に拡張
      const date = new Date(minDate);
      date.setDate(1); // 月初に設定
      newStartDate = formatDate(date);
      needsUpdate = true;
    }
    
    if (maxDate > currentMax) {
      // 1ヶ月後まで拡張
      const date = new Date(maxDate);
      date.setMonth(date.getMonth() + 1);
      date.setDate(0); // 月末に設定
      newEndDate = formatDate(date);
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      setVisibleRange({
        startDate: newStartDate,
        endDate: newEndDate
      });
    }
  }, [tasks]);

  // 表示モードに基づいた期間単位（日/週/月）のリストを生成
  const periods = useMemo((): TimelinePeriod[] => {
    const startDate = new Date(visibleRange.startDate);
    const endDate = new Date(visibleRange.endDate);
    const periods: TimelinePeriod[] = [];
    
    if (viewMode === 'month') {
      // 月単位の期間を生成
      const current = new Date(startDate);
      while (current <= endDate) {
        const year = current.getFullYear();
        const month = current.getMonth();
        
        const periodStart = new Date(year, month, 1);
        const periodEnd = new Date(year, month + 1, 0);
        
        const daysInMonth = periodEnd.getDate();
        
        periods.push({
          id: `month-${year}-${month + 1}`,
          name: current.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' }),
          startDate: formatDate(periodStart),
          endDate: formatDate(periodEnd),
          daysCount: daysInMonth
        });
        
        // 次の月へ
        current.setMonth(month + 1);
      }
    } else if (viewMode === 'week') {
      // 週単位の期間を生成
      const current = new Date(startDate);
      // 週の開始日（日曜日）に調整
      const dayOfWeek = current.getDay();
      current.setDate(current.getDate() - dayOfWeek);
      
      while (current <= endDate) {
        const weekStart = new Date(current);
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        periods.push({
          id: `week-${formatDate(weekStart)}`,
          name: `${formatDate(weekStart)} 〜 ${formatDate(weekEnd)}`,
          startDate: formatDate(weekStart),
          endDate: formatDate(weekEnd),
          daysCount: 7
        });
        
        // 次の週へ
        current.setDate(current.getDate() + 7);
      }
    } else {
      // 日単位でグループ化（例えば10日ごと）
      const groupDays = 10;
      const current = new Date(startDate);
      
      while (current <= endDate) {
        const groupStart = new Date(current);
        const groupEnd = new Date(current);
        groupEnd.setDate(groupEnd.getDate() + groupDays - 1);
        
        // 終了日が全体の終了日を超えないように調整
        if (groupEnd > endDate) {
          groupEnd.setTime(endDate.getTime());
        }
        
        const daysCount = Math.round((groupEnd.getTime() - groupStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        periods.push({
          id: `day-group-${formatDate(groupStart)}`,
          name: `${formatDate(groupStart)} 〜 ${formatDate(groupEnd)}`,
          startDate: formatDate(groupStart),
          endDate: formatDate(groupEnd),
          daysCount
        });
        
        // 次のグループへ
        current.setDate(current.getDate() + groupDays);
      }
    }
    
    return periods;
  }, [visibleRange, viewMode]);

  // 表示期間を前後に移動
  const navigatePeriod = (direction: 'prev' | 'next') => {
    const startDate = new Date(visibleRange.startDate);
    const endDate = new Date(visibleRange.endDate);
    
    if (viewMode === 'month') {
      // 月単位で移動
      if (direction === 'prev') {
        startDate.setMonth(startDate.getMonth() - 1);
        endDate.setMonth(endDate.getMonth() - 1);
      } else {
        startDate.setMonth(startDate.getMonth() + 1);
        endDate.setMonth(endDate.getMonth() + 1);
      }
    } else if (viewMode === 'week') {
      // 週単位で移動
      const days = direction === 'prev' ? -7 : 7;
      startDate.setDate(startDate.getDate() + days);
      endDate.setDate(endDate.getDate() + days);
    } else {
      // 日単位で移動（10日単位）
      const days = direction === 'prev' ? -10 : 10;
      startDate.setDate(startDate.getDate() + days);
      endDate.setDate(endDate.getDate() + days);
    }
    
    setVisibleRange({
      startDate: formatDate(startDate),
      endDate: formatDate(endDate)
    });
  };

  // 表示範囲をリセット（今日を中心に表示）
  const resetTimelineView = () => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date;
    
    if (viewMode === 'month') {
      // 前月から翌々月までを表示
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    } else if (viewMode === 'week') {
      // 前週から翌々週までを表示
      const dayOfWeek = today.getDay();
      startDate = new Date(today);
      startDate.setDate(today.getDate() - dayOfWeek - 7);
      endDate = new Date(today);
      endDate.setDate(today.getDate() - dayOfWeek + 21);
    } else {
      // 10日前から20日後までを表示
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 10);
      endDate = new Date(today);
      endDate.setDate(today.getDate() + 20);
    }
    
    setVisibleRange({
      startDate: formatDate(startDate),
      endDate: formatDate(endDate)
    });
  };

  return {
    viewMode,
    setViewMode,
    visibleRange,
    setVisibleRange,
    zoomLevel,
    setZoomLevel,
    today,
    periods,
    navigatePeriod,
    resetTimelineView
  };
}
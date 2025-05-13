// src/hooks/useTimelineZoom.ts
import { useState, useMemo, useCallback } from "react";
import { TimelineViewMode } from "./useTimelineView";

/**
 * タイムラインのズーム機能とスケール管理を提供するフック
 */
export function useTimelineZoom() {
  // ズームレベル（50%～200%）
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  
  // 1日あたりの基本ピクセル幅
  const [baseDayWidth, setBaseDayWidth] = useState<number>(32);
  
  /**
   * 現在のズームレベルに基づいた1日あたりのピクセル幅を計算
   */
  const dayWidth = useMemo(() => {
    return Math.round((baseDayWidth * zoomLevel) / 100);
  }, [baseDayWidth, zoomLevel]);
  
  /**
   * 表示モードに応じた基本単位幅を設定
   */
  const setViewModeScale = useCallback((viewMode: TimelineViewMode) => {
    switch (viewMode) {
      case 'day':
        setBaseDayWidth(50); // 日単位表示は大きめに
        break;
      case 'week':
        setBaseDayWidth(32); // 週単位表示は標準
        break;
      case 'month':
        setBaseDayWidth(24); // 月単位表示は小さめに
        break;
      default:
        setBaseDayWidth(32);
    }
  }, []);
  
  /**
   * ズームレベルを変更する
   * @param newZoomLevel 新しいズームレベル
   */
  const changeZoomLevel = useCallback((newZoomLevel: number) => {
    // 50%～200%の範囲に制限
    const limitedZoom = Math.max(50, Math.min(200, newZoomLevel));
    setZoomLevel(limitedZoom);
  }, []);
  
  /**
   * ズームイン（拡大）
   */
  const zoomIn = useCallback(() => {
    changeZoomLevel(zoomLevel + 10);
  }, [zoomLevel, changeZoomLevel]);
  
  /**
   * ズームアウト（縮小）
   */
  const zoomOut = useCallback(() => {
    changeZoomLevel(zoomLevel - 10);
  }, [zoomLevel, changeZoomLevel]);
  
  /**
   * ズームをリセット
   */
  const resetZoom = useCallback(() => {
    setZoomLevel(100);
  }, []);
  
  /**
   * 指定された日数分の幅をピクセルで計算
   */
  const calculateWidth = useCallback((days: number) => {
    return days * dayWidth;
  }, [dayWidth]);
  
  /**
   * ピクセル位置から日数を計算（ドラッグ操作時に使用）
   */
  const calculateDaysFromPixels = useCallback((pixels: number) => {
    return Math.round(pixels / dayWidth);
  }, [dayWidth]);
  
  /**
   * スナップ機能 - 指定された位置を最も近いグリッドにスナップ
   */
  const snapToGrid = useCallback((position: number, snapThreshold = 8) => {
    const gridPosition = Math.round(position / dayWidth) * dayWidth;
    if (Math.abs(position - gridPosition) < snapThreshold) {
      return gridPosition;
    }
    return position;
  }, [dayWidth]);

  return {
    zoomLevel,
    dayWidth,
    setViewModeScale,
    changeZoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    calculateWidth,
    calculateDaysFromPixels,
    snapToGrid
  };
}
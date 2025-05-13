// src/components/views/TimelineView/TimelineHeader.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RefreshCw, Calendar, Clock, CalendarDays } from "lucide-react";
import { TimelineViewMode } from "../../../hooks/useTimelineView";

interface TimelineHeaderProps {
  viewMode: TimelineViewMode;
  zoomLevel: number;
  onViewModeChange: (mode: TimelineViewMode) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onReset: () => void;
  showCompleted: boolean;
  onToggleCompleted: () => void;
}

export default function TimelineHeader({
  viewMode,
  zoomLevel,
  onViewModeChange,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onNavigate,
  onReset,
  showCompleted,
  onToggleCompleted
}: TimelineHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-t-md border border-gray-200">
      <div className="flex items-center border rounded-md overflow-hidden mr-2">
        <Button 
          variant={viewMode === 'day' ? "default" : "ghost"} 
          size="sm" 
          onClick={() => onViewModeChange('day')}
          className="rounded-none"
        >
          <Clock size={16} className="mr-1" />
          <span className="text-xs">日</span>
        </Button>
        <Button 
          variant={viewMode === 'week' ? "default" : "ghost"} 
          size="sm" 
          onClick={() => onViewModeChange('week')}
          className="rounded-none"
        >
          <Calendar size={16} className="mr-1" />
          <span className="text-xs">週</span>
        </Button>
        <Button 
          variant={viewMode === 'month' ? "default" : "ghost"} 
          size="sm" 
          onClick={() => onViewModeChange('month')}
          className="rounded-none"
        >
          <CalendarDays size={16} className="mr-1" />
          <span className="text-xs">月</span>
        </Button>
      </div>
      
      <div className="flex items-center mr-2">
        <Button variant="outline" size="sm" onClick={() => onNavigate('prev')}>
          <ChevronLeft size={16} />
        </Button>
        <Button variant="outline" size="sm" onClick={onReset} className="mx-1">
          <RefreshCw size={16} />
        </Button>
        <Button variant="outline" size="sm" onClick={() => onNavigate('next')}>
          <ChevronRight size={16} />
        </Button>
      </div>
      
      <div className="flex items-center border rounded-md overflow-hidden mr-2">
        <Button variant="ghost" size="sm" onClick={onZoomOut} className="rounded-none px-2">
          <ZoomOut size={16} />
        </Button>
        <div className="px-2 flex items-center">
          <span className="text-xs font-medium">{zoomLevel}%</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onZoomIn} className="rounded-none px-2">
          <ZoomIn size={16} />
        </Button>
      </div>
      
      <label className="flex items-center text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={showCompleted}
          onChange={onToggleCompleted}
          className="mr-2 h-4 w-4"
        />
        完了済みを表示
      </label>
      
      <div className="ml-auto flex items-center text-xs text-gray-500">
        <div className="flex items-center mx-1">
          <div className="w-3 h-3 rounded-full bg-red-400 mr-1"></div>
          <span>遅延</span>
        </div>
        <div className="flex items-center mx-1">
          <div className="w-3 h-3 rounded-full bg-blue-400 mr-1"></div>
          <span>進行中</span>
        </div>
        <div className="flex items-center mx-1">
          <div className="w-3 h-3 rounded-full bg-green-400 mr-1"></div>
          <span>未来</span>
        </div>
        <div className="flex items-center mx-1">
          <div className="w-3 h-3 rounded-full bg-gray-400 mr-1"></div>
          <span>完了</span>
        </div>
      </div>
    </div>
  );
}
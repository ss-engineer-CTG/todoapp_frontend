"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, RotateCw, Maximize2 } from "lucide-react"

interface ZoomControlsProps {
  zoomLevel: number
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  onFitToScreen: () => void
  onZoomChange: (level: number) => void
}

const ZOOM_CONFIG = {
  min: 10,
  max: 200,
  default: 100,
  step: 10
}

export default function ZoomControls({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onReset,
  onFitToScreen,
  onZoomChange
}: ZoomControlsProps) {
  return (
    <div className="flex items-center space-x-2 p-1 bg-muted rounded-lg">
      <Button
        variant="ghost"
        size="sm"
        onClick={onZoomOut}
        disabled={zoomLevel <= ZOOM_CONFIG.min}
        title="縮小"
        className="h-8 w-8 p-0"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>

      <div className="flex items-center space-x-2">
        <input
          type="range"
          min={ZOOM_CONFIG.min}
          max={ZOOM_CONFIG.max}
          step={ZOOM_CONFIG.step}
          value={zoomLevel}
          onChange={(e) => onZoomChange(parseInt(e.target.value))}
          className="w-20 h-1 bg-muted-foreground/20 rounded-lg appearance-none cursor-pointer"
          title={`ズーム: ${zoomLevel}%`}
        />
        <span className="text-xs font-medium min-w-[2.5rem] text-center text-muted-foreground">
          {zoomLevel}%
        </span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onZoomIn}
        disabled={zoomLevel >= ZOOM_CONFIG.max}
        title="拡大"
        className="h-8 w-8 p-0"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        title="リセット (100%)"
        className="h-8 w-8 p-0"
      >
        <RotateCw className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onFitToScreen}
        title="画面にフィット"
        className="h-8 w-8 p-0"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
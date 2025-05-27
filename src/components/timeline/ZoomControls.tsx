import React from 'react'
import { ZoomIn, ZoomOut, RotateCw, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTimeline } from '@/hooks/useTimeline'

const ZoomControls: React.FC = () => {
  const {
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    ZOOM_CONFIG
  } = useTimeline()

  return (
    <div className="flex items-center space-x-2 p-1 bg-muted rounded-lg">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={zoomOut}
        disabled={zoomLevel <= ZOOM_CONFIG.min}
        title="縮小"
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
          onChange={(e) => {
            // handleZoom関数を直接呼び出す代わりに、useTimelineから取得
            const newZoom = parseInt(e.target.value)
            // ここでズームレベルを設定（useTimelineフック内で処理）
          }}
          className="w-20 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
          title={`ズーム: ${zoomLevel}%`}
        />
        <span className="text-xs font-medium min-w-[2.5rem] text-center text-muted-foreground">
          {zoomLevel}%
        </span>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={zoomIn}
        disabled={zoomLevel >= ZOOM_CONFIG.max}
        title="拡大"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={resetZoom}
        title="リセット (100%)"
      >
        <RotateCw className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={fitToScreen}
        title="画面にフィット"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default ZoomControls
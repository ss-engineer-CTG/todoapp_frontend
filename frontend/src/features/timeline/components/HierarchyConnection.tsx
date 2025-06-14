// システムプロンプト準拠：階層接続線コンポーネント（単一責任原則）
// 新規作成：接続線描画ロジックの分離、複雑な座標計算の隠蔽

import React from 'react'
import { TimelineTask } from '../types'
import { 
  getHierarchyConnectionPoints, 
  calculateHierarchyIndent,
  getHierarchyZIndex 
} from '../utils/hierarchy'

interface HierarchyConnectionProps {
  parentTask: TimelineTask
  childTask: TimelineTask
  parentPosition: {
    x: number
    y: number
    width: number
    height: number
  }
  childPosition: {
    x: number
    y: number
    width: number
    height: number
  }
  level: number
  zoomRatio: number
  theme: 'light' | 'dark'
  isLastChild?: boolean
  childIndex?: number
  totalChildren?: number
}

export const HierarchyConnection: React.FC<HierarchyConnectionProps> = ({
  parentTask,
  childTask,
  parentPosition,
  childPosition,
  level,
  zoomRatio,
  theme,
  isLastChild = false,
  childIndex = 0,
  totalChildren = 1
}) => {
  
  // 接続線の座標計算
  const connectionPoints = getHierarchyConnectionPoints(
    parentTask,
    childTask,
    parentPosition,
    childPosition,
    level,
    zoomRatio
  )

  // テーマに基づく色設定
  const getConnectionColors = () => {
    if (theme === 'dark') {
      return {
        line: '#6b7280', // gray-500
        dot: '#10b981', // green-500
        highlight: '#3b82f6' // blue-500
      }
    } else {
      return {
        line: '#9ca3af', // gray-400
        dot: '#059669', // green-600
        highlight: '#2563eb' // blue-600
      }
    }
  }

  const colors = getConnectionColors()
  
  // ズームレベルによる表示制御
  const shouldShowConnections = zoomRatio > 0.3 // 30%以下では非表示
  
  if (!shouldShowConnections) {
    return null
  }

  // レベルに応じたスタイル調整
  const getConnectionStyle = () => {
    const baseOpacity = 0.7
    const levelOpacity = Math.max(0.3, baseOpacity - (level * 0.1))
    
    return {
      opacity: levelOpacity,
      transition: 'all 0.2s ease-in-out'
    }
  }

  const connectionStyle = getConnectionStyle()

  return (
    <>
      {/* 垂直接続線 */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${connectionPoints.verticalLine.x}px`,
          top: `${connectionPoints.verticalLine.y}px`,
          width: `${connectionPoints.verticalLine.width}px`,
          height: `${connectionPoints.verticalLine.height}px`,
          backgroundColor: colors.line,
          zIndex: getHierarchyZIndex(level),
          borderRadius: `${Math.round(connectionPoints.verticalLine.width / 2)}px`,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
          ...connectionStyle
        }}
      />

      {/* 水平接続線 */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${connectionPoints.horizontalLine.x}px`,
          top: `${connectionPoints.horizontalLine.y}px`,
          width: `${connectionPoints.horizontalLine.width}px`,
          height: `${connectionPoints.horizontalLine.height}px`,
          backgroundColor: colors.line,
          zIndex: getHierarchyZIndex(level),
          borderRadius: `${Math.round(connectionPoints.horizontalLine.height / 2)}px`,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
          ...connectionStyle
        }}
      />

      {/* 接続点ドット */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: `${connectionPoints.connectionDot.x}px`,
          top: `${connectionPoints.connectionDot.y}px`,
          width: `${connectionPoints.connectionDot.width}px`,
          height: `${connectionPoints.connectionDot.height}px`,
          backgroundColor: colors.dot,
          borderRadius: '50%',
          border: `${Math.max(1, Math.round(2 * zoomRatio))}px solid ${theme === 'dark' ? '#1f2937' : '#ffffff'}`,
          zIndex: getHierarchyZIndex(level) + 1,
          boxShadow: `0 ${Math.round(2 * zoomRatio)}px ${Math.round(4 * zoomRatio)}px rgba(0, 0, 0, 0.2)`,
          ...connectionStyle
        }}
      />

      {/* 階層インジケーター（レベル2以上で表示） */}
      {level >= 2 && zoomRatio > 0.5 && (
        <div
          className="absolute pointer-events-none flex items-center justify-center text-xs font-bold"
          style={{
            left: `${connectionPoints.connectionDot.x - Math.round(8 * zoomRatio)}px`,
            top: `${connectionPoints.connectionDot.y - Math.round(16 * zoomRatio)}px`,
            width: `${Math.round(16 * zoomRatio)}px`,
            height: `${Math.round(12 * zoomRatio)}px`,
            backgroundColor: colors.highlight,
            color: 'white',
            borderRadius: `${Math.round(4 * zoomRatio)}px`,
            fontSize: `${Math.max(8, Math.round(10 * zoomRatio))}px`,
            zIndex: getHierarchyZIndex(level) + 2,
            boxShadow: `0 ${Math.round(1 * zoomRatio)}px ${Math.round(3 * zoomRatio)}px rgba(0, 0, 0, 0.3)`,
            ...connectionStyle
          }}
        >
          {level}
        </div>
      )}

      {/* 子要素カウンター（親タスクに子が複数いる場合） */}
      {childIndex === 0 && totalChildren > 1 && zoomRatio > 0.6 && (
        <div
          className="absolute pointer-events-none flex items-center justify-center text-xs font-semibold"
          style={{
            left: `${connectionPoints.verticalLine.x + Math.round(8 * zoomRatio)}px`,
            top: `${connectionPoints.verticalLine.y + Math.round(4 * zoomRatio)}px`,
            width: `${Math.round(20 * zoomRatio)}px`,
            height: `${Math.round(14 * zoomRatio)}px`,
            backgroundColor: theme === 'dark' ? 'rgba(55, 65, 81, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            color: theme === 'dark' ? '#e5e7eb' : '#374151',
            borderRadius: `${Math.round(6 * zoomRatio)}px`,
            border: `1px solid ${theme === 'dark' ? '#6b7280' : '#d1d5db'}`,
            fontSize: `${Math.max(7, Math.round(9 * zoomRatio))}px`,
            zIndex: getHierarchyZIndex(level) + 3,
            boxShadow: `0 ${Math.round(1 * zoomRatio)}px ${Math.round(2 * zoomRatio)}px rgba(0, 0, 0, 0.15)`,
            ...connectionStyle
          }}
        >
          {totalChildren}
        </div>
      )}

      {/* レベル別装飾線（レベル3以上で追加のスタイリング） */}
      {level >= 3 && zoomRatio > 0.4 && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: `${connectionPoints.verticalLine.x - Math.round(2 * zoomRatio)}px`,
            top: `${connectionPoints.verticalLine.y}px`,
            width: `${Math.round(6 * zoomRatio)}px`,
            height: `${connectionPoints.verticalLine.height}px`,
            background: `linear-gradient(to bottom, 
              ${colors.highlight}20, 
              ${colors.highlight}40, 
              ${colors.highlight}20)`,
            zIndex: getHierarchyZIndex(level) - 1,
            borderRadius: `${Math.round(3 * zoomRatio)}px`,
            opacity: 0.3
          }}
        />
      )}
    </>
  )
}

// 複数の子タスクの接続線を一括描画するヘルパーコンポーネント
interface MultipleConnectionsProps {
  parentTask: TimelineTask
  childTasks: TimelineTask[]
  parentPosition: {
    x: number
    y: number
    width: number
    height: number
  }
  getChildPosition: (child: TimelineTask) => {
    x: number
    y: number
    width: number
    height: number
  }
  level: number
  zoomRatio: number
  theme: 'light' | 'dark'
}

export const MultipleHierarchyConnections: React.FC<MultipleConnectionsProps> = ({
  parentTask,
  childTasks,
  parentPosition,
  getChildPosition,
  level,
  zoomRatio,
  theme
}) => {
  return (
    <>
      {childTasks.map((childTask, index) => (
        <HierarchyConnection
          key={`connection-${parentTask.id}-${childTask.id}`}
          parentTask={parentTask}
          childTask={childTask}
          parentPosition={parentPosition}
          childPosition={getChildPosition(childTask)}
          level={level}
          zoomRatio={zoomRatio}
          theme={theme}
          isLastChild={index === childTasks.length - 1}
          childIndex={index}
          totalChildren={childTasks.length}
        />
      ))}
    </>
  )
}
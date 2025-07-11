// システムプロンプト準拠：選択範囲枠線コンポーネント
// 機能：選択されたタスクグループを視覚的に囲む枠線を描画

import React, { useMemo } from 'react'
import { Task } from '@core/types'
import '../styles/animations.css'

interface SelectionBorderProps {
  selectedTasks: Task[]
  taskPositions: Map<string, { top: number; left: number; width: number; height: number }>
  theme: 'light' | 'dark'
  containerRef: React.RefObject<HTMLElement>
}

interface SelectionGroup {
  id: string
  tasks: Task[]
  bounds: {
    top: number
    left: number
    right: number
    bottom: number
    width: number
    height: number
  }
}

export const SelectionBorder: React.FC<SelectionBorderProps> = ({
  selectedTasks,
  taskPositions,
  theme,
  containerRef
}) => {
  
  // 選択されたタスクをグループ化し、境界を計算
  const selectionGroups = useMemo((): SelectionGroup[] => {
    if (selectedTasks.length === 0) return []
    
    // グループの境界を計算する内部関数
    const createSelectionGroup = (tasks: Task[], positions: Map<string, { top: number; left: number; width: number; height: number }>): SelectionGroup => {
      let minTop = Infinity
      let minLeft = Infinity
      let maxRight = -Infinity
      let maxBottom = -Infinity
      
      tasks.forEach(task => {
        // プロジェクト情報を含むユニークキーで位置を取得
        const uniqueKey = `${task.projectId}-${task.id}`
        const pos = positions.get(uniqueKey)
        
        if (!pos) {
          // フォールバック：元のタスクIDでも試行
          const fallbackPos = positions.get(task.id)
          
          console.warn('SelectionBorder: Position not found', {
            taskId: task.id,
            projectId: task.projectId,
            uniqueKey,
            hasUniqueKey: positions.has(uniqueKey),
            hasFallbackKey: positions.has(task.id),
            availableKeys: Array.from(positions.keys()),
            foundFallback: !!fallbackPos
          })
          
          if (!fallbackPos) return
          
          minTop = Math.min(minTop, fallbackPos.top)
          minLeft = Math.min(minLeft, fallbackPos.left)
          maxRight = Math.max(maxRight, fallbackPos.left + fallbackPos.width)
          maxBottom = Math.max(maxBottom, fallbackPos.top + fallbackPos.height)
          return
        }
        
        console.debug('SelectionBorder: Using unique key position', {
          taskId: task.id,
          projectId: task.projectId,
          uniqueKey,
          position: pos
        })
        
        minTop = Math.min(minTop, pos.top)
        minLeft = Math.min(minLeft, pos.left)
        maxRight = Math.max(maxRight, pos.left + pos.width)
        maxBottom = Math.max(maxBottom, pos.top + pos.height)
      })
      
      return {
        id: `group-${tasks.map(t => t.id).join('-')}`,
        tasks,
        bounds: {
          top: minTop - 4, // マージン
          left: minLeft - 8,
          right: maxRight + 8,
          bottom: maxBottom + 4,
          width: (maxRight + 8) - (minLeft - 8),
          height: (maxBottom + 4) - (minTop - 4)
        }
      }
    }
    
    // 連続するタスクをグループ化
    const groups: SelectionGroup[] = []
    let currentGroup: Task[] = []
    
    // タスクを位置順（top座標）でソート
    const sortedTasks = [...selectedTasks].sort((a, b) => {
      const posA = taskPositions.get(a.id)
      const posB = taskPositions.get(b.id)
      if (!posA || !posB) return 0
      return posA.top - posB.top
    })
    
    for (let i = 0; i < sortedTasks.length; i++) {
      const task = sortedTasks[i]
      const position = taskPositions.get(task.id)
      if (!position) continue
      
      if (currentGroup.length === 0) {
        currentGroup = [task]
      } else {
        const lastTask = currentGroup[currentGroup.length - 1]
        const lastPosition = taskPositions.get(lastTask.id)
        
        // 連続する行かどうかチェック（行の高さ + マージンを考慮）
        if (lastPosition && Math.abs(position.top - lastPosition.top) <= lastPosition.height + 5) {
          currentGroup.push(task)
        } else {
          // 新しいグループを開始
          if (currentGroup.length > 0) {
            groups.push(createSelectionGroup(currentGroup, taskPositions))
          }
          currentGroup = [task]
        }
      }
    }
    
    // 最後のグループを追加
    if (currentGroup.length > 0) {
      groups.push(createSelectionGroup(currentGroup, taskPositions))
    }
    
    return groups
  }, [selectedTasks, taskPositions])
  
  if (selectionGroups.length === 0) {
    return null
  }
  
  return (
    <>
      {selectionGroups.map(group => (
        <div
          key={group.id}
          className="absolute pointer-events-none animate-selection-border selection-border"
          style={{
            top: `${group.bounds.top}px`,
            left: `${group.bounds.left}px`,
            width: `${group.bounds.width}px`,
            height: `${group.bounds.height}px`,
            border: `2px dashed ${theme === 'dark' ? '#3b82f6' : '#2563eb'}`,
            borderRadius: '8px',
            background: theme === 'dark' 
              ? 'rgba(59, 130, 246, 0.08)' 
              : 'rgba(37, 99, 235, 0.05)',
            zIndex: 5,
            opacity: 0.9
          }}
        >
          {/* 角のマーカー */}
          <div
            className="absolute -top-1 -left-1 w-3 h-3 rounded-full"
            style={{
              backgroundColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }}
          />
          <div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
            style={{
              backgroundColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }}
          />
          <div
            className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full"
            style={{
              backgroundColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }}
          />
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full"
            style={{
              backgroundColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
            }}
          />
          
          {/* 選択数バッジ */}
          {group.tasks.length > 1 && (
            <div
              className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded-full text-xs font-bold text-white"
              style={{
                backgroundColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                minWidth: '20px',
                textAlign: 'center'
              }}
            >
              {group.tasks.length}
            </div>
          )}
        </div>
      ))}
    </>
  )
}
// デバッグ用：行選択機能テストページ
// 開発時のみ使用、本番環境では削除予定

import React from 'react'
import { useRowSelection } from '../hooks/useRowSelection'
import { Task } from '@core/types'

// テスト用のダミータスク
const mockTasks: Task[] = [
  {
    id: '1',
    name: 'タスク1',
    startDate: new Date('2024-01-01'),
    dueDate: new Date('2024-01-03'),
    completed: false,
    projectId: 'project1',
    level: 0,
    parentId: null,
    collapsed: false,
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2', 
    name: 'タスク2',
    startDate: new Date('2024-01-02'),
    dueDate: new Date('2024-01-04'),
    completed: false,
    projectId: 'project1',
    level: 0,
    parentId: null,
    collapsed: false,
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'タスク3',
    startDate: new Date('2024-01-03'),
    dueDate: new Date('2024-01-05'),
    completed: false,
    projectId: 'project1',
    level: 0,
    parentId: null,
    collapsed: false,
    notes: '',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export const RowSelectionTestPage: React.FC = () => {
  const {
    selectedTaskIds,
    selectedCount,
    isSelecting,
    isDragSelecting,
    previewTaskIds,
    handleRowClick,
    handleRowMouseDown,
    clearSelection,
    updateTasksRef,
    registerRowElement
  } = useRowSelection()

  // テスト用タスクリストを設定
  React.useEffect(() => {
    updateTasksRef(mockTasks)
  }, [updateTasksRef])

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">行選択機能テスト</h1>
      
      {/* 状態表示 */}
      <div className="mb-4 p-3 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">選択状態</h2>
        <div className="text-sm space-y-1">
          <div>選択中タスク数: {selectedCount}</div>
          <div>選択中: {isSelecting ? 'Yes' : 'No'}</div>
          <div>ドラッグ選択中: {isDragSelecting ? 'Yes' : 'No'}</div>
          <div>選択タスクID: {Array.from(selectedTaskIds).join(', ')}</div>
          <div>プレビュータスクID: {Array.from(previewTaskIds).join(', ')}</div>
        </div>
        <button 
          onClick={clearSelection}
          className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm"
        >
          選択解除
        </button>
      </div>

      {/* 操作説明 */}
      <div className="mb-4 p-3 bg-blue-50 rounded">
        <h2 className="font-semibold mb-2">操作方法</h2>
        <ul className="text-sm space-y-1">
          <li>• クリック: 単一選択</li>
          <li>• Ctrl+クリック: 複数選択</li>
          <li>• Shift+クリック: 範囲選択</li>
          <li>• ドラッグ: 範囲選択</li>
          <li>• Ctrl+ドラッグ: 追加選択</li>
          <li>• Escape: 選択解除</li>
        </ul>
      </div>

      {/* タスク行テスト */}
      <div className="border rounded">
        <h2 className="font-semibold p-3 border-b bg-gray-50">タスク一覧</h2>
        {mockTasks.map(task => {
          const isSelected = selectedTaskIds.has(task.id)
          const isPreview = previewTaskIds.has(task.id)
          
          return (
            <div
              key={task.id}
              ref={(element) => {
                if (element) {
                  registerRowElement(task.id, element)
                }
              }}
              className={`
                p-3 border-b cursor-pointer select-none transition-all duration-150
                ${isSelected ? 'bg-blue-100 border-l-4 border-l-blue-500' : ''}
                ${isPreview ? 'bg-blue-50 border-l-2 border-l-blue-300' : ''}
                ${!isSelected && !isPreview ? 'hover:bg-gray-50' : ''}
              `}
              onClick={(e) => handleRowClick(e, task.id)}
              onMouseDown={(e) => handleRowMouseDown(e, task.id)}
            >
              <div className="font-medium">{task.name}</div>
              <div className="text-sm text-gray-600">
                {task.startDate.toLocaleDateString()} - {task.dueDate.toLocaleDateString()}
              </div>
              <div className="text-xs text-gray-400">ID: {task.id}</div>
            </div>
          )
        })}
      </div>

      {/* 選択されたタスクの詳細 */}
      {selectedCount > 0 && (
        <div className="mt-4 p-3 bg-green-50 rounded">
          <h2 className="font-semibold mb-2">選択されたタスク</h2>
          <div className="space-y-1">
            {mockTasks
              .filter(task => selectedTaskIds.has(task.id))
              .map(task => (
                <div key={task.id} className="text-sm">
                  {task.name} (ID: {task.id})
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
}
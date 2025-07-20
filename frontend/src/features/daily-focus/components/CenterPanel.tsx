import React, { useState, useCallback, useEffect } from 'react'
import { useTheme } from '@core/components/ThemeProvider'
import { CheckSquare, Plus, Trash2, Bell, BarChart3 } from 'lucide-react'
import { useGoals } from '../hooks/useGoals'
import { useCustomTags } from '../hooks/useCustomTags'
import { useSelection } from '../hooks/useSelection'
import { useMonthlyGoalsLifecycle } from '../hooks/useMonthlyGoalsLifecycle'
import { TagSelectionModal } from './modals/TagSelectionModal'
import { TagEditModal } from './modals/TagEditModal'
import { MonthlyGoalsReport } from './MonthlyGoalsReport'
import { MonthlyGoalsNotificationCenter } from './MonthlyGoalsNotificationCenter'
import { FocusTodo, LearningCategory } from '../types'
import { todoStorage, initializeStorage } from '../utils/storage'

export const CenterPanel: React.FC = () => {
  const { theme } = useTheme()
  const { goals } = useGoals()
  const { tags } = useCustomTags()
  const { selection, getSelectableProps } = useSelection()
  const { notifications, lifecycleState } = useMonthlyGoalsLifecycle()
  
  
  
  const [newTodoText, setNewTodoText] = useState('')
  const [todos, setTodos] = useState<FocusTodo[]>([])
  const [isTagSelectionOpen, setIsTagSelectionOpen] = useState(false)
  const [isTagEditOpen, setIsTagEditOpen] = useState(false)
  const [pendingTodoText, setPendingTodoText] = useState('')
  const [loading, setLoading] = useState(true)
  
  // 月次目標機能の状態
  const [showMonthlyReport, setShowMonthlyReport] = useState(false)
  const [showNotificationCenter, setShowNotificationCenter] = useState(false)
  

  // ストレージ初期化とToDo読み込み
  useEffect(() => {
    const loadTodos = async () => {
      try {
        setLoading(true)
        // ストレージ初期化を確実に実行
        initializeStorage()
        const loadedTodos = todoStorage.getAll()
        setTodos(loadedTodos)
      } catch (error) {
        // エラーハンドリング（サイレント）
      } finally {
        setLoading(false)
      }
    }
    
    loadTodos()
  }, [])

  // ToDo削除
  const handleDeleteTodo = useCallback((todoId: string) => {
    const updatedTodos = todoStorage.delete(todoId)
    setTodos(updatedTodos)
  }, [])

  // 削除イベントの処理
  useEffect(() => {
    const handleDeleteSelected = (event: CustomEvent) => {
      const { type, id } = event.detail
      if (type === 'todo' && id) {
        handleDeleteTodo(id)
      }
    }

    window.addEventListener('deleteSelected', handleDeleteSelected as EventListener)
    return () => {
      window.removeEventListener('deleteSelected', handleDeleteSelected as EventListener)
    }
  }, [handleDeleteTodo])

  // 統一されたToDo追加フロー（プロトタイプ風）
  const handleAddTodo = useCallback(() => {
    if (newTodoText.trim()) {
      // タグまたは目標が存在する場合はタグ選択モーダルを表示
      if (goals.length > 0 || tags.length > 0) {
        setPendingTodoText(newTodoText.trim())
        setIsTagSelectionOpen(true)
      } else {
        // タグがない場合は直接追加
        const newTodo: FocusTodo = {
          id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: newTodoText.trim(),
          completed: false,
          tagIds: [],
          category: 'other',
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        const updatedTodos = todoStorage.add(newTodo)
        setTodos(updatedTodos)
        setNewTodoText('')
      }
    }
  }, [newTodoText, goals.length, tags.length])

  // タグ選択完了
  const handleTagSelected = useCallback((tagId: string, tagType: 'goal' | 'custom') => {
    let goalId: string | undefined
    let selectedTagId: string | undefined
    let tagIds: string[] = []
    let category: LearningCategory = 'other'
    
    if (tagType === 'goal') {
      const goal = goals.find(g => g.id === tagId)
      if (goal) {
        goalId = goal.id
        tagIds = goal.tagIds || []
        category = goal.category as LearningCategory
      }
    } else {
      const tag = tags.find(t => t.id === tagId)
      if (tag) {
        selectedTagId = tag.id
        tagIds = [tag.id]
        category = tag.category as LearningCategory
      }
    }
    
    const newTodo: FocusTodo = {
      id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: pendingTodoText,
      completed: false,
      goalId: goalId || undefined,
      tagId: selectedTagId || undefined,
      tagIds,
      category,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const updatedTodos = todoStorage.add(newTodo)
    setTodos(updatedTodos)
    setNewTodoText('')
    setIsTagSelectionOpen(false)
    setPendingTodoText('')
  }, [pendingTodoText, goals, tags])

  // タグなしで追加
  const handleSkipTag = useCallback(() => {
    const newTodo: FocusTodo = {
      id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: pendingTodoText,
      completed: false,
      tagIds: [],
      category: 'other',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const updatedTodos = todoStorage.add(newTodo)
    setTodos(updatedTodos)
    setNewTodoText('')
    setIsTagSelectionOpen(false)
    setPendingTodoText('')
  }, [pendingTodoText])

  // ToDo完了状態切り替え
  const handleToggleTodo = useCallback((todoId: string) => {
    const todo = todos.find(t => t.id === todoId)
    if (todo) {
      const updates: Partial<FocusTodo> = {
        completed: !todo.completed,
        ...((!todo.completed) ? { completedAt: new Date() } : { completedAt: undefined })
      }
      const updatedTodos = todoStorage.update(todoId, updates)
      setTodos(updatedTodos)
    }
  }, [todos])

  // キーボード処理（統一フロー）
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      
      // 直接的にhandleAddTodoを呼び出す代わりに、少し遅延させる
      setTimeout(() => {
        handleAddTodo()
      }, 10)
    }
  }, [handleAddTodo])

  // タグ表示の取得
  const getTodoTagDisplay = (todo: FocusTodo) => {
    const displayTags: Array<{ text: string; color: string; type: 'goal' | 'custom' }> = []
    
    // ゴール表示
    if (todo.goalId) {
      const goal = goals.find(g => g.id === todo.goalId)
      if (goal) {
        displayTags.push({
          text: `📚 ${goal.title}`,
          color: goal.color,
          type: 'goal' as const
        })
      }
    }
    
    // 新しいタグシステム: tagIds配列
    if (todo.tagIds && todo.tagIds.length > 0) {
      todo.tagIds.forEach(tagId => {
        const tag = tags.find(t => t.id === tagId)
        if (tag) {
          displayTags.push({
            text: `${tag.emoji} ${tag.name}`,
            color: tag.color,
            type: 'custom' as const
          })
        }
      })
    }
    // 後方互換性: 単一tagId
    else if (todo.tagId) {
      const tag = tags.find(t => t.id === todo.tagId)
      if (tag) {
        displayTags.push({
          text: `${tag.emoji} ${tag.name}`,
          color: tag.color,
          type: 'custom' as const
        })
      }
    }
    
    return displayTags.length > 0 ? displayTags : null
  }

  // タグの色クラス取得
  const getTagColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: theme === 'dark' ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-100 text-blue-800',
      green: theme === 'dark' ? 'bg-green-900/30 text-green-200' : 'bg-green-100 text-green-800',
      purple: theme === 'dark' ? 'bg-purple-900/30 text-purple-200' : 'bg-purple-100 text-purple-800',
      orange: theme === 'dark' ? 'bg-orange-900/30 text-orange-200' : 'bg-orange-100 text-orange-800',
      teal: theme === 'dark' ? 'bg-teal-900/30 text-teal-200' : 'bg-teal-100 text-teal-800',
      rose: theme === 'dark' ? 'bg-rose-900/30 text-rose-200' : 'bg-rose-100 text-rose-800'
    }
    return colorMap[color] || (theme === 'dark' ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800')
  }

  // 現在の日付文字列を取得
  const getCurrentDateString = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    const weekday = weekdays[now.getDay()]
    return `${year}年${month}月${day}日 (${weekday})`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return (
    <section className="mb-4" aria-labelledby="todo-section-title">
      <header>
        <div className="flex items-center justify-between mb-2">
          <h2 
            id="todo-section-title"
            className={`text-lg font-semibold flex items-center ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}
          >
            <CheckSquare className="mr-2" size={20} aria-hidden="true" />
            今日のToDo
          </h2>
          
          {/* 月次目標関連ボタン */}
          <div className="flex items-center space-x-2">
            {/* 通知センターボタン */}
            <button
              onClick={() => setShowNotificationCenter(true)}
              className={`relative p-2 rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'hover:bg-gray-700 text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="通知センター"
            >
              <Bell size={16} />
              {(notifications.length > 0 || lifecycleState.expiredGoals.length > 0) && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notifications.length + lifecycleState.expiredGoals.length}
                </span>
              )}
            </button>
            
            {/* 月次レポートボタン */}
            <button
              onClick={() => setShowMonthlyReport(!showMonthlyReport)}
              className={`p-2 rounded-lg transition-colors ${
                showMonthlyReport
                  ? 'bg-rose-600 text-white'
                  : theme === 'dark' 
                  ? 'hover:bg-gray-700 text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              title="月次目標レポート"
            >
              <BarChart3 size={16} />
            </button>
          </div>
        </div>
        
        <time 
          className={`text-sm mb-4 block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
          dateTime={new Date().toISOString().split('T')[0]}
        >
          {getCurrentDateString()}
        </time>
      </header>
      
      {/* ToDoリスト */}
      <div 
        className="space-y-2"
        role="list"
        aria-label="今日のタスク一覧"
      >
        {todos.map(todo => {
          const tagDisplays = getTodoTagDisplay(todo)
          return (
            <div 
              key={todo.id}
              {...getSelectableProps(todo.id, 'todo')}
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ease-in-out hover:scale-[1.01] ${
                theme === 'dark' 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-gray-50 hover:bg-gray-100'
              } ${getSelectableProps(todo.id, 'todo').className}`}
              role="listitem"
              aria-label={`タスク: ${todo.text}${todo.completed ? ' (完了済み)' : ''}`}
            >
              <input 
                type="checkbox" 
                checked={todo.completed}
                onChange={() => handleToggleTodo(todo.id)}
                className="mr-3 w-4 h-4 text-blue-600 rounded" 
                aria-label={`${todo.text}を${todo.completed ? '未完了にする' : '完了にする'}`}
                id={`todo-checkbox-${todo.id}`}
              />
              <div className="flex-1 flex items-center space-x-2">
                <label 
                  htmlFor={`todo-checkbox-${todo.id}`}
                  className={`cursor-pointer ${todo.completed ? 'line-through text-gray-500' : ''}`}
                >
                  {todo.text}
                </label>
                {tagDisplays && tagDisplays.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tagDisplays.map((tagDisplay, index) => (
                      <span 
                        key={index}
                        className={`text-xs px-2 py-1 rounded ${getTagColorClasses(tagDisplay.color)}`}
                        role="tag"
                        aria-label={`タグ: ${tagDisplay.text}`}
                      >
                        {tagDisplay.text}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* 選択されたToDoのアクションボタン */}
              {selection.selectedTodoId === todo.id && (
                <div className="flex items-center space-x-1 ml-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteTodo(todo.id)
                    }}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                    title="削除"
                    aria-label={`${todo.text}を削除`}
                    type="button"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        
        {/* ToDoがない場合の表示 */}
        {todos.length === 0 && (
          <div 
            className={`text-center py-8 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}
            role="status"
            aria-live="polite"
          >
            <p className="text-sm">今日のToDoはありません</p>
            <p className="text-xs mt-1">新しいToDoを追加してください</p>
          </div>
        )}
      </div>
      
      {/* 新しいToDo追加（統一フロー） */}
      <section className="mt-4" aria-labelledby="add-todo-label">
        <h3 id="add-todo-label" className="sr-only">新しいタスクを追加</h3>
        <div className="flex">
          <label htmlFor="new-todo-input" className="sr-only">
            新しいタスクの内容
          </label>
          <input 
            id="new-todo-input"
            type="text" 
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              goals.length > 0 || tags.length > 0 
                ? "新しいToDoを追加... (Enterでタグ選択)" 
                : "新しいToDoを追加... (Enter)"
            }
            aria-describedby="add-todo-help"
            className={`flex-1 p-2 border rounded-l-lg ${
              theme === 'dark' 
                ? 'border-gray-600 bg-gray-800 text-gray-200 placeholder-gray-400' 
                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
            }`}
          />
          <button 
            onClick={handleAddTodo}
            disabled={!newTodoText.trim()}
            className={`px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors flex items-center ${
              !newTodoText.trim() ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Plus size={16} className="mr-1" />
            追加
          </button>
        </div>
        
        {/* タグがある場合のヒント */}
        {(goals.length > 0 || tags.length > 0) && (
          <p 
            id="add-todo-help"
            className={`text-xs mt-2 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}
            role="note"
          >
            Enterキーで自動的にタグ選択画面が表示されます
          </p>
        )}
      </section>
      
      {/* 月次目標レポート */}
      {showMonthlyReport && (
        <section className="mt-6" aria-labelledby="monthly-report-title">
          <h3 id="monthly-report-title" className="sr-only">月次目標レポート</h3>
          <MonthlyGoalsReport />
        </section>
      )}
      
      {/* 通知センター */}
      <MonthlyGoalsNotificationCenter
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
      />
      
      {/* タグ選択モーダル */}
      <TagSelectionModal
        isOpen={isTagSelectionOpen}
        onClose={() => {
          setIsTagSelectionOpen(false)
          setPendingTodoText('')
        }}
        onSelectTag={handleTagSelected}
        onSkipTag={handleSkipTag}
        todoText={pendingTodoText}
      />
      
      {/* デバッグ用：モーダルの状態表示 */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          position: 'fixed', 
          top: '10px', 
          right: '10px', 
          background: 'rgba(0,0,0,0.8)', 
          color: 'white', 
          padding: '10px',
          fontSize: '12px',
          zIndex: 9999
        }}>
          Modal Open: {isTagSelectionOpen ? 'YES' : 'NO'}<br/>
          Goals: {goals.length}<br/>
          Tags: {tags.length}<br/>
          Pending: {pendingTodoText}
        </div>
      )}
      
      {/* タグ編集モーダル */}
      <TagEditModal
        isOpen={isTagEditOpen}
        onClose={() => setIsTagEditOpen(false)}
        editingFromTagSelection={true}
      />
    </section>
  )
}
import React, { useState, useCallback, useEffect } from 'react'
import { useTheme } from '@core/components/ThemeProvider'
import { CheckSquare, Plus, Edit, Trash2 } from 'lucide-react'
import { useGoals } from '../hooks/useGoals'
import { useCustomTags } from '../hooks/useCustomTags'
import { useSelection } from '../hooks/useSelection'
import { TagSelectionModal } from './modals/TagSelectionModal'
import { TagEditModal } from './modals/TagEditModal'
import { FocusTodo, LearningCategory } from '../types'
import { todoStorage } from '../utils/storage'

export const CenterPanel: React.FC = () => {
  const { theme } = useTheme()
  const { goals } = useGoals()
  const { tags } = useCustomTags()
  const { selection, getSelectableProps } = useSelection()
  
  const [newTodoText, setNewTodoText] = useState('')
  const [todos, setTodos] = useState<FocusTodo[]>([])
  const [isTagSelectionOpen, setIsTagSelectionOpen] = useState(false)
  const [isTagEditOpen, setIsTagEditOpen] = useState(false)
  const [pendingTodoText, setPendingTodoText] = useState('')
  const [loading, setLoading] = useState(true)

  // ToDo読み込み
  useEffect(() => {
    const loadTodos = async () => {
      try {
        setLoading(true)
        const loadedTodos = todoStorage.getAll()
        setTodos(loadedTodos)
      } catch (error) {
        console.error('Failed to load todos:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadTodos()
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
  }, [])

  // 簡単なToDo追加（タグ選択なし）
  const handleAddTodoSimple = useCallback(() => {
    if (newTodoText.trim()) {
      const newTodo: FocusTodo = {
        id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: newTodoText.trim(),
        completed: false,
        category: 'other',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const updatedTodos = todoStorage.add(newTodo)
      setTodos(updatedTodos)
      setNewTodoText('')
    }
  }, [newTodoText])

  // タグ選択モーダルを開く
  const handleAddTodoWithTag = useCallback(() => {
    if (newTodoText.trim()) {
      setPendingTodoText(newTodoText.trim())
      setIsTagSelectionOpen(true)
    }
  }, [newTodoText])

  // タグ選択完了
  const handleTagSelected = useCallback((tagId: string, tagType: 'goal' | 'custom') => {
    let goalId: string | undefined
    let selectedTagId: string | undefined
    let category: LearningCategory = 'other'
    
    if (tagType === 'goal') {
      const goal = goals.find(g => g.id === tagId)
      if (goal) {
        goalId = goal.id
        category = goal.category as LearningCategory
      }
    } else {
      const tag = tags.find(t => t.id === tagId)
      if (tag) {
        selectedTagId = tag.id
        category = tag.category as LearningCategory
      }
    }
    
    const newTodo: FocusTodo = {
      id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: pendingTodoText,
      completed: false,
      goalId,
      tagId: selectedTagId,
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
        completedAt: !todo.completed ? new Date() : undefined
      }
      const updatedTodos = todoStorage.update(todoId, updates)
      setTodos(updatedTodos)
    }
  }, [todos])

  // ToDo削除
  const handleDeleteTodo = useCallback((todoId: string) => {
    const updatedTodos = todoStorage.delete(todoId)
    setTodos(updatedTodos)
  }, [])

  // キーボード処理
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enterでタグ選択
        handleAddTodoWithTag()
      } else {
        // Enterでシンプル追加
        handleAddTodoSimple()
      }
    }
  }, [handleAddTodoSimple, handleAddTodoWithTag])

  // タグ表示の取得
  const getTodoTagDisplay = (todo: FocusTodo) => {
    if (todo.goalId) {
      const goal = goals.find(g => g.id === todo.goalId)
      if (goal) {
        return {
          text: `📚 ${goal.title}`,
          color: goal.color,
          type: 'goal' as const
        }
      }
    }
    
    if (todo.tagId) {
      const tag = tags.find(t => t.id === todo.tagId)
      if (tag) {
        return {
          text: `${tag.emoji} ${tag.name}`,
          color: tag.color,
          type: 'custom' as const
        }
      }
    }
    
    return null
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
    <div className="mb-4">
      <h2 className={`text-lg font-semibold mb-2 flex items-center ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
        <CheckSquare className="mr-2" size={20} />
        今日のToDo
      </h2>
      <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
        {getCurrentDateString()}
      </p>
      
      {/* ToDoリスト */}
      <div className="space-y-2">
        {todos.map(todo => {
          const tagDisplay = getTodoTagDisplay(todo)
          return (
            <div 
              key={todo.id}
              {...getSelectableProps(todo.id, 'todo')}
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                theme === 'dark' 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-gray-50 hover:bg-gray-100'
              } ${getSelectableProps(todo.id, 'todo').className}`}
            >
              <input 
                type="checkbox" 
                checked={todo.completed}
                onChange={() => handleToggleTodo(todo.id)}
                className="mr-3 w-4 h-4 text-blue-600 rounded" 
              />
              <div className="flex-1 flex items-center space-x-2">
                <span className={`${todo.completed ? 'line-through text-gray-500' : ''}`}>
                  {todo.text}
                </span>
                {tagDisplay && (
                  <span className={`text-xs px-2 py-1 rounded ${getTagColorClasses(tagDisplay.color)}`}>
                    {tagDisplay.text}
                  </span>
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
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          )
        })}
        
        {/* ToDoがない場合の表示 */}
        {todos.length === 0 && (
          <div className={`text-center py-8 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <p className="text-sm">今日のToDoはありません</p>
            <p className="text-xs mt-1">新しいToDoを追加してください</p>
          </div>
        )}
      </div>
      
      {/* 新しいToDo追加 */}
      <div className="mt-4 space-y-2">
        <div className="flex">
          <input 
            type="text" 
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="新しいToDoを追加... (Enter: 追加, Shift+Enter: タグ選択)" 
            className={`flex-1 p-2 border rounded-l-lg ${
              theme === 'dark' 
                ? 'border-gray-600 bg-gray-800 text-gray-200 placeholder-gray-400' 
                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
            }`}
          />
          <button 
            onClick={handleAddTodoSimple}
            disabled={!newTodoText.trim()}
            className={`px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors flex items-center ${
              !newTodoText.trim() ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Plus size={16} className="mr-1" />
            追加
          </button>
        </div>
        
        {/* タグ付きで追加ボタン */}
        <button 
          onClick={handleAddTodoWithTag}
          disabled={!newTodoText.trim()}
          className={`w-full p-2 border border-dashed rounded-lg transition-colors flex items-center justify-center space-x-2 ${
            theme === 'dark' 
              ? 'border-gray-600 text-gray-400 hover:border-gray-500' 
              : 'border-gray-300 text-gray-500 hover:border-gray-400'
          } ${!newTodoText.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Edit size={16} />
          <span>タグを選択して追加</span>
        </button>
      </div>
      
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
      
      {/* タグ編集モーダル */}
      <TagEditModal
        isOpen={isTagEditOpen}
        onClose={() => setIsTagEditOpen(false)}
        editingFromTagSelection={true}
      />
    </div>
  )
}
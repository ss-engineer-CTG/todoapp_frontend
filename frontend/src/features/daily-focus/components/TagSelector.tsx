import React, { useState, useRef, useEffect } from 'react'
import { useTheme } from '@core/components/ThemeProvider'
import { ChevronDown, Plus, X } from 'lucide-react'
import { Tag } from '../types'
import { tagStorage } from '../utils/tagStorage'

interface TagSelectorProps {
  selectedTagIds: string[]
  onTagsChange: (tagIds: string[]) => void
  placeholder?: string
  maxTags?: number
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTagIds,
  onTagsChange,
  placeholder = 'タグを選択または作成...',
  maxTags = 5
}) => {
  const { resolvedTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [filteredTags, setFilteredTags] = useState<Tag[]>([])
  
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // タグデータを読み込み
  useEffect(() => {
    const tags = tagStorage.getAllTags()
    setAvailableTags(tags)
    setFilteredTags(tags)
  }, [])

  // 検索クエリに基づくフィルタリング
  useEffect(() => {
    const filtered = tagStorage.searchTags(searchQuery)
    setFilteredTags(filtered)
  }, [searchQuery])

  // 外部クリックでドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedTags = tagStorage.getTags(selectedTagIds)

  // タグ選択
  const handleTagSelect = (tag: Tag) => {
    if (selectedTagIds.includes(tag.id)) {
      // 既に選択済みの場合は除去
      const newTagIds = selectedTagIds.filter(id => id !== tag.id)
      onTagsChange(newTagIds)
    } else if (selectedTagIds.length < maxTags) {
      // 新規選択
      const newTagIds = [...selectedTagIds, tag.id]
      onTagsChange(newTagIds)
      tagStorage.incrementUsage(tag.id)
    }
    setSearchQuery('')
  }

  // タグ除去
  const handleTagRemove = (tagId: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    const newTagIds = selectedTagIds.filter(id => id !== tagId)
    onTagsChange(newTagIds)
  }

  // 新規タグ作成
  const handleCreateTag = () => {
    if (!searchQuery.trim()) return
    
    try {
      const newTag = tagStorage.createTag(searchQuery.trim())
      const newTagIds = [...selectedTagIds, newTag.id]
      onTagsChange(newTagIds)
      
      // 利用可能タグリストを更新
      const updatedTags = tagStorage.getAllTags()
      setAvailableTags(updatedTags)
      setFilteredTags(updatedTags)
      
      setSearchQuery('')
    } catch (error) {
      console.error('タグの作成に失敗しました:', error)
    }
  }

  // Enterキーでタグ作成
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && searchQuery.trim()) {
      event.preventDefault()
      handleCreateTag()
    } else if (event.key === 'Escape') {
      setIsOpen(false)
      setSearchQuery('')
    }
  }

  // タグの色クラスを取得
  const getTagColorClass = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      teal: 'bg-teal-100 text-teal-800 border-teal-200',
      rose: 'bg-rose-100 text-rose-800 border-rose-200'
    }
    
    if (resolvedTheme === 'dark') {
      const darkColorMap = {
        blue: 'bg-blue-900/50 text-blue-200 border-blue-700',
        green: 'bg-green-900/50 text-green-200 border-green-700',
        purple: 'bg-purple-900/50 text-purple-200 border-purple-700',
        orange: 'bg-orange-900/50 text-orange-200 border-orange-700',
        teal: 'bg-teal-900/50 text-teal-200 border-teal-700',
        rose: 'bg-rose-900/50 text-rose-200 border-rose-700'
      }
      return darkColorMap[color as keyof typeof darkColorMap] || darkColorMap.blue
    }
    
    return colorMap[color as keyof typeof colorMap] || colorMap.blue
  }

  const canCreateNewTag = searchQuery.trim() && 
    !filteredTags.some(tag => tag.name.toLowerCase() === searchQuery.trim().toLowerCase()) &&
    selectedTagIds.length < maxTags

  return (
    <div className="space-y-2">
      {/* 選択済みタグ表示 */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map(tag => (
            <span 
              key={tag.id}
              className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getTagColorClass(tag.color)}`}
            >
              {tag.emoji && <span className="mr-1">{tag.emoji}</span>}
              {tag.name}
              <button
                onClick={(e) => handleTagRemove(tag.id, e)}
                className="ml-1 hover:bg-black/10 rounded-full p-0.5"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* タグ選択/作成インターフェース */}
      <div className="relative" ref={containerRef}>
        <div 
          className={`flex items-center gap-2 p-2 border rounded-lg cursor-text transition-colors ${
            resolvedTheme === 'dark'
              ? 'border-gray-600 bg-gray-800 hover:border-gray-500'
              : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
          onClick={() => {
            setIsOpen(true)
            inputRef.current?.focus()
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedTags.length === 0 ? placeholder : '追加のタグを入力...'}
            className={`flex-1 bg-transparent outline-none text-sm ${
              resolvedTheme === 'dark' ? 'text-gray-200' : 'text-gray-900'
            }`}
            onFocus={() => setIsOpen(true)}
          />
          <ChevronDown 
            size={16} 
            className={`transition-transform ${isOpen ? 'rotate-180' : ''} ${
              resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}
          />
        </div>

        {/* ドロップダウンメニュー */}
        {isOpen && (
          <div className={`absolute z-10 mt-1 w-full rounded-lg border shadow-lg max-h-60 overflow-y-auto ${
            resolvedTheme === 'dark' 
              ? 'border-gray-600 bg-gray-800' 
              : 'border-gray-300 bg-white'
          }`}>
            {/* 新規タグ作成オプション */}
            {canCreateNewTag && (
              <button
                onClick={handleCreateTag}
                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b ${
                  resolvedTheme === 'dark' 
                    ? 'border-gray-600 text-gray-200' 
                    : 'border-gray-200 text-gray-900'
                }`}
              >
                <Plus size={16} className="text-blue-600" />
                <span>「{searchQuery}」を作成</span>
              </button>
            )}

            {/* 既存タグリスト */}
            {filteredTags.length > 0 ? (
              <div className="py-1">
                {filteredTags.map(tag => {
                  const isSelected = selectedTagIds.includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      onClick={() => handleTagSelect(tag)}
                      disabled={!isSelected && selectedTagIds.length >= maxTags}
                      className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200'
                          : selectedTagIds.length >= maxTags
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-200'
                      }`}
                    >
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getTagColorClass(tag.color)}`}>
                        {tag.emoji && <span className="mr-1">{tag.emoji}</span>}
                        {tag.name}
                      </span>
                      {tag.usageCount > 0 && (
                        <span className="ml-auto text-xs text-gray-400">
                          {tag.usageCount}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            ) : searchQuery && !canCreateNewTag ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                一致するタグが見つかりません
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* ヘルプテキスト */}
      <div className="text-xs text-gray-500">
        最大 {maxTags} 個まで選択可能 • Enter キーで新規作成
      </div>
    </div>
  )
}
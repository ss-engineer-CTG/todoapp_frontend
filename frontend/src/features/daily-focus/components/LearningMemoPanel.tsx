import React, { useState, useCallback } from 'react'
import { useTheme } from '@core/components/ThemeProvider'
import { Edit3, Save, Plus, X, Target, Trophy, AlertCircle, BookOpen, Calendar, Download, Eye } from 'lucide-react'
import { useLearningMemo } from '../hooks/useLearningMemo'
import { 
  getColorClasses, 
  getNeutralClasses, 
  getInteractionClasses,
  getButtonStyles,
  getInputStyles,
  combineClasses,
  type ThemeMode 
} from '../utils/themeUtils'

export const LearningMemoPanel: React.FC = () => {
  const { resolvedTheme } = useTheme()
  const {
    memo,
    loading,
    error,
    isEditing,
    lastSaved,
    updateMemoContent,
    toggleEditing,
    manualSave: _manualSave,
    addGoal,
    removeGoal,
    addAchievement,
    removeAchievement,
    addChallenge,
    removeChallenge,
    updateReflections,
    updateTomorrowPlans,
    getMemoStats,
    exportMemo
  } = useLearningMemo()

  // 統一テーマシステムを使用 - resolvedThemeを直接使用
  const themeMode = resolvedTheme as ThemeMode
  const neutralClasses = getNeutralClasses(themeMode)
  const interactionClasses = getInteractionClasses(themeMode)

  const [newGoal, setNewGoal] = useState('')
  const [newAchievement, setNewAchievement] = useState('')
  const [newChallenge, setNewChallenge] = useState('')
  const [activeTab, setActiveTab] = useState<'content' | 'goals' | 'reflection'>('content')
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isCompactMode, setIsCompactMode] = useState(false)

  // 目標を追加
  const handleAddGoal = useCallback(() => {
    if (newGoal.trim()) {
      addGoal(newGoal.trim())
      setNewGoal('')
    }
  }, [newGoal, addGoal])

  // 達成事項を追加
  const handleAddAchievement = useCallback(() => {
    if (newAchievement.trim()) {
      addAchievement(newAchievement.trim())
      setNewAchievement('')
    }
  }, [newAchievement, addAchievement])

  // 課題を追加
  const handleAddChallenge = useCallback(() => {
    if (newChallenge.trim()) {
      addChallenge(newChallenge.trim())
      setNewChallenge('')
    }
  }, [newChallenge, addChallenge])

  // エクスポート
  const handleExport = useCallback(() => {
    const text = exportMemo('text')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `learning-memo-${memo?.date || 'today'}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [exportMemo, memo])

  // Markdownレンダリング関数
  const renderMarkdown = useCallback((text: string): string => {
    return text
      // ヘッダー
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-gray-100">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-6 mb-3 text-gray-900 dark:text-gray-100">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-gray-100">$1</h1>')
      
      // コードブロック
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg my-3 overflow-x-auto border"><code class="text-sm text-gray-800 dark:text-gray-200">$2</code></pre>')
      
      // インラインコード
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm text-gray-800 dark:text-gray-200">$1</code>')
      
      // 太字
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      
      // 斜体
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      
      // リスト（箇条書き）
      .replace(/^- (.*$)/gim, '<li class="ml-4 my-1">• $1</li>')
      
      // チェックボックスリスト
      .replace(/^- \[ \] (.*$)/gim, '<li class="ml-4 my-1 flex items-center"><input type="checkbox" class="mr-2" disabled> $1</li>')
      .replace(/^- \[x\] (.*$)/gim, '<li class="ml-4 my-1 flex items-center"><input type="checkbox" class="mr-2" checked disabled> <span class="line-through text-gray-500">$1</span></li>')
      
      // 改行
      .replace(/\n/g, '<br>')
      
      // リストのまとめ
      .replace(/(<li.*?>.*?<\/li>)/gs, '<ul class="my-2 space-y-1">$1</ul>')
  }, [])

  const stats = getMemoStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-4 rounded-lg border ${
        themeMode === 'dark' 
          ? 'bg-red-900/20 border-red-800 text-red-200' 
          : 'bg-red-50 border-red-200 text-red-800'
      }`}>
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  if (!memo) return null

  return (
    <section className="space-y-4" aria-labelledby="learning-memo-title">
      {/* ヘッダー */}
      <header className="flex items-center justify-between">
        <h3 
          id="learning-memo-title"
          className={combineClasses(
            'text-md font-semibold flex items-center',
            neutralClasses.text
          )}
        >
          <BookOpen className="mr-2" size={18} aria-hidden="true" />
          学習メモ
        </h3>
        
        <div className="flex items-center space-x-2" role="toolbar" aria-label="学習メモ操作">
          {/* コンパクトモード切り替え */}
          <button
            onClick={() => setIsCompactMode(!isCompactMode)}
            className={`p-1 rounded transition-colors ${
              isCompactMode
                ? 'bg-green-100 dark:bg-green-900/20 text-green-600'
                : themeMode === 'dark' 
                ? 'hover:bg-gray-700 text-gray-400' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title={isCompactMode ? '詳細表示' : 'コンパクト表示'}
            aria-label={isCompactMode ? '詳細表示に切り替え' : 'コンパクト表示に切り替え'}
            aria-pressed={isCompactMode}
            type="button"
          >
            <div className="w-4 h-4 flex flex-col space-y-0.5" aria-hidden="true">
              <div className="h-0.5 bg-current rounded"></div>
              <div className="h-0.5 bg-current rounded"></div>
              <div className="h-0.5 bg-current rounded"></div>
            </div>
          </button>
          
          {activeTab === 'content' && !isCompactMode && (
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`p-1 rounded transition-colors ${
                isPreviewMode
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600'
                  : themeMode === 'dark' 
                  ? 'hover:bg-gray-700 text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              title={isPreviewMode ? '編集モード' : 'プレビューモード'}
            >
              <Eye size={16} />
            </button>
          )}
          <button
            onClick={handleExport}
            className={combineClasses(
              'p-1 rounded transition-colors',
              neutralClasses.textSecondary,
              interactionClasses.hover
            )}
            title="エクスポート"
            aria-label="学習メモをテキストファイルとしてエクスポート"
            type="button"
          >
            <Download size={16} />
          </button>
          <button
            onClick={toggleEditing}
            className={combineClasses(
              'p-1 rounded transition-colors',
              neutralClasses.textSecondary,
              interactionClasses.hover
            )}
            title={isEditing ? '編集を終了' : '編集開始'}
            aria-label={isEditing ? '編集を終了して保存' : '編集モードを開始'}
            aria-pressed={isEditing}
            type="button"
          >
            {isEditing ? <Save size={16} /> : <Edit3 size={16} />}
          </button>
        </div>
      </header>

      {/* 統計情報（コンパクトモードでは非表示） */}
      {stats && !isCompactMode && (
        <div className="grid grid-cols-2 gap-2">
          <div className={combineClasses(
            'p-2 rounded border',
            getColorClasses('blue', 'light', themeMode).background,
            getColorClasses('blue', 'light', themeMode).border
          )}>
            <div className="text-xs text-blue-600">達成率</div>
            <div className={combineClasses(
              'text-lg font-bold',
              getColorClasses('blue', 'light', themeMode).text
            )}>
              {stats.totalGoals > 0 ? Math.round(stats.completionRate * 100) : 0}%
            </div>
          </div>
          
          <div className={combineClasses(
            'p-2 rounded border',
            getColorClasses('green', 'light', themeMode).background,
            getColorClasses('green', 'light', themeMode).border
          )}>
            <div className="text-xs text-green-600">総文字数</div>
            <div className={combineClasses(
              'text-lg font-bold',
              getColorClasses('green', 'light', themeMode).text
            )}>
              {stats.wordCount}
            </div>
          </div>
        </div>
      )}

      {/* コンパクトモードの統計情報 */}
      {stats && isCompactMode && (
        <div className="flex items-center space-x-4 text-xs">
          <span className={neutralClasses.textMuted}>
            達成率: <span className="font-medium text-blue-600">
              {stats.totalGoals > 0 ? Math.round(stats.completionRate * 100) : 0}%
            </span>
          </span>
          <span className={neutralClasses.textMuted}>
            文字数: <span className="font-medium text-green-600">{stats.wordCount}</span>
          </span>
        </div>
      )}

      {/* タブ */}
      <div className="flex space-x-1">
        {[
          { id: 'content', label: '内容', icon: BookOpen },
          { id: 'goals', label: '目標', icon: Target },
          { id: 'reflection', label: '振り返り', icon: Calendar }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={combineClasses(
              'px-3 py-1 text-xs rounded transition-colors flex items-center space-x-1',
              activeTab === tab.id
                ? getButtonStyles('primary', 'blue', themeMode)
                : getButtonStyles('secondary', 'blue', themeMode)
            )}
          >
            <tab.icon size={12} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      <div className="space-y-4">
        {activeTab === 'content' && (
          <div className="space-y-3">
            <div>
              <label className={combineClasses(
                'block text-sm font-medium mb-1',
                neutralClasses.textSecondary
              )}>
                今日の学習内容 {isPreviewMode && <span className={combineClasses(
                  'text-xs px-2 py-0.5 rounded text-blue-600',
                  getColorClasses('blue', 'light', themeMode).background
                )}>プレビュー</span>}
              </label>
              
              {isPreviewMode ? (
                <div
                  className={combineClasses(
                    'w-full p-3 border rounded min-h-[200px] prose prose-sm max-w-none',
                    neutralClasses.surface,
                    neutralClasses.border,
                    neutralClasses.text
                  )}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(memo.content || '') }}
                />
              ) : (
                <textarea
                  value={memo.content}
                  onChange={(e) => updateMemoContent(e.target.value)}
                  placeholder="今日学んだことを記録しましょう...

Markdownをサポート:
# 見出し1
## 見出し2
### 見出し3
**太字** *斜体*
`コード`
```
コードブロック
```
- リスト項目
- [ ] チェックボックス
- [x] 完了済み"
                  disabled={!isEditing}
                  className={combineClasses(
                    'w-full p-2 rounded resize-none',
                    getInputStyles(themeMode),
                    !isEditing && interactionClasses.disabled
                  )}
                  rows={isCompactMode ? 4 : 8}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className={isCompactMode ? "space-y-2" : "space-y-4"}>
            {/* 目標セクション */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Target size={16} className="text-blue-600" />
                <span className={combineClasses(
                  isCompactMode ? 'text-xs' : 'text-sm',
                  'font-medium',
                  neutralClasses.textSecondary
                )}>
                  今日の目標
                </span>
              </div>
              
              <div className={isCompactMode ? "space-y-1" : "space-y-2"}>
                {memo.goals.map((goal, index) => (
                  <div 
                    key={index}
                    className={`flex items-center justify-between ${isCompactMode ? 'p-1' : 'p-2'} rounded border ${
                      themeMode === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <span className={isCompactMode ? "text-xs" : "text-sm"}>{goal}</span>
                    {isEditing && (
                      <button
                        onClick={() => removeGoal(index)}
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                
                {isEditing && (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      placeholder="新しい目標を追加..."
                      className={`flex-1 p-2 border rounded ${
                        themeMode === 'dark' 
                          ? 'border-gray-600 bg-gray-800 text-gray-200' 
                          : 'border-gray-300 bg-white text-gray-900'
                      }`}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddGoal()}
                    />
                    <button
                      onClick={handleAddGoal}
                      className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 達成事項セクション */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Trophy size={16} className="text-green-600" />
                <span className={`text-sm font-medium ${
                  themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  達成したこと
                </span>
              </div>
              
              <div className="space-y-2">
                {memo.achievements.map((achievement, index) => (
                  <div 
                    key={index}
                    className={`flex items-center justify-between p-2 rounded border ${
                      themeMode === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <span className="text-sm">{achievement}</span>
                    {isEditing && (
                      <button
                        onClick={() => removeAchievement(index)}
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                
                {isEditing && (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newAchievement}
                      onChange={(e) => setNewAchievement(e.target.value)}
                      placeholder="達成したことを追加..."
                      className={`flex-1 p-2 border rounded ${
                        themeMode === 'dark' 
                          ? 'border-gray-600 bg-gray-800 text-gray-200' 
                          : 'border-gray-300 bg-white text-gray-900'
                      }`}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddAchievement()}
                    />
                    <button
                      onClick={handleAddAchievement}
                      className="p-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 課題セクション */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle size={16} className="text-orange-600" />
                <span className={`text-sm font-medium ${
                  themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  課題・困ったこと
                </span>
              </div>
              
              <div className="space-y-2">
                {memo.challenges.map((challenge, index) => (
                  <div 
                    key={index}
                    className={`flex items-center justify-between p-2 rounded border ${
                      themeMode === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <span className="text-sm">{challenge}</span>
                    {isEditing && (
                      <button
                        onClick={() => removeChallenge(index)}
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                
                {isEditing && (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newChallenge}
                      onChange={(e) => setNewChallenge(e.target.value)}
                      placeholder="課題を追加..."
                      className={`flex-1 p-2 border rounded ${
                        themeMode === 'dark' 
                          ? 'border-gray-600 bg-gray-800 text-gray-200' 
                          : 'border-gray-300 bg-white text-gray-900'
                      }`}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddChallenge()}
                    />
                    <button
                      onClick={handleAddChallenge}
                      className="p-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reflection' && (
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                振り返り
              </label>
              <textarea
                value={memo.reflections}
                onChange={(e) => updateReflections(e.target.value)}
                placeholder="今日の学習を振り返って感じたことを記録しましょう..."
                disabled={!isEditing}
                className={`w-full p-2 border rounded resize-none ${
                  themeMode === 'dark' 
                    ? 'border-gray-600 bg-gray-800 text-gray-200 placeholder-gray-400' 
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                } ${!isEditing ? 'bg-opacity-50 cursor-not-allowed' : ''}`}
                rows={4}
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                明日の計画
              </label>
              <textarea
                value={memo.tomorrowPlans}
                onChange={(e) => updateTomorrowPlans(e.target.value)}
                placeholder="明日の学習計画を立てましょう..."
                disabled={!isEditing}
                className={`w-full p-2 border rounded resize-none ${
                  themeMode === 'dark' 
                    ? 'border-gray-600 bg-gray-800 text-gray-200 placeholder-gray-400' 
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                } ${!isEditing ? 'bg-opacity-50 cursor-not-allowed' : ''}`}
                rows={4}
              />
            </div>
          </div>
        )}
      </div>

      {/* 最終保存時刻 */}
      {lastSaved && (
        <div className={combineClasses(
          'text-xs text-center',
          neutralClasses.textMuted
        )}>
          最終保存: {lastSaved.toLocaleTimeString()}
        </div>
      )}
    </section>
  )
}
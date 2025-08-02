import React, { useEffect, useCallback, useRef, useId } from 'react'
import { useTheme } from '@core/components/ThemeProvider'
import { X } from 'lucide-react'
import { 
  getNeutralClasses, 
  getInteractionClasses, 
  combineClasses,
  type ThemeMode 
} from '../../utils/themeUtils'

interface KeyboardNavigableModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
  onKeyDown?: (event: KeyboardEvent) => void
  preventBackgroundClose?: boolean
  // アクセシビリティ関連
  ariaDescribedBy?: string
  ariaLabelledBy?: string
  initialFocusRef?: React.RefObject<HTMLElement>
  role?: 'dialog' | 'alertdialog'
}

export const KeyboardNavigableModal: React.FC<KeyboardNavigableModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  className = '',
  size = 'md',
  onKeyDown,
  preventBackgroundClose = false,
  ariaDescribedBy,
  ariaLabelledBy,
  initialFocusRef,
  role = 'dialog'
}) => {
  const { resolvedTheme } = useTheme()
  const modalRef = useRef<HTMLDivElement>(null)
  const titleIdSuffix = useId()
  const subtitleIdSuffix = useId()
  const titleId = `modal-title-${titleIdSuffix}`
  const subtitleId = subtitle ? `modal-subtitle-${subtitleIdSuffix}` : undefined
  
  // 統一テーマシステムを使用 - resolvedThemeを直接使用
  const themeMode = resolvedTheme as ThemeMode
  const neutralClasses = getNeutralClasses(themeMode)
  const interactionClasses = getInteractionClasses(themeMode)

  // サイズクラスの取得
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-sm'
      case 'md':
        return 'max-w-md'
      case 'lg':
        return 'max-w-lg'
      default:
        return 'max-w-md'
    }
  }

  // キーボードイベントハンドラー
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return

    // カスタムキーハンドラーがある場合は優先
    if (onKeyDown) {
      onKeyDown(event)
      return
    }

    // デフォルトのEscapeキー処理
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    }
  }, [isOpen, onKeyDown, onClose])

  // フォーカストラップ
  const handleTabKey = useCallback((event: KeyboardEvent) => {
    if (!isOpen || event.key !== 'Tab') return

    const modal = modalRef.current
    if (!modal) return

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    if (event.shiftKey) {
      // Shift+Tab: 最初の要素にフォーカスがある場合、最後に移動
      if (document.activeElement === firstElement) {
        event.preventDefault()
        lastElement?.focus()
      }
    } else {
      // Tab: 最後の要素にフォーカスがある場合、最初に移動
      if (document.activeElement === lastElement) {
        event.preventDefault()
        firstElement?.focus()
      }
    }
  }, [isOpen])

  // グローバルキーボードイベント
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('keydown', handleTabKey)
      
      // 初期フォーカスを設定
      setTimeout(() => {
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus()
        } else {
          // デフォルトでは最初のフォーカス可能な要素にフォーカス
          const modal = modalRef.current
          if (modal) {
            const focusableElement = modal.querySelector(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            ) as HTMLElement
            focusableElement?.focus() || modal.focus()
          }
        }
      }, 10)
      
      // 背景スクロールを防止
      document.body.style.overflow = 'hidden'
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.removeEventListener('keydown', handleTabKey)
        document.body.style.overflow = ''
      }
    }
  }, [isOpen, handleKeyDown, handleTabKey])

  // 背景クリック処理
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (preventBackgroundClose) return
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // デバッグ用ログ
  console.log('KeyboardNavigableModal render:', { isOpen, title })
  
  if (!isOpen) {
    console.log('KeyboardNavigableModal not rendering because isOpen is false')
    return null
  }
  
  console.log('KeyboardNavigableModal rendering with isOpen=true')

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackgroundClick}
    >
      <div 
        ref={modalRef}
        className={combineClasses(
          'w-full rounded-lg shadow-xl outline-none',
          getSizeClasses(),
          neutralClasses.surface,
          neutralClasses.text,
          className
        )}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        role={role}
        aria-modal="true"
        aria-labelledby={ariaLabelledBy || titleId}
        aria-describedby={ariaDescribedBy || subtitleId}
        aria-hidden={!isOpen}
      >
        {/* ヘッダー */}
        <div className={combineClasses(
          'flex items-center justify-between p-4 border-b',
          neutralClasses.border
        )}>
          <div className="flex-1">
            <h2 
              id={titleId}
              className="text-lg font-semibold"
            >
              {title}
            </h2>
            {subtitle && (
              <p 
                id={subtitleId}
                className={combineClasses(
                  'text-sm mt-1 p-2 rounded',
                  neutralClasses.surfaceSecondary,
                  neutralClasses.textSecondary
                )}
                role="note"
              >
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className={combineClasses(
              'p-1 rounded-lg transition-colors',
              neutralClasses.textSecondary,
              interactionClasses.hover
            )}
            aria-label="モーダルを閉じる"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {children}
        </div>

        {/* フッター */}
        {footer && (
          <div className={combineClasses(
            'flex justify-end space-x-2 p-4 border-t',
            neutralClasses.border
          )}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
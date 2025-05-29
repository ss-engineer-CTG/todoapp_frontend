// 選択タスクの自動スクロール機能（page.tsx準拠）
import { useEffect, useRef } from 'react'

interface UseAutoScrollProps {
  selectedItemId: string | null
  items: Array<{ id: string }>
  behavior?: ScrollBehavior
  block?: ScrollLogicalPosition
}

export const useAutoScroll = <T extends HTMLElement = HTMLDivElement>({
  selectedItemId,
  items,
  behavior = 'smooth',
  block = 'nearest'
}: UseAutoScrollProps) => {
  const itemRefs = useRef<{ [key: string]: T }>({})

  // 選択アイテムの自動スクロール
  useEffect(() => {
    if (selectedItemId && itemRefs.current[selectedItemId]) {
      const element = itemRefs.current[selectedItemId]
      
      // スクロール実行
      element.scrollIntoView({
        behavior,
        block
      })
    }
  }, [selectedItemId, behavior, block])

  // Refを設定するためのコールバック関数
  const setItemRef = (id: string) => (el: T | null) => {
    if (el) {
      itemRefs.current[id] = el
    } else {
      delete itemRefs.current[id]
    }
  }

  // クリーンアップ
  useEffect(() => {
    const currentItemIds = items.map(item => item.id)
    const refKeys = Object.keys(itemRefs.current)
    
    // 存在しないアイテムのRefを削除
    refKeys.forEach(key => {
      if (!currentItemIds.includes(key)) {
        delete itemRefs.current[key]
      }
    })
  }, [items])

  return {
    itemRefs: itemRefs.current,
    setItemRef
  }
}
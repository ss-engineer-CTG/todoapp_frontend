import { useAppContext } from '@/context/AppProvider'
import type { ViewMode, ActiveArea } from '@/types/app'

export function useApp() {
  try {
    const {
      state,
      setViewMode,
      setActiveArea,
      toggleShowCompleted,
      setShowCompleted,
      toggleDetailPanel,
      setIsDetailPanelVisible,
    } = useAppContext()

    return {
      viewMode: state.viewMode,
      activeArea: state.activeArea,
      showCompleted: state.showCompleted,
      isDetailPanelVisible: state.isDetailPanelVisible,
      setViewMode,
      setActiveArea,
      toggleShowCompleted,
      setShowCompleted,
      toggleDetailPanel,
      setIsDetailPanelVisible,
    }
  } catch (error) {
    console.error('useApp hook error:', error)
    // フォールバック値を返す
    return {
      viewMode: 'list' as ViewMode,
      activeArea: 'projects' as ActiveArea,
      showCompleted: true,
      isDetailPanelVisible: true,
      setViewMode: () => {},
      setActiveArea: () => {},
      toggleShowCompleted: () => {},
      setShowCompleted: () => {},
      toggleDetailPanel: () => {},
      setIsDetailPanelVisible: () => {},
    }
  }
}
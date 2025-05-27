import { useAppContext } from '@/context/AppProvider'
import type { ViewMode, ActiveArea } from '@/types/app'

export function useApp() {
  const context = useAppContext()
  
  if (!context) {
    console.error('useApp must be used within an AppProvider')
    // フォールバック値を返す
    return {
      viewMode: 'list' as ViewMode,
      activeArea: 'projects' as ActiveArea,
      showCompleted: true,
      isDetailPanelVisible: true,
      setViewMode: () => console.warn('setViewMode called outside of AppProvider'),
      setActiveArea: () => console.warn('setActiveArea called outside of AppProvider'),
      toggleShowCompleted: () => console.warn('toggleShowCompleted called outside of AppProvider'),
      setShowCompleted: () => console.warn('setShowCompleted called outside of AppProvider'),
      toggleDetailPanel: () => console.warn('toggleDetailPanel called outside of AppProvider'),
      setIsDetailPanelVisible: () => console.warn('setIsDetailPanelVisible called outside of AppProvider'),
    }
  }

  const {
    state,
    setViewMode,
    setActiveArea,
    toggleShowCompleted,
    setShowCompleted,
    toggleDetailPanel,
    setIsDetailPanelVisible,
  } = context

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
}
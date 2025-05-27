import { useAppContext } from '@/context/AppProvider'
import type { ViewMode, ActiveArea } from '@/types/app'

export function useApp() {
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
}
import React from 'react'
import { LearningMemoPanel } from './LearningMemoPanel'

interface CenterPanelProps {
  selectedDate: string
  onBackToToday: () => void
}

export const CenterPanel: React.FC<CenterPanelProps> = ({
  selectedDate,
  onBackToToday
}) => {
  return (
    <div className="h-full">
      <LearningMemoPanel 
        selectedDate={selectedDate}
        onBackToToday={onBackToToday}
      />
    </div>
  )
}
import React from 'react'
import { List, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/hooks/useApp'

const ViewModeToggle: React.FC = () => {
  const { viewMode, setViewMode } = useApp()

  return (
    <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg">
      <Button
        variant={viewMode === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('list')}
        className="h-8"
      >
        <List className="h-4 w-4 mr-1" />
        リスト
      </Button>
      <Button
        variant={viewMode === 'timeline' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setViewMode('timeline')}
        className="h-8"
      >
        <Calendar className="h-4 w-4 mr-1" />
        タイムライン
      </Button>
    </div>
  )
}

export default ViewModeToggle
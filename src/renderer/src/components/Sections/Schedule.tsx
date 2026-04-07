import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Play, 
  SkipBack, 
  SkipForward, 
  GripVertical, 
  X, 
  BookOpen, 
  Music, 
  FileText,
  Megaphone,
  Image as ImageIcon,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '@/components/ui/empty'
import { FolderOpen } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { usePresentationContext, SceneItem, SceneType } from '@/context/PresentationContext'
import { cn } from '@/lib/utils'

// Icon mapping for scene types
const sceneTypeIcons: Record<SceneType, React.ElementType> = {
  bible: BookOpen,
  song: Music,
  note: FileText,
  announcement: Megaphone,
  media: ImageIcon,
}

interface ScheduleItemProps {
  item: SceneItem
  index: number
  isActive: boolean
  onSelect: () => void
  onRemove: () => void
  onDragStart: (index: number) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDrop: (index: number) => void
  isDragging: boolean
  dragOverIndex: number | null
}

function ScheduleItem({ 
  item, 
  index, 
  isActive, 
  onSelect, 
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  isDragging,
  dragOverIndex
}: ScheduleItemProps) {
  const Icon = sceneTypeIcons[item.type]
  const isDropTarget = dragOverIndex === index
  
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        onDragStart(index)
      }}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        onDragOver(e, index)
      }}
      onDrop={(e) => {
        e.preventDefault()
        onDrop(index)
      }}
      onDragEnd={() => onDrop(-1)}
      onClick={onSelect}
      className={cn(
        'group flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-all',
        'border border-transparent',
        isActive 
          ? 'bg-primary/10 border-primary/50 text-primary' 
          : 'hover:bg-muted/50',
        isDragging && 'opacity-50',
        isDropTarget && 'border-primary border-dashed bg-primary/5'
      )}
    >
      {/* Drag handle */}
      <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
        <GripVertical className="h-4 w-4" />
      </div>
      
      {/* Icon */}
      <div className={cn(
        'flex items-center justify-center h-6 w-6 rounded',
        isActive ? 'bg-primary/20' : 'bg-muted'
      )}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.title}</p>
        {item.verses && item.verses.length > 1 && (
          <p className="text-xs text-muted-foreground">
            {item.verses.length} verses
          </p>
        )}
      </div>
      
      {/* Remove button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

const Schedule = () => {
  const { t } = useTranslation()
  const {
    schedule,
    currentSceneIndex,
    skipLeft,
    skipRight,
    selectScene,
    removeFromSchedule,
    reorderSchedule,
    clearSchedule,
    goLive,
    previewContent
  } = usePresentationContext()

  // Drag and drop state
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index)
  }, [])

  const handleDragOver = useCallback((_e: React.DragEvent, index: number) => {
    if (dragIndex !== null && dragIndex !== index) {
      setDragOverIndex(index)
    }
  }, [dragIndex])

  const handleDrop = useCallback((toIndex: number) => {
    if (dragIndex !== null && toIndex !== -1 && dragIndex !== toIndex) {
      reorderSchedule(dragIndex, toIndex)
    }
    setDragIndex(null)
    setDragOverIndex(null)
  }, [dragIndex, reorderSchedule])

  return (
    <section className="lg:w-1/5 h-full border-b p-4 shrink-0 flex flex-col gap-3">
      <Tabs defaultValue="schedule" className="flex flex-col flex-1 min-h-0">
        <TabsList className="w-full shrink-0">
          <TabsTrigger value="schedule" className="flex-1">
            {t('dashboard.scheduleHeader')}
          </TabsTrigger>
          <TabsTrigger value="media" className="flex-1">
            {t('dashboard.media')}
          </TabsTrigger>
        </TabsList>

        {/* Schedule tab */}
        <TabsContent value="schedule" className="flex-1 flex flex-col min-h-0 mt-2">
          {schedule.length > 0 ? (
            <>
              {/* Schedule header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">
                  {schedule.length} {schedule.length === 1 ? 'item' : 'items'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive hover:text-destructive"
                  onClick={clearSchedule}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
              
              {/* Schedule items */}
              <ScrollArea className="flex-1 min-h-0 -mx-1 px-1">
                <div className="flex flex-col gap-1">
                  {schedule.map((item, index) => (
                    <ScheduleItem
                      key={item.id}
                      item={item}
                      index={index}
                      isActive={index === currentSceneIndex}
                      onSelect={() => selectScene(index)}
                      onRemove={() => removeFromSchedule(item.id)}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      isDragging={dragIndex === index}
                      dragOverIndex={dragOverIndex}
                    />
                  ))}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FolderOpen />
                  </EmptyMedia>
                  <EmptyTitle>No items scheduled</EmptyTitle>
                  <EmptyDescription>
                    Add verses or media to build your presentation
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          )}
          
          {/* Navigation controls */}
          <div className="flex justify-center gap-2 pt-3 border-t mt-3">
            <Button 
              variant="outline" 
              size="lg"
              disabled={schedule.length === 0}
              onClick={skipLeft}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              disabled={schedule.length === 0}
              onClick={skipRight}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button 
              size="lg"
              disabled={!previewContent}
              onClick={goLive}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              {t('dashboard.goLive')}
            </Button>
          </div>
        </TabsContent>

        {/* Media tab */}
        <TabsContent value="media" className="flex-1 flex items-center justify-center min-h-0">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderOpen />
              </EmptyMedia>
              <EmptyTitle>{t('dashboard.mediaEmpty')}</EmptyTitle>
              <EmptyDescription>{t('dashboard.mediaEmptyDesc')}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </TabsContent>
      </Tabs>
    </section>
  )
}

export default Schedule

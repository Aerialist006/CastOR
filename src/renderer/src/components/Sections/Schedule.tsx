import { useState, useCallback, useEffect } from 'react'
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
  Trash2,
  FolderOpen,
  MonitorCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { ScrollArea } from '@/components/ui/scroll-area'
import { usePresentationContext, type SceneItem, type SceneType } from '@/context/PresentationContext'
import { SongDetailPanel } from '@/components/Songs/SongDetailPanel'
import type { Presentation } from '@/types/presentation'
import { SlideDetailPanel } from '@/components/Slides/SlideDetailPanel'
import { cn } from '@/utils/utils'
import type { Song } from '@/types/song'


const sceneTypeIcons: Record<SceneType, React.ElementType> = {
  bible: BookOpen,
  slide: MonitorCheck,
  song: Music,
  note: FileText,
  announcement: Megaphone,
  media: ImageIcon
}


interface ScheduleProps {
  selectedSong?: Song | null
  selectedPresentation?: Presentation | null
  onSongClose?: () => void
  onPresentationClose?: () => void
  onSongItemClick?: (item: SceneItem) => void
  onSlideItemClick?: (item: SceneItem) => void
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
  onSongItemClick?: (item: SceneItem) => void
  onSlideItemClick?: (item: SceneItem) => void
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
  dragOverIndex,
  onSongItemClick,
  onSlideItemClick
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
      onClick={() => {
        onSelect()
        if (item.type === 'song') onSongItemClick?.(item)
        else if (item.type === 'media') onSlideItemClick?.(item)
      }}
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
      <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
        <GripVertical className="h-4 w-4" />
      </div>

      <div
        className={cn(
          'flex items-center justify-center h-6 w-6 rounded shrink-0',
          isActive ? 'bg-primary/20' : 'bg-muted'
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.title}</p>
        {item.verses && item.verses.length > 1 && (
          <p className="text-xs text-muted-foreground">
            {item.verses.length} verses
          </p>
        )}
      </div>

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


const Schedule = ({
  selectedSong,
  selectedPresentation,
  onSongClose,
  onPresentationClose,
  onSongItemClick,
  onSlideItemClick
}: ScheduleProps) => {
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

  const [tabValue, setTabValue] = useState('schedule')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Switch to media tab whenever a song or presentation is selected
  useEffect(() => {
    if (selectedSong) setTabValue('media')
  }, [selectedSong])

  useEffect(() => {
    if (selectedPresentation) setTabValue('media')
  }, [selectedPresentation])

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

  // Render the media tab body — song takes priority over presentation
  const renderMediaContent = () => {
    if (selectedSong) {
      return <SongDetailPanel song={selectedSong} onClose={() => onSongClose?.()} />
    }
    if (selectedPresentation) {
      return <SlideDetailPanel presentation={selectedPresentation} onClose={() => onPresentationClose?.()} />
    }
    return (
      <div className="flex-1 flex items-center justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Music />
            </EmptyMedia>
            <EmptyTitle>{t('dashboard.mediaEmpty')}</EmptyTitle>
            <EmptyDescription>{t('dashboard.mediaEmptyDesc')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <section className="lg:w-1/5 h-full border-b p-4 shrink-0 flex flex-col gap-3">
      <Tabs value={tabValue} onValueChange={setTabValue} className="flex flex-col flex-1 min-h-0">
        <TabsList className="w-full shrink-0">
          <TabsTrigger value="schedule" className="flex-1">
            {t('dashboard.scheduleHeader')}
          </TabsTrigger>
          <TabsTrigger value="media" className="flex-1">
            {t('dashboard.media')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="flex-1 flex flex-col min-h-0 mt-2">
          {schedule.length > 0 ? (
            <>
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
                  {t('dashboard.clear')}
                </Button>
              </div>

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
                      onSongItemClick={onSongItemClick}
                      onSlideItemClick={onSlideItemClick}
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
                  <EmptyTitle>{t('schedule.empty')}</EmptyTitle>
                  <EmptyDescription>{t('schedule.emptyDesc')}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          )}

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

        <TabsContent value="media" className="flex-1 flex min-h-0 mt-2">
          {renderMediaContent()}
        </TabsContent>
      </Tabs>
    </section>
  )
}


export default Schedule
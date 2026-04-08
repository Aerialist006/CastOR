import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Song } from '@/types/song'
import { parseSong, stripChords, buildSongGroups } from '@/utils/songParser'
import { usePresentationContext, generateId } from '@/context/PresentationContext'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { GripVertical, X, Music, Plus } from 'lucide-react'
import { cn } from '@/utils/utils'

interface SlideItem {
  id: string
  title?: string
  content: string
  flatIndex: number
}

function buildSlides(content: string): SlideItem[] {
  let flatIndex = 1
  return parseSong(content)
    .map((verse) => {
      const text = verse.lines
        .filter((l) => l.type !== 'empty')
        .map((l) => stripChords(l.content))
        .filter(Boolean)
        .join('\n')
      const displayTitle = verse.title?.startsWith('__unnamed_') ? undefined : verse.title
      return {
        id: crypto.randomUUID(),
        title: displayTitle,
        content: text,
        flatIndex: flatIndex++
      }
    })
    .filter((item) => item.content.trim() !== '')
}

interface SongDetailPanelProps {
  song: Song
  onClose: () => void
}

export function SongDetailPanel({ song, onClose }: SongDetailPanelProps) {
  const { t } = useTranslation()
  const { addToSchedule, setPreviewContent } = usePresentationContext()

  const [slides, setSlides] = useState<SlideItem[]>(() => buildSlides(song.content))
  const [activeId, setActiveId] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  useEffect(() => {
    setSlides(buildSlides(song.content))
    setActiveId(null)
  }, [song.id])

  const handlePreviewSlide = (slide: SlideItem) => {
    setActiveId(slide.id)
    setPreviewContent({
      id: generateId(),
      type: 'song',
      title: song.title,
      content: slide.content,
      showTitle: false,
      navIndex: slide.flatIndex
    })
  }

  const handleDragStart = useCallback((index: number) => setDragIndex(index), [])

  const handleDragOver = useCallback(
    (_e: React.DragEvent, index: number) => {
      if (dragIndex !== null && dragIndex !== index) setDragOverIndex(index)
    },
    [dragIndex]
  )

  const handleDrop = useCallback(
    (toIndex: number) => {
      if (dragIndex !== null && toIndex !== -1 && dragIndex !== toIndex) {
        setSlides((prev) => {
          const next = [...prev]
          const [moved] = next.splice(dragIndex, 1)
          next.splice(toIndex, 0, moved)
          return next.map((item, i) => ({ ...item, flatIndex: i + 1 }))
        })
      }
      setDragIndex(null)
      setDragOverIndex(null)
    },
    [dragIndex]
  )

  return (
    <div className="flex flex-col w-full h-full overflow-y-scroll no-scrollbar">
      {/* Header */}
      <div className="flex w-full items-start justify-between px-3 pt-3 pb-2 border-b gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Music className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{song.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {song.author} · {song.tone} · {song.bpm} BPM
            </p>
          </div>
        </div>
        <div className="items-center gap-1 shrink-0">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Slide list */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 p-2">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move'
                handleDragStart(index)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                handleDragOver(e, index)
              }}
              onDrop={(e) => {
                e.preventDefault()
                handleDrop(index)
              }}
              onDragEnd={() => handleDrop(-1)}
              onClick={() => handlePreviewSlide(slide)}
              className={cn(
                'group flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-all border',
                'border-transparent',
                activeId === slide.id
                  ? 'bg-primary/10 border-primary/50 text-primary'
                  : 'hover:bg-muted/50',
                dragIndex === index && 'opacity-50',
                dragOverIndex === index && 'border-primary border-dashed bg-primary/5'
              )}
            >
              <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100" />
              <div className="min-w-0 flex-1">
                {slide.title && (
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
                    {slide.title}
                  </p>
                )}
                <p className="text-xs whitespace-pre-wrap">{slide.content}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  addToSchedule({
                    id: generateId(),
                    type: 'song',
                    tone: song.tone,
                    originalTone: song.originalTone ?? song.tone, // 
                    songGroups: buildSongGroups(song.content), 
                    songId: song.id,
                    title: slide.title ? `${song.title} — ${slide.title}` : song.title,
                    content: slide.content
                  })
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

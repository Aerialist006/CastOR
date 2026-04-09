import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Presentation } from '@/types/presentation'
import { usePresentationContext } from '@/context/PresentationContext'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MonitorPlay, Plus, X } from 'lucide-react'
import { cn } from '@/utils/utils'
import { makePresentationSceneItem } from '@/utils/presentationPreview'

interface SlideDetailPanelProps {
  presentation: Presentation
  onClose: () => void
}

export function SlideDetailPanel({ presentation, onClose }: SlideDetailPanelProps) {
  const { t } = useTranslation()
  const { addToSchedule, setPreviewContent } = usePresentationContext()
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    setActiveId(null)
  }, [presentation.id])

  const handlePreviewSlide = (slideIndex: number) => {
    const slide = presentation.slides[slideIndex]
    if (!slide) return
    setActiveId(slide.id)
    setPreviewContent(makePresentationSceneItem(presentation, slide))
  }

  return (
    <div className="flex flex-col w-full h-full overflow-y-scroll no-scrollbar">
      <div className="flex w-full items-start justify-between px-3 pt-3 pb-2 border-b gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <MonitorPlay className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{presentation.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {presentation.fileName} · {presentation.fileType.toUpperCase()} · {presentation.slideCount} slides
            </p>
          </div>
        </div>

        <div className="items-center gap-1 shrink-0">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-2">
          {presentation.slides.map((slide) => (
            <div
              key={slide.id}
              onClick={() => handlePreviewSlide(slide.index)}
              className={cn(
                'group flex items-start gap-2 px-2 py-2 rounded-md cursor-pointer transition-all border',
                'border-transparent',
                activeId === slide.id
                  ? 'bg-primary/10 border-primary/50 text-primary'
                  : 'hover:bg-muted/50'
              )}
            >
              <div className="w-28 aspect-video rounded overflow-hidden border bg-muted/30 shrink-0">
                {slide.thumbnailUrl ? (
                  <img
                    src={slide.thumbnailUrl}
                    alt={`${presentation.title} slide ${slide.index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                    {slide.index + 1}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
                  {t('slide.slide', 'Slide')} {slide.index + 1}
                </p>
                <p className="text-xs line-clamp-4 whitespace-pre-wrap">
                  {slide.text || t('slide.noText', 'No extracted text')}
                </p>
              </div>

              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  addToSchedule(makePresentationSceneItem(presentation, slide))
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
import type { Presentation } from '@/types/presentation'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useTranslation } from 'react-i18next'

interface SlideCardProps {
  presentation: Presentation
  onAddToSchedule: (presentation: Presentation) => void
  onOpen: (presentation: Presentation) => void
  onDelete: (presentation: Presentation) => void
}

export function SlideCard({
  presentation,
  onAddToSchedule,
  onOpen,
  onDelete
}: SlideCardProps) {
  const { t } = useTranslation()

  return (
    <div
      className="group relative rounded-md border bg-card p-3 cursor-pointer hover:bg-accent/50 transition-colors select-none"
      onDoubleClick={() => onOpen(presentation)}
    >
      <TooltipProvider delayDuration={300}>
        <div className="absolute top-1.5 right-1.5 hidden group-hover:flex gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddToSchedule(presentation)
                }}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('slide.addToSchedule', 'Add to schedule')}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(presentation)
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('common.delete', 'Delete')}</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <div className="aspect-video rounded border bg-muted/40 overflow-hidden mb-2 flex items-center justify-center">
        {presentation.slides[0]?.thumbnailUrl ? (
          <img
            src={presentation.slides[0].thumbnailUrl}
            alt={presentation.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs text-muted-foreground">{presentation.fileType.toUpperCase()}</span>
        )}
      </div>

      <p className="font-medium text-sm truncate pr-14">{presentation.title}</p>
      <p className="text-xs text-muted-foreground truncate">{presentation.fileName}</p>
      <p className="text-xs text-muted-foreground">
        {presentation.fileType.toUpperCase()} · {presentation.slideCount} slides
      </p>
    </div>
  )
}
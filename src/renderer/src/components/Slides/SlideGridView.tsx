import type { Presentation } from '@/types/presentation'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MonitorPlay } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SlideCard } from './SlideCard'

interface SlideGridViewProps {
  presentations: Presentation[]
  search: string
  onAddToSchedule: (presentation: Presentation) => void
  onOpen: (presentation: Presentation) => void
  onDelete: (presentation: Presentation) => void
}

export function SlideGridView({
  presentations,
  search,
  onAddToSchedule,
  onOpen,
  onDelete
}: SlideGridViewProps) {
  const { t } = useTranslation()

  const filtered = presentations.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.fileName.toLowerCase().includes(search.toLowerCase())
  )

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground gap-2 py-8">
        <MonitorPlay className="h-8 w-8 opacity-30" />
        <p className="text-xs">{search ? t('slide.noResults', 'No results') : t('slide.empty', 'No presentations yet')}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0">
      <ScrollArea className="h-full">
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 p-1 pr-3">
          {filtered.map((presentation) => (
            <SlideCard
              key={presentation.id}
              presentation={presentation}
              onAddToSchedule={onAddToSchedule}
              onOpen={onOpen}
              onDelete={onDelete}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
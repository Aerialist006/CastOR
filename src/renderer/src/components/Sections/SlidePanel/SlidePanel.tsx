import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Input } from '@/components/ui/input'
import { LayoutGrid, List, Plus, Search } from 'lucide-react'
import type { Presentation } from '@/types/presentation'
import { SlideGridView } from '@/components/Slides/SlideGridView'
import { SlideListView } from '@/components/Slides/SlideListView'

interface SlidesPanelProps {
  presentations: Presentation[]
  onImport: (files: FileList) => void
  onAddToSchedule: (presentation: Presentation) => void
  onOpen: (presentation: Presentation) => void
  onDelete: (presentation: Presentation) => void
}

export function SlidesPanel({
  presentations,
  onImport,
  onAddToSchedule,
  onOpen,
  onDelete
}: SlidesPanelProps) {
  const { t } = useTranslation()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  return (
    <div className="mt-0 w-full p-2 self-stretch flex flex-col gap-2 min-w-0 h-full">
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <span className="uppercase text-muted-foreground text-xs tracking-wide">
          {t('dashboard.slideHeader', 'Presentations')}
        </span>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              className="pl-7 h-7 w-36 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('slide.search', 'Search presentations')}
            />
          </div>

          <input
            ref={inputRef}
            type="file"
            hidden
            accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            onChange={(e) => {
              if (e.target.files?.length) onImport(e.target.files)
              e.target.value = ''
            }}
          />

          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={() => inputRef.current?.click()}
          >
            <Plus className="h-3.5 w-3.5" />
            {t('dashboard.slideButton', 'Import')}
          </Button>

          <ButtonGroup>
            <Button
              variant={view === 'list' ? 'default' : 'outline'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setView('list')}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={view === 'grid' ? 'default' : 'outline'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setView('grid')}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
          </ButtonGroup>
        </div>
      </div>

      {view === 'grid' ? (
        <SlideGridView
          presentations={presentations}
          search={search}
          onAddToSchedule={onAddToSchedule}
          onOpen={onOpen}
          onDelete={onDelete}
        />
      ) : (
        <SlideListView
          presentations={presentations}
          search={search}
          onAddToSchedule={onAddToSchedule}
          onOpen={onOpen}
          onDelete={onDelete}
        />
      )}
    </div>
  )
}
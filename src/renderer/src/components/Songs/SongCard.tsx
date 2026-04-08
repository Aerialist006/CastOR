import { Song } from '@/types/song'
import { Eye, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useTranslation } from 'react-i18next'

interface SongCardProps {
  song: Song
  onPreview: (song: Song) => void
  onAddToSchedule: (song: Song) => void
  onDoubleClick: (song: Song) => void
}

export function SongCard({ song, onPreview, onAddToSchedule, onDoubleClick }: SongCardProps) {
  const { t } = useTranslation()

  return (
    <div
      className="group relative rounded-md border bg-card p-3 cursor-pointer hover:bg-accent/50 transition-colors select-none"
      onDoubleClick={() => onDoubleClick(song)}
    >
      <TooltipProvider delayDuration={300}>
        <div className="absolute top-1.5 right-1.5 hidden group-hover:flex gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={e => { e.stopPropagation(); onAddToSchedule(song) }}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('song.addToSchedule')}</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <p className="font-medium text-sm truncate pr-14">{song.title}</p>
      <p className="text-xs text-muted-foreground truncate">{song.author || '—'}</p>
      <p className="text-xs text-muted-foreground">{song.tone} · {song.bpm} BPM</p>
    </div>
  )
}
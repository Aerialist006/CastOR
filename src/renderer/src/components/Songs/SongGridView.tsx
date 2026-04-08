import { Song } from '@/types/song'
import { SongCard } from './SongCard'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useTranslation } from 'react-i18next'
import { Music } from 'lucide-react'

interface SongGridViewProps {
  songs: Song[]
  search: string
  onPreview: (song: Song) => void
  onAddToSchedule: (song: Song) => void
  onEdit: (song: Song) => void
}

export function SongGridView({
  songs,
  search,
  onPreview,
  onAddToSchedule,
  onEdit
}: SongGridViewProps) {
  const { t } = useTranslation()

  const filtered = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.author?.toLowerCase().includes(search.toLowerCase())
  )

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground gap-2 py-8">
        <Music className="h-8 w-8 opacity-30" />
        <p className="text-xs">{search ? t('song.noResults') : t('song.empty')}</p>
      </div>
    )
  }

  return (
    <div className="flex-1 min-h-0">
      <ScrollArea className="h-full">
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 p-1 pr-3">
          {filtered.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              onPreview={onPreview}
              onAddToSchedule={onAddToSchedule}
              onDoubleClick={onEdit}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

import Preview from '@/components/Sections/Preview'
import Schedule from '@/components/Sections/Schedule'
import { BiblePanel } from '@/components/BiblePanel/BiblePanel'
import { useTranslation } from 'react-i18next'
import { SongModal } from '@/components/Songs/SongModal'
import { SongGridView } from '@/components/Songs/SongGridView'
import { SongListView } from '@/components/Songs/SongListView'
import { useSongs } from '@/hooks/useSongs'
import { usePresentationContext, generateId, SceneItem } from '@/context/PresentationContext'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ButtonGroup } from '@/components/ui/button-group'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  LayoutGrid,
  Music,
  List,
  MonitorPlay,
  Clapperboard,
  Wallpaper,
  ScrollText,
  NotebookPen,
  Plus,
  Search
} from 'lucide-react'
import { useState } from 'react'
import type { Song } from '@/types/song'
import { groupVerses, buildSongGroups } from '@/utils/songParser'

const mediaTabs = [
  { value: 'music', icon: Music, labelKey: 'dashboard.song' },
  { value: 'slides', icon: MonitorPlay, labelKey: 'dashboard.slide' },
  { value: 'videos', icon: Clapperboard, labelKey: 'dashboard.video' },
  { value: 'background', icon: Wallpaper, labelKey: 'dashboard.background' },
  { value: 'notes', icon: NotebookPen, labelKey: 'dashboard.note' },
  { value: 'announcements', icon: ScrollText, labelKey: 'dashboard.announcement' }
]

const Dashboard = () => {
  const { t } = useTranslation()
  const { songs, addSong, updateSong } = useSongs()
  const { addToSchedule, setPreviewContent } = usePresentationContext()

  const [songModalOpen, setSongModalOpen] = useState(false)
  const [editingSong, setEditingSong] = useState<Song | null>(null)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [selectedSong, setSelectedSong] = useState<Song | null>(null)

  const handleSongPreview = (song: Song) => {
    const verses = groupVerses(song.content)
    if (verses.length > 0) {
      setPreviewContent({
        id: generateId(),
        type: 'song',
        title: song.title,
        content: verses[0].content
      })
    }
    setSelectedSong(song)
  }

  const handleAddToSchedule = (song: Song) => {
    const groups = buildSongGroups(song.content)
    addToSchedule({
      id: generateId(),
      type: 'song',
      title: song.title,
      subtitle: song.author,
      content: groups[0]?.slides[0]?.text ?? '',
      songId: song.id,
      songGroups: groups
    })
  }

  const handleScheduleItemClick = (item: SceneItem) => {
    if (item.type === 'song' && item.songId) {
      const song = songs.find((s) => s.id === item.songId)
      if (song) setSelectedSong(song)
    }
  }

  const handleEdit = (song: Song) => {
    setEditingSong(song)
    setSongModalOpen(true)
  }

  return (
    <div className="flex flex-col w-full h-full text-sm">
      <div className="w-full flex flex-1 min-h-0">
        <Preview />
        <Schedule
          selectedSong={selectedSong}
          onSongClose={() => setSelectedSong(null)}
          onSongItemClick={handleScheduleItemClick}
        />
      </div>

      <section className="lg:h-1/3 border-b gap-3 flex shrink-0">
        <div className="border-r lg:w-1/3">
          <BiblePanel />
        </div>
        <div className="w-full py-2 pr-2 min-w-0">
          <Tabs
            defaultValue="music"
            orientation="vertical"
            className="h-full w-full flex items-center"
          >
            <TooltipProvider delayDuration={300}>
              <TabsList className="h-full self-center">
                {mediaTabs.map(({ value, icon: Icon, labelKey }) => (
                  <Tooltip key={value}>
                    <TabsTrigger value={value}>
                      <TooltipTrigger asChild>
                        <div className="w-6 h-8 flex flex-col items-center justify-center">
                          <Icon />
                        </div>
                      </TooltipTrigger>
                    </TabsTrigger>
                    <TooltipContent side="right">{t(labelKey)}</TooltipContent>
                  </Tooltip>
                ))}
              </TabsList>
            </TooltipProvider>

            <TabsContent
              value="music"
              className="mt-0 w-full p-2 self-stretch flex flex-col gap-2 min-w-0"
            >
              {/* Toolbar */}
              <div className="flex justify-between items-center gap-2 flex-wrap">
                <span className="uppercase text-muted-foreground text-xs tracking-wide">
                  {t('dashboard.songHeader')}
                </span>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      className="pl-7 h-7 w-36 text-xs"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t('song.search')}
                    />
                  </div>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setEditingSong(null)
                      setSongModalOpen(true)
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {t('dashboard.songButton')}
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

              {/* View */}
              {view === 'grid' ? (
                <SongGridView
                  songs={songs}
                  search={search}
                  onPreview={handleSongPreview}
                  onAddToSchedule={handleAddToSchedule}
                  onEdit={handleEdit}
                />
              ) : (
                <SongListView
                  songs={songs}
                  search={search}
                  onPreview={handleSongPreview}
                  onAddToSchedule={handleAddToSchedule}
                  onEdit={handleEdit}
                />
              )}
            </TabsContent>

            <TabsContent value="slides" className="mt-0 p-2 self-stretch" />
            <TabsContent value="videos" className="mt-0 p-2 self-stretch" />
            <TabsContent value="background" className="mt-0 p-2 self-stretch" />
            <TabsContent value="notes" className="mt-0 p-2 self-stretch" />
            <TabsContent value="announcements" className="mt-0 p-2 self-stretch" />
          </Tabs>
        </div>
      </section>

      <SongModal
        key={editingSong?.id ?? 'new'} // ← ADD THIS
        open={songModalOpen}
        onClose={() => {
          setSongModalOpen(false)
          setEditingSong(null)
        }}
        onSave={(song) => (editingSong ? updateSong(song) : addSong(song))}
        initial={editingSong ?? undefined}
      />
    </div>
  )
}

export default Dashboard

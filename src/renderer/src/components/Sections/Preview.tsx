import { useTranslation } from 'react-i18next'
import { useEffect, useState, useCallback } from 'react'
import { usePresentationContext, generateId } from '@/context/PresentationContext'
import type { SceneItem } from '@/context/PresentationContext'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Play, Square, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/utils/utils'
import { useBibleContext } from '@/context/BibleContext'
import { CastPreview } from '../CastPreview'
import type { SongVerseGroup } from '@/types/song'

// ── Song nav types ──────────────────────────────────────────────────────────

interface FlatSlide {
  content: string
  groupTitle?: string
  flatIndex: number // 0 = intro, 1+ = actual verse slides
  isIntro: boolean
}

interface SongNavState {
  sceneId: string
  title: string
  author: string
  flatSlides: FlatSlide[]
  cursor: number
}

function flattenGroups(groups: SongVerseGroup[]): FlatSlide[] {
  const slides: FlatSlide[] = [{ content: '', flatIndex: 0, isIntro: true }]
  let idx = 1
  for (const group of groups) {
    for (const slide of group.slides) {
      slides.push({
        content: slide.text,
        groupTitle: group.title,
        flatIndex: idx++,
        isIntro: false
      })
    }
  }
  return slides
}

function makeSongItem(
  slide: FlatSlide,
  title: string,
  author: string,
  navIndex: number
): SceneItem {
  return {
    id: generateId(),
    type: 'song',
    title,
    subtitle: slide.isIntro ? author : undefined,
    content: slide.isIntro ? '' : slide.content,
    showTitle: slide.isIntro,
    navIndex
  }
}

// ── Component ───────────────────────────────────────────────────────────────

const Preview = () => {
  const { config } = useBibleContext()
  const { t } = useTranslation()
  const {
    previewContent,
    liveContent,
    goLive,
    clearLive,
    castWindowOpen,
    setPreviewContent,
    schedule,
    currentSceneIndex
  } = usePresentationContext()

  const [songNav, setSongNav] = useState<SongNavState | null>(null)

  // Broadcast live content to cast window
  useEffect(() => {
    if (liveContent) {
      window.api?.broadcastLiveContent?.({ content: liveContent, config })
    }
  }, [liveContent, config])

  // Init song navigation when a song scene is selected from schedule
  useEffect(() => {
    const scene = schedule[currentSceneIndex ?? -1]

    if (!scene || scene.type !== 'song') {
      setSongNav(null)
      return
    }
    if (songNav?.sceneId === scene.id) return // already tracking

    const groups: SongVerseGroup[] = scene.songGroups ?? []
    const flatSlides = flattenGroups(groups)
    const nav: SongNavState = {
      sceneId: scene.id,
      title: scene.title,
      author: scene.subtitle ?? '',
      flatSlides,
      cursor: 0
    }
    setSongNav(nav)
    setPreviewContent(makeSongItem(flatSlides[0], nav.title, nav.author, 0))
  }, [currentSceneIndex, schedule])

  // Sync cursor when SongDetailPanel jumps to a verse via navIndex
  useEffect(() => {
    if (!previewContent || previewContent.type !== 'song') return
    if (!songNav) return
    const navIndex = previewContent.navIndex
    if (navIndex !== undefined && navIndex !== songNav.cursor) {
      setSongNav((prev) => (prev ? { ...prev, cursor: navIndex } : null))
    }
  }, [previewContent?.id])

  // ── Navigation ────────────────────────────────────────────────────────────

  const handleNext = useCallback(() => {
    if (!songNav) {
      goLive()
      return
    }
    const { flatSlides, cursor, title, author } = songNav
    if (cursor >= flatSlides.length - 1) return

    goLive()
    const next = cursor + 1
    setSongNav((prev) => (prev ? { ...prev, cursor: next } : null))
    setPreviewContent(makeSongItem(flatSlides[next], title, author, next))
  }, [songNav, goLive, setPreviewContent])

  const handlePrev = useCallback(() => {
    if (!songNav) return
    const { flatSlides, cursor, title, author } = songNav
    if (cursor <= 0) return

    const prev = cursor - 1
    setSongNav((p) => (p ? { ...p, cursor: prev } : null))
    setPreviewContent(makeSongItem(flatSlides[prev], title, author, prev))
  }, [songNav, setPreviewContent])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return

      if (['ArrowRight', 'ArrowDown', 'PageDown'].includes(e.key)) {
        e.preventDefault()
        handleNext()
      }
      if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault()
        handlePrev()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleNext, handlePrev])

  // ── Derived UI state ──────────────────────────────────────────────────────

  const isSongActive = songNav !== null
  const currentSlide = songNav?.flatSlides[songNav.cursor]
  const isAtEnd = isSongActive && songNav.cursor >= songNav.flatSlides.length - 1
  const isAtStart = isSongActive && songNav.cursor <= 0

  const slideLabel = !currentSlide
    ? ''
    : currentSlide.isIntro
      ? t('song.intro', 'Intro')
      : currentSlide.groupTitle
        ? `${currentSlide.groupTitle}  ·  ${songNav!.cursor} / ${songNav!.flatSlides.length - 1}`
        : `${t('song.slide', 'Slide')} ${songNav!.cursor} / ${songNav!.flatSlides.length - 1}`

  return (
    <section className="flex-1 border-b border-r p-4 h-full flex gap-4 overflow-hidden min-w-0">
      {/* ── Live Screen ── */}
      <div className="flex-3 min-w-0 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="uppercase text-lg font-bold text-red-500 flex items-center gap-2">
            <div
              className={cn(
                'h-2 w-2 rounded-full',
                liveContent ? 'bg-red-500 animate-pulse' : 'bg-red-500/30'
              )}
            />
            {t('dashboard.live')}
          </span>
          <div className="flex items-center gap-2">
            {castWindowOpen && (
              <span className="text-xs text-green-500 flex items-center gap-1">
                <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
                Casting
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={clearLive}
              disabled={!liveContent}
            >
              <Square className="h-3 w-3 mr-1" />
              {t('dashboard.clear')}
            </Button>
          </div>
        </div>
        <CastPreview content={liveContent} config={config} isLive />
      </div>

      {/* ── Preview Screen ── */}
      <div className="flex-2 min-w-0 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="uppercase text-lg text-muted-foreground font-semibold">
            {t('dashboard.preview')}
          </span>
          {!isSongActive && (
            <Button
              variant="default"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={goLive}
              disabled={!previewContent}
            >
              <Play className="h-3 w-3" />
              {t('dashboard.goLive')}
            </Button>
          )}
        </div>

        <CastPreview content={previewContent} config={config} />

        {/* Bible verse chips */}
        {!isSongActive && previewContent?.verses && previewContent.verses.length > 1 && (
          <div className="p-2 bg-muted/50 rounded-md">
            <p className="text-xs text-muted-foreground mb-1">Verses in this selection:</p>
            <div className="flex flex-wrap gap-1">
              {previewContent.verses.map((v) => (
                <span
                  key={`${v.book}-${v.chapter}-${v.verse}`}
                  className="text-xs px-1.5 py-0.5 bg-background rounded border"
                >
                  v.{v.verse}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Song navigation controls */}
        {isSongActive && (
          <TooltipProvider delayDuration={400}>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={handlePrev}
                    disabled={isAtStart}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="flex items-center gap-1.5">
                  {t('song.prev', 'Previous')}
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px] font-mono">
                    ←
                  </kbd>
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px] font-mono">
                    ↑
                  </kbd>
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px] font-mono">
                    PgUp
                  </kbd>
                </TooltipContent>
              </Tooltip>

              <p className="flex-1 text-center text-xs text-muted-foreground truncate">
                {slideLabel}
              </p>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isAtEnd ? 'outline' : 'default'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={handleNext}
                    disabled={isAtEnd}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="flex items-center gap-1.5">
                  {t('song.next', 'Next')}
                  <Kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px] font-mono">
                    →
                  </Kbd>
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px] font-mono">
                    ↓
                  </kbd>
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px] font-mono">
                    PgDn
                  </kbd>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        )}
      </div>
    </section>
  )
}

export default Preview

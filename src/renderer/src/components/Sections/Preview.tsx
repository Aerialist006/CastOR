import { useTranslation } from 'react-i18next'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { usePresentationContext, generateId } from '@/context/PresentationContext'
import type { SceneItem } from '@/context/PresentationContext'
import { Button } from '@/components/ui/button'
import { MonitorOff, Play } from 'lucide-react'
import { cn } from '@/utils/utils'
import { useBibleContext } from '@/context/BibleContext'
import { CastPreview } from '../CastPreview'
import type { SongVerseGroup } from '@/types/song'
import type { VerseData } from '@/types/bible'
import { BibleTopPanel } from '../Panels/BibleTopPanel'
import { SongTopPanel } from '../Panels/SongTopPanel'
import { SongBottomPanel } from '../Panels/SongBottomPanel'
import { BibleBottomPanel } from '../Panels/BibleBottomPanel'
import { FoldbackPreview } from '@/components/FoldbackPreview'
import type { FoldbackPayload, FoldbackVerseInfo } from '@/types/foldback'
import { transposeSongContent } from '@/utils/chordTransposer'

// ── Song nav types ──────────────────────────────────────────────────────────

interface FlatSlide {
  content: string
  rawLines: string[]
  groupTitle?: string
  flatIndex: number
  isIntro: boolean
}

interface SongNavState {
  sceneId: string
  title: string
  author: string
  tone: string
  flatSlides: FlatSlide[]
  cursor: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function flattenGroups(groups: SongVerseGroup[]): FlatSlide[] {
  const slides: FlatSlide[] = [{ content: '', rawLines: [], flatIndex: 0, isIntro: true }]
  let idx = 1
  for (const group of groups) {
    for (const slide of group.slides) {
      slides.push({
        content: slide.text,
        rawLines: (slide.rawText ?? slide.text).split('\n'),
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

function makeBibleItem(verse: VerseData): SceneItem {
  return {
    id: generateId(),
    type: 'bible',
    title: `${verse.book} ${verse.chapter}:${verse.verse}`,
    content: verse.text,
    verses: [verse]
  }
}

function slideToFoldbackInfo(
  slide: FlatSlide | undefined,
  songTitle: string
): FoldbackVerseInfo | null {
  if (!slide) return null
  if (slide.isIntro) return { type: 'song', verseTitle: songTitle, rawLines: [], cleanText: '' }
  return {
    type: 'song',
    verseTitle: slide.groupTitle,
    rawLines: slide.rawLines,
    cleanText: slide.content
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

const Preview = () => {
  const { config, activeBible } = useBibleContext()
  const { t } = useTranslation()
  const {
    previewContent,
    liveContent,
    goLive,
    clearLive,
    castWindowOpen,
    foldbackWindowOpen,
    setPreviewContent,
    setLiveContent,
    schedule,
    currentSceneIndex,
    broadcastFoldbackContent
  } = usePresentationContext()

  const [songNav, setSongNav] = useState<SongNavState | null>(null)
  const [liveCanvasW, setLiveCanvasW] = useState<number | undefined>(undefined)

  // ── Broadcast live to cast window ─────────────────────────────────────────
  useEffect(() => {
    if (liveContent) {
      window.api?.broadcastLiveContent?.({ content: liveContent, config })
    }
  }, [liveContent, config])

  // ── Bible foldback on live change ─────────────────────────────────────────
  useEffect(() => {
    if (!liveContent || liveContent.type !== 'bible') return
    const verse = liveContent.verses?.[0]
    const nextVerse = previewContent?.type === 'bible' ? previewContent.verses?.[0] : null

    broadcastFoldbackContent({
      current: {
        type: 'bible',
        reference: verse ? `${verse.book} ${verse.chapter}:${verse.verse}` : liveContent.title,
        cleanText: liveContent.content ?? '',
        rawLines: [liveContent.content ?? ''],
        verseTitle: liveContent.title
      },
      next: nextVerse
        ? {
            type: 'bible',
            reference: `${nextVerse.book} ${nextVerse.chapter}:${nextVerse.verse}`,
            cleanText: previewContent!.content ?? '',
            rawLines: [previewContent!.content ?? ''],
            verseTitle: previewContent!.title
          }
        : null
    })
  }, [liveContent?.id])

  // ── Init song nav on schedule selection ──────────────────────────────────
  useEffect(() => {
    const scene = schedule[currentSceneIndex ?? -1]
    if (!scene || scene.type !== 'song') {
      setSongNav(null)
      return
    }
    if (songNav?.sceneId === scene.id) return

    const originalTone = (scene as any).originalTone ?? (scene as any).tone ?? 'C'
    const currentTone = (scene as any).tone ?? 'C'
    const baseGroups: SongVerseGroup[] = (scene as any).songGroups ?? []

    // Only rewrite rawText tokens if the keys actually differ
    const groups: SongVerseGroup[] =
      originalTone !== currentTone
        ? baseGroups.map((group) => ({
            ...group,
            slides: group.slides.map((slide) => ({
              ...slide,
              rawText: transposeSongContent(slide.rawText ?? slide.text, originalTone, currentTone)
            }))
          }))
        : baseGroups

    const flatSlides = flattenGroups(groups)
    const nav: SongNavState = {
      sceneId: scene.id,
      title: scene.title,
      author: scene.subtitle ?? '',
      tone: scene.tone ?? '',
      flatSlides,
      cursor: 0
    }
    setSongNav(nav)
    setPreviewContent(makeSongItem(flatSlides[0], nav.title, nav.author, 0))
    broadcastFoldbackContent({
      current: slideToFoldbackInfo(flatSlides[0], nav.title),
      next: slideToFoldbackInfo(flatSlides[1], nav.title)
    })
  }, [currentSceneIndex, schedule])

  // ── Sync cursor on navIndex jump ──────────────────────────────────────────
  useEffect(() => {
    if (!previewContent || previewContent.type !== 'song') return
    if (!songNav) return
    const navIndex = previewContent.navIndex
    if (navIndex !== undefined && navIndex !== songNav.cursor) {
      const slide = songNav.flatSlides[navIndex]
      if (slide) {
        setSongNav((prev) => (prev ? { ...prev, cursor: navIndex } : null))
        setPreviewContent(makeSongItem(slide, songNav.title, songNav.author, navIndex))
      }
    }
  }, [previewContent?.id])

  // ── Foldback broadcast helper ─────────────────────────────────────────────
  const broadcastFoldback = useCallback(
    (cursor: number) => {
      if (!songNav) return
      broadcastFoldbackContent({
        current: slideToFoldbackInfo(songNav.flatSlides[cursor], songNav.title),
        next: slideToFoldbackInfo(songNav.flatSlides[cursor + 1], songNav.title)
      })
    },
    [songNav, broadcastFoldbackContent]
  )

  // ── Song navigation ───────────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (!songNav) {
      goLive()
      return
    }
    const { flatSlides, cursor, title, author } = songNav
    const lastIdx = flatSlides.length - 1

    if (cursor < lastIdx) {
      goLive()
      const next = cursor + 1
      setSongNav((prev) => (prev ? { ...prev, cursor: next } : null))
      setPreviewContent(makeSongItem(flatSlides[next], title, author, next))
      broadcastFoldback(cursor)
    } else if (cursor === lastIdx) {
      goLive()
      setSongNav((prev) => (prev ? { ...prev, cursor: lastIdx + 1 } : null))
      setPreviewContent(null)
      broadcastFoldbackContent({ current: null, next: null })
    } else if (cursor === lastIdx + 1) {
      clearLive()
      setSongNav((prev) => (prev ? { ...prev, cursor: lastIdx + 2 } : null))
      broadcastFoldbackContent({ current: null, next: null })
    }
  }, [songNav, goLive, clearLive, setPreviewContent, broadcastFoldback, broadcastFoldbackContent])

  const handlePrev = useCallback(() => {
    if (!songNav) return
    const { flatSlides, cursor, title, author } = songNav
    const lastIdx = flatSlides.length - 1

    if (cursor > lastIdx) {
      const item = makeSongItem(flatSlides[lastIdx], title, author, lastIdx)
      setSongNav((p) => (p ? { ...p, cursor: lastIdx } : null))
      setPreviewContent(item)
      setLiveContent?.(item)
      broadcastFoldback(lastIdx)
      return
    }
    if (cursor <= 0) return

    const prev = cursor - 1
    const prevPreview = makeSongItem(flatSlides[prev], title, author, prev)
    const prevLiveIdx = Math.max(prev - 1, 0)
    const prevLive = makeSongItem(flatSlides[prevLiveIdx], title, author, prevLiveIdx)
    setSongNav((p) => (p ? { ...p, cursor: prev } : null))
    setPreviewContent(prevPreview)
    setLiveContent?.(prevLive)
    broadcastFoldback(prevLiveIdx)
  }, [songNav, setPreviewContent, setLiveContent, broadcastFoldback])

  const handleHome = useCallback(() => {
    if (!songNav) return
    const item = makeSongItem(songNav.flatSlides[0], songNav.title, songNav.author, 0)
    setSongNav((p) => (p ? { ...p, cursor: 0 } : null))
    setPreviewContent(item)
    setLiveContent?.(item)
    broadcastFoldback(0)
  }, [songNav, setPreviewContent, setLiveContent, broadcastFoldback])

  const handleFirstVerse = useCallback(() => {
    if (!songNav || songNav.flatSlides.length < 2) return
    const item = makeSongItem(songNav.flatSlides[1], songNav.title, songNav.author, 1)
    setSongNav((p) => (p ? { ...p, cursor: 1 } : null))
    setPreviewContent(item)
    setLiveContent?.(item)
    broadcastFoldback(1)
  }, [songNav, setPreviewContent, setLiveContent, broadcastFoldback])

  const handlePresentPreview = useCallback(() => goLive(), [goLive])

  // ── Bible navigation ──────────────────────────────────────────────────────
  const handleBibleNext = useCallback(() => {
    if (!previewContent || !activeBible) return
    const verse = previewContent.verses?.[0]
    if (!verse) return

    // Go live with whatever is currently in preview
    goLive()

    // Load next verse into preview
    const bookData = activeBible.books.get(verse.book)
    const chData = bookData?.chapters.get(verse.chapter)
    if (!bookData || !chData) return

    let nextChapter = verse.chapter
    let nextVerse = verse.verse + 1

    if (nextVerse > chData.verseCount) {
      if (verse.chapter >= bookData.chapterCount) {
        // End of book — clear preview
        setPreviewContent(null)
        return
      }
      nextChapter = verse.chapter + 1
      nextVerse = 1
    }

    const text = activeBible.books.get(verse.book)?.chapters.get(nextChapter)?.verses.get(nextVerse)
    if (!text) return

    setPreviewContent(
      makeBibleItem({ book: verse.book, chapter: nextChapter, verse: nextVerse, text })
    )
  }, [previewContent, activeBible, goLive, setPreviewContent])

  const handleBiblePrev = useCallback(() => {
    if (!previewContent || !activeBible) return
    const verse = previewContent.verses?.[0]
    if (!verse) return

    // Step preview back one verse
    let prevChapter = verse.chapter
    let prevVerse = verse.verse - 1

    if (prevVerse < 1) {
      if (verse.chapter <= 1) return
      prevChapter = verse.chapter - 1
      const chData = activeBible.books.get(verse.book)?.chapters.get(prevChapter)
      if (!chData) return
      prevVerse = chData.verseCount
    }

    const prevText = activeBible.books
      .get(verse.book)
      ?.chapters.get(prevChapter)
      ?.verses.get(prevVerse)
    if (!prevText) return

    const prevItem = makeBibleItem({
      book: verse.book,
      chapter: prevChapter,
      verse: prevVerse,
      text: prevText
    })

    // Also step live back one verse (mirror song behaviour)
    const liveVerse = liveContent?.verses?.[0]
    if (liveVerse) {
      let prevLiveChapter = liveVerse.chapter
      let prevLiveVerse = liveVerse.verse - 1

      if (prevLiveVerse < 1) {
        if (liveVerse.chapter > 1) {
          prevLiveChapter = liveVerse.chapter - 1
          const chData = activeBible.books.get(liveVerse.book)?.chapters.get(prevLiveChapter)
          if (chData) {
            prevLiveVerse = chData.verseCount
            const liveText = activeBible.books
              .get(liveVerse.book)
              ?.chapters.get(prevLiveChapter)
              ?.verses.get(prevLiveVerse)
            if (liveText)
              setLiveContent(
                makeBibleItem({
                  book: liveVerse.book,
                  chapter: prevLiveChapter,
                  verse: prevLiveVerse,
                  text: liveText
                })
              )
          }
        }
      } else {
        const liveText = activeBible.books
          .get(liveVerse.book)
          ?.chapters.get(prevLiveChapter)
          ?.verses.get(prevLiveVerse)
        if (liveText)
          setLiveContent(
            makeBibleItem({
              book: liveVerse.book,
              chapter: prevLiveChapter,
              verse: prevLiveVerse,
              text: liveText
            })
          )
      }
    }

    setPreviewContent(prevItem)
  }, [previewContent, liveContent, activeBible, setPreviewContent, setLiveContent])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
      if (['ArrowRight', 'ArrowDown', 'PageDown'].includes(e.key)) {
        e.preventDefault()
        if (isSongActive) handleNext()
        else if (isBibleActive) handleBibleNext()
      }
      if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault()
        if (isSongActive) handlePrev()
        else if (isBibleActive) handleBiblePrev()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleNext, handlePrev, handleBibleNext, handleBiblePrev])

  // ── Derived UI state ──────────────────────────────────────────────────────
  const isSongActive = songNav !== null
  const isBibleActive = !isSongActive && previewContent?.type === 'bible'
  const currentSlide = songNav?.flatSlides[songNav.cursor]
  const isAtEnd = isSongActive && songNav.cursor >= songNav.flatSlides.length - 1
  const isAtStart = isSongActive && songNav.cursor <= 0

  const slideLabel = !currentSlide
    ? isSongActive && songNav.cursor === songNav.flatSlides.length
      ? t('song.finishing', 'Finishing...')
      : isSongActive && songNav.cursor > songNav.flatSlides.length
        ? t('song.done', 'Done')
        : ''
    : currentSlide.isIntro
      ? t('song.intro', 'Intro')
      : currentSlide.groupTitle
        ? `${currentSlide.groupTitle}  ·  ${songNav!.cursor} / ${songNav!.flatSlides.length - 1}`
        : `${t('song.slide', 'Slide')} ${songNav!.cursor} / ${songNav!.flatSlides.length - 1}`

  const bibleVerse = isBibleActive ? previewContent?.verses?.[0] : null

  const bibleIsAtStart = useMemo(() => {
    if (!bibleVerse) return true
    return bibleVerse.chapter === 1 && bibleVerse.verse === 1
  }, [bibleVerse])

  const bibleIsAtEnd = useMemo(() => {
    if (!bibleVerse || !activeBible) return true
    const bookData = activeBible.books.get(bibleVerse.book)
    if (!bookData) return true
    const chData = bookData.chapters.get(bibleVerse.chapter)
    if (!chData) return true
    return bibleVerse.chapter === bookData.chapterCount && bibleVerse.verse === chData.verseCount
  }, [bibleVerse, activeBible])

  const verseLabel = bibleVerse
    ? `${bibleVerse.book} ${bibleVerse.chapter}:${bibleVerse.verse}`
    : ''

  // ── Foldback stage monitor payload ────────────────────────────────────────
  const stageMonitorPayload = useMemo<FoldbackPayload | null>(() => {
    if (isSongActive && songNav) {
      const liveCursor = liveContent?.type === 'song' ? (liveContent.navIndex ?? 0) : 0
      return {
        current: slideToFoldbackInfo(songNav.flatSlides[liveCursor], songNav.title),
        next: slideToFoldbackInfo(songNav.flatSlides[liveCursor + 1], songNav.title)
      }
    }

    const bibleContent =
      liveContent?.type === 'bible'
        ? liveContent
        : previewContent?.type === 'bible'
          ? previewContent
          : null
    if (bibleContent) {
      const verse = bibleContent.verses?.[0]
      const nextContent =
        liveContent?.type === 'bible' &&
        previewContent?.type === 'bible' &&
        previewContent.id !== liveContent.id
          ? previewContent
          : null
      const nextVerse = nextContent?.verses?.[0]
      return {
        current: {
          type: 'bible',
          reference: verse ? `${verse.book} ${verse.chapter}:${verse.verse}` : bibleContent.title,
          cleanText: bibleContent.content ?? '',
          rawLines: [bibleContent.content ?? ''],
          verseTitle: bibleContent.title
        },
        next: nextVerse
          ? {
              type: 'bible',
              reference: `${nextVerse.book} ${nextVerse.chapter}:${nextVerse.verse}`,
              cleanText: nextContent!.content ?? '',
              rawLines: [nextContent!.content ?? ''],
              verseTitle: nextContent!.title
            }
          : null
      }
    }

    return null
  }, [isSongActive, songNav, liveContent, previewContent])

  // In Preview.tsx — pull the key from the active schedule scene
  const activeSongKey = songNav?.tone
  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <section className="flex-1 border-b border-r p-4 h-full flex gap-4 overflow-hidden min-w-0">
      {/* ── Live ── */}
      <div className="flex-3 min-w-0 flex flex-col gap-2 overflow-hidden">
        <div
          className="shrink-0 flex items-center justify-between"
          style={liveCanvasW ? { width: liveCanvasW } : undefined}
        >
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
                {t('dashboard.casting', 'Casting')}
              </span>
            )}
            {foldbackWindowOpen && (
              <span className="text-xs text-blue-400 flex items-center gap-1">
                <div className="h-1.5 w-1.5 bg-blue-400 rounded-full" />
                {t('dashboard.stageBadge', 'Stage')}
              </span>
            )}
            <Button variant="outline" className="h-7" onClick={clearLive} disabled={!liveContent}>
              <MonitorOff />
              {t('dashboard.clear')}
            </Button>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <CastPreview content={liveContent} config={config} isLive onCanvasSize={setLiveCanvasW} />
        </div>
      </div>

      {/* ── Preview ── */}
      <div
        className={`${config.foldbackEnabled ? 'flex-1' : 'flex-2'} min-w-0 flex flex-col gap-2`}
      >
        {/* Top bar */}
        <div className="shrink-0 flex items-center justify-between">
          <span className="uppercase text-lg text-muted-foreground font-semibold">
            {t('dashboard.preview')}
          </span>
          {isSongActive ? (
            <SongTopPanel
              castWindowOpen={!!castWindowOpen}
              cursor={songNav.cursor}
              onHome={handleHome}
              onFirstVerse={handleFirstVerse}
              onPresentPreview={handlePresentPreview}
            />
          ) : isBibleActive ? (
            <BibleTopPanel onGoLive={goLive} verses={previewContent?.verses} />
          ) : (
            <Button
              variant="default"
              size="sm"
              className="h-7 text-xs gap-1 self-end"
              onClick={goLive}
              disabled={!previewContent}
            >
              <Play className="h-3 w-3" />
              {t('dashboard.goLive')}
            </Button>
          )}
        </div>

        {/* Preview canvas */}
        <div
          className={`shrink-0 w-full ${config.aspectRatio === '4:3' ? 'aspect-4/3' : 'aspect-video'}`}
        >
          <CastPreview content={previewContent} config={config} className="w-full h-full" />
        </div>

        {/* Bottom nav — song */}
        {isSongActive && (
          <div className="shrink-0">
            <SongBottomPanel
              onPrev={handlePrev}
              onNext={handleNext}
              isAtStart={isAtStart}
              isAtEnd={isAtEnd}
              slideLabel={slideLabel}
            />
          </div>
        )}

        {/* Bottom nav — bible */}
        {isBibleActive && (
          <div className="shrink-0">
            <BibleBottomPanel
              onPrev={handleBiblePrev}
              onNext={handleBibleNext}
              isAtStart={bibleIsAtStart}
              isAtEnd={bibleIsAtEnd}
              verseLabel={verseLabel}
            />
          </div>
        )}

        {/* Stage monitor */}
        {config.foldbackEnabled && (isSongActive || liveContent?.type === 'bible') && (
          <>
            <div className="shrink-0 border-t border-border/50 mt-1" />
            <div className="shrink-0 flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <div
                  className={cn(
                    'h-1.5 w-1.5 rounded-full shrink-0',
                    foldbackWindowOpen ? 'bg-blue-400' : 'bg-muted-foreground/30'
                  )}
                />
                <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                  {t('dashboard.stageMonitor', 'Stage Monitor')}
                </span>
                {foldbackWindowOpen && (
                  <span className="text-xs text-blue-400 ml-auto">
                    {t('dashboard.stageLive', 'Live')}
                  </span>
                )}
              </div>
              <div
                className={cn(
                  'relative w-full rounded-md overflow-hidden border border-blue-400/30',
                  config.aspectRatio === '4:3' ? 'aspect-4/3' : 'aspect-video'
                )}
              >
                <div className="absolute inset-0">
                  <FoldbackPreview
                    payload={stageMonitorPayload}
                    showChords={config.foldbackShowChords ?? true}
                    showNext={true}
                    songKey={activeSongKey} // ← add this
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default Preview

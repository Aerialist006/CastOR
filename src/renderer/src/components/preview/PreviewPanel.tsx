import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'
import { CastPreview } from '../CastPreview'
import { SongTopPanel } from '../Panels/SongTopPanel'
import { BibleTopPanel } from '../Panels/BibleTopPanel'
import { SongBottomPanel } from '../Panels/SongBottomPanel'
import { BibleBottomPanel } from '../Panels/BibleBottomPanel'
import { SlideBottomPanel } from '../Panels/SlideBottomPanel'
import { StageMonitorPanel } from '@/components/preview/StageMonitorPanel'


export function PreviewPanel(props: any) {
  const {
    t,
    config,
    previewContent,
    isSongActive,
    isBibleActive,
    isSlideActive,
    songNav,
    slideNav,
    handleHome,
    handleFirstVerse,
    handlePresentPreview,
    goLive,
    handlePrev,
    handleNext,
    handleBiblePrev,
    handleBibleNext,
    handleSlidePrev,
    handleSlideNext,
    isAtStart,
    isAtEnd,
    bibleIsAtStart,
    bibleIsAtEnd,
    slideIsAtStart,
    slideIsAtEnd,
    slideLabel,
    presentationSlideLabel,
    verseLabel,
    castWindowOpen,
    foldbackWindowOpen,
    stageMonitorPayload,
    activeSongKey
  } = props

  // ── Top bar action ────────────────────────────────────────────────────────
  const renderTopAction = () => {
    if (isSongActive) {
      return (
        <SongTopPanel
          castWindowOpen={!!castWindowOpen}
          cursor={songNav.cursor}
          onHome={handleHome}
          onFirstVerse={handleFirstVerse}
          onPresentPreview={handlePresentPreview}
        />
      )
    }
    if (isBibleActive) {
      return <BibleTopPanel onGoLive={goLive} verses={previewContent?.verses} />
    }
    // slide and generic fallback both just get the Go Live button
    return (
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
    )
  }

  return (
    <div className={`${config.foldbackEnabled ? 'flex-1' : 'flex-2'} min-w-0 flex flex-col gap-2`}>

      {/* ── Top bar ── */}
      <div className="shrink-0 flex items-center justify-between">
        <span className="uppercase text-lg text-muted-foreground font-semibold">
          {t('dashboard.preview')}
        </span>
        {renderTopAction()}
      </div>

      {/* ── Canvas ── */}
      <div
        className={`shrink-0 w-full ${
          config.aspectRatio === '4:3' ? 'aspect-4/3' : 'aspect-video'
        }`}
      >
        <CastPreview content={previewContent} config={config} className="w-full h-full" />
      </div>

      {/* ── Song bottom nav ── */}
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

      {/* ── Bible bottom nav ── */}
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

      {/* ── Slide deck bottom nav ── */}
      {isSlideActive && (
        <div className="shrink-0">
          <SlideBottomPanel
            onPrev={handleSlidePrev}
            onNext={handleSlideNext}
            isAtStart={slideIsAtStart}
            isAtEnd={slideIsAtEnd}
            slideLabel={presentationSlideLabel}
          />
        </div>
      )}

      {/* ── Stage monitor ── */}
      <StageMonitorPanel
        t={t}
        config={config}
        foldbackWindowOpen={!!foldbackWindowOpen}
        payload={stageMonitorPayload}
        songKey={activeSongKey}
      />
    </div>
  )
}
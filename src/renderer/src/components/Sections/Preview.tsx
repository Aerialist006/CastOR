import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { usePresentationContext } from '@/context/PresentationContext'
import { Button } from '@/components/ui/button'
import { Play, Square, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBibleContext } from '@/context/BibleContext'
import { CastPreview } from '../CastPreview'

const Preview = () => {
  const { config } = useBibleContext()
  const { t } = useTranslation()
  const { previewContent, liveContent, goLive, clearLive, castWindowOpen } =
    usePresentationContext()

  useEffect(() => {
    if (liveContent) {
      window.api?.broadcastLiveContent?.({ content: liveContent, config })
    }
  }, [liveContent, config])

  return (
    <section className="flex-1 border-b border-r p-4 h-full flex gap-4 overflow-hidden min-w-0">
      {/* Live Screen — flex-3 = ~60% */}
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

        {/* ↓ only this div changed */}
        <CastPreview content={liveContent} config={config} isLive />
      </div>

      {/* Preview Screen — flex-2 = ~40% */}
      <div className="flex-2 min-w-0 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="uppercase text-lg text-muted-foreground font-semibold flex items-center gap-2">
            {t('dashboard.preview')}
          </span>
          <Button
            variant="default"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={goLive}
            disabled={!previewContent}
          >
            <Play className="h-3 w-3" />
            {t('dashboard.goLive')}
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        {/* ↓ only this div changed */}
        <CastPreview content={previewContent} config={config} />

        {/* Verse chips — unchanged */}
        {previewContent?.verses && previewContent.verses.length > 1 && (
          <div className="mt-2 p-2 bg-muted/50 rounded-md">
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
      </div>
    </section>
  )
}

export default Preview

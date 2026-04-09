import { FoldbackPreview } from '@/components/FoldbackPreview'
import { cn } from '@/utils/utils'

export function StageMonitorPanel({
  t,
  config,
  foldbackWindowOpen,
  payload,
  songKey
}: any) {
  if (!config.foldbackEnabled || !payload) return null

  return (
    <>
      <div className="shrink-0 border-t border-border/50 mt-1" />
      <div className="shrink-0 flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', foldbackWindowOpen ? 'bg-blue-400' : 'bg-muted-foreground/30')} />
          <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
            {t('dashboard.stageMonitor', 'Stage Monitor')}
          </span>
          {foldbackWindowOpen && <span className="text-xs text-blue-400 ml-auto">{t('dashboard.stageLive', 'Live')}</span>}
        </div>

        <div className={cn('relative w-full rounded-md overflow-hidden border border-blue-400/30', config.aspectRatio === '4:3' ? 'aspect-4/3' : 'aspect-video')}>
          <div className="absolute inset-0">
            <FoldbackPreview
              payload={payload}
              showChords={config.foldbackShowChords ?? true}
              showNext={true}
              songKey={songKey}
            />
          </div>
        </div>
      </div>
    </>
  )
}
import { Button } from '@/components/ui/button'
import { MonitorOff } from 'lucide-react'
import { cn } from '@/utils/utils'

interface Props {
  t: (key: string, fallback?: string) => string
  liveContent: any
  castWindowOpen: boolean
  foldbackWindowOpen: boolean
  onClearLive: () => void
  liveCanvasW?: number
}

export function PreviewHeader({
  t,
  liveContent,
  castWindowOpen,
  foldbackWindowOpen,
  onClearLive,
  liveCanvasW
}: Props) {
  return (
    <div
      className="shrink-0 flex items-center justify-between"
      style={liveCanvasW ? { width: liveCanvasW } : undefined}
    >
      <span className="uppercase text-lg font-bold text-red-500 flex items-center gap-2">
        <div className={cn('h-2 w-2 rounded-full', liveContent ? 'bg-red-500 animate-pulse' : 'bg-red-500/30')} />
        {t('dashboard.live')}
      </span>

      <div className="flex items-center gap-2">
        {castWindowOpen && <span className="text-xs text-green-500">Casting</span>}
        {foldbackWindowOpen && <span className="text-xs text-blue-400">Stage</span>}
        <Button variant="outline" className="h-7" onClick={onClearLive} disabled={!liveContent}>
          <MonitorOff />
          {t('dashboard.clear')}
        </Button>
      </div>
    </div>
  )
}
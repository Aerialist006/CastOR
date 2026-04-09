import { CastPreview } from '../CastPreview'
import { PreviewHeader } from './PreviewHeader'

export function LivePanel(props: {
  t: any
  config: any
  liveContent: any
  castWindowOpen: boolean
  foldbackWindowOpen: boolean
  onClearLive: () => void
  onCanvasSize: (w?: number) => void
  liveCanvasW?: number
}) {
  const { t, config, liveContent, castWindowOpen, foldbackWindowOpen, onClearLive, onCanvasSize, liveCanvasW } = props

  return (
    <div className="flex-3 min-w-0 flex flex-col gap-2 overflow-hidden">
      <PreviewHeader
        t={t}
        liveContent={liveContent}
        castWindowOpen={castWindowOpen}
        foldbackWindowOpen={foldbackWindowOpen}
        onClearLive={onClearLive}
        liveCanvasW={liveCanvasW}
      />
      <div className="flex-1 min-h-0 overflow-hidden">
        <CastPreview content={liveContent} config={config} isLive onCanvasSize={onCanvasSize} />
      </div>
    </div>
  )
}
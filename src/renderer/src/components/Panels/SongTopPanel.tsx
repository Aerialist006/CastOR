import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Home, ArrowUpToLine, Play } from 'lucide-react'

interface SongTopPanelProps {
  castWindowOpen: boolean
  cursor: number
  onHome: () => void
  onFirstVerse: () => void
  onPresentPreview: () => void
}

export function SongTopPanel({
  castWindowOpen,
  cursor,
  onHome,
  onFirstVerse,
  onPresentPreview
}: SongTopPanelProps) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7"
                onClick={onHome}
                disabled={cursor === 0}
              >
                <Home className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('song.goToIntro')}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7"
                onClick={onFirstVerse}
                disabled={cursor === 1}
              >
                <ArrowUpToLine className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('song.goToFirstVerse')}</TooltipContent>
          </Tooltip>

          <Button size="sm" onClick={onPresentPreview}>
            <Play className="w-3.5 h-3.5" />
            <p>{t('actions.cast')}</p>
          </Button>
        </TooltipProvider>
      </div>
    </div>
  )
}

import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ChevronLeft, ChevronRight, ArrowLeft, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react'

interface BibleBottomPanelProps {
  onPrev: () => void
  onNext: () => void
  isAtStart: boolean
  isAtEnd: boolean
  verseLabel: string
}

export function BibleBottomPanel({
  onPrev,
  onNext,
  isAtStart,
  isAtEnd,
  verseLabel
}: BibleBottomPanelProps) {
  const { t } = useTranslation()
  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onPrev}
              disabled={isAtStart}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="flex items-center gap-1.5">
            {t('bible.prev', 'Previous verse')}
            <KbdGroup>
              <Kbd>
                <ArrowLeft />
              </Kbd>
              <Kbd>PgUp</Kbd>
              <Kbd>
                <ArrowUp />
              </Kbd>
            </KbdGroup>
          </TooltipContent>
        </Tooltip>

        <p className="flex-1 text-center text-xs text-muted-foreground truncate">{verseLabel}</p>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isAtEnd ? 'outline' : 'default'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onNext}
              disabled={isAtEnd}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="flex items-center gap-1.5">
            {t('bible.next', 'Next verse')}
            <KbdGroup>
              <Kbd>
                <ArrowRight />
              </Kbd>
              <Kbd>PgDown</Kbd>
              <Kbd>
                <ArrowDown />
              </Kbd>
            </KbdGroup>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

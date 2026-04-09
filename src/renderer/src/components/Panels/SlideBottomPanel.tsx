import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SlideBottomPanelProps {
  onPrev: () => void
  onNext: () => void
  isAtStart: boolean
  isAtEnd: boolean
  slideLabel: string
}

export function SlideBottomPanel({
  onPrev,
  onNext,
  isAtStart,
  isAtEnd,
  slideLabel
}: SlideBottomPanelProps) {
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={onPrev} disabled={isAtStart}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <p className="flex-1 text-center text-xs text-muted-foreground truncate">
        {slideLabel}
      </p>

      <Button variant={isAtEnd ? 'outline' : 'default'} size="sm" className="h-8 w-8 p-0" onClick={onNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
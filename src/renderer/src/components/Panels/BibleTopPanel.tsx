import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'
import type { VerseData } from '@/types/bible' // ← use the real type

interface BibleTopPanelProps {
  onGoLive: () => void
  verses?: VerseData[] // ← was BibleVerse[], now VerseData[]
}

export function BibleTopPanel({ onGoLive, verses }: BibleTopPanelProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-1">
      <Button size="sm" className="w-full" onClick={onGoLive}>
        <Play className="w-3 h-3 mr-1" />
        {t('dashboard.goLive')}
      </Button>
      {verses && verses.length > 1 && (
        <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <span>Verses in this selection:</span>
          {verses.map((v) => (
            <span key={v.verse} className="px-1.5 py-0.5 rounded bg-muted font-mono">
              v.{v.verse}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

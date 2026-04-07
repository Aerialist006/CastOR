import { useBibleContext } from '../../context/BibleContext'
import { TRANSLATION_CONFIGS } from '../../types/bibleTypes'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'


export function BibleSettings() {
  const { config, setConfig, activeBible, isLoading } = useBibleContext()

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bible-select">Bible Translation</Label>
        <Select
          value={config.activeBibleId}
          onValueChange={(value) => setConfig({ activeBibleId: value })}
        >
          <SelectTrigger id="bible-select" className="w-full">
            <SelectValue placeholder="Select translation" />
          </SelectTrigger>
          <SelectContent>
            {TRANSLATION_CONFIGS.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name} ({t.abbreviation})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Choose the Bible translation for scripture display
        </p>
      </div>

      {/* Current Bible Info */}
      {activeBible && (
        <div className="rounded-md bg-muted p-3 space-y-1">
          <p className="text-sm font-medium">{activeBible.name}</p>
          <p className="text-xs text-muted-foreground">
            Language: {activeBible.language === 'en' ? 'English' : 'Spanish'}
          </p>
          <p className="text-xs text-muted-foreground">
            Books: {activeBible.bookNames.length}
          </p>
        </div>
      )}

      {isLoading && (
        <p className="text-sm text-muted-foreground animate-pulse">
          Loading Bible translation...
        </p>
      )}
    </div>
  )
}

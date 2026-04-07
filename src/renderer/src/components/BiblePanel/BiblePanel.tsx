import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, Plus, Eye } from 'lucide-react'
import { useBibleContext } from '../../context/BibleContext'
import { usePresentationContext, generateId } from '../../context/PresentationContext'
import { BibleSearchBar } from './BibleSearchBar'
import type { VerseData } from '../../lib/bibleTypes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

interface VerseCardProps {
  v: VerseData
  onAddToSchedule: (v: VerseData) => void
  onPreview: (v: VerseData) => void
}

function VerseCard({ v, onAddToSchedule, onPreview }: VerseCardProps) {
  return (
    <div className="group relative rounded-md border border-border bg-card px-3 py-2 hover:border-primary/50 transition-colors">
      {/* Action buttons in top right */}
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => onPreview(v)}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Preview verse</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => onAddToSchedule(v)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Add to schedule</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <p className="mb-0.5 text-xs font-semibold text-muted-foreground">
        {v.book} {v.chapter}:{v.verse}
      </p>
      <p className="line-clamp-3 text-sm leading-snug text-card-foreground pr-14">{v.text}</p>
    </div>
  )
}

export function BiblePanel() {
  const { t } = useTranslation()
  const { activeBible, isLoading, config } = useBibleContext()
  const { addToSchedule, setPreviewContent } = usePresentationContext()

  const [book, setBook] = useState('John')
  const [chapter, setChapter] = useState(3)
  const [verse, setVerse] = useState(16)
  const [results, setResults] = useState<VerseData[]>([])
  const [expanded, setExpanded] = useState(false)

  // Use versesDisplayed from config (default to 5)
  const versesToDisplay = config.versesDisplayed ?? 5

  const bookNames = activeBible?.bookNames ?? []
  const chapterCount = useMemo(
    () => activeBible?.books.get(book)?.chapterCount ?? 0,
    [activeBible, book]
  )
  const verseCount = useMemo(
    () => activeBible?.books.get(book)?.chapters.get(chapter)?.verseCount ?? 0,
    [activeBible, book, chapter]
  )

  function runSearch(b = book, c = chapter, v = verse) {
    if (!activeBible) return
    const chData = activeBible.books.get(b)?.chapters.get(c)
    if (!chData) return
    const found: VerseData[] = []
    for (let i = v; i < v + versesToDisplay; i++) {
      const text = chData.verses.get(i)
      if (text) found.push({ book: b, chapter: c, verse: i, text })
    }
    setResults(found)
    setExpanded(false)
  }

  function handleNavigate(b: string, c: number, v: number) {
    setBook(b)
    setChapter(c)
    setVerse(v)
    runSearch(b, c, v)
  }

  // Add single verse to schedule
  const handleAddToSchedule = (v: VerseData) => {
    addToSchedule({
      id: generateId(),
      type: 'bible',
      title: `${v.book} ${v.chapter}:${v.verse}`,
      content: v.text,
      verses: [v]
    })
  }

  // Add all displayed verses to schedule as a group
  const handleAddAllToSchedule = () => {
    if (results.length === 0) return
    
    const firstVerse = results[0]
    const lastVerse = results[results.length - 1]
    const verseRange = results.length > 1 
      ? `${firstVerse.book} ${firstVerse.chapter}:${firstVerse.verse}-${lastVerse.verse}`
      : `${firstVerse.book} ${firstVerse.chapter}:${firstVerse.verse}`
    
    addToSchedule({
      id: generateId(),
      type: 'bible',
      title: verseRange,
      content: results.map(v => v.text).join(' '),
      verses: results
    })
  }

  // Preview a verse
  const handlePreview = (v: VerseData) => {
    setPreviewContent({
      id: generateId(),
      type: 'bible',
      title: `${v.book} ${v.chapter}:${v.verse}`,
      content: v.text,
      verses: [v]
    })
  }

  return (
    <div className="flex h-full flex-col">
      {/* Fixed top: title + search */}
      <div className="shrink-0 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('dashboard.bibleTitle')}
        </p>

        <div className="relative">
          {/* Search bar row */}
          <div className="flex gap-2">
            <div className="flex-1">
              <BibleSearchBar
                bible={activeBible}
                onNavigate={handleNavigate}
                onStartTyping={() => setExpanded(false)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setExpanded((prev) => !prev)}
              className="shrink-0"
              aria-label={expanded ? 'Collapse search options' : 'Expand search options'}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {/* Floating expanded form */}
          {expanded && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-md border border-border bg-popover p-3 shadow-xl">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    {t('dashboard.bibleBook')}
                  </span>
                  <Select
                    value={book}
                    onValueChange={(value) => {
                      setBook(value)
                      setChapter(1)
                      setVerse(1)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('dashboard.bibleBook')} />
                    </SelectTrigger>
                    <SelectContent>
                      {bookNames.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      {t('dashboard.bibleChapter')}
                    </span>
                    <Input
                      type="number"
                      min={1}
                      max={chapterCount || 150}
                      value={chapter}
                      onChange={(e) => setChapter(Number(e.target.value))}
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      {t('dashboard.bibleVerse')}
                    </span>
                    <Input
                      type="number"
                      min={1}
                      max={verseCount || 176}
                      value={verse}
                      onChange={(e) => setVerse(Number(e.target.value))}
                    />
                  </div>
                </div>

                <Button onClick={() => runSearch()} disabled={!activeBible} className="w-full">
                  {t('dashboard.bibleSearchButton')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Results header with add all button */}
      {results.length > 0 && (
        <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b">
          <span className="text-xs text-muted-foreground">
            {results.length} {results.length === 1 ? t('dashboard.verse') : t('dashboard.verses')}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={handleAddAllToSchedule}
          >
            <Plus className="h-3 w-3" />
            Add All
          </Button>
        </div>
      )}

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-2 p-3">
          {isLoading && (
            <p className="animate-pulse text-xs text-muted-foreground">Loading Bible...</p>
          )}
          {results.map((v) => (
            <VerseCard 
              key={`${v.book}-${v.chapter}-${v.verse}`} 
              v={v}
              onAddToSchedule={handleAddToSchedule}
              onPreview={handlePreview}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

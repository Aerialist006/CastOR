import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useBibleContext } from '@/context/BibleContext'
import type { AppConfig } from '@/lib/appConfig'
import { DEFAULT_CONFIG } from '@/lib/appConfig'
import { FONT_OPTIONS } from '@/lib/fontOptions'
import { useFontLoader } from '@/hooks/useFontLoader'
import { CastPreview } from '@/components/CastPreview'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { cn } from '@/utils/utils'

interface DisplayInfo {
  index: number
  id: number
  label: string
  bounds: { x: number; y: number; width: number; height: number }
  isPrimary: boolean
}

const MARGINS = ['Top', 'Bottom', 'Left', 'Right'] as const

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  disabled
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  disabled?: boolean
  onChange: (v: number) => void
}) {
  return (
    <div className={cn('space-y-2', disabled && 'opacity-40 pointer-events-none')}>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-sm text-muted-foreground tabular-nums">
          {value}
          {unit}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        disabled={disabled}
      />
    </div>
  )
}

function ColorRow({
  label,
  value,
  onChange
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded border border-border" style={{ background: value }} />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
        />
        <span className="text-xs text-muted-foreground tabular-nums">{value}</span>
      </div>
    </div>
  )
}

export function DisplaySettings() {
  const { t } = useTranslation()
  const { config, setConfig } = useBibleContext()
  const [displays, setDisplays] = useState<DisplayInfo[]>([])
  const rootRef = useRef<HTMLDivElement>(null)
  const [panelH, setPanelH] = useState(0)

  // Compute exact available height: from this component's top edge → window bottom
  // Works regardless of whether any parent has h-full or not
  useEffect(() => {
    const measure = () => {
      if (!rootRef.current) return
      const top = rootRef.current.getBoundingClientRect().top
      setPanelH(Math.floor(window.innerHeight - top - 16)) // 16px bottom breathing room
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    window.api
      ?.getDisplays?.()
      .then((d) => setDisplays(d || []))
      .catch(console.error)
  }, [])

  const c = { ...DEFAULT_CONFIG, ...config }
  const set = (partial: Partial<AppConfig>) => setConfig(partial)
  useFontLoader(c.fontFamily)

  return (
    // panelH is now a real pixel value — no more silent h-full = 0
    <div
      ref={rootRef}
      className="flex gap-6 overflow-hidden"
      style={{ height: panelH || undefined }}
    >
      {/* ── Left: scroll area, exact same height ── */}
      <ScrollArea className="flex-1 min-w-0" style={{ height: panelH || undefined }}>
        <div className="space-y-6 pr-4 pb-6">
          {/* Verse Display */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.displayTitle', 'Display Settings')}</CardTitle>
              <CardDescription>
                {t('settings.displayDesc', 'Configure how verses are displayed')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1.5">
                <Label>{t('settings.fontFamily', 'Font')}</Label>
                <Select value={c.fontFamily} onValueChange={(v) => set({ fontFamily: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        <span style={{ fontFamily: f.value }}>{f.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <SliderRow
                label={t('settings.versesDisplayed', 'Verses to display')}
                value={c.versesDisplayed}
                min={1}
                max={15}
                step={1}
                unit=""
                onChange={(v) => set({ versesDisplayed: v })}
              />
              <SliderRow
                label={t('settings.fontSize', 'Font size')}
                value={c.fontSize}
                min={16}
                max={120}
                step={2}
                unit="px"
                onChange={(v) => set({ fontSize: v })}
              />
              <SliderRow
                label={t('settings.lineHeight', 'Line height')}
                value={c.lineHeight}
                min={1.0}
                max={3.0}
                step={0.1}
                unit="×"
                onChange={(v) => set({ lineHeight: v })}
              />

              <div className="space-y-1.5">
                <Label>{t('settings.textAlign', 'Text alignment')}</Label>
                <ToggleGroup
                  type="single"
                  value={c.textAlign}
                  className="justify-start"
                  onValueChange={(v) => v && set({ textAlign: v as AppConfig['textAlign'] })}
                >
                  <ToggleGroupItem value="left" aria-label="Align left">
                    <AlignLeft className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="center" aria-label="Align center">
                    <AlignCenter className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="right" aria-label="Align right">
                    <AlignRight className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.showVerseNumbers', 'Show verse numbers')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.showVerseNumbersDesc', 'Display verse numbers alongside the text')}
                  </p>
                </div>
                <Switch
                  checked={c.showVerseNumbers}
                  onCheckedChange={(v) => set({ showVerseNumbers: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.autoSizeFit', 'Adjust autosize when overflow')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      'settings.autoSizeFitDesc',
                      'Shrinks text automatically so it never overflows the margins. The font size above becomes the maximum.'
                    )}
                  </p>
                </div>
                <Switch checked={c.autoSizeFit} onCheckedChange={(v) => set({ autoSizeFit: v })} />
              </div>
            </CardContent>
          </Card>

          {/* Reference & Version */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.refTitle', 'Reference & Version')}</CardTitle>
              <CardDescription>
                {t('settings.refDesc', 'Control how the verse reference and Bible version appear')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.showVerseRef', 'Show verse reference')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.showVerseRefDesc', 'Show "John 3:16" below the text')}
                  </p>
                </div>
                <Switch
                  checked={c.showVerseRef}
                  onCheckedChange={(v) => set({ showVerseRef: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.showBibleVersion', 'Show Bible version')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      'settings.showBibleVersionDesc',
                      'Show "KJV" or "RV1960" next to the reference'
                    )}
                  </p>
                </div>
                <Switch
                  checked={c.showBibleVersion}
                  onCheckedChange={(v) => set({ showBibleVersion: v })}
                />
              </div>

              <div className="space-y-3 rounded-md border border-border p-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.refSyncSize', 'Auto-size reference')}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.refSyncSizeDesc', 'Automatically scale with verse font size')}
                    </p>
                  </div>
                  <Switch
                    checked={c.refSyncSize}
                    onCheckedChange={(v) => set({ refSyncSize: v })}
                  />
                </div>
                <SliderRow
                  label={t('settings.refFontSize', 'Reference font size')}
                  value={c.refSyncSize ? Math.round(c.fontSize * 0.45) : c.refFontSize}
                  min={10}
                  max={80}
                  step={1}
                  unit="px"
                  disabled={c.refSyncSize}
                  onChange={(v) => set({ refFontSize: v })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Text Effects */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.effectsTitle', 'Text Effects')}</CardTitle>
              <CardDescription>
                {t('settings.effectsDesc', 'Improve legibility over bright or complex backgrounds')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3 rounded-md border border-border p-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.textShadow', 'Text shadow')}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.textShadowDesc', 'Drop shadow behind the text')}
                    </p>
                  </div>
                  <Switch checked={c.textShadow} onCheckedChange={(v) => set({ textShadow: v })} />
                </div>
                <div className={cn('space-y-4', !c.textShadow && 'opacity-40 pointer-events-none')}>
                  <SliderRow
                    label={t('settings.textShadowBlur', 'Blur radius')}
                    value={c.textShadowBlur}
                    min={0}
                    max={40}
                    step={1}
                    unit="px"
                    onChange={(v) => set({ textShadowBlur: v })}
                  />
                  <ColorRow
                    label={t('settings.textShadowColor', 'Shadow color')}
                    value={c.textShadowColor}
                    onChange={(v) => set({ textShadowColor: v })}
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-md border border-border p-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.textOutline', 'Text outline')}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.textOutlineDesc', 'Stroke around each letter')}
                    </p>
                  </div>
                  <Switch
                    checked={c.textOutline}
                    onCheckedChange={(v) => set({ textOutline: v })}
                  />
                </div>
                <div
                  className={cn('space-y-4', !c.textOutline && 'opacity-40 pointer-events-none')}
                >
                  <SliderRow
                    label={t('settings.textOutlineWidth', 'Outline width')}
                    value={c.textOutlineWidth}
                    min={1}
                    max={8}
                    step={0.5}
                    unit="px"
                    onChange={(v) => set({ textOutlineWidth: v })}
                  />
                  <ColorRow
                    label={t('settings.textOutlineColor', 'Outline color')}
                    value={c.textOutlineColor}
                    onChange={(v) => set({ textOutlineColor: v })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Margins */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.marginsTitle', 'Margins')}</CardTitle>
              <CardDescription>
                {t('settings.marginsDesc', 'Padding around the text in the cast window')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {MARGINS.map((side) => {
                const key = `margin${side}` as keyof AppConfig
                return (
                  <SliderRow
                    key={side}
                    label={t(`settings.margin${side}`, side)}
                    value={c[key] as number}
                    min={0}
                    max={30}
                    step={1}
                    unit="%"
                    onChange={(v) => set({ [key]: v })}
                  />
                )
              })}
            </CardContent>
          </Card>

          {/* Cast Monitor */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.castTitle', 'Cast Settings')}</CardTitle>
              <CardDescription>
                {t('settings.castDesc', 'Configure the external display for casting')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('settings.castMonitor', 'Cast monitor')}</Label>
                <Select
                  value={String(c.castMonitorIndex)}
                  onValueChange={(v) => set({ castMonitorIndex: parseInt(v) })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="-1">
                      {t('settings.autoDetect', 'Auto-detect (secondary monitor)')}
                    </SelectItem>
                    {displays.map((d) => (
                      <SelectItem key={d.id} value={String(d.index)}>
                        {d.label} ({d.bounds.width}×{d.bounds.height})
                        {d.isPrimary ? ' — Primary' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {displays.length > 0 && (
                <div className="rounded-md bg-muted p-3">
                  <p className="text-xs font-medium mb-2">
                    {t('settings.availableDisplays', 'Available displays')}:
                  </p>
                  <ul className="space-y-1">
                    {displays.map((d) => (
                      <li
                        key={d.id}
                        className="text-xs text-muted-foreground flex items-center gap-2"
                      >
                        <span className={d.isPrimary ? 'text-primary font-medium' : ''}>
                          {d.label}
                        </span>
                        <span>–</span>
                        <span>
                          {d.bounds.width}×{d.bounds.height}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('settings.foldbackTitle', 'Stage Monitor (Foldback)')}</CardTitle>
              <CardDescription>
                {t(
                  'settings.foldbackDesc',
                  'Third screen for performers — shows chords, current verse, and upcoming lyrics'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.foldbackEnabled', 'Enable stage monitor')}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t(
                      'settings.foldbackEnabledDesc',
                      'Open a third display window for performers'
                    )}
                  </p>
                </div>
                <Switch
                  checked={c.foldbackEnabled}
                  onCheckedChange={(v) => set({ foldbackEnabled: v })}
                />
              </div>

              <div
                className={cn('space-y-4', !c.foldbackEnabled && 'opacity-40 pointer-events-none')}
              >
                <div className="space-y-2">
                  <Label>{t('settings.foldbackMonitor', 'Stage monitor display')}</Label>
                  <Select
                    value={String(c.foldbackMonitorIndex ?? -1)}
                    onValueChange={(v) => set({ foldbackMonitorIndex: parseInt(v) })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-1">
                        {t('settings.foldbackAutoDetect', 'Auto-detect (third monitor)')}
                      </SelectItem>
                      {displays.map((d) => (
                        <SelectItem key={d.id} value={String(d.index)}>
                          {d.label} ({d.bounds.width}×{d.bounds.height})
                          {d.isPrimary ? ' — Primary' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.foldbackShowChords', 'Show chords')}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t(
                        'settings.foldbackShowChordsDesc',
                        'Display chord symbols above the lyrics'
                      )}
                    </p>
                  </div>
                  <Switch
                    checked={c.foldbackShowChords ?? true}
                    onCheckedChange={(v) => set({ foldbackShowChords: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.foldbackShowNext', 'Show next verse')}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t(
                        'settings.foldbackShowNextDesc',
                        'Show upcoming verse name and first line'
                      )}
                    </p>
                  </div>
                  <Switch
                    checked={c.foldbackShowNextVerse ?? true}
                    onCheckedChange={(v) => set({ foldbackShowNextVerse: v })}
                  />
                </div>

                <SliderRow
                  label={t('settings.foldbackFontSize', 'Font size')}
                  value={c.foldbackFontSize ?? 48}
                  min={24}
                  max={96}
                  step={2}
                  unit="px"
                  onChange={(v) => set({ foldbackFontSize: v })}
                />

                {c.foldbackEnabled && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs"
                    onClick={() => window.api?.openFoldbackWindow?.()}
                  >
                    {t('settings.foldbackOpenWindow', 'Open Stage Monitor Window')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* ── Right: exact pixel height, preview fills it ── */}
      <div
        className="w-3/5 shrink-0 flex flex-col gap-3 overflow-hidden"
        style={{ height: panelH || undefined }}
      >
        {/* Fixed header */}
        <div className="shrink-0">
          <p className="text-sm font-semibold">{t('settings.previewTitle', 'Live Preview')}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('settings.previewDesc', 'Updates as you change settings')}
          </p>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden flex items-start">
          <div
            className="h-full max-w-full"
            style={{ aspectRatio: c.aspectRatio === '4:3' ? '4/3' : '16/9' }}
          >
            <CastPreview config={c} showPlaceholder className="h-full" />
          </div>
        </div>

        {/* Fixed ratio toggle */}
        <div className="shrink-0 space-y-1.5">
          <Label>{t('settings.aspectRatio', 'Screen ratio')}</Label>
          <ToggleGroup
            type="single"
            value={c.aspectRatio}
            className="justify-start"
            onValueChange={(v) => v && set({ aspectRatio: v as AppConfig['aspectRatio'] })}
          >
            <ToggleGroupItem value="16:9" className="text-xs px-3">
              16:9
            </ToggleGroupItem>
            <ToggleGroupItem value="4:3" className="text-xs px-3">
              4:3
            </ToggleGroupItem>
          </ToggleGroup>
          <p className="text-xs text-muted-foreground">
            {c.aspectRatio === '4:3'
              ? t('settings.aspectRatio43Desc', 'Older projectors and screens')
              : t('settings.aspectRatio169Desc', 'Modern displays and projectors')}
          </p>
        </div>
      </div>
    </div>
  )
}

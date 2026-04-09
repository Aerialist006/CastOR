import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useBibleContext } from '@/context/BibleContext'
import type { BackgroundConfig } from '@/types/background'
import { DEFAULT_BACKGROUND } from '@/types/background'
import {
  getBackgroundStyle,
  SOLID_PRESETS,
  GRADIENT_PRESETS,
  BIBLE_PRESETS,
  ANIMATED_PRESETS,
  type BgPreset
} from '@/utils/backgroundUtils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/utils'
import { Upload, Palette, ImageOff, Plus, Trash2 } from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────────────────────

const CUSTOM_PRESETS_KEY = 'bg-custom-presets'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getBgThumbnail(bg: BackgroundConfig): string {
  if (bg.type === 'color') return bg.color ?? '#000'
  if (bg.type === 'gradient' && bg.gradient) {
    const { kind, angle, stops } = bg.gradient
    const stopsStr = stops.map((s) => `${s.color} ${s.position}%`).join(', ')
    return kind === 'linear'
      ? `linear-gradient(${angle}deg, ${stopsStr})`
      : `radial-gradient(ellipse at center, ${stopsStr})`
  }
  if (bg.type === 'image' && bg.imageUrl) return `url(${bg.imageUrl}) center/cover`
  return '#222'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function GradientBuilder({ onApply }: { onApply: (bg: BackgroundConfig) => void }) {
  const [stop1, setStop1] = useState('#0a0e27')
  const [stop2, setStop2] = useState('#1a2a6c')
  const [angle, setAngle] = useState(135)
  const [kind, setKind] = useState<'linear' | 'radial'>('linear')

  const preview =
    kind === 'linear'
      ? `linear-gradient(${angle}deg, ${stop1} 0%, ${stop2} 100%)`
      : `radial-gradient(ellipse at center, ${stop1} 0%, ${stop2} 100%)`

  return (
    <div className="p-3 border rounded-md flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Custom Gradient
      </p>
      <div className="w-full h-10 rounded-md border" style={{ background: preview }} />
      <div className="flex gap-2 items-center">
        <label className="text-xs text-muted-foreground w-14 shrink-0">Color 1</label>
        <input
          type="color"
          value={stop1}
          onChange={(e) => setStop1(e.target.value)}
          className="h-7 w-10 rounded border cursor-pointer bg-transparent"
        />
        <label className="text-xs text-muted-foreground w-14 shrink-0">Color 2</label>
        <input
          type="color"
          value={stop2}
          onChange={(e) => setStop2(e.target.value)}
          className="h-7 w-10 rounded border cursor-pointer bg-transparent"
        />
      </div>
      <div className="flex gap-2 items-center">
        <label className="text-xs text-muted-foreground w-14 shrink-0">Type</label>
        <Button
          size="sm"
          variant={kind === 'linear' ? 'default' : 'outline'}
          className="h-6 text-xs px-2"
          onClick={() => setKind('linear')}
        >
          Linear
        </Button>
        <Button
          size="sm"
          variant={kind === 'radial' ? 'default' : 'outline'}
          className="h-6 text-xs px-2"
          onClick={() => setKind('radial')}
        >
          Radial
        </Button>
        {kind === 'linear' && (
          <Input
            type="number"
            min={0}
            max={360}
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            className="h-6 w-16 text-xs"
          />
        )}
      </div>
      <Button
        size="sm"
        className="h-7 text-xs w-full"
        onClick={() =>
          onApply({
            type: 'gradient',
            gradient: {
              kind,
              angle,
              stops: [
                { color: stop1, position: 0 },
                { color: stop2, position: 100 }
              ]
            }
          })
        }
      >
        Apply Gradient
      </Button>
    </div>
  )
}

function PresetGrid({
  presets,
  activeId,
  onSelect
}: {
  presets: BgPreset[]
  activeId: string | null
  onSelect: (preset: BgPreset) => void
}) {
  if (presets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
        <ImageOff className="h-6 w-6 opacity-30" />
        <p className="text-xs">No presets yet</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-1.5 p-1">
      {presets.map((preset) => (
        <TooltipProvider key={preset.id} delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onSelect(preset)}
                className={cn(
                  'aspect-video rounded-md border-2 transition-all hover:scale-105',
                  activeId === preset.id
                    ? 'border-primary ring-1 ring-primary'
                    : 'border-transparent hover:border-muted-foreground/50'
                )}
                style={{ background: preset.thumbnail }}
              />
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">{preset.name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function BackgroundPanel() {
  const { t } = useTranslation()
  const { config, updateBackground } = useBibleContext()

  const bg = config.background ?? DEFAULT_BACKGROUND
  const bgStyle = getBackgroundStyle(bg)

  // ── Custom presets (localStorage) ─────────────────────────────────────────
  const [customPresets, setCustomPresets] = useState<BgPreset[]>(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_PRESETS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const persistCustom = (updated: BgPreset[]) => {
    setCustomPresets(updated)
    try {
      localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(updated))
    } catch {}
  }

  const saveCustomPreset = () => {
    if (bg.type === 'none') return
    const preset: BgPreset = {
      id: `custom-${Date.now()}`,
      name: `Custom ${customPresets.length + 1}`,
      thumbnail: getBgThumbnail(bg),
      bg: { ...bg }
    }
    persistCustom([...customPresets, preset])
  }

  const deleteCustomPreset = (id: string) => {
    persistCustom(customPresets.filter((p) => p.id !== id))
  }

  // ── Active preset detection (across all banks) ────────────────────────────
  const activePresetId = (() => {
    const all = [
      ...SOLID_PRESETS,
      ...GRADIENT_PRESETS,
      ...BIBLE_PRESETS,
      ...ANIMATED_PRESETS,
      ...customPresets
    ]
    if (bg.type === 'color')
      return all.find((p) => p.bg.type === 'color' && p.bg.color === bg.color)?.id ?? null
    if (bg.type === 'gradient')
      return (
        all.find((p) => JSON.stringify(p.bg.gradient) === JSON.stringify(bg.gradient))?.id ?? null
      )
    if (bg.type === 'image') return all.find((p) => p.bg.imageUrl === bg.imageUrl)?.id ?? null
    return null
  })()

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleApply = (newBg: BackgroundConfig) => updateBackground(newBg)

  const handleLocalImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => handleApply({ type: 'image', imageUrl: ev.target?.result as string })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="flex h-full gap-3 p-2 min-w-0 w-full overflow-hidden">
      {/* ── Left: preview + import ── */}
      <div className="flex flex-col gap-2 shrink-0 w-36">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Background
        </p>

        <div className="w-full aspect-video rounded-md border" style={bgStyle} />

        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs w-full"
          onClick={() => handleApply(DEFAULT_BACKGROUND)}
          disabled={bg.type === 'none'}
        >
          <ImageOff className="h-3 w-3 mr-1" />
          Clear
        </Button>

        <div className="flex flex-col gap-1 mt-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Import</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLocalImport}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs w-full justify-start"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-3 w-3 mr-1.5" />
            From device
          </Button>

          <Button variant="outline" size="sm" className="h-7 text-xs w-full justify-start" disabled>
            <Palette className="h-3 w-3 mr-1.5" />
            Pexels
          </Button>

          <Button variant="outline" size="sm" className="h-7 text-xs w-full justify-start" disabled>
            <Palette className="h-3 w-3 mr-1.5" />
            Freepik
          </Button>
        </div>
      </div>

      {/* ── Right: accordion (single scroll area wrapping everything) ── */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <ScrollArea className="h-full">
          {/* all sections collapsed — no defaultValue */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="colors">
              <AccordionTrigger className="py-2 text-sm font-medium">Colors</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-3 pb-2">
                  <PresetGrid
                    presets={SOLID_PRESETS}
                    activeId={activePresetId}
                    onSelect={(p) => handleApply(p.bg)}
                  />
                  <div className="px-1 flex items-center gap-2">
                    <p className="text-xs text-muted-foreground shrink-0">Custom:</p>
                    <input
                      type="color"
                      defaultValue="#000000"
                      onChange={(e) => handleApply({ type: 'color', color: e.target.value })}
                      className="h-7 w-10 rounded border cursor-pointer bg-transparent"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="gradients">
              <AccordionTrigger className="py-2 text-sm font-medium">Gradients</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-3 pb-2">
                  <PresetGrid
                    presets={GRADIENT_PRESETS}
                    activeId={activePresetId}
                    onSelect={(p) => handleApply(p.bg)}
                  />
                  <div className="px-1">
                    <GradientBuilder onApply={handleApply} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="bible">
              <AccordionTrigger className="py-2 text-sm font-medium">Bibles</AccordionTrigger>
              <AccordionContent>
                <PresetGrid
                  presets={BIBLE_PRESETS}
                  activeId={activePresetId}
                  onSelect={(p) => handleApply(p.bg)}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="animated">
              <AccordionTrigger className="py-2 text-sm font-medium">Animated</AccordionTrigger>
              <AccordionContent>
                <PresetGrid
                  presets={ANIMATED_PRESETS}
                  activeId={activePresetId}
                  onSelect={(p) => handleApply(p.bg)}
                />
              </AccordionContent>
            </AccordionItem>

            {/* ── Custom (saved locally) ── */}
            <AccordionItem value="custom">
              <AccordionTrigger className="py-2 text-sm font-medium">Custom</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-2 pb-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs w-full"
                    onClick={saveCustomPreset}
                    disabled={bg.type === 'none'}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Save current background
                  </Button>

                  {customPresets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground gap-2">
                      <ImageOff className="h-5 w-5 opacity-30" />
                      <p className="text-xs">No saved backgrounds</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-1.5 p-1">
                      {customPresets.map((preset) => (
                        <div key={preset.id} className="relative group">
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleApply(preset.bg)}
                                  className={cn(
                                    'aspect-video w-full rounded-md border-2 transition-all hover:scale-105',
                                    activePresetId === preset.id
                                      ? 'border-primary ring-1 ring-primary'
                                      : 'border-transparent hover:border-muted-foreground/50'
                                  )}
                                  style={{ background: preset.thumbnail }}
                                />
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="text-xs">{preset.name}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {/* delete on hover */}
                          <button
                            onClick={() => deleteCustomPreset(preset.id)}
                            className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-destructive/80 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollArea>
      </div>
    </div>
  )
}

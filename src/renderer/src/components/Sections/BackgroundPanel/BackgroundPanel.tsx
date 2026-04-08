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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/utils'
import { Upload, Palette, ImageOff } from 'lucide-react'

// ── Custom gradient builder ────────────────────────────────────────────────

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

// ── Preset grid ────────────────────────────────────────────────────────────

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

// ── Main component ─────────────────────────────────────────────────────────

export function BackgroundPanel() {
  const { t } = useTranslation()
  const { config, updateBackground } = useBibleContext()

  const bg = config.background ?? DEFAULT_BACKGROUND
  const bgStyle = getBackgroundStyle(bg)

  // Track which preset is active for highlight
  const activePresetId =
    bg.type === 'color'
      ? (SOLID_PRESETS.find((p) => p.bg.color === bg.color)?.id ?? null)
      : bg.type === 'gradient'
        ? (GRADIENT_PRESETS.find(
            (p) => JSON.stringify(p.bg.gradient) === JSON.stringify(bg.gradient)
          )?.id ?? null)
        : bg.type === 'image'
          ? (BIBLE_PRESETS.find((p) => p.bg.imageUrl === bg.imageUrl)?.id ?? null)
          : null

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleApply = (newBg: BackgroundConfig) => {
    updateBackground(newBg)
  }

  const handleLocalImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      handleApply({ type: 'image', imageUrl: dataUrl })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="flex h-full gap-3 p-2 min-w-0 w-full">
      {/* ── Left: current preview + import ── */}
      <div className="flex flex-col gap-2 shrink-0 w-36">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Background
        </p>

        {/* Current selection preview */}
        <div className="w-full aspect-video rounded-md border" style={bgStyle} />

        {/* Clear button */}
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

        {/* Import section */}
        <div className="flex flex-col gap-1 mt-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Import</p>

          {/* Local file */}
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

          {/* Pexels placeholder */}
          <Button variant="outline" size="sm" className="h-7 text-xs w-full justify-start" disabled>
            <Palette className="h-3 w-3 mr-1.5" />
            Pexels
          </Button>

          {/* Freepik placeholder */}
          <Button variant="outline" size="sm" className="h-7 text-xs w-full justify-start" disabled>
            <Palette className="h-3 w-3 mr-1.5" />
            Freepik
          </Button>
        </div>
      </div>

      {/* ── Right: preset browser ── */}
      <div className="flex-1 min-w-0 flex  w-full">
        <Tabs defaultValue="colors" className=" h-full w-full">
          <TabsList className=" w-fit mb-1">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="gradients">Gradients</TabsTrigger>
            <TabsTrigger value="bible">Bibles</TabsTrigger>
            <TabsTrigger value="animated">Animated</TabsTrigger>
          </TabsList>

          {/* Colors */}
          <TabsContent value="colors" className="mt-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="flex flex-col gap-3">
                <PresetGrid
                  presets={SOLID_PRESETS}
                  activeId={activePresetId}
                  onSelect={(p) => handleApply(p.bg)}
                />
                {/* Custom color picker */}
                <div className="px-1 pb-2 flex items-center gap-2">
                  <p className="text-xs text-muted-foreground shrink-0">Custom:</p>
                  <input
                    type="color"
                    defaultValue="#000000"
                    onChange={(e) => handleApply({ type: 'color', color: e.target.value })}
                    className="h-7 w-10 rounded border cursor-pointer bg-transparent"
                  />
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Gradients */}
          <TabsContent value="gradients" className="mt-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
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
            </ScrollArea>
          </TabsContent>

          {/* Bible */}
          <TabsContent value="bible" className="mt-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <PresetGrid
                presets={BIBLE_PRESETS}
                activeId={activePresetId}
                onSelect={(p) => handleApply(p.bg)}
              />
            </ScrollArea>
          </TabsContent>

          {/* Animated */}
          <TabsContent value="animated" className="mt-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <PresetGrid
                presets={ANIMATED_PRESETS}
                activeId={activePresetId}
                onSelect={(p) => handleApply(p.bg)}
              />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

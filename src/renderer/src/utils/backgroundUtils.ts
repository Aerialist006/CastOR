import type { BackgroundConfig } from '@/types/background'
import type React from 'react'

// ── CSS resolver ───────────────────────────────────────────────────────────

export function getBackgroundStyle(bg: BackgroundConfig | undefined): React.CSSProperties {
  if (!bg || bg.type === 'none') return { background: '#000' }

  if (bg.type === 'color') return { background: bg.color ?? '#000' }

  if (bg.type === 'gradient' && bg.gradient) {
    const { kind, angle = 135, stops } = bg.gradient
    const stopStr = stops.map((s) => `${s.color} ${s.position}%`).join(', ')
    return {
      background:
        kind === 'linear'
          ? `linear-gradient(${angle}deg, ${stopStr})`
          : `radial-gradient(ellipse at center, ${stopStr})`
    }
  }

  if ((bg.type === 'image' || bg.type === 'animated') && bg.imageUrl) {
    return {
      backgroundImage: `url(${bg.imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
      backgroundRepeat: 'no-repeat'
    }
  }

  return { background: '#000' }
}

// ── Preset data ────────────────────────────────────────────────────────────

export interface BgPreset {
  id: string
  name: string
  bg: BackgroundConfig
  thumbnail: string // inline CSS background shorthand for the thumbnail swatch
}

export const SOLID_PRESETS: BgPreset[] = [
  { id: 'black', name: 'Black', bg: { type: 'color', color: '#000000' }, thumbnail: '#000000' },
  { id: 'navy', name: 'Navy', bg: { type: 'color', color: '#0a0e27' }, thumbnail: '#0a0e27' },
  {
    id: 'deep-blue',
    name: 'Deep Blue',
    bg: { type: 'color', color: '#03045e' },
    thumbnail: '#03045e'
  },
  {
    id: 'dark-slate',
    name: 'Dark Slate',
    bg: { type: 'color', color: '#0f1419' },
    thumbnail: '#0f1419'
  },
  {
    id: 'burgundy',
    name: 'Burgundy',
    bg: { type: 'color', color: '#3d0e0e' },
    thumbnail: '#3d0e0e'
  },
  { id: 'forest', name: 'Forest', bg: { type: 'color', color: '#0d2b0d' }, thumbnail: '#0d2b0d' },
  {
    id: 'charcoal',
    name: 'Charcoal',
    bg: { type: 'color', color: '#1a1a1a' },
    thumbnail: '#1a1a1a'
  },
  {
    id: 'dark-purple',
    name: 'Dark Purple',
    bg: { type: 'color', color: '#1a0a2e' },
    thumbnail: '#1a0a2e'
  },
  {
    id: 'dark-teal',
    name: 'Dark Teal',
    bg: { type: 'color', color: '#012a2a' },
    thumbnail: '#012a2a'
  }
]

export const GRADIENT_PRESETS: BgPreset[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    bg: {
      type: 'gradient',
      gradient: {
        kind: 'linear',
        angle: 135,
        stops: [
          { color: '#0a0e27', position: 0 },
          { color: '#1a2a6c', position: 100 }
        ]
      }
    },
    thumbnail: 'linear-gradient(135deg, #0a0e27 0%, #1a2a6c 100%)'
  },
  {
    id: 'ember',
    name: 'Ember',
    bg: {
      type: 'gradient',
      gradient: {
        kind: 'linear',
        angle: 135,
        stops: [
          { color: '#1a0505', position: 0 },
          { color: '#5c1010', position: 100 }
        ]
      }
    },
    thumbnail: 'linear-gradient(135deg, #1a0505 0%, #5c1010 100%)'
  },
  {
    id: 'deep-ocean',
    name: 'Deep Ocean',
    bg: {
      type: 'gradient',
      gradient: {
        kind: 'radial',
        stops: [
          { color: '#012b45', position: 0 },
          { color: '#000508', position: 100 }
        ]
      }
    },
    thumbnail: 'radial-gradient(ellipse at center, #012b45 0%, #000508 100%)'
  },
  {
    id: 'royal',
    name: 'Royal',
    bg: {
      type: 'gradient',
      gradient: {
        kind: 'linear',
        angle: 160,
        stops: [
          { color: '#0e0a1a', position: 0 },
          { color: '#2d1b69', position: 100 }
        ]
      }
    },
    thumbnail: 'linear-gradient(160deg, #0e0a1a 0%, #2d1b69 100%)'
  },
  {
    id: 'forest-depth',
    name: 'Forest Depth',
    bg: {
      type: 'gradient',
      gradient: {
        kind: 'linear',
        angle: 180,
        stops: [
          { color: '#0a1a0a', position: 0 },
          { color: '#1a3a1a', position: 100 }
        ]
      }
    },
    thumbnail: 'linear-gradient(180deg, #0a1a0a 0%, #1a3a1a 100%)'
  },
  {
    id: 'sunrise',
    name: 'Sunrise',
    bg: {
      type: 'gradient',
      gradient: {
        kind: 'linear',
        angle: 180,
        stops: [
          { color: '#1a0a00', position: 0 },
          { color: '#3d1a00', position: 50 },
          { color: '#5c2a00', position: 100 }
        ]
      }
    },
    thumbnail: 'linear-gradient(180deg, #1a0a00 0%, #3d1a00 50%, #5c2a00 100%)'
  },
  {
    id: 'cosmic',
    name: 'Cosmic',
    bg: {
      type: 'gradient',
      gradient: {
        kind: 'radial',
        stops: [
          { color: '#1a0a2e', position: 0 },
          { color: '#000000', position: 70 }
        ]
      }
    },
    thumbnail: 'radial-gradient(ellipse at center, #1a0a2e 0%, #000000 70%)'
  },
  {
    id: 'slate-blue',
    name: 'Slate Blue',
    bg: {
      type: 'gradient',
      gradient: {
        kind: 'linear',
        angle: 120,
        stops: [
          { color: '#0f1419', position: 0 },
          { color: '#1e2d4a', position: 100 }
        ]
      }
    },
    thumbnail: 'linear-gradient(120deg, #0f1419 0%, #1e2d4a 100%)'
  }
]

// For bible / animated categories you can add image presets here once you have files.
// Example shape:
// export const BIBLE_PRESETS: BgPreset[] = [
//   { id: 'cross', name: 'Cross', bg: { type: 'image', imageUrl: '/presets/cross.jpg' }, thumbnail: '/presets/cross.jpg' },
// ]
export const BIBLE_PRESETS: BgPreset[] = []
export const ANIMATED_PRESETS: BgPreset[] = []

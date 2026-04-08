export type BgType = 'none' | 'color' | 'gradient' | 'image' | 'animated'

export interface GradientStop {
  color: string
  position: number // 0–100
}

export interface BackgroundConfig {
  type: BgType
  color?: string
  gradient?: {
    kind: 'linear' | 'radial'
    angle?: number // degrees, linear only
    stops: GradientStop[]
  }
  imageUrl?: string  // base64 for local imports, CSS url() for presets
  animationId?: string
}

export const DEFAULT_BACKGROUND: BackgroundConfig = { type: 'none' }
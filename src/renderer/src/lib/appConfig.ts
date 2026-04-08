import type { BackgroundConfig } from '@/types/background'
import { DEFAULT_BACKGROUND } from '@/types/background'

export interface AppConfig {
  activeBibleId: string
  versesDisplayed: number
  fontSize: number
  showVerseNumbers: boolean
  showVerseRef: boolean
  showBibleVersion: boolean // show "KJV" / "RV1960" next to the ref
  refSyncSize: boolean // ref font size follows verse size automatically
  refFontSize: number // manual ref font size (used when refSyncSize=false)
  castMonitorIndex: number
  textAlign: 'left' | 'center' | 'right'
  lineHeight: number
  marginTop: number
  marginBottom: number
  marginLeft: number
  marginRight: number
  fontFamily: string
  textShadow: boolean
  textShadowBlur: number
  textShadowColor: string
  textOutline: boolean
  textOutlineWidth: number
  aspectRatio: '16:9' | '4:3'
  textOutlineColor: string
  autoSizeFit: boolean
  background?: BackgroundConfig
  foldbackEnabled?: boolean
  foldbackMonitorIndex?: number // -1 = auto (third monitor)
  foldbackShowChords?: boolean
  foldbackShowNextVerse?: boolean
  foldbackFontSize?: number
  foldbackDarkMode?: boolean
}

export const DEFAULT_CONFIG: AppConfig = {
  activeBibleId: 'kjv',
  versesDisplayed: 5,
  fontSize: 48,
  showVerseNumbers: true,
  showVerseRef: true,
  showBibleVersion: false,
  refSyncSize: true,
  refFontSize: 22,
  castMonitorIndex: -1,
  textAlign: 'center',
  lineHeight: 1.6,
  marginTop: 8,
  marginBottom: 8,
  marginLeft: 8,
  marginRight: 8,
  fontFamily: 'Inter, sans-serif',
  textShadow: false,
  textShadowBlur: 8,
  textShadowColor: '#000000',
  textOutline: false,
  textOutlineWidth: 2,
  textOutlineColor: '#000000',
  aspectRatio: '16:9',
  autoSizeFit: false,
  background: DEFAULT_BACKGROUND,
  foldbackEnabled: false,
  foldbackMonitorIndex: -1,
  foldbackShowChords: true,
  foldbackShowNextVerse: true,
  foldbackFontSize: 48,
  foldbackDarkMode: false,
}

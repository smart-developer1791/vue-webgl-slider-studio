export const EFFECT_IDS = [
  'displacement',
  'liquid',
  'glitch',
  'pixelate',
  'dissolve',
  'ripple',
  'zoomBlur',
  'slices',
] as const
export type EffectId = (typeof EFFECT_IDS)[number]

export const EASING_IDS = ['linear', 'easeInOutCubic', 'easeInOutQuart', 'easeInOutExpo', 'easeOutExpo'] as const
export type EasingId = (typeof EASING_IDS)[number]

export type SlideEffect = 'inherit' | EffectId

export interface Slide {
  id: string
  /** http(s) URL, or `idb:<id>` for images uploaded into IndexedDB */
  image: string
  title: string
  subtitle: string
  buttonText: string
  buttonUrl: string
  /** Effect used for the transition *into* this slide */
  effect: SlideEffect
}

export const INDICATORS = ['progress', 'dots', 'none'] as const
export type Indicator = (typeof INDICATORS)[number]
export const TEXT_ANIMATIONS = ['letters', 'fadeUp', 'blurIn'] as const
export type TextAnimation = (typeof TEXT_ANIMATIONS)[number]
export const TEXT_POSITIONS = ['bottomLeft', 'middleLeft', 'center'] as const
export type TextPosition = (typeof TEXT_POSITIONS)[number]
export const FONT_IDS = ['cormorant', 'unbounded', 'manrope'] as const
export type FontId = (typeof FONT_IDS)[number]

export interface TransitionSettings {
  effect: EffectId
  /** Pick a different random effect on every transition */
  random: boolean
  duration: number
  easing: EasingId
  intensity: number
  edgeColor: string
}

export interface InteractionSettings {
  hover: boolean
  hoverStrength: number
  hoverRadius: number
  drag: boolean
  dragSensitivity: number
  wheel: boolean
  keyboard: boolean
  loop: boolean
}

export interface AutoplaySettings {
  enabled: boolean
  interval: number
  pauseOnHover: boolean
}

export interface AppearanceSettings {
  arrows: boolean
  indicator: Indicator
  counter: boolean
  textAnimation: TextAnimation
  textPosition: TextPosition
  font: FontId
  textScale: number
  textColor: string
  accent: string
  overlay: number
  grain: number
  vignette: number
}

export interface FxSettings {
  kenBurns: number
  parallax: number
  ambient: number
  chroma: number
  cursor: boolean
}

export interface SliderConfig {
  version: 1
  slides: Slide[]
  transition: TransitionSettings
  effectParams: Record<EffectId, number[]>
  interaction: InteractionSettings
  autoplay: AutoplaySettings
  appearance: AppearanceSettings
  fx: FxSettings
}

export type PresetSettings = Omit<SliderConfig, 'version' | 'slides'>

export interface Preset {
  id: string
  name: string
  builtIn?: boolean
  settings: PresetSettings
}

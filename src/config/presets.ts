import { defaultConfig } from './defaults'
import type { Preset, PresetSettings } from './types'

function preset(id: string, name: string, mod: (s: PresetSettings) => void): Preset {
  const { version: _v, slides: _s, ...settings } = defaultConfig()
  mod(settings)
  return { id, name, builtIn: true, settings }
}

export const BUILT_IN_PRESETS: Preset[] = [
  preset('cinematic', 'Cinematic', () => {}),
  preset('liquid', 'Liquid', (s) => {
    s.transition = { ...s.transition, effect: 'liquid', duration: 1900, easing: 'easeInOutQuart', edgeColor: '#7cc8ff' }
    s.interaction.hoverStrength = 0.9
    s.interaction.hoverRadius = 0.45
    s.fx = { ...s.fx, ambient: 0.7, kenBurns: 0.4, chroma: 0.25 }
    s.appearance = {
      ...s.appearance,
      font: 'manrope',
      textAnimation: 'fadeUp',
      accent: '#7cc8ff',
      textColor: '#ffffff',
      grain: 0.12,
      vignette: 0.35,
    }
  }),
  preset('glitch', 'Glitch', (s) => {
    s.transition = { ...s.transition, effect: 'glitch', duration: 900, easing: 'easeOutExpo', intensity: 1.2 }
    s.autoplay.interval = 4000
    s.fx = { ...s.fx, chroma: 0.9, kenBurns: 0.25, ambient: 0.1, parallax: 0.7 }
    s.appearance = {
      ...s.appearance,
      font: 'unbounded',
      textAnimation: 'letters',
      textPosition: 'middleLeft',
      accent: '#3dff9e',
      textColor: '#ffffff',
      grain: 0.5,
      vignette: 0.55,
      indicator: 'dots',
    }
  }),
  preset('minimal', 'Minimal', (s) => {
    s.transition = { ...s.transition, effect: 'slices', duration: 1300, easing: 'easeInOutCubic', intensity: 0.8 }
    s.interaction.hoverStrength = 0.3
    s.fx = { ...s.fx, kenBurns: 0.3, parallax: 0.3, ambient: 0, chroma: 0 }
    s.appearance = {
      ...s.appearance,
      font: 'manrope',
      textAnimation: 'blurIn',
      textPosition: 'center',
      accent: '#f2f2f2',
      textColor: '#ffffff',
      overlay: 0.4,
      grain: 0,
      vignette: 0.2,
      textScale: 0.85,
    }
  }),
]

import type { EffectId, PresetSettings, Slide, SliderConfig } from './types'

export type SectionKey = 'transition' | 'interaction' | 'autoplay' | 'appearance' | 'fx'

export type Action =
  | { type: 'patch'; section: SectionKey; value: object }
  | { type: 'effectParam'; effect: EffectId; index: number; value: number }
  | { type: 'addSlides'; slides: Slide[] }
  | { type: 'updateSlide'; id: string; value: Partial<Slide> }
  | { type: 'removeSlide'; id: string }
  | { type: 'moveSlide'; from: number; to: number }
  | { type: 'applyPreset'; settings: PresetSettings }
  | { type: 'replace'; config: SliderConfig }

export function reducer(state: SliderConfig, action: Action): SliderConfig {
  switch (action.type) {
    case 'patch':
      return { ...state, [action.section]: { ...state[action.section], ...action.value } }
    case 'effectParam': {
      const params = [...state.effectParams[action.effect]]
      params[action.index] = action.value
      return { ...state, effectParams: { ...state.effectParams, [action.effect]: params } }
    }
    case 'addSlides':
      return { ...state, slides: [...state.slides, ...action.slides] }
    case 'updateSlide':
      return { ...state, slides: state.slides.map((s) => (s.id === action.id ? { ...s, ...action.value } : s)) }
    case 'removeSlide':
      return { ...state, slides: state.slides.filter((s) => s.id !== action.id) }
    case 'moveSlide': {
      const { from, to } = action
      if (from === to || to < 0 || to >= state.slides.length) return state
      const slides = [...state.slides]
      const [item] = slides.splice(from, 1)
      slides.splice(to, 0, item)
      return { ...state, slides }
    }
    case 'applyPreset':
      return { ...state, ...structuredClone(action.settings) }
    case 'replace':
      return action.config
  }
}


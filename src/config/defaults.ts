import { EFFECTS } from '@/webgl/effects'
import { EFFECT_IDS, type EffectId, type Slide, type SliderConfig } from './types'

export function createId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=2200&q=80`

const DEFAULT_SLIDES: Omit<Slide, 'id'>[] = [
  {
    image: img('photo-1511884642898-4c92249e20b6'),
    title: 'Northern Forest',
    subtitle: 'Mist drifts between the treetops — quiet and slow, at dawn.',
    buttonText: 'Explore',
    buttonUrl: '#',
    effect: 'inherit',
  },
  {
    image: img('photo-1535391879778-3bae11d29a24'),
    title: 'City After Rain',
    subtitle: 'Neon reflects on wet pavement and glows until morning.',
    buttonText: 'View',
    buttonUrl: '#',
    effect: 'inherit',
  },
  {
    image: img('photo-1508624217470-5ef0f947d8be'),
    title: 'The Shoreline',
    subtitle: 'From above, the ocean looks like a living texture — a shader brought to life.',
    buttonText: 'Learn more',
    buttonUrl: '#',
    effect: 'inherit',
  },
  {
    image: img('photo-1621795307430-3ff25aa08945'),
    title: 'Sand and Light',
    subtitle: 'The dunes change shape every day. Every frame is one of a kind.',
    buttonText: 'Discover',
    buttonUrl: '#',
    effect: 'inherit',
  },
]

export function newSlide(image = ''): Slide {
  return { id: createId(), image, title: '', subtitle: '', buttonText: '', buttonUrl: '', effect: 'inherit' }
}

export function defaultEffectParams() {
  return Object.fromEntries(EFFECT_IDS.map((id) => [id, EFFECTS[id].params.map((p) => p.default)])) as Record<
    EffectId,
    number[]
  >
}

export function defaultConfig(): SliderConfig {
  return {
    version: 1,
    slides: DEFAULT_SLIDES.map((s) => ({ ...s, id: createId() })),
    transition: {
      effect: 'dissolve',
      random: false,
      duration: 1600,
      easing: 'easeInOutCubic',
      intensity: 1,
      edgeColor: '#ff8a3d',
    },
    effectParams: defaultEffectParams(),
    interaction: {
      hover: true,
      hoverStrength: 0.6,
      hoverRadius: 0.35,
      drag: true,
      dragSensitivity: 1,
      wheel: true,
      keyboard: true,
      loop: true,
    },
    autoplay: { enabled: true, interval: 6000, pauseOnHover: true },
    appearance: {
      arrows: true,
      indicator: 'progress',
      counter: true,
      textAnimation: 'letters',
      textPosition: 'bottomLeft',
      font: 'cormorant',
      textScale: 1,
      textColor: '#f5f1ea',
      accent: '#ff8a3d',
      overlay: 0.55,
      grain: 0.22,
      vignette: 0.45,
    },
    fx: { kenBurns: 0.6, parallax: 0.5, ambient: 0.3, chroma: 0.35, cursor: true },
  }
}

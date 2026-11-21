import type { EasingId } from '@/config/types'

export type EasingFn = (t: number) => number

export const EASINGS: Record<EasingId, EasingFn> = {
  linear: (t) => t,
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  easeInOutQuart: (t) => (t < 0.5 ? 8 * t ** 4 : 1 - Math.pow(-2 * t + 2, 4) / 2),
  easeInOutExpo: (t) =>
    t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
  easeOutExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
}

export const EASING_LABELS: Record<EasingId, string> = {
  linear: 'Linear',
  easeInOutCubic: 'In-Out Cubic',
  easeInOutQuart: 'In-Out Quart',
  easeInOutExpo: 'In-Out Expo',
  easeOutExpo: 'Out Expo',
}

export const easeOutCubic: EasingFn = (t) => 1 - Math.pow(1 - t, 3)

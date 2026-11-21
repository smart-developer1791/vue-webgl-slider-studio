import type { FontId } from '@/config/types'

export interface CaptionState {
  index: number
  key: number
  delay: number
}

export const FONTS: Record<FontId, { label: string; family: string; weight: number; tracking: string; leading: number; size: number }> = {
  cormorant: { label: 'Cormorant', family: "'Cormorant Garamond', serif", weight: 500, tracking: '-0.015em', leading: 0.92, size: 8.6 },
  unbounded: { label: 'Unbounded', family: "'Unbounded', sans-serif", weight: 500, tracking: '-0.035em', leading: 1.02, size: 5.6 },
  manrope: { label: 'Manrope', family: "'Manrope', sans-serif", weight: 700, tracking: '-0.05em', leading: 0.96, size: 7 },
}

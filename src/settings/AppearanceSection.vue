<script setup lang="ts">
import { computed } from 'vue'
import { Palette } from '@lucide/vue'
import { useStudio } from '@/config/studio'
import { FONT_IDS } from '@/config/types'
import { FONTS } from '@/slider/captions'
import ColorField from './controls/ColorField.vue'
import RangeField from './controls/RangeField.vue'
import Section from './controls/Section.vue'
import Segmented from './controls/Segmented.vue'
import Toggle from './controls/Toggle.vue'
import { percent } from './formats'

const { config, patch } = useStudio()
const look = computed(() => config.value.appearance)
const fonts = FONT_IDS.map((id) => ({ value: id, label: FONTS[id].label }))
const animations = [
  { value: 'letters', label: 'Letters' },
  { value: 'fadeUp', label: 'Fade up' },
  { value: 'blurIn', label: 'Blur in' },
] as const
const positions = [
  { value: 'bottomLeft', label: 'Bottom' },
  { value: 'middleLeft', label: 'Left' },
  { value: 'center', label: 'Center' },
] as const
const indicators = [
  { value: 'progress', label: 'Progress' },
  { value: 'dots', label: 'Dots' },
  { value: 'none', label: 'None' },
] as const
</script>

<template>
  <Section :icon="Palette" title="Appearance">
    <Segmented label="Heading font" :model-value="look.font" :options="fonts" @update:model-value="patch('appearance', { font: $event })" />
    <Segmented label="Text entrance" :model-value="look.textAnimation" :options="animations" @update:model-value="patch('appearance', { textAnimation: $event })" />
    <Segmented label="Text position" :model-value="look.textPosition" :options="positions" @update:model-value="patch('appearance', { textPosition: $event })" />
    <RangeField label="Text size" :model-value="look.textScale" :min="0.5" :max="1.6" :step="0.01" :format="percent" @update:model-value="patch('appearance', { textScale: $event })" />
    <div class="grid grid-cols-2 gap-3">
      <ColorField label="Text color" :model-value="look.textColor" @update:model-value="patch('appearance', { textColor: $event })" />
      <ColorField label="Accent" :model-value="look.accent" @update:model-value="patch('appearance', { accent: $event })" />
    </div>
    <RangeField label="Text backdrop" :model-value="look.overlay" :min="0" :max="1" :step="0.01" :format="percent" @update:model-value="patch('appearance', { overlay: $event })" />
    <RangeField label="Film grain" :model-value="look.grain" :min="0" :max="1" :step="0.01" :format="percent" @update:model-value="patch('appearance', { grain: $event })" />
    <RangeField label="Vignette" :model-value="look.vignette" :min="0" :max="1" :step="0.01" :format="percent" @update:model-value="patch('appearance', { vignette: $event })" />
    <Segmented label="Indicator" :model-value="look.indicator" :options="indicators" @update:model-value="patch('appearance', { indicator: $event })" />
    <Toggle label="Arrows" :model-value="look.arrows" @update:model-value="patch('appearance', { arrows: $event })" />
    <Toggle label="Slide counter" :model-value="look.counter" @update:model-value="patch('appearance', { counter: $event })" />
  </Section>
</template>

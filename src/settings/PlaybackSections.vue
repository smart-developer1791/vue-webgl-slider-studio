<script setup lang="ts">
import { computed } from 'vue'
import { Clapperboard, MousePointer2, Timer } from '@lucide/vue'
import { useStudio } from '@/config/studio'
import RangeField from './controls/RangeField.vue'
import Section from './controls/Section.vue'
import Toggle from './controls/Toggle.vue'
import { percent, seconds } from './formats'

const { config, patch } = useStudio()
const fx = computed(() => config.value.fx)
const interaction = computed(() => config.value.interaction)
const autoplay = computed(() => config.value.autoplay)
const decimal = (v: number) => v.toFixed(2)
const multiplier = (v: number) => `×${v.toFixed(2)}`
</script>

<template>
  <Section :icon="Clapperboard" title="Cinematic effects" default-open>
    <RangeField label="Ken Burns — slow zoom" :model-value="fx.kenBurns" :min="0" :max="1" :step="0.01" :format="percent" @update:model-value="patch('fx', { kenBurns: $event })" />
    <RangeField label="Depth parallax" :model-value="fx.parallax" :min="0" :max="1" :step="0.01" :format="percent" @update:model-value="patch('fx', { parallax: $event })" />
    <RangeField label="Ambient motion" :model-value="fx.ambient" :min="0" :max="1" :step="0.01" :format="percent" @update:model-value="patch('fx', { ambient: $event })" />
    <RangeField label="Lens aberration" :model-value="fx.chroma" :min="0" :max="1" :step="0.01" :format="percent" @update:model-value="patch('fx', { chroma: $event })" />
    <Toggle label="Custom cursor" hint="A Drag ring that shrinks over buttons" :model-value="fx.cursor" @update:model-value="patch('fx', { cursor: $event })" />
  </Section>
  <Section :icon="MousePointer2" title="Interaction">
    <Toggle label="Cursor distortion" hint="Lens and RGB shift driven by pointer speed" :model-value="interaction.hover" @update:model-value="patch('interaction', { hover: $event })" />
    <template v-if="interaction.hover">
      <RangeField label="Strength" :model-value="interaction.hoverStrength" :min="0" :max="2" :step="0.01" :format="percent" @update:model-value="patch('interaction', { hoverStrength: $event })" />
      <RangeField label="Radius" :model-value="interaction.hoverRadius" :min="0.05" :max="1" :step="0.01" :format="decimal" @update:model-value="patch('interaction', { hoverRadius: $event })" />
    </template>
    <Toggle label="Drag and swipe" hint="The transition follows your finger with inertia" :model-value="interaction.drag" @update:model-value="patch('interaction', { drag: $event })" />
    <RangeField v-if="interaction.drag" label="Sensitivity" :model-value="interaction.dragSensitivity" :min="0.3" :max="3" :step="0.05" :format="multiplier" @update:model-value="patch('interaction', { dragSensitivity: $event })" />
    <Toggle label="Mouse wheel and trackpad" :model-value="interaction.wheel" @update:model-value="patch('interaction', { wheel: $event })" />
    <Toggle label="Arrow keys ← →" :model-value="interaction.keyboard" @update:model-value="patch('interaction', { keyboard: $event })" />
    <Toggle label="Infinite loop" :model-value="interaction.loop" @update:model-value="patch('interaction', { loop: $event })" />
  </Section>
  <Section :icon="Timer" title="Autoplay">
    <template #aside><span class="font-mono text-[11px] text-white/35">{{ autoplay.enabled ? 'on' : 'off' }}</span></template>
    <Toggle label="Enable autoplay" :model-value="autoplay.enabled" @update:model-value="patch('autoplay', { enabled: $event })" />
    <RangeField label="Interval" :model-value="autoplay.interval" :min="1500" :max="12000" :step="250" :format="seconds" @update:model-value="patch('autoplay', { interval: $event })" />
    <Toggle label="Pause on hover" :model-value="autoplay.pauseOnHover" @update:model-value="patch('autoplay', { pauseOnHover: $event })" />
  </Section>
</template>

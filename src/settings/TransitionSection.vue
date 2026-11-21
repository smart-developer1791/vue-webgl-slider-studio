<script setup lang="ts">
import { computed } from 'vue'
import { Play, Wand2 } from '@lucide/vue'
import { useStudio } from '@/config/studio'
import { EASING_IDS, EFFECT_IDS, type EffectId } from '@/config/types'
import { EASING_LABELS } from '@/webgl/easing'
import { EFFECTS } from '@/webgl/effects'
import ColorField from './controls/ColorField.vue'
import RangeField from './controls/RangeField.vue'
import Section from './controls/Section.vue'
import Segmented from './controls/Segmented.vue'
import SelectField from './controls/SelectField.vue'
import StudioButton from './controls/StudioButton.vue'
import Toggle from './controls/Toggle.vue'
import { percent, seconds } from './formats'

const { config, engine, patch, dispatch } = useStudio()
const transition = computed(() => config.value.transition)
const effect = computed(() => EFFECTS[transition.value.effect])
const params = computed(() => config.value.effectParams[transition.value.effect])
const easingOptions = EASING_IDS.map((id) => ({ value: id, label: EASING_LABELS[id] }))
const formatParam = (value: number, step: number) => step >= 1 ? String(value) : value.toFixed(step >= 0.01 ? 2 : 3)

function chooseEffect(id: EffectId) {
  patch('transition', { effect: id })
  requestAnimationFrame(() => engine.value?.replay())
}

function setParam(index: number, value: number) {
  dispatch({ type: 'effectParam', effect: transition.value.effect, index, value })
}

function resetParams() {
  effect.value.params.forEach((param, index) => setParam(index, param.default))
}
</script>

<template>
  <Section :icon="Wand2" title="Transition" default-open>
    <div class="grid grid-cols-2 gap-1.5">
      <button
        v-for="id in EFFECT_IDS"
        :key="id"
        type="button"
        class="rounded-lg border px-3 py-2.5 text-left transition-colors"
        :class="id === transition.effect ? 'bg-white/[0.06]' : 'border-white/[0.06] hover:border-white/15 hover:bg-white/[0.025]'"
        :style="id === transition.effect ? { borderColor: 'var(--ui-accent)' } : undefined"
        @click="chooseEffect(id)"
      >
        <span class="block text-[12.5px] font-semibold text-white/90">{{ EFFECTS[id].name }}</span>
        <span class="mt-0.5 block text-[10.5px] leading-snug text-white/40">{{ EFFECTS[id].description }}</span>
      </button>
    </div>
    <Toggle
      label="Random effect"
      hint="A new effect for each transition, with no consecutive repeats"
      :model-value="transition.random"
      @update:model-value="patch('transition', { random: $event })"
    />
    <StudioButton variant="primary" :icon="Play" class="w-full" :disabled="config.slides.length < 2" @click="engine?.replay()">Play transition</StudioButton>
    <RangeField label="Duration" :model-value="transition.duration" :min="300" :max="3000" :step="50" :format="seconds" @update:model-value="patch('transition', { duration: $event })" />
    <SelectField label="Easing curve" :model-value="transition.easing" :options="easingOptions" @update:model-value="patch('transition', { easing: $event })" />
    <RangeField label="Intensity" :model-value="transition.intensity" :min="0" :max="2" :step="0.01" :format="percent" @update:model-value="patch('transition', { intensity: $event })" />
    <div class="space-y-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <p class="font-mono text-[10px] tracking-[0.18em] text-white/40 uppercase">Parameters · {{ effect.name }}</p>
      <template v-for="(param, i) in effect.params" :key="param.label">
        <Segmented
          v-if="param.options"
          :label="param.label"
          :model-value="params[i]"
          :options="param.options.map((label, value) => ({ label, value }))"
          @update:model-value="setParam(i, $event)"
        />
        <RangeField
          v-else
          :label="param.label"
          :model-value="params[i]"
          :min="param.min"
          :max="param.max"
          :step="param.step"
          :format="(value) => formatParam(value, param.step)"
          @update:model-value="setParam(i, $event)"
        />
      </template>
      <ColorField v-if="transition.effect === 'dissolve'" label="Edge color" :model-value="transition.edgeColor" @update:model-value="patch('transition', { edgeColor: $event })" />
      <button type="button" class="text-[11px] text-white/40 underline-offset-2 hover:text-white/70 hover:underline" @click="resetParams">Reset effect parameters</button>
    </div>
  </Section>
</template>

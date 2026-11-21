<script setup lang="ts">
import { computed } from 'vue'
import FieldLabel from './FieldLabel.vue'

const props = defineProps<{ label: string; min: number; max: number; step: number; format?: (value: number) => string }>()
const value = defineModel<number>({ required: true })
const fill = computed(() => `${((value.value - props.min) / (props.max - props.min)) * 100}%`)
</script>

<template>
  <label class="block">
    <FieldLabel :value="format ? format(value) : value">{{ label }}</FieldLabel>
    <input v-model.number="value" type="range" class="range" :min="min" :max="max" :step="step" :style="{ '--fill': fill }" />
  </label>
</template>

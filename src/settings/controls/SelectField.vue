<script setup lang="ts" generic="T extends string">
import { ChevronDown } from '@lucide/vue'
import FieldLabel from './FieldLabel.vue'

defineProps<{ label: string; options: readonly { value: T; label: string }[] }>()
const value = defineModel<T>({ required: true })
</script>

<template>
  <label class="block">
    <FieldLabel>{{ label }}</FieldLabel>
    <div class="relative">
      <select v-model="value" class="field appearance-none pr-8">
        <option v-for="option in options" :key="option.value" :value="option.value" class="bg-[#141417]">{{ option.label }}</option>
      </select>
      <ChevronDown class="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-white/40" />
    </div>
  </label>
</template>

<script setup lang="ts" generic="T extends string | number">
import FieldLabel from './FieldLabel.vue'

defineProps<{ label?: string; options: readonly { value: T; label: string }[] }>()
const value = defineModel<T>({ required: true })
</script>

<template>
  <div>
    <FieldLabel v-if="label">{{ label }}</FieldLabel>
    <div class="flex rounded-lg bg-white/[0.05] p-0.5">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="flex-1 rounded-md px-2 py-1.5 text-[12px] font-medium transition-colors"
        :class="option.value === value ? 'bg-white/[0.12] text-white shadow-sm' : 'text-white/45 hover:text-white/80'"
        @click="value = option.value"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>

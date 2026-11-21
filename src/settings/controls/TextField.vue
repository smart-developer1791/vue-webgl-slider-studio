<script setup lang="ts">
import FieldLabel from './FieldLabel.vue'

defineProps<{ label: string; placeholder?: string; multiline?: boolean }>()
const value = defineModel<string>({ required: true })
</script>

<template>
  <label class="block">
    <FieldLabel>{{ label }}</FieldLabel>
    <textarea v-if="multiline" v-model="value" :placeholder="placeholder" rows="2" class="field resize-none leading-relaxed" />
    <input v-else v-model="value" :placeholder="placeholder" class="field" />
  </label>
</template>

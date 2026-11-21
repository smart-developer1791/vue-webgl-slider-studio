<script setup lang="ts">
import { ref } from 'vue'
import FieldLabel from './FieldLabel.vue'

defineProps<{ label: string }>()
const value = defineModel<string>({ required: true })
const draft = ref<string | null>(null)

function edit(event: Event) {
  const text = (event.target as HTMLInputElement).value
  draft.value = text
  if (/^#[0-9a-f]{6}$/i.test(text)) value.value = text.toLowerCase()
}
</script>

<template>
  <div>
    <FieldLabel>{{ label }}</FieldLabel>
    <div class="flex items-center gap-2">
      <label class="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-white/10" :style="{ background: value }">
        <input v-model="value" type="color" class="absolute inset-0 cursor-pointer opacity-0" />
      </label>
      <input :value="draft ?? value" :spellcheck="false" class="field font-mono uppercase" @input="edit" @blur="draft = null" />
    </div>
  </div>
</template>

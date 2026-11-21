<script setup lang="ts">
import { shallowRef, watch } from 'vue'
import type { AppearanceSettings, Slide } from '@/config/types'
import type { CaptionState } from './captions'
import SlideCaption from './SlideCaption.vue'

const props = defineProps<{ caption: CaptionState; slides: Slide[]; appearance: AppearanceSettings }>()
const items = shallowRef([{ ...props.caption, leaving: false }])

// Keep the previous caption mounted long enough for its exit animation.
watch(() => props.caption, (caption, _, onCleanup) => {
  items.value = [
    ...items.value.filter((item) => !item.leaving).map((item) => ({ ...item, leaving: true })),
    { ...caption, leaving: false },
  ]
  const timer = window.setTimeout(() => { items.value = items.value.filter((item) => !item.leaving) }, 650)
  onCleanup(() => window.clearTimeout(timer))
})
</script>

<template>
  <template v-for="item in items" :key="item.key">
    <SlideCaption v-if="slides[item.index]" :slide="slides[item.index]" :appearance="appearance" :delay="item.delay" :leaving="item.leaving" />
  </template>
</template>

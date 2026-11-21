<script setup lang="ts">
import { computed, onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue'
import { ChevronLeft, ChevronRight, ImagePlus } from '@lucide/vue'
import { useStudio } from '@/config/studio'
import { Renderer } from '@/webgl/Renderer'
import { SliderEngine } from './engine'
import type { CaptionState } from './captions'
import CaptionLayer from './CaptionLayer.vue'
import SliderChrome from './SliderChrome.vue'

const props = defineProps<{ urls: string[] }>()
const { config, active, engine, webgl, statuses } = useStudio()
const root = useTemplateRef<HTMLDivElement>('root')
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const caption = shallowRef<CaptionState>({ index: 0, key: 0, delay: 250 })
const count = computed(() => config.value.slides.length)
const motion = window.matchMedia('(prefers-reduced-motion: reduce)')

const overlay = computed(() => {
  const appearance = config.value.appearance
  const k = (v: number) => `rgba(0,0,0,${(appearance.overlay * v).toFixed(3)})`
  switch (appearance.textPosition) {
    case 'bottomLeft': return `linear-gradient(to top, ${k(0.9)} 0%, ${k(0.35)} 45%, ${k(0.12)} 100%)`
    case 'middleLeft': return `linear-gradient(to right, ${k(0.85)} 0%, ${k(0.25)} 60%, ${k(0.05)} 100%)`
    case 'center': return `radial-gradient(ellipse at center, ${k(0.7)} 0%, ${k(0.3)} 75%)`
  }
})

function updateMotion() {
  if (engine.value) engine.value.reducedMotion = motion.matches
}

onMounted(() => {
  if (!canvas.value || !root.value) return
  const renderer = Renderer.create(canvas.value)
  webgl.value = !!renderer
  if (renderer) renderer.onTextureStatus = (url, status) => { statuses.value = { ...statuses.value, [url]: status } }
  const slider = new SliderEngine(renderer, config.value, {
    onIndex(index) {
      active.value = index
      if (caption.value.index !== index) caption.value = { index, key: caption.value.key + 1, delay: 0 }
    },
    onTransitionStart(index, duration) {
      caption.value = { index, key: caption.value.key + 1, delay: Math.round(duration * 0.42) }
    },
  })
  engine.value = slider
  updateMotion()
  motion.addEventListener('change', updateMotion)
  slider.attach(root.value)
  slider.setUrls(props.urls)
})
watch(() => props.urls, (urls) => engine.value?.setUrls(urls))
onUnmounted(() => {
  motion.removeEventListener('change', updateMotion)
  engine.value?.destroy()
  engine.value = null
})
</script>

<template>
  <div
    ref="root"
    :data-drag="config.interaction.drag && count > 1"
    :data-cursor-on="config.fx.cursor"
    class="slider-root relative h-full w-full overflow-hidden bg-[#0b0b0d] select-none"
    style="touch-action: pan-y; container-type: inline-size"
    aria-roledescription="carousel"
  >
    <canvas ref="canvas" class="absolute inset-0 block h-full w-full" />
    <template v-if="!webgl">
      <template v-for="(url, index) in urls" :key="url + index">
        <img v-if="url" :src="url" alt="" :draggable="false" class="absolute inset-0 size-full object-cover transition-opacity duration-700" :style="{ opacity: index === active ? 1 : 0 }" />
      </template>
    </template>
    <div class="pointer-events-none absolute inset-0" :style="{ background: overlay }" />
    <div v-if="count === 0" class="absolute inset-0 grid place-items-center p-8 text-center">
      <div class="flex max-w-xs flex-col items-center gap-4 text-white/60">
        <span class="grid size-14 place-items-center rounded-2xl border border-white/10 bg-white/5"><ImagePlus class="size-6" /></span>
        <p class="text-sm leading-relaxed">No slides yet. Add images in the Slides section of the panel.</p>
      </div>
    </div>
    <div v-else data-parallax class="pointer-events-none absolute inset-0 will-change-transform">
      <CaptionLayer :slides="config.slides" :caption="caption" :appearance="config.appearance" />
    </div>
    <SliderChrome />
    <div v-if="config.fx.cursor" data-cursor data-state="idle" aria-hidden="true" class="custom-cursor pointer-events-none absolute top-0 left-0 z-30" style="opacity: 0">
      <div class="cursor-ring">
        <template v-if="config.interaction.drag && count > 1">
          <ChevronLeft class="size-3" :stroke-width="2.5" />
          <span>Drag</span>
          <ChevronRight class="size-3" :stroke-width="2.5" />
        </template>
      </div>
    </div>
  </div>
</template>

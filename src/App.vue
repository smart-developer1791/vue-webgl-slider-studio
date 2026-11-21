<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import { CircleAlert, CircleCheck, Maximize2, Minimize2, SlidersHorizontal } from '@lucide/vue'
import SettingsPanel from '@/settings/SettingsPanel.vue'
import WebGLSlider from '@/slider/WebGLSlider.vue'
import { useResolvedUrls } from '@/slider/useResolvedUrls'
import { provideStudio } from '@/config/studio'
import { contrastText } from '@/lib/color'

const { config, toast, notify } = provideStudio()
const main = useTemplateRef<HTMLElement>('main')
const urls = useResolvedUrls(config)
const fullscreen = ref(false)
const panelOpen = ref(window.matchMedia('(min-width: 768px)').matches)
const accent = computed(() => config.value.appearance.accent)

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => undefined)
    return
  }
  const el = main.value
  if (!el?.requestFullscreen || !document.fullscreenEnabled) {
    notify('Fullscreen is unavailable in this window — open the preview in a separate tab', 'error')
    return
  }
  el.requestFullscreen().catch(() => notify('The browser blocked fullscreen mode', 'error'))
}

function updateFullscreen() {
  fullscreen.value = document.fullscreenElement === main.value
}

function onKey(event: KeyboardEvent) {
  if ((event.code !== 'KeyH' && event.code !== 'KeyF') || event.metaKey || event.ctrlKey || event.altKey) return
  if ((event.target as HTMLElement | null)?.closest?.('input, textarea, select, [contenteditable="true"]')) return
  if (event.code === 'KeyF') toggleFullscreen()
  else panelOpen.value = !panelOpen.value
}

onMounted(() => {
  document.addEventListener('fullscreenchange', updateFullscreen)
  window.addEventListener('keydown', onKey)
})
onUnmounted(() => {
  document.removeEventListener('fullscreenchange', updateFullscreen)
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div
    class="flex h-dvh w-full overflow-hidden bg-[#08080a] font-sans text-white"
    :style="{ '--ui-accent': accent, '--ui-on-accent': contrastText(accent) }"
  >
    <main ref="main" class="relative h-full min-w-0 flex-1 bg-[#08080a]">
      <WebGLSlider :urls="urls" />
      <div class="absolute top-5 right-5 z-20 flex gap-2">
        <button
          type="button"
          :aria-label="fullscreen ? 'Exit fullscreen' : 'Fullscreen'"
          :title="fullscreen ? 'Exit fullscreen (F)' : 'Fullscreen (F)'"
          class="grid size-10 place-items-center rounded-full border border-white/15 bg-black/30 text-white backdrop-blur-xl transition hover:bg-black/50"
          @click="toggleFullscreen"
        >
          <Minimize2 v-if="fullscreen" class="size-4" />
          <Maximize2 v-else class="size-4" />
        </button>
        <button
          v-if="!panelOpen && !fullscreen"
          type="button"
          class="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-black/30 pr-4 pl-3.5 text-[13px] font-medium text-white backdrop-blur-xl transition hover:bg-black/50"
          @click="panelOpen = true"
        >
          <SlidersHorizontal class="size-4" />
          Settings
          <kbd class="ml-1 hidden rounded border border-white/20 px-1 font-mono text-[10px] text-white/60 md:inline">H</kbd>
        </button>
      </div>
    </main>
    <SettingsPanel :open="panelOpen" :urls="urls" @close="panelOpen = false" />
  </div>
  <div
    v-if="toast"
    :key="toast.key"
    role="status"
    class="toast fixed bottom-5 left-5 z-50 flex max-w-sm items-center gap-2.5 rounded-xl border border-white/10 bg-[#141417]/95 px-4 py-3 text-[13px] text-white shadow-2xl backdrop-blur-xl"
  >
    <CircleAlert v-if="toast.kind === 'error'" class="size-4 shrink-0 text-[#ff6b6b]" />
    <CircleCheck v-else class="size-4 shrink-0" style="color: var(--ui-accent)" />
    {{ toast.message }}
  </div>
</template>

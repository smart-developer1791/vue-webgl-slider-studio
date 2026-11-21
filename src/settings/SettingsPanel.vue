<script setup lang="ts">
import { Layers, X } from '@lucide/vue'
import { useStudio } from '@/config/studio'
import SlidesSection from './SlidesSection.vue'
import TransitionSection from './TransitionSection.vue'
import PlaybackSections from './PlaybackSections.vue'
import AppearanceSection from './AppearanceSection.vue'
import PresetsSection from './PresetsSection.vue'
import DataSection from './DataSection.vue'

defineProps<{ open: boolean; urls: string[] }>()
const emit = defineEmits<{ close: [] }>()
const { webgl } = useStudio()
</script>

<template>
  <aside
    aria-label="Slider settings"
    :aria-hidden="!open"
    :inert="!open"
    class="fixed inset-x-0 bottom-0 z-30 h-[66dvh] overflow-hidden rounded-t-2xl border-t border-white/10 bg-[#0e0e11]/95 shadow-[0_-20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:static md:h-full md:shrink-0 md:rounded-none md:border-t-0 md:shadow-none md:transition-[width]"
    :class="open ? 'translate-y-0 md:w-[380px] md:border-l' : 'translate-y-full md:w-0 md:translate-y-0'"
  >
    <div class="flex h-full w-full flex-col md:w-[380px]">
      <header class="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
        <span class="grid size-8 place-items-center rounded-lg" style="background: var(--ui-accent); color: var(--ui-on-accent)">
          <Layers class="size-4" :stroke-width="2" />
        </span>
        <div class="flex-1">
          <p class="text-[13.5px] font-semibold tracking-tight text-white">Shader Slider</p>
          <p class="flex items-center gap-1.5 font-mono text-[10.5px] text-white/40">
            <span class="size-1.5 rounded-full" :class="webgl ? 'bg-[#3dff9e]' : 'bg-[#ffb14a]'" />
            {{ webgl ? 'WebGL2 · studio' : 'WebGL unavailable — CSS mode' }}
          </p>
        </div>
        <button type="button" aria-label="Hide panel" class="grid size-8 place-items-center rounded-lg text-white/50 transition hover:bg-white/[0.08] hover:text-white" @click="emit('close')">
          <X class="size-4" />
        </button>
      </header>
      <div class="panel-scroll flex-1 overflow-y-auto overscroll-contain">
        <SlidesSection :urls="urls" />
        <TransitionSection />
        <PlaybackSections />
        <AppearanceSection />
        <PresetsSection />
        <DataSection />
      </div>
      <footer class="flex items-center justify-between border-t border-white/[0.06] px-5 py-3 font-mono text-[10.5px] text-white/35">
        <span>Autosave</span>
        <span><kbd class="rounded border border-white/15 px-1 py-px text-white/60">H</kbd> hide panel</span>
      </footer>
    </div>
  </aside>
</template>

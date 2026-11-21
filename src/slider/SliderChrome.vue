<script setup lang="ts">
import { computed } from 'vue'
import { ArrowLeft, ArrowRight } from '@lucide/vue'
import { useStudio } from '@/config/studio'

const { config, active, engine } = useStudio()
const look = computed(() => config.value.appearance)
const count = computed(() => config.value.slides.length)
const autoplay = computed(() => config.value.autoplay.enabled)
const canPrev = computed(() => count.value > 1 && (config.value.interaction.loop || active.value > 0))
const canNext = computed(() => count.value > 1 && (config.value.interaction.loop || active.value < count.value - 1))
const pad = (n: number) => String(n).padStart(2, '0')
const arrows = [
  { label: 'Previous slide', icon: ArrowLeft, enabled: canPrev, run: () => engine.value?.prev() },
  { label: 'Next slide', icon: ArrowRight, enabled: canNext, run: () => engine.value?.next() },
]
</script>

<template>
  <div v-if="look.counter && count > 0" class="pointer-events-none absolute top-6 left-6 flex items-baseline gap-2 font-mono text-white md:top-9 md:left-[5.5cqw]">
    <span class="text-sm">{{ pad(active + 1) }}</span>
    <span class="h-px w-6 self-center bg-white/40" />
    <span class="text-[11px] text-white/50">{{ pad(count) }}</span>
  </div>
  <div v-if="look.indicator !== 'none' && count > 1" data-no-drag class="absolute bottom-6 left-6 flex items-center md:bottom-9 md:left-[5.5cqw]">
    <div v-if="look.indicator === 'progress'" class="flex w-[min(42cqw,22rem)] gap-1.5">
      <button v-for="n in count" :key="n" type="button" :aria-label="`Slide ${n}`" class="group flex-1 py-3" @click="engine?.goTo(n - 1)">
        <span class="block h-[2px] overflow-hidden rounded-full bg-white/25 transition-colors group-hover:bg-white/50">
          <span
            class="block h-full origin-left"
            :data-active-fill="n - 1 === active && autoplay ? '' : undefined"
            :style="{ background: look.accent, transform: n - 1 === active && !autoplay ? 'scaleX(1)' : 'scaleX(0)' }"
          />
        </span>
      </button>
    </div>
    <div v-else class="flex items-center gap-2">
      <button
        v-for="n in count"
        :key="n"
        type="button"
        :aria-label="`Slide ${n}`"
        class="relative h-2 overflow-hidden rounded-full bg-white/30 transition-[width,background-color] duration-500 hover:bg-white/60"
        :style="{ width: n - 1 === active ? '36px' : '8px' }"
        @click="engine?.goTo(n - 1)"
      >
        <span v-if="n - 1 === active" :data-active-fill="autoplay ? '' : undefined" class="absolute inset-0 origin-left" :style="{ background: look.accent, transform: autoplay ? 'scaleX(0)' : 'scaleX(1)' }" />
      </button>
    </div>
  </div>
  <div v-if="look.arrows && count > 1" data-no-drag class="absolute right-6 bottom-6 flex gap-2 md:right-[5.5cqw] md:bottom-9">
    <button
      v-for="arrow in arrows"
      :key="arrow.label"
      type="button"
      :aria-label="arrow.label"
      :disabled="!arrow.enabled.value"
      class="grid size-12 place-items-center rounded-full border border-white/20 bg-black/15 text-white backdrop-blur-md transition hover:border-transparent hover:bg-white hover:text-black disabled:pointer-events-none disabled:opacity-30"
      @click="arrow.run"
    >
      <component :is="arrow.icon" class="size-[18px]" :stroke-width="1.75" />
    </button>
  </div>
</template>

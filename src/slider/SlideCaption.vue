<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUpRight } from '@lucide/vue'
import type { AppearanceSettings, Slide, TextPosition } from '@/config/types'
import { contrastText } from '@/lib/color'
import { FONTS } from './captions'

const props = defineProps<{ slide: Slide; appearance: AppearanceSettings; delay: number; leaving: boolean }>()
const POSITION: Record<TextPosition, { wrap: string; inner: string }> = {
  bottomLeft: { wrap: 'items-end justify-start text-left pb-24 md:pb-28', inner: 'items-start max-w-[min(64rem,80cqw)]' },
  middleLeft: { wrap: 'items-center justify-start text-left', inner: 'items-start max-w-[min(56rem,64cqw)]' },
  center: { wrap: 'items-center justify-center text-center', inner: 'items-center max-w-[min(64rem,82cqw)]' },
}
const position = computed(() => POSITION[props.appearance.textPosition])
const font = computed(() => FONTS[props.appearance.font])
const letters = computed(() => props.appearance.textAnimation === 'letters')
const words = computed(() => {
  let index = 0
  return props.slide.title.split(' ').map((word) => Array.from(word, (text) => ({ text, index: index++ })))
})
const external = computed(() => /^https?:\/\//i.test(props.slide.buttonUrl))
const href = computed(() => {
  const url = props.slide.buttonUrl
  // Match the React version's handling of script URLs in editable links.
  return /^javascript:/i.test(url.replace(/[\t\r\n]/g, '').replace(/^[\u0000-\u0020]+/, '')) ? '#' : url || '#'
})
</script>

<template>
  <div class="absolute inset-0 flex px-6 pt-20 md:px-[5.5cqw]" :class="position.wrap">
    <div
      class="caption flex flex-col"
      :class="[`cap-${appearance.textAnimation}`, position.inner, { 'cap-leave': leaving }]"
      :style="{ '--d': `${delay}ms`, color: appearance.textColor }"
    >
      <h2
        v-if="slide.title"
        class="text-balance"
        :class="{ 'cap-item': !letters }"
        :style="{
          '--i': 0,
          fontFamily: font.family,
          fontWeight: font.weight,
          letterSpacing: font.tracking,
          lineHeight: font.leading,
          fontSize: `calc(clamp(2.25rem, ${font.size}cqw, 9.5rem) * ${appearance.textScale})`,
        }"
      >
        <template v-if="letters">
          <template v-for="(word, index) in words" :key="index">{{ index ? ' ' : '' }}<span class="inline-block whitespace-nowrap"><span v-for="letter in word" :key="letter.index" class="cap-char" :style="{ '--c': letter.index }">{{ letter.text }}</span></span></template>
        </template>
        <template v-else>{{ slide.title }}</template>
      </h2>
      <p v-if="slide.subtitle" class="cap-item mt-5 max-w-[34rem] text-[clamp(0.95rem,1.3cqw,1.2rem)] leading-relaxed text-pretty opacity-80" :style="{ '--i': 2 }">
        {{ slide.subtitle }}
      </p>
      <a
        v-if="slide.buttonText"
        data-no-drag
        :href="href"
        :target="external ? '_blank' : undefined"
        :rel="external ? 'noreferrer' : undefined"
        class="cap-item pointer-events-auto mt-8 inline-flex items-center gap-3 rounded-full py-2 pr-2 pl-6 text-sm font-semibold transition-transform hover:scale-[1.03] active:scale-[0.98]"
        :style="{ '--i': 3, background: appearance.accent, color: contrastText(appearance.accent) }"
      >
        {{ slide.buttonText }}
        <span class="grid size-8 place-items-center rounded-full bg-black/15"><ArrowUpRight class="size-4" /></span>
      </a>
    </div>
  </div>
</template>

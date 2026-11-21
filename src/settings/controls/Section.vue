<script setup lang="ts">
import { ref, type Component } from 'vue'
import { ChevronDown } from '@lucide/vue'

const { defaultOpen = false } = defineProps<{ icon: Component; title: string; defaultOpen?: boolean }>()
const open = ref(defaultOpen)
</script>

<template>
  <section class="border-b border-white/[0.06]">
    <button
      type="button"
      :aria-expanded="open"
      class="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.025]"
      @click="open = !open"
    >
      <component :is="icon" class="size-4 text-white/45" :stroke-width="1.75" />
      <span class="flex-1 text-[13px] font-semibold tracking-tight text-white/90">{{ title }}</span>
      <slot name="aside" />
      <ChevronDown class="size-4 text-white/35 transition-transform duration-300" :class="{ 'rotate-180': open }" />
    </button>
    <div v-if="open" class="space-y-5 px-5 pt-1 pb-6"><slot /></div>
  </section>
</template>

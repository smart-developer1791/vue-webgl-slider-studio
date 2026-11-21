<script setup lang="ts">
import type { Component } from 'vue'

const { variant = 'ghost', type = 'button' } = defineProps<{
  variant?: 'primary' | 'ghost' | 'danger'
  icon?: Component
  type?: 'button' | 'submit' | 'reset'
}>()
const styles = {
  primary: 'bg-[var(--ui-accent)] text-[var(--ui-on-accent)] hover:brightness-110',
  ghost: 'bg-white/[0.06] text-white/85 hover:bg-white/[0.1]',
  danger: 'bg-[#ff5a5a]/10 text-[#ff8c8c] hover:bg-[#ff5a5a]/20',
}
</script>

<template>
  <button
    :type="type"
    class="inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-[12.5px] font-semibold transition disabled:pointer-events-none disabled:opacity-40"
    :class="styles[variant]"
  >
    <component :is="icon" v-if="icon" class="size-3.5" :stroke-width="2" />
    <slot />
  </button>
</template>

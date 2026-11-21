<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{ icon: Component; label: string }>()
</script>

<template>
  <button
    type="button"
    :aria-label="label"
    :title="label"
    class="grid size-7 place-items-center rounded-md text-white/45 transition hover:bg-white/[0.08] hover:text-white disabled:pointer-events-none disabled:opacity-25"
  >
    <component :is="icon" class="size-3.5" :stroke-width="2" />
  </button>
</template>

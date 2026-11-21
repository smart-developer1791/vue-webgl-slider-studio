<script setup lang="ts">
defineProps<{ value?: string | number }>()
</script>

<template>
  <div class="mb-2 flex items-baseline justify-between gap-3">
    <span class="text-xs text-white/55"><slot /></span>
    <span v-if="value !== undefined" class="font-mono text-[11px] text-white/85 tabular-nums">{{ value }}</span>
  </div>
</template>

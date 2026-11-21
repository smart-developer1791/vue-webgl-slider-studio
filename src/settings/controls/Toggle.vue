<script setup lang="ts">
defineProps<{ label: string; hint?: string }>()
const checked = defineModel<boolean>({ required: true })
</script>

<template>
  <button type="button" role="switch" :aria-checked="checked" class="flex w-full items-center gap-3 text-left" @click="checked = !checked">
    <span class="flex-1">
      <span class="block text-[13px] text-white/85">{{ label }}</span>
      <span v-if="hint" class="mt-0.5 block text-[11px] leading-snug text-white/40">{{ hint }}</span>
    </span>
    <span
      class="relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-200"
      :style="{ background: checked ? 'var(--ui-accent)' : 'rgb(255 255 255 / 0.12)' }"
    >
      <span
        class="absolute top-[3px] left-[3px] size-4 rounded-full shadow transition-transform duration-200"
        :style="{ transform: checked ? 'translateX(16px)' : 'none', background: checked ? 'var(--ui-on-accent)' : '#fff' }"
      />
    </span>
  </button>
</template>

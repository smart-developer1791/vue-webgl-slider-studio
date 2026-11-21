<script setup lang="ts">
import { ref, shallowRef } from 'vue'
import { Bookmark, Plus, Trash2 } from '@lucide/vue'
import { createId } from '@/config/defaults'
import { BUILT_IN_PRESETS } from '@/config/presets'
import { useStudio } from '@/config/studio'
import { loadPresets, pickSettings, savePresets } from '@/config/storage'
import type { Preset } from '@/config/types'
import { EFFECTS } from '@/webgl/effects'
import IconButton from './controls/IconButton.vue'
import Section from './controls/Section.vue'
import StudioButton from './controls/StudioButton.vue'

const { config, dispatch, notify } = useStudio()
const custom = shallowRef<Preset[]>(loadPresets())
const name = ref('')

function apply(preset: Preset) {
  dispatch({ type: 'applyPreset', settings: preset.settings })
  notify(`Preset “${preset.name}” applied`)
}

function persist(list: Preset[]) {
  custom.value = list
  if (!savePresets(list)) notify('Could not save the preset', 'error')
}

function save() {
  const preset = {
    id: createId(),
    name: name.value.trim() || `My preset ${custom.value.length + 1}`,
    settings: pickSettings(config.value),
  }
  persist([...custom.value, preset])
  name.value = ''
  notify(`Preset “${preset.name}” saved`)
}
</script>

<template>
  <Section :icon="Bookmark" title="Presets">
    <div class="grid grid-cols-2 gap-1.5">
      <button
        v-for="preset in BUILT_IN_PRESETS"
        :key="preset.id"
        type="button"
        class="group flex items-center gap-2.5 rounded-lg border border-white/[0.06] p-2 text-left transition-colors hover:border-white/15 hover:bg-white/[0.03]"
        @click="apply(preset)"
      >
        <span class="size-8 shrink-0 rounded-md" :style="{ background: `radial-gradient(circle at 30% 30%, ${preset.settings.appearance.accent}, #111 75%)` }" />
        <span class="min-w-0">
          <span class="block text-[12.5px] font-semibold text-white/90">{{ preset.name }}</span>
          <span class="block truncate text-[10.5px] text-white/40">{{ EFFECTS[preset.settings.transition.effect].name }}</span>
        </span>
      </button>
    </div>
    <ul v-if="custom.length" class="space-y-1">
      <li v-for="preset in custom" :key="preset.id" class="flex items-center gap-2 rounded-lg bg-white/[0.03] py-1 pr-1 pl-3">
        <button type="button" class="flex-1 truncate text-left text-[12.5px] text-white/85 hover:text-white" @click="apply(preset)">{{ preset.name }}</button>
        <IconButton :icon="Trash2" label="Delete preset" @click="persist(custom.filter((entry) => entry.id !== preset.id))" />
      </li>
    </ul>
    <form class="flex gap-2" @submit.prevent="save">
      <input v-model="name" placeholder="Preset name" class="field flex-1" />
      <StudioButton type="submit" :icon="Plus">Save</StudioButton>
    </form>
  </Section>
</template>

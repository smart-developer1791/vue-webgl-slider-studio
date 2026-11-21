<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { Database, Download, RotateCcw, Upload } from '@lucide/vue'
import { defaultConfig } from '@/config/defaults'
import { useStudio } from '@/config/studio'
import { exportConfig, importConfig } from '@/config/storage'
import Section from './controls/Section.vue'
import StudioButton from './controls/StudioButton.vue'

const { config, dispatch, notify } = useStudio()
const fileInput = useTemplateRef<HTMLInputElement>('file-input')
const busy = ref(false)

async function doExport() {
  busy.value = true
  try {
    const blob = await exportConfig(config.value)
    const anchor = document.createElement('a')
    anchor.href = URL.createObjectURL(blob)
    anchor.download = 'webgl-slider.json'
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(anchor.href), 1000)
  } catch {
    notify('Could not export the configuration', 'error')
  } finally {
    busy.value = false
  }
}

async function doImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  busy.value = true
  try {
    dispatch({ type: 'replace', config: await importConfig(await file.text()) })
    notify('Configuration imported')
  } catch (error) {
    notify(error instanceof SyntaxError ? 'The file is not valid JSON' : error instanceof Error ? error.message : 'Import failed', 'error')
  } finally {
    busy.value = false
  }
}

function reset() {
  if (window.confirm('Reset all settings and slides to their defaults?')) {
    dispatch({ type: 'replace', config: defaultConfig() })
    notify('Settings reset')
  }
}
</script>

<template>
  <Section :icon="Database" title="Data">
    <p class="text-[11.5px] leading-relaxed text-white/45">
      Settings are saved automatically in this browser. Export creates a JSON file including uploaded images.
    </p>
    <div class="grid grid-cols-2 gap-2">
      <StudioButton :icon="Download" :disabled="busy" @click="doExport">Export</StudioButton>
      <StudioButton :icon="Upload" :disabled="busy" @click="fileInput?.click()">Import</StudioButton>
    </div>
    <input ref="file-input" type="file" accept="application/json,.json" hidden @change="doImport" />
    <StudioButton variant="danger" :icon="RotateCcw" class="w-full" @click="reset">Reset all</StudioButton>
  </Section>
</template>

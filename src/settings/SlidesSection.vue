<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { ChevronDown, ChevronUp, GripVertical, ImageOff, ImagePlus, Images, Link2, Pencil, Trash2 } from '@lucide/vue'
import { newSlide } from '@/config/defaults'
import { deleteImage, putImage } from '@/config/storage'
import { useStudio } from '@/config/studio'
import { EFFECT_IDS, type Slide, type SlideEffect } from '@/config/types'
import { EFFECTS } from '@/webgl/effects'
import IconButton from './controls/IconButton.vue'
import Section from './controls/Section.vue'
import SelectField from './controls/SelectField.vue'
import StudioButton from './controls/StudioButton.vue'
import TextField from './controls/TextField.vue'

const props = defineProps<{ urls: string[] }>()
const { config, dispatch, notify, engine, active, statuses } = useStudio()
const expanded = ref<string | null>(null)
const dragFrom = ref<number | null>(null)
const dropOver = ref(false)
const url = ref('')
const fileInput = useTemplateRef<HTMLInputElement>('file-input')
const slides = computed(() => config.value.slides)
const effectOptions: { value: SlideEffect; label: string }[] = [
  { value: 'inherit', label: 'Use transition settings' },
  ...EFFECT_IDS.map((id) => ({ value: id, label: EFFECTS[id].name })),
]

function status(index: number) {
  const src = props.urls[index]
  return src ? statuses.value[src] : 'error'
}

async function addFiles(files: FileList | null | undefined) {
  const images = Array.from(files ?? []).filter((file) => file.type.startsWith('image/'))
  if (!images.length) return
  try {
    const added = await Promise.all(images.map(async (file) => ({ ...newSlide(await putImage(file)), title: file.name.replace(/\.[^.]+$/, '') })))
    dispatch({ type: 'addSlides', slides: added })
    notify(added.length > 1 ? `Slides added: ${added.length}` : 'Slide added')
  } catch {
    notify('Could not save the image in this browser', 'error')
  }
}

function onFiles(event: Event) {
  const input = event.target as HTMLInputElement
  void addFiles(input.files)
  input.value = ''
}

function addUrl() {
  const image = url.value.trim()
  if (!/^https?:\/\/\S+$/i.test(image)) {
    notify('Enter a URL starting with http:// or https://', 'error')
    return
  }
  dispatch({ type: 'addSlides', slides: [newSlide(image)] })
  url.value = ''
}

function remove(slide: Slide) {
  dispatch({ type: 'removeSlide', id: slide.id })
  if (!slides.value.some((item) => item.image === slide.image)) void deleteImage(slide.image)
}

function updateSlide(id: string, value: Partial<Slide>) {
  dispatch({ type: 'updateSlide', id, value })
}

function move(from: number, to: number) {
  dispatch({ type: 'moveSlide', from, to })
}

function startDrag(event: DragEvent, index: number) {
  dragFrom.value = index
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function dropSlide(to: number) {
  if (dragFrom.value !== null) move(dragFrom.value, to)
  dragFrom.value = null
}

function hoverFiles(event: DragEvent) {
  if (event.dataTransfer?.types.includes('Files')) {
    event.preventDefault()
    dropOver.value = true
  }
}

function dropFiles(event: DragEvent) {
  dropOver.value = false
  void addFiles(event.dataTransfer?.files)
}
</script>

<template>
  <Section :icon="Images" title="Slides" default-open>
    <template #aside><span class="font-mono text-[11px] text-white/35">{{ slides.length }}</span></template>
    <ul v-if="slides.length" class="space-y-1.5">
      <li
        v-for="(slide, i) in slides"
        :key="slide.id"
        draggable="true"
        class="rounded-xl border transition-colors"
        :class="[dragFrom === i ? 'opacity-40' : '', i === active ? 'bg-white/[0.045]' : 'border-white/[0.06] hover:border-white/[0.12]']"
        :style="i === active ? { borderColor: 'color-mix(in srgb, var(--ui-accent) 55%, transparent)' } : undefined"
        @dragstart="startDrag($event, i)"
        @dragover="dragFrom !== null && $event.preventDefault()"
        @drop.prevent="dropSlide(i)"
        @dragend="dragFrom = null"
      >
        <div class="flex items-center gap-2.5 p-2">
          <GripVertical class="size-3.5 shrink-0 cursor-grab text-white/20" />
          <button type="button" title="Show slide" class="relative h-11 w-16 shrink-0 overflow-hidden rounded-md bg-white/5" @click="engine?.goTo(i)">
            <img v-if="urls[i] && status(i) !== 'error'" :src="urls[i]" alt="" :draggable="false" class="size-full object-cover" />
            <span v-if="status(i) === 'error'" class="absolute inset-0 grid place-items-center bg-[#ff5a5a]/15 text-[#ff8c8c]"><ImageOff class="size-4" /></span>
            <span class="absolute top-1 left-1 rounded bg-black/55 px-1 font-mono text-[9px] text-white">{{ i + 1 }}</span>
          </button>
          <div class="min-w-0 flex-1">
            <p class="truncate text-[13px] font-medium text-white/90">{{ slide.title || 'Untitled' }}</p>
            <p class="truncate text-[11px]" :class="status(i) === 'error' ? 'text-[#ff8c8c]' : 'text-white/40'">
              {{ status(i) === 'error' ? 'Image failed to load' : slide.effect === 'inherit' ? 'Global effect' : EFFECTS[slide.effect].name }}
            </p>
          </div>
          <div class="flex shrink-0">
            <IconButton :icon="ChevronUp" label="Move up" :disabled="i === 0" @click="move(i, i - 1)" />
            <IconButton :icon="ChevronDown" label="Move down" :disabled="i === slides.length - 1" @click="move(i, i + 1)" />
            <IconButton :icon="Pencil" label="Edit" :aria-expanded="expanded === slide.id" @click="expanded = expanded === slide.id ? null : slide.id" />
            <IconButton :icon="Trash2" label="Delete" @click="remove(slide)" />
          </div>
        </div>
        <div v-if="expanded === slide.id" class="space-y-3.5 border-t border-white/[0.06] p-3">
          <TextField label="Title" :model-value="slide.title" @update:model-value="updateSlide(slide.id, { title: $event })" />
          <TextField label="Subtitle" multiline :model-value="slide.subtitle" @update:model-value="updateSlide(slide.id, { subtitle: $event })" />
          <div class="grid grid-cols-2 gap-2">
            <TextField label="Button text" :model-value="slide.buttonText" placeholder="Leave empty to hide" @update:model-value="updateSlide(slide.id, { buttonText: $event })" />
            <TextField label="Link" :model-value="slide.buttonUrl" placeholder="https://" @update:model-value="updateSlide(slide.id, { buttonUrl: $event })" />
          </div>
          <SelectField label="Transition into this slide" :model-value="slide.effect" :options="effectOptions" @update:model-value="updateSlide(slide.id, { effect: $event })" />
        </div>
      </li>
    </ul>
    <button
      type="button"
      class="flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed px-4 py-5 text-center transition-colors"
      :class="dropOver ? 'bg-white/[0.06]' : 'border-white/15 hover:border-white/30 hover:bg-white/[0.025]'"
      :style="dropOver ? { borderColor: 'var(--ui-accent)' } : undefined"
      @click="fileInput?.click()"
      @dragover="hoverFiles"
      @dragleave="dropOver = false"
      @drop.prevent="dropFiles"
    >
      <ImagePlus class="size-5 text-white/50" :stroke-width="1.75" />
      <span class="text-[12.5px] font-medium text-white/80">Drop images or choose files</span>
      <span class="text-[11px] text-white/35">JPG, PNG, WebP — stored in this browser</span>
    </button>
    <input ref="file-input" type="file" accept="image/*" multiple hidden @change="onFiles" />
    <form class="flex gap-2" @submit.prevent="addUrl">
      <div class="relative flex-1">
        <Link2 class="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-white/35" />
        <input v-model="url" placeholder="Image URL" class="field pl-8" />
      </div>
      <StudioButton type="submit" :disabled="!url.trim()">Add</StudioButton>
    </form>
  </Section>
</template>

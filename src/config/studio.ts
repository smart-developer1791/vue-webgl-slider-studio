import { inject, onScopeDispose, provide, ref, shallowRef, watch, type InjectionKey } from 'vue'
import type { SliderEngine } from '@/slider/engine'
import type { TextureStatus } from '@/webgl/Renderer'
import { reducer, type Action, type SectionKey } from './reducer'
import { loadConfig, saveConfig } from './storage'
import type { SliderConfig } from './types'

type ToastKind = 'success' | 'error'

function createStudio() {
  const config = shallowRef(loadConfig())
  const engine = shallowRef<SliderEngine | null>(null)
  const active = ref(0)
  const webgl = ref(true)
  const statuses = shallowRef<Record<string, TextureStatus>>({})
  const toast = shallowRef<{ message: string; kind: ToastKind; key: number } | null>(null)
  let toastTimer = 0

  function dispatch(action: Action) {
    config.value = reducer(config.value, action)
  }

  function patch<K extends SectionKey>(section: K, value: Partial<SliderConfig[K]>) {
    dispatch({ type: 'patch', section, value })
  }

  function notify(message: string, kind: ToastKind = 'success') {
    toast.value = { message, kind, key: Date.now() }
    window.clearTimeout(toastTimer)
    toastTimer = window.setTimeout(() => { toast.value = null }, 3200)
  }

  watch(config, (current, _, onCleanup) => {
    engine.value?.setConfig(current)
    const timer = window.setTimeout(() => {
      if (!saveConfig(current)) notify('Browser storage is full — settings were not saved', 'error')
    }, 300)
    onCleanup(() => window.clearTimeout(timer))
  }, { immediate: true })
  onScopeDispose(() => window.clearTimeout(toastTimer))

  return { config, engine, active, webgl, statuses, toast, dispatch, patch, notify }
}

const studioKey: InjectionKey<ReturnType<typeof createStudio>> = Symbol('slider-studio')

export function provideStudio() {
  const studio = createStudio()
  provide(studioKey, studio)
  return studio
}

export function useStudio() {
  const studio = inject(studioKey)
  if (!studio) throw new Error('useStudio must be used inside the slider studio')
  return studio
}

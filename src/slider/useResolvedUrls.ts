import { computed, shallowRef, watch, type Ref } from 'vue'
import { resolveImage, resolveSync } from '@/config/storage'
import type { SliderConfig } from '@/config/types'

const same = (a: string[], b: string[]) => a.length === b.length && a.every((value, i) => value === b[i])

export function useResolvedUrls(config: Ref<SliderConfig>) {
  const sources = computed<string[]>((previous) => {
    const current = config.value.slides.map((slide) => slide.image)
    return previous && same(current, previous) ? previous : current
  })
  const urls = shallowRef<string[]>([])

  watch(sources, (current, _, onCleanup) => {
    let cancelled = false
    const sync = current.map(resolveSync)
    urls.value = sync.map((url) => url ?? '')
    if (sync.some((url) => url === null)) {
      Promise.all(current.map(resolveImage)).then((resolved) => {
        if (!cancelled && !same(urls.value, resolved)) urls.value = resolved
      })
    }
    onCleanup(() => { cancelled = true })
  }, { immediate: true })

  return urls
}

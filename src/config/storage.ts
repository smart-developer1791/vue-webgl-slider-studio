import { EFFECTS } from '@/webgl/effects'
import { createId, defaultConfig } from './defaults'
import {
  EASING_IDS,
  EFFECT_IDS,
  FONT_IDS,
  INDICATORS,
  TEXT_ANIMATIONS,
  TEXT_POSITIONS,
  type Preset,
  type PresetSettings,
  type Slide,
  type SliderConfig,
} from './types'

const CONFIG_KEY = 'webgl-slider:config:v1'
const PRESETS_KEY = 'webgl-slider:presets:v1'

// ---- validation ------------------------------------------------------------

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const obj = (v: unknown): Obj => (isObj(v) ? v : {})
const num = (v: unknown, d: number, min: number, max: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : d
const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d)
const str = (v: unknown, d: string, max = 2000) => (typeof v === 'string' ? v.slice(0, max) : d)
const oneOf = <T extends string>(v: unknown, list: readonly T[], d: T): T =>
  list.includes(v as T) ? (v as T) : d
const color = (v: unknown, d: string) => (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v : d)

/** Merges unknown input over defaults, dropping invalid values. Throws on non-objects. */
export function normalizeConfig(raw: unknown): SliderConfig {
  if (!isObj(raw)) throw new Error('The file does not appear to be a slider configuration')
  const d = defaultConfig()
  const t = obj(raw.transition)
  const i = obj(raw.interaction)
  const a = obj(raw.autoplay)
  const ap = obj(raw.appearance)
  const fx = obj(raw.fx)
  const ep = obj(raw.effectParams)

  const seen = new Set<string>()
  const slides: Slide[] = Array.isArray(raw.slides)
    ? raw.slides.filter(isObj).flatMap((s) => {
        const image = str(s.image, '', 20_000_000)
        if (!image) return []
        let id = str(s.id, '', 64)
        if (!id || seen.has(id)) id = createId()
        seen.add(id)
        return [
          {
            id,
            image,
            title: str(s.title, ''),
            subtitle: str(s.subtitle, ''),
            buttonText: str(s.buttonText, '', 80),
            buttonUrl: str(s.buttonUrl, ''),
            effect: oneOf(s.effect, ['inherit', ...EFFECT_IDS] as const, 'inherit'),
          },
        ]
      })
    : d.slides

  return {
    version: 1,
    slides,
    transition: {
      effect: oneOf(t.effect, EFFECT_IDS, d.transition.effect),
      random: bool(t.random, d.transition.random),
      duration: num(t.duration, d.transition.duration, 200, 5000),
      easing: oneOf(t.easing, EASING_IDS, d.transition.easing),
      intensity: num(t.intensity, d.transition.intensity, 0, 3),
      edgeColor: color(t.edgeColor, d.transition.edgeColor),
    },
    effectParams: Object.fromEntries(
      EFFECT_IDS.map((id) => {
        const arr = Array.isArray(ep[id]) ? (ep[id] as unknown[]) : []
        return [id, EFFECTS[id].params.map((p, k) => num(arr[k], p.default, p.min, p.max))]
      }),
    ) as SliderConfig['effectParams'],
    interaction: {
      hover: bool(i.hover, d.interaction.hover),
      hoverStrength: num(i.hoverStrength, d.interaction.hoverStrength, 0, 2),
      hoverRadius: num(i.hoverRadius, d.interaction.hoverRadius, 0.05, 1),
      drag: bool(i.drag, d.interaction.drag),
      dragSensitivity: num(i.dragSensitivity, d.interaction.dragSensitivity, 0.2, 3),
      wheel: bool(i.wheel, d.interaction.wheel),
      keyboard: bool(i.keyboard, d.interaction.keyboard),
      loop: bool(i.loop, d.interaction.loop),
    },
    autoplay: {
      enabled: bool(a.enabled, d.autoplay.enabled),
      interval: num(a.interval, d.autoplay.interval, 1000, 30000),
      pauseOnHover: bool(a.pauseOnHover, d.autoplay.pauseOnHover),
    },
    appearance: {
      arrows: bool(ap.arrows, d.appearance.arrows),
      indicator: oneOf(ap.indicator, INDICATORS, d.appearance.indicator),
      counter: bool(ap.counter, d.appearance.counter),
      textAnimation: oneOf(ap.textAnimation, TEXT_ANIMATIONS, d.appearance.textAnimation),
      textPosition: oneOf(ap.textPosition, TEXT_POSITIONS, d.appearance.textPosition),
      font: oneOf(ap.font, FONT_IDS, d.appearance.font),
      textScale: num(ap.textScale, d.appearance.textScale, 0.4, 2),
      textColor: color(ap.textColor, d.appearance.textColor),
      accent: color(ap.accent, d.appearance.accent),
      overlay: num(ap.overlay, d.appearance.overlay, 0, 1),
      grain: num(ap.grain, d.appearance.grain, 0, 1),
      vignette: num(ap.vignette, d.appearance.vignette, 0, 1),
    },
    fx: {
      kenBurns: num(fx.kenBurns, d.fx.kenBurns, 0, 1),
      parallax: num(fx.parallax, d.fx.parallax, 0, 1),
      ambient: num(fx.ambient, d.fx.ambient, 0, 1),
      chroma: num(fx.chroma, d.fx.chroma, 0, 1),
      cursor: bool(fx.cursor, d.fx.cursor),
    },
  }
}

export function loadConfig(): SliderConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    return raw ? normalizeConfig(JSON.parse(raw)) : defaultConfig()
  } catch {
    return defaultConfig()
  }
}

export function saveConfig(config: SliderConfig) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
    return true
  } catch {
    return false
  }
}

export function loadPresets(): Preset[] {
  try {
    const list = JSON.parse(localStorage.getItem(PRESETS_KEY) ?? '[]')
    if (!Array.isArray(list)) return []
    return list.filter(isObj).map((p) => {
      const { version: _v, slides: _s, ...settings } = normalizeConfig({ ...obj(p.settings), slides: [] })
      return { id: str(p.id, createId(), 64), name: str(p.name, 'Preset', 60), settings }
    })
  } catch {
    return []
  }
}

export function savePresets(list: Preset[]) {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(list))
    return true
  } catch {
    return false
  }
}

export function pickSettings(config: SliderConfig): PresetSettings {
  const { version: _v, slides: _s, ...settings } = config
  return structuredClone(settings)
}

// ---- uploaded images (IndexedDB) -------------------------------------------

const DB_NAME = 'webgl-slider'
const STORE = 'images'
let dbPromise: Promise<IDBDatabase> | null = null

function openDb() {
  dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

async function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const req = run(db.transaction(STORE, mode).objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export const isStoredImage = (src: string) => src.startsWith('idb:')

export async function putImage(blob: Blob) {
  const id = createId()
  await tx('readwrite', (s) => s.put(blob, id))
  return `idb:${id}`
}

export async function deleteImage(src: string) {
  if (!isStoredImage(src)) return
  await tx('readwrite', (s) => s.delete(src.slice(4))).catch(() => undefined)
}

const resolved = new Map<string, string>()

/** Returns a displayable URL right away when possible, or null when IndexedDB lookup is needed. */
export function resolveSync(src: string) {
  return isStoredImage(src) ? (resolved.get(src) ?? null) : src
}

export async function resolveImage(src: string) {
  if (!isStoredImage(src)) return src
  const cached = resolved.get(src)
  if (cached) return cached
  const blob = await tx<Blob | undefined>('readonly', (s) => s.get(src.slice(4))).catch(() => undefined)
  if (!blob) return ''
  const url = URL.createObjectURL(blob)
  resolved.set(src, url)
  return url
}

// ---- export / import -------------------------------------------------------

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
}

/** Uploaded images are inlined as data URLs so the file is self-contained. */
export async function exportConfig(config: SliderConfig) {
  const slides = await Promise.all(
    config.slides.map(async (s) => {
      if (!isStoredImage(s.image)) return s
      const blob = await tx<Blob | undefined>('readonly', (st) => st.get(s.image.slice(4))).catch(() => undefined)
      return { ...s, image: blob ? await blobToDataUrl(blob) : '' }
    }),
  )
  return new Blob([JSON.stringify({ ...config, slides }, null, 2)], { type: 'application/json' })
}

export async function importConfig(text: string) {
  const config = normalizeConfig(JSON.parse(text))
  const slides = await Promise.all(
    config.slides.map(async (s) =>
      s.image.startsWith('data:') ? { ...s, image: await putImage(await (await fetch(s.image)).blob()) } : s,
    ),
  )
  return { ...config, slides }
}

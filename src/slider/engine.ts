import { EFFECT_IDS, type EffectId, type SliderConfig } from '@/config/types'
import type { ProgramKey, Renderer } from '@/webgl/Renderer'
import { EASINGS, easeOutCubic, type EasingFn } from '@/webgl/easing'
import { hexToRgb } from '@/lib/color'

interface Anim {
  from: number
  to: number
  start: number
  duration: number
  ease: EasingFn
}

interface DragState {
  id: number
  startX: number
  lastX: number
  lastT: number
  vel: number
  active: boolean
}

export interface EngineEvents {
  onIndex: (index: number) => void
  onTransitionStart: (target: number, duration: number) => void
}

/**
 * Imperative slider state machine: owns navigation, drag, wheel, keyboard,
 * autoplay and the rAF loop. React only feeds it config and image URLs.
 */
export class SliderEngine {
  config: SliderConfig
  reducedMotion = false
  current = 0
  private urls: string[] = []
  private target: number | null = null
  private dir = 1
  private progress = 0
  private anim: Anim | null = null
  private pending: { index: number; dir: number } | null = null
  private drag: DragState | null = null
  private mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, vx: 0, vy: 0 }
  private hovering = false
  private hover = 0
  /** Smoothed pointer presence (0..1) used for parallax and the cursor */
  private presence = 0
  /** Ken Burns phase (0..1): grows while a slide rests, relaxes during transitions */
  private kb = 0
  private cursor = { x: 0.5, y: 0.5 }
  private overInteractive = false
  private randomEffect: EffectId = 'dissolve'
  private origin: [number, number] = [0.5, 0.5]
  private elapsed = 0
  private wheelLock = 0
  private raf = 0
  private last = 0
  private readonly t0 = performance.now()
  private el: HTMLElement | null = null
  private colorCache = { hex: '', rgb: [1, 1, 1] as [number, number, number] }
  readonly renderer: Renderer | null
  private readonly events: EngineEvents

  constructor(renderer: Renderer | null, config: SliderConfig, events: EngineEvents) {
    this.renderer = renderer
    this.config = config
    this.events = events
    this.raf = requestAnimationFrame(this.tick)
  }

  get count() {
    return this.urls.length
  }

  setConfig(config: SliderConfig) {
    this.config = config
  }

  setUrls(urls: string[]) {
    this.urls = urls
    for (const url of urls) if (url) this.renderer?.load(url)
    this.renderer?.retain(urls.filter(Boolean))
    if (this.current >= urls.length) {
      this.reset()
      this.current = Math.max(0, urls.length - 1)
      this.events.onIndex(this.current)
    } else if (this.target !== null && this.target >= urls.length) {
      this.reset()
    }
  }

  private reset() {
    this.anim = null
    this.target = null
    this.pending = null
    this.drag = null
    this.progress = 0
  }

  private neighbor(from: number, dir: number) {
    const n = this.count
    if (n < 2) return null
    const idx = from + dir
    if (idx >= 0 && idx < n) return idx
    return this.config.interaction.loop ? (idx + n) % n : null
  }

  next() {
    this.step(1)
  }

  prev() {
    this.step(-1)
  }

  /** Plays the current transition once, regardless of the loop setting. */
  replay() {
    if (this.neighbor(this.current, 1) !== null) this.next()
    else this.prev()
  }

  private step(dir: number) {
    const base = this.pending?.index ?? (this.anim?.to === 1 && this.target !== null ? this.target : this.current)
    const idx = this.neighbor(base, dir)
    if (idx !== null) this.goTo(idx, dir)
  }

  goTo(index: number, dir?: number) {
    if (this.count < 2 || index < 0 || index >= this.count || this.drag?.active) return
    const d = dir ?? (index > this.current ? 1 : -1)
    if (this.anim) {
      if (this.anim.to === 1 && index === this.target && !this.pending) return
      // Fast-forward the running transition, then continue to the new target.
      this.pending = { index, dir: d }
      this.anim = { from: this.progress, to: this.anim.to, start: performance.now(), duration: 220, ease: easeOutCubic }
      return
    }
    if (index !== this.current) this.start(index, d)
  }

  private duration() {
    return this.reducedMotion ? 500 : this.config.transition.duration
  }

  private pickRandom() {
    const pool = EFFECT_IDS.filter((id) => id !== this.randomEffect)
    this.randomEffect = pool[Math.floor(Math.random() * pool.length)]
  }

  private start(index: number, dir: number) {
    this.target = index
    this.dir = dir
    this.progress = 0
    this.pickRandom()
    this.origin = this.hovering ? [this.mouse.x, this.mouse.y] : [0.5, 0.5]
    const duration = this.duration()
    this.anim = { from: 0, to: 1, start: performance.now(), duration, ease: EASINGS[this.config.transition.easing] }
    this.elapsed = 0
    this.events.onTransitionStart(index, duration)
  }

  private finish() {
    const anim = this.anim
    this.anim = null
    if (anim?.to === 1 && this.target !== null) {
      this.current = this.target
      this.events.onIndex(this.current)
    }
    this.target = null
    this.progress = 0
    this.elapsed = 0
    const pending = this.pending
    this.pending = null
    if (pending && pending.index !== this.current && pending.index < this.count) this.start(pending.index, pending.dir)
  }

  private tick = (now: number) => {
    this.raf = requestAnimationFrame(this.tick)
    const dt = Math.min(64, now - (this.last || now))
    this.last = now

    const m = this.mouse
    const k = 1 - Math.exp(-dt / 90)
    const px = m.x
    const py = m.y
    m.x += (m.tx - m.x) * k
    m.y += (m.ty - m.y) * k
    const norm = dt > 0 ? 16.67 / dt : 1
    m.vx += ((m.x - px) * norm - m.vx) * 0.2
    m.vy += ((m.y - py) * norm - m.vy) * 0.2

    const hoverOn = this.hovering && this.config.interaction.hover && !this.reducedMotion
    this.hover += ((hoverOn ? 1 : 0) - this.hover) * (1 - Math.exp(-dt / 220))
    this.presence += ((this.hovering ? 1 : 0) - this.presence) * (1 - Math.exp(-dt / 400))
    const ck = 1 - Math.exp(-dt / 45)
    this.cursor.x += (m.tx - this.cursor.x) * ck
    this.cursor.y += (m.ty - this.cursor.y) * ck
    if (this.anim || this.drag?.active) this.kb *= Math.exp(-dt / Math.max(120, this.duration() * 0.35))
    else this.kb = Math.min(1, this.kb + dt / 10000)

    if (this.anim) {
      const a = this.anim
      const t = Math.min(1, (now - a.start) / a.duration)
      this.progress = a.from + (a.to - a.from) * a.ease(t)
      if (t >= 1) this.finish()
    }

    this.updateAutoplay(dt)
    if (!document.hidden) {
      this.draw(now)
      this.updateDom()
    }
  }

  /** Per-frame DOM writes (text parallax, custom cursor) without React re-renders. */
  private updateDom() {
    const el = this.el
    if (!el) return
    const m = this.mouse
    const par = this.reducedMotion ? 0 : this.config.fx.parallax
    const layer = el.querySelector<HTMLElement>('[data-parallax]')
    if (layer) {
      const x = (m.x - 0.5) * par * 40 * this.presence
      const y = -(m.y - 0.5) * par * 26 * this.presence
      layer.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`
    }
    const cur = el.querySelector<HTMLElement>('[data-cursor]')
    if (cur) {
      cur.style.transform = `translate3d(${(this.cursor.x * el.clientWidth).toFixed(1)}px, ${((1 - this.cursor.y) * el.clientHeight).toFixed(1)}px, 0)`
      cur.style.opacity = this.presence.toFixed(3)
      const state = this.drag?.active ? 'drag' : this.overInteractive ? 'link' : 'idle'
      if (cur.dataset.state !== state) cur.dataset.state = state
    }
  }

  private updateAutoplay(dt: number) {
    const ap = this.config.autoplay
    const atEnd = !this.config.interaction.loop && this.current >= this.count - 1
    const running =
      ap.enabled && !this.reducedMotion && this.count > 1 && !atEnd && !this.anim && !this.drag?.active &&
      !(ap.pauseOnHover && this.hovering) && !document.hidden
    if (!ap.enabled) this.elapsed = 0
    if (running) {
      this.elapsed += dt
      if (this.elapsed >= ap.interval) {
        this.elapsed = 0
        this.next()
      }
    }
    const fill = this.el?.querySelector<HTMLElement>('[data-active-fill]')
    if (fill) fill.style.transform = `scaleX(${Math.min(1, this.elapsed / ap.interval)})`
  }

  private draw(now: number) {
    if (!this.renderer) return
    const c = this.config
    let effect: ProgramKey = 'fade'
    if (this.target !== null && !this.reducedMotion) {
      const override = c.slides[this.target]?.effect
      effect =
        override && override !== 'inherit' ? override : c.transition.random ? this.randomEffect : c.transition.effect
    }
    if (this.colorCache.hex !== c.transition.edgeColor) {
      this.colorCache = { hex: c.transition.edgeColor, rgb: hexToRgb(c.transition.edgeColor) }
    }
    const m = this.mouse
    const len = Math.hypot(m.vx, m.vy)
    const vs = len > 0.05 ? 0.05 / len : 1
    const rm = this.reducedMotion
    const par = rm ? 0 : c.fx.parallax
    const kbAmt = rm ? 0 : c.fx.kenBurns
    const kb = this.kb * this.kb * (3 - 2 * this.kb)
    const kbDir = this.current % 2 === 0 ? 1 : -1
    this.renderer.render({
      effect,
      from: this.urls[this.current] || null,
      to: this.target !== null ? this.urls[this.target] || null : null,
      progress: this.progress,
      dir: this.dir,
      time: (now - this.t0) / 1000,
      intensity: c.transition.intensity,
      params: effect === 'fade' ? [] : c.effectParams[effect as EffectId],
      color: this.colorCache.rgb,
      mouse: [m.x, m.y],
      mouseVel: [m.vx * vs * 0.6, m.vy * vs * 0.6],
      origin: this.origin,
      hoverAmt: this.hover,
      hoverStrength: c.interaction.hoverStrength,
      hoverRadius: c.interaction.hoverRadius,
      grain: c.appearance.grain,
      vignette: c.appearance.vignette,
      zoom: 1 + par * 0.04 + kbAmt * 0.1 * kb,
      pan: [
        (m.x - 0.5) * par * 0.03 * this.presence + kbDir * kbAmt * 0.015 * kb,
        (m.y - 0.5) * par * 0.03 * this.presence,
      ],
      ambient: rm ? 0 : c.fx.ambient,
      chroma: c.fx.chroma,
    })
  }

  // ---- input ---------------------------------------------------------------

  attach(el: HTMLElement) {
    this.el = el
    el.addEventListener('pointerenter', this.onEnter)
    el.addEventListener('pointerleave', this.onLeave)
    el.addEventListener('pointerdown', this.onDown)
    el.addEventListener('pointermove', this.onMove)
    el.addEventListener('pointerup', this.onUp)
    el.addEventListener('pointercancel', this.onUp)
    el.addEventListener('wheel', this.onWheel, { passive: false })
    window.addEventListener('keydown', this.onKey)
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    const el = this.el
    if (el) {
      el.removeEventListener('pointerenter', this.onEnter)
      el.removeEventListener('pointerleave', this.onLeave)
      el.removeEventListener('pointerdown', this.onDown)
      el.removeEventListener('pointermove', this.onMove)
      el.removeEventListener('pointerup', this.onUp)
      el.removeEventListener('pointercancel', this.onUp)
      el.removeEventListener('wheel', this.onWheel)
    }
    window.removeEventListener('keydown', this.onKey)
    this.renderer?.dispose()
    this.el = null
  }

  private onEnter = () => {
    this.hovering = true
  }

  private onLeave = () => {
    this.hovering = false
  }

  private onDown = (e: PointerEvent) => {
    if (e.button !== 0 || (e.target as Element).closest('[data-no-drag]')) return
    if (!this.config.interaction.drag || this.count < 2 || this.anim) return
    const now = performance.now()
    this.drag = { id: e.pointerId, startX: e.clientX, lastX: e.clientX, lastT: now, vel: 0, active: false }
  }

  private onMove = (e: PointerEvent) => {
    const el = this.el
    if (!el) return
    const r = el.getBoundingClientRect()
    this.mouse.tx = (e.clientX - r.left) / r.width
    this.mouse.ty = 1 - (e.clientY - r.top) / r.height
    this.hovering = true
    this.overInteractive = !!(e.target as Element).closest('a, button')

    const d = this.drag
    if (!d || d.id !== e.pointerId) return
    const now = performance.now()
    const dx = e.clientX - d.startX
    d.vel = d.vel * 0.6 + ((e.clientX - d.lastX) / Math.max(1, now - d.lastT)) * 0.4
    d.lastX = e.clientX
    d.lastT = now
    if (!d.active) {
      if (Math.abs(dx) < 6) return
      d.active = true
      el.setPointerCapture(e.pointerId)
    }
    const frac = (-dx / r.width) * this.config.interaction.dragSensitivity * 1.5
    const dir = Math.sign(frac)
    if (dir === 0) {
      this.progress = 0
      return
    }
    if (this.target === null || this.dir !== dir) {
      const idx = this.neighbor(this.current, dir)
      if (idx === null) {
        this.target = null
        this.progress = 0
        return
      }
      this.target = idx
      this.dir = dir
      this.pickRandom()
      this.origin = [this.mouse.tx, this.mouse.ty]
    }
    this.progress = Math.min(1, Math.abs(frac))
  }

  private onUp = (e: PointerEvent) => {
    const d = this.drag
    if (!d || d.id !== e.pointerId) return
    this.drag = null
    if (!d.active || this.target === null) {
      this.target = null
      this.progress = 0
      return
    }
    const fling = -d.vel * this.dir
    const forward = this.progress > 0.3 || (fling > 0.35 && this.progress > 0.03)
    const now = performance.now()
    if (forward) {
      const duration = Math.max(280, this.duration() * (1 - this.progress) * 0.8)
      this.anim = { from: this.progress, to: 1, start: now, duration, ease: easeOutCubic }
      this.events.onTransitionStart(this.target, duration)
    } else {
      this.anim = { from: this.progress, to: 0, start: now, duration: 380, ease: easeOutCubic }
    }
  }

  private onWheel = (e: WheelEvent) => {
    if (!this.config.interaction.wheel || this.count < 2) return
    e.preventDefault()
    const now = performance.now()
    // Keep extending the lock while trackpad inertia keeps firing: one gesture = one slide.
    if (now < this.wheelLock) {
      this.wheelLock = Math.max(this.wheelLock, now + 150)
      return
    }
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
    if (Math.abs(delta) < 8) return
    this.wheelLock = now + this.duration() + 250
    if (delta > 0) this.next()
    else this.prev()
  }

  private onKey = (e: KeyboardEvent) => {
    if (!this.config.interaction.keyboard || e.metaKey || e.ctrlKey || e.altKey) return
    const t = e.target as HTMLElement | null
    if (t?.closest?.('input, textarea, select, [contenteditable="true"]')) return
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      this.next()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      this.prev()
    }
  }
}

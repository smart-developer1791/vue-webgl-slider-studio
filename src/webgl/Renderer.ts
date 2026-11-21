import type { EffectId } from '@/config/types'
import { EFFECTS, FADE_GLSL } from './effects'
import { VERTEX_SHADER, buildFragment } from './shaders'

export type ProgramKey = EffectId | 'fade'
export type TextureStatus = 'loading' | 'ready' | 'error'

export interface Frame {
  effect: ProgramKey
  from: string | null
  to: string | null
  progress: number
  dir: number
  time: number
  intensity: number
  params: number[]
  color: [number, number, number]
  mouse: [number, number]
  mouseVel: [number, number]
  origin: [number, number]
  hoverAmt: number
  hoverStrength: number
  hoverRadius: number
  grain: number
  vignette: number
  zoom: number
  pan: [number, number]
  ambient: number
  chroma: number
}

const UNIFORMS = [
  'uTex0', 'uTex1', 'uRes0', 'uRes1', 'uResolution', 'uProgress', 'uTime', 'uIntensity', 'uDir', 'uParams',
  'uColor', 'uMouse', 'uMouseVel', 'uOrigin', 'uHoverAmt', 'uHoverStrength', 'uHoverRadius', 'uGrain', 'uVignette',
  'uZoom', 'uPan', 'uAmbient', 'uChroma',
] as const

interface ProgramInfo {
  program: WebGLProgram
  loc: Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>
}

interface TextureEntry {
  status: TextureStatus
  source: TexImageSource | null
  tex: WebGLTexture | null
  w: number
  h: number
}

/** Larger photos are downscaled before upload to keep GPU memory sane. */
const MAX_TEXTURE = 2560

export class Renderer {
  readonly gl: WebGL2RenderingContext
  private readonly canvas: HTMLCanvasElement
  private programs = new Map<ProgramKey, ProgramInfo | null>()
  private textures = new Map<string, TextureEntry>()
  private placeholder: WebGLTexture | null = null
  private vao: WebGLVertexArrayObject | null = null
  private lost = false
  onTextureStatus: ((url: string, status: TextureStatus) => void) | null = null

  static create(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' })
    return gl ? new Renderer(canvas, gl) : null
  }

  private constructor(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) {
    this.canvas = canvas
    this.gl = gl
    this.setup()
    canvas.addEventListener('webglcontextlost', this.handleLost)
    canvas.addEventListener('webglcontextrestored', this.handleRestored)
  }

  private setup() {
    const gl = this.gl
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    // One oversized triangle covers the viewport.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    this.vao = gl.createVertexArray()
    gl.bindVertexArray(this.vao)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    this.placeholder = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, this.placeholder)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([20, 20, 24, 255]))

    this.programs.clear()
    for (const entry of this.textures.values()) entry.tex = entry.source ? this.upload(entry.source) : null
  }

  private handleLost = (e: Event) => {
    e.preventDefault()
    this.lost = true
    this.programs.clear()
    for (const entry of this.textures.values()) entry.tex = null
  }

  private handleRestored = () => {
    this.lost = false
    this.setup()
  }

  private compileShader(type: number, src: string) {
    const gl = this.gl
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, src)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('[webgl] shader compile error', gl.getShaderInfoLog(shader))
      gl.deleteShader(shader)
      return null
    }
    return shader
  }

  private getProgram(key: ProgramKey): ProgramInfo | null {
    if (this.programs.has(key)) return this.programs.get(key) ?? null
    const gl = this.gl
    const vs = this.compileShader(gl.VERTEX_SHADER, VERTEX_SHADER)
    const fs = this.compileShader(gl.FRAGMENT_SHADER, buildFragment(key === 'fade' ? FADE_GLSL : EFFECTS[key].glsl))
    let info: ProgramInfo | null = null
    if (vs && fs) {
      const program = gl.createProgram()
      gl.attachShader(program, vs)
      gl.attachShader(program, fs)
      gl.bindAttribLocation(program, 0, 'aPos')
      gl.linkProgram(program)
      if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const loc = {} as ProgramInfo['loc']
        for (const name of UNIFORMS) loc[name] = gl.getUniformLocation(program, name)
        info = { program, loc }
      } else {
        console.error('[webgl] link error', gl.getProgramInfoLog(program))
      }
    }
    if (vs) gl.deleteShader(vs)
    if (fs) gl.deleteShader(fs)
    this.programs.set(key, info)
    return info
  }

  private upload(source: TexImageSource) {
    const gl = this.gl
    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    return tex
  }

  load(url: string) {
    if (!url || this.textures.has(url)) return
    const entry: TextureEntry = { status: 'loading', source: null, tex: null, w: 1, h: 1 }
    this.textures.set(url, entry)
    const img = new Image()
    if (/^https?:/i.test(url)) img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (this.textures.get(url) !== entry) return
      const scale = Math.min(1, MAX_TEXTURE / Math.max(img.naturalWidth, img.naturalHeight))
      let source: TexImageSource = img
      entry.w = img.naturalWidth
      entry.h = img.naturalHeight
      if (scale < 1) {
        const c = document.createElement('canvas')
        c.width = Math.round(img.naturalWidth * scale)
        c.height = Math.round(img.naturalHeight * scale)
        c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height)
        source = c
        entry.w = c.width
        entry.h = c.height
      }
      entry.source = source
      if (!this.lost) entry.tex = this.upload(source)
      entry.status = 'ready'
      this.onTextureStatus?.(url, 'ready')
    }
    img.onerror = () => {
      if (this.textures.get(url) !== entry) return
      entry.status = 'error'
      this.onTextureStatus?.(url, 'error')
    }
    img.src = url
  }

  /** Frees textures whose URLs are no longer used by any slide. */
  retain(urls: string[]) {
    const keep = new Set(urls)
    for (const [url, entry] of this.textures) {
      if (keep.has(url)) continue
      if (entry.tex) this.gl.deleteTexture(entry.tex)
      this.textures.delete(url)
    }
  }

  private bind(unit: number, entry: TextureEntry | undefined) {
    const gl = this.gl
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(gl.TEXTURE_2D, entry?.tex ?? this.placeholder)
    return entry?.tex ? [entry.w, entry.h] : [1, 1]
  }

  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.max(1, Math.round(this.canvas.clientWidth * dpr))
    const h = Math.max(1, Math.round(this.canvas.clientHeight * dpr))
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w
      this.canvas.height = h
    }
    this.gl.viewport(0, 0, w, h)
  }

  render(f: Frame) {
    const gl = this.gl
    if (this.lost || gl.isContextLost()) return
    this.resize()
    const info = this.getProgram(f.effect) ?? this.getProgram('fade')
    if (!info) return
    gl.useProgram(info.program)
    const L = info.loc
    const r0 = this.bind(0, f.from ? this.textures.get(f.from) : undefined)
    const toUrl = f.to ?? f.from
    const r1 = this.bind(1, toUrl ? this.textures.get(toUrl) : undefined)
    const p = f.params
    gl.uniform1i(L.uTex0, 0)
    gl.uniform1i(L.uTex1, 1)
    gl.uniform2f(L.uRes0, r0[0], r0[1])
    gl.uniform2f(L.uRes1, r1[0], r1[1])
    gl.uniform2f(L.uResolution, this.canvas.width, this.canvas.height)
    gl.uniform1f(L.uProgress, Math.min(1, Math.max(0, f.progress)))
    gl.uniform1f(L.uTime, f.time)
    gl.uniform1f(L.uIntensity, f.intensity)
    gl.uniform1f(L.uDir, f.dir)
    gl.uniform4f(L.uParams, p[0] ?? 0, p[1] ?? 0, p[2] ?? 0, p[3] ?? 0)
    gl.uniform3f(L.uColor, ...f.color)
    gl.uniform2f(L.uMouse, ...f.mouse)
    gl.uniform2f(L.uMouseVel, ...f.mouseVel)
    gl.uniform2f(L.uOrigin, ...f.origin)
    gl.uniform1f(L.uHoverAmt, f.hoverAmt)
    gl.uniform1f(L.uHoverStrength, f.hoverStrength)
    gl.uniform1f(L.uHoverRadius, Math.max(0.01, f.hoverRadius))
    gl.uniform1f(L.uGrain, f.grain)
    gl.uniform1f(L.uVignette, f.vignette)
    gl.uniform1f(L.uZoom, f.zoom)
    gl.uniform2f(L.uPan, ...f.pan)
    gl.uniform1f(L.uAmbient, f.ambient)
    gl.uniform1f(L.uChroma, f.chroma)
    gl.bindVertexArray(this.vao)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  dispose() {
    this.canvas.removeEventListener('webglcontextlost', this.handleLost)
    this.canvas.removeEventListener('webglcontextrestored', this.handleRestored)
    const gl = this.gl
    for (const entry of this.textures.values()) if (entry.tex) gl.deleteTexture(entry.tex)
    for (const info of this.programs.values()) if (info) gl.deleteProgram(info.program)
    this.textures.clear()
    this.programs.clear()
  }
}

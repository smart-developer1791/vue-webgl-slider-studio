import type { EffectId } from '@/config/types'

export interface EffectParam {
  label: string
  min: number
  max: number
  step: number
  default: number
  /** Renders as a segmented control instead of a range */
  options?: string[]
}

export interface EffectDef {
  name: string
  description: string
  params: EffectParam[]
  glsl: string
}

export const FADE_GLSL = `
vec4 transition(vec2 uv) {
  return mix(sampleImg(uTex0, uRes0, uv), sampleImg(uTex1, uRes1, uv), uProgress);
}`

export const EFFECTS: Record<EffectId, EffectDef> = {
  displacement: {
    name: 'Displacement',
    description: 'Noise-map displacement',
    params: [
      { label: 'Strength', min: 0, max: 1.5, step: 0.01, default: 0.45 },
      { label: 'Noise scale', min: 0.5, max: 8, step: 0.1, default: 2.2 },
      { label: 'Angle', min: 0, max: 360, step: 1, default: 20 },
    ],
    glsl: `
vec4 transition(vec2 uv) {
  float p = uProgress;
  float n = fbm(uv * aspect() * uParams.y + vec2(uTime * 0.03, 0.0)) * 0.5 + 0.5;
  float ang = radians(uParams.z);
  vec2 dir = vec2(cos(ang), sin(ang)) * uDir;
  float s = uParams.x * uIntensity;
  vec4 a = sampleImg(uTex0, uRes0, uv + dir * p * s * n);
  vec4 b = sampleImg(uTex1, uRes1, uv - dir * (1.0 - p) * s * n);
  return mix(a, b, smoothstep(n * 0.5, n * 0.5 + 0.5, p));
}`,
  },
  liquid: {
    name: 'Liquid',
    description: 'Viscous liquid flow',
    params: [
      { label: 'Scale', min: 0.5, max: 8, step: 0.1, default: 2.4 },
      { label: 'Turbulence', min: 0, max: 2, step: 0.01, default: 1 },
      { label: 'Edge softness', min: 0.02, max: 0.5, step: 0.01, default: 0.22 },
    ],
    glsl: `
vec4 transition(vec2 uv) {
  float p = uProgress;
  float w = sin(p * PI);
  vec2 q = uv * aspect() * uParams.x;
  float t = uTime * 0.15;
  float n1 = fbm(q + vec2(t, -t));
  float n2 = fbm(q + vec2(4.7, 1.9) + n1 * 1.5 * uParams.y);
  vec2 flow = vec2(n1, n2) * w * 0.15 * uIntensity * uParams.y;
  vec4 a = sampleImg(uTex0, uRes0, uv + flow * (0.5 + p));
  vec4 b = sampleImg(uTex1, uRes1, uv - flow * (1.5 - p));
  float s = uParams.z;
  float e = n2 * 0.5 + 0.5;
  float m = smoothstep(e - s, e + s, p * (1.0 + 2.0 * s) - s);
  return mix(a, b, m);
}`,
  },
  glitch: {
    name: 'RGB Glitch',
    description: 'Digital glitch and channel splitting',
    params: [
      { label: 'RGB split', min: 0, max: 0.15, step: 0.001, default: 0.04 },
      { label: 'Block count', min: 4, max: 80, step: 1, default: 22 },
      { label: 'Chaos', min: 0, max: 1, step: 0.01, default: 0.6 },
    ],
    glsl: `
vec4 transition(vec2 uv) {
  float p = uProgress;
  float w = sin(p * PI);
  float t = floor(uTime * 24.0);
  float row = floor(uv.y * uParams.y);
  float hit = step(1.0 - uParams.z * w, hash(vec2(row, t)));
  float shift = (hash(vec2(row + 11.0, t)) - 0.5) * 0.35 * w * uIntensity * hit;
  vec2 g = vec2(uv.x + shift, uv.y);
  vec2 sp = vec2(uParams.x * w * uIntensity, 0.0);
  vec4 a = vec4(sampleRaw(uTex0, uRes0, g + sp).r, sampleRaw(uTex0, uRes0, g).g, sampleRaw(uTex0, uRes0, g - sp).b, 1.0);
  vec4 b = vec4(sampleRaw(uTex1, uRes1, g - sp).r, sampleRaw(uTex1, uRes1, g).g, sampleRaw(uTex1, uRes1, g + sp).b, 1.0);
  float th = mix(hash(vec2(row, 3.7)), hash(vec2(row, t + 5.0)), 0.35);
  vec4 c = mix(a, b, step(th, p));
  c.rgb *= 1.0 - 0.12 * w * uIntensity * step(0.5, fract(gl_FragCoord.y * 0.5));
  return c;
}`,
  },
  pixelate: {
    name: 'Pixelate',
    description: 'Pixel mosaic',
    params: [
      { label: 'Pixel size', min: 4, max: 160, step: 1, default: 44 },
      { label: 'Transition smoothness', min: 0.02, max: 0.5, step: 0.01, default: 0.16 },
      { label: 'Scatter', min: 0, max: 1, step: 0.01, default: 0.7 },
    ],
    glsl: `
vec4 transition(vec2 uv) {
  float p = uProgress;
  float w = sin(p * PI);
  float size = max(1.0, floor(uParams.x * uIntensity * w));
  vec2 cells = uResolution / size;
  vec2 cell = floor(uv * cells);
  vec2 puv = size > 1.0 ? (cell + 0.5) / cells : uv;
  vec4 a = sampleImg(uTex0, uRes0, puv);
  vec4 b = sampleImg(uTex1, uRes1, puv);
  float bl = uParams.y;
  float m = smoothstep(0.5 - bl, 0.5 + bl, p + (hash(cell) - 0.5) * uParams.z * w);
  return mix(a, b, m);
}`,
  },
  dissolve: {
    name: 'Noise Dissolve',
    description: 'Dissolve with a glowing edge',
    params: [
      { label: 'Noise scale', min: 0.5, max: 12, step: 0.1, default: 2.8 },
      { label: 'Edge width', min: 0.01, max: 0.3, step: 0.005, default: 0.07 },
      { label: 'Glow', min: 0, max: 4, step: 0.05, default: 1.6 },
    ],
    glsl: `
vec4 transition(vec2 uv) {
  float p = uProgress;
  float n = fbm(uv * aspect() * uParams.x) * 0.5 + 0.5;
  float e = uParams.y;
  float t = p * (1.0 + 2.0 * e) - e;
  float m = smoothstep(n - e * 0.5, n + e * 0.5, t);
  float band = 1.0 - abs(m * 2.0 - 1.0);
  vec2 push = (vec2(n) - 0.5) * band * 0.05 * uIntensity;
  vec4 c = mix(sampleImg(uTex0, uRes0, uv + push), sampleImg(uTex1, uRes1, uv - push), m);
  float glow = (1.0 - smoothstep(0.0, e * 1.5, abs(t - n))) * clamp(sin(p * PI) * 4.0, 0.0, 1.0);
  c.rgb += uColor * (glow * 0.6 + band) * uParams.z * 0.6 * uIntensity;
  return c;
}`,
  },
  ripple: {
    name: 'Ripple',
    description: 'Ripple from the cursor or center',
    params: [
      { label: 'Frequency', min: 4, max: 80, step: 1, default: 28 },
      { label: 'Amplitude', min: 0, max: 0.1, step: 0.001, default: 0.03 },
      { label: 'Wave width', min: 0.05, max: 0.6, step: 0.01, default: 0.24 },
    ],
    glsl: `
vec4 transition(vec2 uv) {
  float p = uProgress;
  vec2 asp = aspect();
  vec2 d = (uv - uOrigin) * asp;
  float dist = length(d);
  float maxD = length(max(uOrigin, 1.0 - uOrigin) * asp);
  float width = uParams.z;
  float r = p * (maxD + width + 0.1) - 0.05;
  float x = dist - r;
  float env = (1.0 - smoothstep(0.0, width, abs(x))) * smoothstep(0.0, 0.12, p) * (1.0 - smoothstep(0.85, 1.0, p));
  vec2 dir = dist > 0.0001 ? d / dist : vec2(0.0);
  float wave = sin(x * uParams.x);
  vec2 off = dir / asp * wave * uParams.y * env * uIntensity;
  float m = 1.0 - smoothstep(-0.02, 0.02, x);
  vec4 c = mix(sampleImg(uTex0, uRes0, uv + off), sampleImg(uTex1, uRes1, uv + off), m);
  c.rgb += env * wave * 0.07 * uIntensity;
  return c;
}`,
  },
  zoomBlur: {
    name: 'Zoom Blur',
    description: 'Radial burst into depth',
    params: [
      { label: 'Blur', min: 0, max: 1, step: 0.01, default: 0.55 },
      { label: 'Zoom', min: 0, max: 0.6, step: 0.01, default: 0.22 },
    ],
    glsl: `
vec4 transition(vec2 uv) {
  float p = uProgress;
  float w = sin(p * PI);
  vec2 c = uOrigin;
  vec2 dir = uv - c;
  float s = uParams.x * w * uIntensity * 0.35;
  float z0 = 1.0 - uParams.y * p;
  float z1 = 1.0 - uParams.y * (1.0 - p);
  vec4 a = vec4(0.0);
  vec4 b = vec4(0.0);
  for (int i = 0; i < 16; i++) {
    float k = 1.0 - s * float(i) / 15.0;
    a += sampleRaw(uTex0, uRes0, c + dir * z0 * k);
    b += sampleRaw(uTex1, uRes1, c + dir * z1 * k);
  }
  vec4 col = mix(a / 16.0, b / 16.0, smoothstep(0.25, 0.75, p));
  col.rgb += w * w * 0.08 * uIntensity;
  return col;
}`,
  },
  slices: {
    name: 'Slices',
    description: 'Staggered sliding strips',
    params: [
      { label: 'Strips', min: 2, max: 24, step: 1, default: 7 },
      { label: 'Direction', min: 0, max: 1, step: 1, default: 0, options: ['Vertical', 'Horizontal'] },
      { label: 'Delay', min: 0, max: 0.9, step: 0.01, default: 0.45 },
    ],
    glsl: `
vec4 transition(vec2 uv) {
  float p = uProgress;
  float n = max(2.0, floor(uParams.x));
  float horiz = step(0.5, uParams.y);
  float across = mix(uv.x, uv.y, horiz);
  float along = mix(uv.y, uv.x, horiz);
  vec2 axis = mix(vec2(0.0, 1.0), vec2(1.0, 0.0), horiz);
  float idx = floor(clamp(across, 0.0, 0.9999) * n);
  float ord = idx / (n - 1.0);
  ord = uDir > 0.0 ? ord : 1.0 - ord;
  float st = uParams.z;
  float lp = clamp((p - ord * st) / (1.0 - st), 0.0, 1.0);
  lp = lp < 0.5 ? 4.0 * lp * lp * lp : 1.0 - pow(-2.0 * lp + 2.0, 3.0) / 2.0;
  float alt = mod(idx, 2.0) < 0.5 ? 1.0 : -1.0;
  vec4 a = sampleImg(uTex0, uRes0, uv - axis * alt * lp * 0.5 * uIntensity);
  vec4 b = sampleImg(uTex1, uRes1, uv + axis * alt * (1.0 - lp));
  float m = alt > 0.0 ? step(along, lp) : step(1.0 - lp, along);
  float seam = alt > 0.0 ? along - lp : (1.0 - lp) - along;
  vec4 c = mix(a, b, m);
  c.rgb *= 1.0 - 0.4 * (1.0 - smoothstep(0.0, 0.08, abs(seam))) * sin(lp * PI);
  return c;
}`,
  },
}

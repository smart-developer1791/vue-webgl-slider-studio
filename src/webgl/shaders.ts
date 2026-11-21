export const VERTEX_SHADER = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`

const HEADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;

uniform sampler2D uTex0;
uniform sampler2D uTex1;
uniform vec2 uRes0;
uniform vec2 uRes1;
uniform vec2 uResolution;
uniform float uProgress;
uniform float uTime;
uniform float uIntensity;
uniform float uDir;
uniform vec4 uParams;
uniform vec3 uColor;
uniform vec2 uMouse;
uniform vec2 uMouseVel;
uniform vec2 uOrigin;
uniform float uHoverAmt;
uniform float uHoverStrength;
uniform float uHoverRadius;
uniform float uGrain;
uniform float uVignette;
uniform float uZoom;
uniform vec2 uPan;
uniform float uAmbient;
uniform float uChroma;

#define PI 3.141592653589793

// Per-pixel RGB split driven by mouse velocity (set in main).
vec2 gShift;

vec2 aspect() { return vec2(uResolution.x / uResolution.y, 1.0); }

// object-fit: cover
vec2 cover(vec2 uv, vec2 res) {
  float sa = uResolution.x / uResolution.y;
  float ta = res.x / res.y;
  vec2 s = sa > ta ? vec2(1.0, ta / sa) : vec2(sa / ta, 1.0);
  return (uv - 0.5) * s + 0.5;
}

vec4 sampleRaw(sampler2D t, vec2 res, vec2 uv) { return texture(t, cover(uv, res)); }

vec4 sampleImg(sampler2D t, vec2 res, vec2 uv) {
  vec4 c = texture(t, cover(uv, res));
  c.r = texture(t, cover(uv + gShift, res)).r;
  c.b = texture(t, cover(uv - gShift, res)).b;
  return c;
}

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }

// Simplex noise, Ashima Arts (MIT)
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * snoise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v;
}
`

const FOOTER = `
vec3 finish(vec3 col) {
  vec2 p = vUv - 0.5;
  p.x *= uResolution.x / uResolution.y * 0.75;
  col *= 1.0 - uVignette * smoothstep(0.2, 0.95, length(p) * 1.25);
  float n = hash(gl_FragCoord.xy + fract(uTime * 7.13) * 917.0) - 0.5;
  col += n * uGrain * 0.18;
  return col;
}

void main() {
  vec2 asp = aspect();
  // Ken Burns + parallax: zoom/pan the whole scene in screen space.
  vec2 uv = (vUv - 0.5) / uZoom + 0.5 + uPan;
  if (uAmbient > 0.0) {
    float t = uTime * 0.08;
    uv += vec2(snoise(vUv * 2.2 + vec2(t, 0.0)), snoise(vUv * 2.2 + vec2(17.0, -t))) * uAmbient * 0.007;
  }
  vec2 d = (vUv - uMouse) * asp;
  float m = (1.0 - smoothstep(0.0, uHoverRadius, length(d))) * uHoverAmt * uHoverStrength;
  uv -= (d / asp) * m * 0.22;
  vec2 fc = vUv - 0.5;
  gShift = uMouseVel * m + fc * dot(fc, fc) * uChroma * 0.04;
  vec4 c = transition(uv);
  outColor = vec4(finish(c.rgb), 1.0);
}
`

/** Each effect supplies `vec4 transition(vec2 uv)`. */
export function buildFragment(effectGlsl: string) {
  return HEADER + effectGlsl + FOOTER
}

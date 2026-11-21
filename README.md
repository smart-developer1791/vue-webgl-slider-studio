<div align="center">

# ✦ Shader Slider Studio

**Vue implementation of Shader Slider Studio, a WebGL image slider with live controls and eight shader transitions**

[![Vue](https://img.shields.io/badge/Vue-3-42B883?style=for-the-badge&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2.2-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](#cloudflare-pages)
[![MIT License](https://img.shields.io/badge/License-MIT-E3B341?style=for-the-badge)](LICENSE)

<br />

*Build a sequence of images, tune its transitions while they play, and save the result as a preset or a portable JSON file.*

</div>

---

## ✨ Highlights

- Eight WebGL transitions with adjustable timing, easing, intensity, and shader parameters. Select a transition for the entire slider or override it for individual slides.
- A live preview alongside controls for typography, colors, indicators, autoplay, and interaction.
- Cinematic effects including Ken Burns zoom, depth parallax, ambient motion, chromatic aberration, film grain, and vignette.
- Slide editing with image uploads or URLs, editable captions and links, and drag-and-drop reordering.
- Four built-in presets, custom presets, and browser autosave. JSON export embeds uploaded images and preserves remote image URLs.
- Fullscreen preview, a responsive settings panel, reduced-motion support, and a CSS fallback when WebGL2 is unavailable.

## 🧭 Scope

The studio runs at `/`. The slider and settings share the same screen, with all editing and storage handled in the browser.

| Control | Action |
| --- | --- |
| `H` | Show or hide the settings panel |
| `F` | Toggle fullscreen |
| `Esc` | Exit browser fullscreen |
| `←` / `→` | Previous or next slide when keyboard navigation is enabled |
| Drag or swipe | Control transition progress when dragging is enabled |
| Mouse wheel or trackpad | Navigate when wheel control is enabled |

## 🛠️ Tech Stack

| Layer | Technology |
| --- | --- |
| Interface | Vue 3, TypeScript 6, Lucide |
| Styling | Tailwind CSS 4 and custom CSS animations |
| Rendering | Native WebGL2 and GLSL |
| Storage | localStorage for settings and presets, IndexedDB for uploaded images |
| Build | Vite 8 and npm |
| Hosting | Cloudflare Pages with Git integration or Direct Upload |

## 🧱 Architecture

Vue single-file components render the slider, captions, and settings panel. A provided studio composable holds reactive settings and saves them in the browser. `SliderEngine` manages navigation and animation timing. The WebGL renderer loads textures and draws each frame using the selected GLSL shader.

The [slider engine](src/slider/engine.ts), [WebGL renderer and shaders](src/webgl/), and [configuration types](src/config/types.ts) come from the [React implementation](https://react-webgl-slider-studio.pages.dev/). Both versions use JSON format version 1, so you can export a configuration from one studio and import it into the other.

Storage is tied to the current origin. Export a JSON file to move settings and uploaded images from localhost or a preview URL to production. The original demo photos load from Unsplash and fonts load from Google Fonts. Remote images must support cross-origin requests to work as WebGL textures.

JSON import limits each embedded image to 20 million characters in its data URL, roughly 15 MB before encoding. Larger images may be truncated even when the import reports success.

## 🗂️ Project Structure

```text
vue-webgl-slider-studio/
├── public/             # Favicon and crawler rules
├── src/
│   ├── settings/       # Inline settings, slide editor, and Vue controls
│   ├── config/         # Defaults, presets, validation, and storage
│   ├── lib/            # Color helpers
│   ├── slider/         # Slider UI and animation engine
│   ├── webgl/          # Renderer, shaders, effects, and easing
│   ├── App.vue
│   ├── index.css
│   └── main.ts
├── .node-version       # Node.js version for Pages builds
├── index.html
├── LICENSE
├── package.json
├── package-lock.json
├── README.md
├── tsconfig.json
├── vite.config.ts
└── wrangler.jsonc      # Cloudflare Pages project and output directory
```

## 🚀 Local Development

Use Node.js 24.14.0, the version pinned in `.node-version`.

```bash
npm ci
npm run dev
```

Run `npm run build` to check TypeScript with `vue-tsc` and generate `dist/`. Run `npm run preview` to serve that build locally with Vite.

## 🌐 Deployment

### Cloudflare Pages

[![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy_to-Cloudflare_Pages-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://dash.cloudflare.com/?to=/:account/workers-and-pages)

The button opens **Workers & Pages** in the Cloudflare dashboard. Choose **Create application**, then **Continue to Pages** below the app creation options and **Import an existing Git repository → Get started**. Cloudflare's [automatic deploy button](https://developers.cloudflare.com/workers/platform/deploy-buttons/#limitations) supports Workers only.

1. Push this project to GitHub or GitLab and select the repository in the Pages setup wizard. When installing the Cloudflare GitHub app, use **Only select repositories** and choose this repository.
2. Use the settings below, then choose **Save and Deploy**.
3. Open the production URL shown by Cloudflare. Subsequent pushes to the production branch trigger new builds, and other branches can create preview deployments.

| Cloudflare Pages setting | Value |
| --- | --- |
| Project name | `vue-webgl-slider-studio` |
| Production branch | The branch you publish from, commonly `master` or `main` |
| Framework preset | `Vue` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | Leave blank in a standalone repo. Set `vue-webgl-slider-studio` if it is a subdirectory of a larger repo. |

Pages reads the Node.js version from `.node-version`. The app runs entirely in the browser and requires no application environment variables, secrets, or Pages Functions. If you choose a different Pages project name, update `name` in `wrangler.jsonc` to match.

See the [Cloudflare Pages Git integration guide](https://developers.cloudflare.com/pages/get-started/git-integration/) and [build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/).

### Direct Upload

For a manual deployment, run `npm run build`, choose **Continue to Pages → Drag and drop your files**, and upload `dist/`. Select Git integration at project creation for automatic builds on repository pushes. See the [Direct Upload guide](https://developers.cloudflare.com/pages/get-started/direct-upload/).

## 📄 License

MIT License. See [LICENSE](LICENSE).

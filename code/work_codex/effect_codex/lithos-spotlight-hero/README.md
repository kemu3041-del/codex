# Lithos Spotlight Hero

A full-screen React 18 hero for a geology brand. A smoothed cursor position drives a canvas-generated radial mask that reveals a second geological image over the base scene.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Implementation notes

- `src/App.tsx` contains the hero, navigation, cursor smoothing loop, and reusable `RevealLayer`.
- `src/index.css` contains Tailwind, the supplied Google Fonts import, and reduced-motion-aware entrance animations.
- Content and image URLs can be replaced directly or moved into CMS fields. The reveal radius and easing are isolated in `SPOTLIGHT_R` and the RAF interpolation factor.
- The current source-code delivery requires Vite/Tailwind compilation; use the generated `dist/` assets for a platform that accepts bundled files.

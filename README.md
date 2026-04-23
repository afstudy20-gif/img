# Frameflow

Browser image editor. Annotate, crop, OCR, background removal. React 19 + Vite 7. PWA.

**Live:** https://img.drtr.uk

## Features

- Annotation tools: arrow, pen, highlight, shape, callout, step, blur, text, mask, crop, fill, selection, grab-text (OCR)
- Right panel: Quick Styles + Tool Properties per active tool
- Left panel: compact drop/open + Effects (filters, brightness, contrast, saturation, border)
- Floating toolbar for editing annotation color/stroke/opacity/font
- Undo/Redo, color swap, eyedropper (EyeDropper API)
- OCR via Tesseract.js (CDN)
- Background removal via @imgly/background-removal (CDN)
- Export: PNG/JPEG/WebP/SVG/PDF with DPI presets, resize, aspect lock, bg fill
- JSON project export/import
- Canvas presets: A3/A4/A5/1:1/16:9/9:16/free + blank canvas creation
- Zoom presets + ±0.1 step, rotate ±0.1°/90°, flip H/V
- Canvas bg: checker/white/black/gray/warm/cool
- Theme: light/dark + language TR/EN (persisted)
- PWA: installable, offline, file_handlers, share_target
- Mobile responsive (touch targets ≥34px)
- Paste from clipboard, drag-drop anywhere

## Dev

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/
npm run preview  # serve dist/
```

## Docker

```bash
docker build -t frameflow .
docker run -p 8080:80 frameflow
```

Multi-stage: `node:20-alpine` build → `nginx:1.27-alpine` serves `dist/`.

## Coolify Deploy

1. **New Resource → Application → Git repo**
   - Repo: `https://github.com/afstudy20-gif/img`
   - Branch: `main`
   - Build Pack: **Dockerfile**
2. **Port**: `80`
3. **Domain**: `img.drtr.uk` (Traefik handles TLS via Let's Encrypt)
4. **Health Check**: path `/`, port `80` (Dockerfile HEALTHCHECK already defined)
5. **Environment**: none required — client-only app
6. **Persistent Storage**: none — browser handles all data (IndexedDB)
7. Deploy

### Headers (nginx.conf already sets):
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: credentialless`

### Cache policy:
- `/sw.js` → no-cache
- `/manifest.webmanifest` → no-cache
- `/assets/*` → immutable 1 year
- SPA fallback → `index.html`

## Tech

- React 19, Vite 7, vite-plugin-pwa, workbox
- Canvas 2D + SVG viewBox "0 0 1 1" relative coords
- File System Access API (optional folder open)
- Clipboard API (paste image)
- EyeDropper API (color pick)
- getDisplayMedia (screen capture)
- Dynamic ESM imports from CDN (Tesseract, @imgly/background-removal, exifr, jspdf)

## License

MIT

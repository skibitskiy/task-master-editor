# Task Master Editor (Electron + TypeScript + Vite)

Secure Electron skeleton with:
- Strict TypeScript
- Secure BrowserWindow defaults: `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false`
- `electron-log` for main-process logging
- External link allow-list via `electron/security.ts`
- Vite-powered renderer

## Scripts

- `npm run dev` — Starts Vite (renderer) and compiles main/preload, then launches Electron
- `npm run build` — Builds main/preload to `dist/electron` and renderer to `dist/renderer`
- `npm run start` — Launches Electron using compiled output

## Install

```bash
npm install
```

## Development

```bash
# One command dev (window should appear)
npm run dev
```

## Production build

```bash
npm run build
npm run start
```

## Security notes

- Navigation outside the app is blocked by default; only allow-listed origins in `electron/security.ts` open via `shell.openExternal()`.
- Renderer has no Node access. Use `preload` + `contextBridge` to expose minimal, typed APIs (to be implemented in Task 2).


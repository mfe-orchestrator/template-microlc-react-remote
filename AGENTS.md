# AGENTS.md

micro-lc React parcel template for the MFE Orchestrator. Read README.md for the why; these are the
rules that keep it loadable.

## Commands

- `pnpm install`, `pnpm dev` (standalone, port 4300), `pnpm build` (→ `dist/parcel.js`),
  `pnpm typecheck`, `pnpm preview` (dist with CORS, port 4301).
- pnpm 12 via `packageManager`, Node 24 LTS.

## Invariants

- The build output is exactly one file, `dist/parcel.js`, the marketplace `entryPoint`. Do not rename
  it, do not add chunks (no dynamic `import()`), do not emit CSS files: qiankun evaluates the script
  with the host's public path, so sibling files would be requested from the host.
- Format stays `umd`. qiankun cannot evaluate ES modules; micro-lc parcels are UMD only.
- `src/parcel.tsx` exports `bootstrap`, `mount`, `unmount`, each returning a Promise. `unmount` must
  undo everything `mount` did: the bundle is evaluated once and mounted many times.
- `react`, `react-dom`, `react-dom/client`, `react/jsx-runtime` are externals mapped to
  `window.React`, `window.ReactDOM`, `window.ReactJSXRuntime`. Changing a name breaks every host
  that publishes the current ones (template-microlc-react-host `src/shared-react.ts`).
- Styles are global while mounted: scope new rules under `.microlc-react-remote`.
- Never hardcode a URL to this remote anywhere: hosts resolve it with `remoteUrl('<slug>')`.

## Verify a change

`pnpm build`, check `ls dist` shows only `parcel.js` and that it contains no React source
(`grep -c useState= dist/parcel.js` → 0), then mount it in the host (see the host README).

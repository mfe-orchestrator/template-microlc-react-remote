# micro-lc & React — remote (parcel) template

Starter template for the [MFE Orchestrator](https://github.com/mfe-orchestrator): a React 19
[micro-lc](https://micro-lc.io) **parcel** application, built with Vite. It is mounted by
[template-microlc-react-host](https://github.com/mfe-orchestrator/template-microlc-react-host).

## Requirements

- Node.js 24 LTS
- [pnpm](https://pnpm.io) 12 (pinned in `packageManager`; `corepack enable` picks it up)

## Getting started

```bash
pnpm install
pnpm dev        # standalone, http://localhost:4300
pnpm build      # production parcel: dist/parcel.js
pnpm preview    # serves dist/ with CORS on http://localhost:4301 (for a local host)
```

## Project structure

```
.
├── index.html          # standalone dev page only (pnpm dev)
├── src/
│   ├── parcel.tsx      # bootstrap / mount / unmount: the parcel entry
│   ├── main.tsx        # standalone dev entry, calls the lifecycles by hand
│   ├── App.tsx
│   ├── components/Button.tsx
│   └── index.css       # inlined into the bundle, scoped under .microlc-react-remote
├── package.json
├── pnpm-workspace.yaml
└── vite.config.ts      # UMD library build, React as an external
```

## Entry point

`pnpm build` writes **one file: `dist/parcel.js`**. That is the marketplace `entryPoint`
(`parcel.js`, relative to `dist/`). CI zips `dist/` and uploads it; the orchestrator then serves it
under a version pinned URL, which is what the host receives from `remoteUrl('example-remote')`.

The file is self-contained on purpose: CSS is inlined (`?inline` import), imported assets are inlined
by Vite's library mode, and there are no chunks. micro-lc evaluates the script with the *host's*
public path, so a parcel that tried to load sibling files relative to itself would request them from
the host. One file means the versioned URL is all there is to fetch.

## How micro-lc loads this parcel

micro-lc 2 delegates parcels to [qiankun](https://qiankun.umijs.org) 2.10 (`loadMicroApp`). For an
application declared as

```js
{ integrationMode: 'parcel', route: './example-remote/', entry: { scripts: [url] } }
```

1. The first time the route is visited, qiankun **`fetch()`es** `url` (so the server must answer
   with CORS headers; `pnpm preview` and the orchestrator do), wraps the source and **evaluates it
   inside a JS sandbox**: a `Proxy` that stands in for `window`, `self` and `globalThis`
   (micro-lc uses `sandbox: { speedy: false }`). Globals the parcel writes stay in its sandbox;
   reads of anything it did not write fall through to the real `window`.
2. The lifecycles are taken from what the entry script exports. qiankun only understands
   **classic UMD scripts**, which is why this is a Vite library build in `umd` format: no
   `<script type="module">`, no `import()` of chunks, no Module Federation, no import maps
   (micro-lc's `importmap` setting is for its composer, not for parcels).
3. `bootstrap()` runs once; `mount({ container, ...props })` runs on every visit of the route and
   `unmount()` every time the user leaves it. The script is **not** re-fetched or re-evaluated on the
   next visit: module state survives between mounts, so `unmount()` must undo everything `mount()`
   did (here: the React root and the wrapper with its `<style>`).
4. `mount` also receives micro-lc's `microlcApi` and the `properties` declared for the application
   in the host's config.

Styles are **not** isolated: micro-lc mounts parcels in its light DOM, so the styles are global
while the parcel is mounted. Every rule is scoped under `.microlc-react-remote`.

## Sharing React

A sandboxed UMD script cannot `import` anything from the host, so by default every parcel would
bundle its own React and ReactDOM. That works — each copy is isolated — but costs a download per
parcel and leaves several Reacts on the page.

This template avoids it: `react`, `react-dom`, `react-dom/client` and `react/jsx-runtime` are
**externals** of the UMD build, mapped to globals. Reads that miss the sandbox reach the real
`window`, where the host publishes its own React before starting micro-lc:

| import | global the host must publish |
| --- | --- |
| `react` | `window.React` |
| `react-dom`, `react-dom/client` | `window.ReactDOM` (both entry points merged) |
| `react/jsx-runtime` | `window.ReactJSXRuntime` |

`dist/parcel.js` is under 2 kB, and the page runs on one React (verified by counting the ReactDOM
renderers registered on the page: one).

What this means for you:

- The host and its parcels share one React **major**: build parcels against the version the host
  ships, and upgrade them together.
- The parcel only works in a host that publishes those globals
  ([template-microlc-react-host](https://github.com/mfe-orchestrator/template-microlc-react-host)
  does, in `src/shared-react.ts`).
- To make a parcel independent of the host's React instead, delete `rolldownOptions` from
  `vite.config.ts` and add `define: { 'process.env.NODE_ENV': '"production"' }` (library mode
  leaves `process.env` untouched, and a browser has no `process`). The parcel then bundles its own
  copy (about 69 kB gzip instead of 1 kB) and runs in any micro-lc host.
- `pnpm dev` is unaffected: it resolves React from `node_modules`.

## Adding it to a host

In the host's runtime micro-lc config, one application per microfrontend, its entry resolved by
slug through the SDK:

```ts
'example-remote': {
  integrationMode: 'parcel',
  route: './example-remote/',
  entry: { scripts: [await remoteUrl('example-remote')] }
}
```

## License

MIT

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// micro-lc mounts parcels through qiankun, which fetches the entry script and
// evaluates it inside a JS sandbox. qiankun only understands classic scripts that
// export the lifecycles as UMD: no `<script type="module">`, no `import()` of
// sibling chunks. So the production build is a Vite *library* build in UMD
// format, one self-contained file: dist/parcel.js.
//
// React is NOT bundled. The UMD wrapper reads it from globals the micro-lc host
// publishes on window (React, ReactDOM, ReactJSXRuntime), so the whole page runs on
// one React. See README, "Sharing React".
const reactGlobals = {
  react: 'React',
  'react-dom': 'ReactDOM',
  'react-dom/client': 'ReactDOM',
  'react/jsx-runtime': 'ReactJSXRuntime'
}

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/parcel.tsx',
      name: 'microlcReactRemote',
      formats: ['umd'],
      fileName: () => 'parcel.js'
    },
    rolldownOptions: {
      external: Object.keys(reactGlobals),
      output: { globals: reactGlobals }
    }
  },
  // `vite preview` serves dist/ to a host on another origin: qiankun fetch()es the
  // entry, so it needs CORS.
  preview: { port: 4301, cors: true },
  server: { port: 4300, cors: true }
})

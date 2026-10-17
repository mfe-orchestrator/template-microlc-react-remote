// Standalone development entry (pnpm dev): runs the parcel lifecycles by hand,
// the way micro-lc would, against a local container. React comes from
// node_modules here; only the production UMD build expects the host's globals.
import { bootstrap, mount } from './parcel'

await bootstrap()
await mount({ container: document.getElementById('root') as HTMLElement })

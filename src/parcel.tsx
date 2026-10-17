// micro-lc parcel entry. micro-lc (through qiankun) calls these lifecycles:
//   bootstrap → once, before the first mount
//   mount     → every time the router selects this application
//   unmount   → every time the user navigates to another application
// Each one must return a Promise. Everything created in mount is torn down in
// unmount, because the same evaluated bundle is mounted again on the next visit.
import { StrictMode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import App from './App'
// Inlined as a string and injected next to the app: the bundle stays a single file
// and the styles are removed with the parcel on unmount. They are not isolated
// (micro-lc mounts parcels in the light DOM), so every rule is scoped under
// .microlc-react-remote.
import styles from './index.css?inline'

export interface ParcelProps {
  /** DOM node micro-lc assigns to this parcel. */
  container?: Element | ShadowRoot
  /** Anything else micro-lc passes: `microlcApi`, the `properties` of the application, ... */
  [key: string]: unknown
}

let root: Root | undefined
let wrapper: HTMLElement | undefined

export async function bootstrap(): Promise<null> {
  return null
}

export async function mount({ container }: ParcelProps): Promise<null> {
  wrapper = document.createElement('div')
  wrapper.className = 'microlc-react-remote'
  const style = document.createElement('style')
  style.textContent = styles
  const mountPoint = document.createElement('div')
  wrapper.append(style, mountPoint)
  ;(container ?? document.body).append(wrapper)

  root = createRoot(mountPoint)
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  )
  return null
}

export async function unmount(): Promise<null> {
  root?.unmount()
  wrapper?.remove()
  root = undefined
  wrapper = undefined
  return null
}

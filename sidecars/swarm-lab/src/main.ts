import './styles/base.css'
import './styles/gallery.css'
import './styles/focus.css'

import { App } from './app/App'

const canvas = document.querySelector<HTMLCanvasElement>('#gl')
const root = document.querySelector<HTMLElement>('#app')

if (!canvas || !root) {
  throw new Error('Swarm lab shell is missing its canvas or root element.')
}

const app = new App(canvas, root)

if (import.meta.env.DEV) {
  ;(window as unknown as { __swarmLab?: App }).__swarmLab = app
}

canvas.addEventListener('webglcontextlost', (event) => {
  event.preventDefault()
  const live = document.querySelector<HTMLElement>('#live')
  if (live) live.textContent = 'The WebGL context was lost. Reload to restart the lab.'
})

canvas.classList.add('ready')

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    app.destroy()
  })
}

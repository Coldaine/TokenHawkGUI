import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

export interface Bloom {
  setScene(scene: THREE.Scene, camera: THREE.Camera): void
  setSize(width: number, height: number): void
  render(): void
  dispose(): void
}

/**
 * Bloom is a focus-mode-only luxury: cards use bare additive glow so a grid of
 * twelve live worlds stays cheap.
 */
export function createBloom(renderer: THREE.WebGLRenderer, width: number, height: number): Bloom {
  const composer = new EffectComposer(renderer)
  const renderPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera())
  // Half-resolution bloom: cheaper, and the softer halo suits the dust.
  const bloom = new UnrealBloomPass(new THREE.Vector2(width * 0.5, height * 0.5), 0.85, 0.55, 0.32)
  const output = new OutputPass()

  composer.addPass(renderPass)
  composer.addPass(bloom)
  composer.addPass(output)
  composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  composer.setSize(width, height)

  return {
    setScene(scene, camera) {
      renderPass.scene = scene
      renderPass.camera = camera
    },
    setSize(w, h) {
      composer.setSize(w, h)
      bloom.setSize(w * 0.5, h * 0.5)
    },
    render() {
      composer.render()
    },
    dispose() {
      composer.dispose()
      bloom.dispose()
      output.dispose()
    },
  }
}

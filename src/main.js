import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { createWorld } from './world.js'
import { createFox } from './fox.js'
import { bindUI, setLoading } from './ui.js'
import './style.css'

const app = document.querySelector('#app')

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 0.95
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
app.appendChild(renderer.domElement)

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.1,
  200,
)
camera.position.set(11, 5.6, 13)

const controls = new OrbitControls(camera, renderer.domElement)
controls.target.set(0, 0.7, 0)
controls.enableDamping = true
controls.maxPolarAngle = Math.PI * 0.48
controls.minDistance = 3
controls.maxDistance = 28
controls.update()

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

async function main() {
  try {
    await createWorld(scene, renderer)
    const fox = await createFox(scene)
    bindUI(fox)
    setLoading('', true)

    const clock = new THREE.Clock()
    function tick() {
      const dt = Math.min(clock.getDelta(), 0.05)
      fox.update(dt, camera)
      controls.update()
      renderer.render(scene, camera)
      requestAnimationFrame(tick)
    }
    tick()
  } catch (error) {
    console.error(error)
    setLoading('Não foi possível carregar a cena. Veja o console para o detalhe.')
  }
}

main()

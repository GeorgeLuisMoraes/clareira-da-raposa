import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { FADE_SECONDS, FOX_HEIGHT, PATH_RADIUS, SPEEDS } from './constants.js'

const CLIP_NAMES = ['survey', 'walk', 'run']

export async function createFox(scene) {
  const gltf = await new GLTFLoader().loadAsync('/models/Fox.glb')
  const model = gltf.scene

  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })

  const bounds = new THREE.Box3().setFromObject(model)
  const height = bounds.max.y - bounds.min.y
  model.scale.setScalar(FOX_HEIGHT / height)
  model.position.y = 0.03 - bounds.min.y * model.scale.y

  scene.add(model)

  const mixer = new THREE.AnimationMixer(model)
  const actions = {}
  for (const clip of gltf.animations) {
    const name = clip.name.toLowerCase()
    const action = mixer.clipAction(clip)
    action.play()
    action.setEffectiveWeight(name === 'walk' ? 1 : 0)
    actions[name] = action
  }

  for (const name of CLIP_NAMES) {
    if (!actions[name]) {
      throw new Error(`A animação "${name}" não está no GLB da raposa.`)
    }
  }

  const dummy = new THREE.Object3D()
  const aim = new THREE.Vector3()
  let current = 'walk'
  let angle = 0.15
  let speed = SPEEDS.walk

  place(angle)
  faceNoseToward(pointOnPath(angle + 0.45), 1)

  function pointOnPath(theta) {
    return new THREE.Vector3(
      Math.cos(theta) * PATH_RADIUS,
      model.position.y,
      Math.sin(theta) * PATH_RADIUS,
    )
  }

  function place(theta) {
    model.position.x = Math.cos(theta) * PATH_RADIUS
    model.position.z = Math.sin(theta) * PATH_RADIUS
  }

  function faceNoseToward(worldPoint, dt) {
    aim.copy(worldPoint)
    aim.y = model.position.y
    dummy.position.copy(model.position)
    dummy.up.set(0, 1, 0)
    dummy.lookAt(aim)
    const alpha = 1 - Math.exp(-12 * dt)
    model.quaternion.slerp(dummy.quaternion, alpha)
  }

  function play(name) {
    const key = name.toLowerCase()
    if (!actions[key] || key === current) return current
    const next = actions[key]
    const previous = actions[current]
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(FADE_SECONDS).play()
    previous.fadeOut(FADE_SECONDS)
    current = key
    return current
  }

  function update(dt, camera) {
    mixer.update(dt)
    speed = THREE.MathUtils.damp(speed, SPEEDS[current], 4, dt)
    if (speed > 0.01) {
      angle += (speed / PATH_RADIUS) * dt
      place(angle)
    }

    const focus = current === 'survey'
      ? camera.position
      : pointOnPath(angle + 0.45)
    faceNoseToward(focus, dt)
  }

  return {
    play,
    update,
    get current() {
      return current
    },
  }
}

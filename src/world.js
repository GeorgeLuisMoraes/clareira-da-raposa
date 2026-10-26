import * as THREE from 'three'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { PATH_RADIUS } from './constants.js'

const GROUND_RADIUS = 72

function mulberry32(seed) {
  let a = seed
  return function rng() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeMaterial(color, roughness = 0.92) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0,
    flatShading: true,
  })
}

function paintTexture(draw) {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')
  draw(ctx, canvas)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 8
  return texture
}

function grassTexture() {
  const texture = paintTexture((ctx, canvas) => {
    const size = canvas.width
    ctx.fillStyle = '#73843f'
    ctx.fillRect(0, 0, size, size)

    for (let i = 0; i < 90; i += 1) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(126, 145, 68, 0.28)' : 'rgba(86, 98, 42, 0.32)'
      ctx.beginPath()
      ctx.ellipse(
        Math.random() * size,
        Math.random() * size,
        40 + Math.random() * 90,
        24 + Math.random() * 50,
        Math.random() * Math.PI,
        0,
        Math.PI * 2,
      )
      ctx.fill()
    }

    ctx.lineWidth = 1
    for (let i = 0; i < 14000; i += 1) {
      const roll = Math.random()
      ctx.strokeStyle = roll > 0.82 ? '#c6a25c' : roll > 0.45 ? '#8ea24e' : '#5d6a34'
      ctx.globalAlpha = 0.4
      ctx.beginPath()
      const x = Math.random() * size
      const y = Math.random() * size
      ctx.moveTo(x, y)
      ctx.lineTo(x + (Math.random() - 0.5) * 2, y - (4 + Math.random() * 8))
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  })
  texture.repeat.set(8, 8)
  return texture
}

function dirtTexture() {
  const texture = paintTexture((ctx, canvas) => {
    const size = canvas.width
    ctx.fillStyle = '#8d6844'
    ctx.fillRect(0, 0, size, size)
    for (let i = 0; i < 8000; i += 1) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(166, 124, 82, 0.45)' : 'rgba(80, 52, 32, 0.4)'
      ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1)
    }
  })
  texture.repeat.set(6, 1)
  return texture
}

function pointInRing(rng, minR, maxR) {
  const angle = rng() * Math.PI * 2
  const radius = Math.sqrt(minR * minR + rng() * (maxR * maxR - minR * minR))
  return new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius)
}

function blocksThePath(point) {
  const radius = Math.hypot(point.x, point.z)
  return radius > PATH_RADIUS - 1.7 && radius < PATH_RADIUS + 1.7
}

function blocksTheView(point) {
  const radius = Math.hypot(point.x, point.z)
  if (radius > 18) return false
  const angle = Math.atan2(point.x, point.z)
  const cameraAngle = Math.atan2(11, 13)
  let delta = Math.abs(angle - cameraAngle)
  if (delta > Math.PI) delta = Math.PI * 2 - delta
  return delta < 0.55
}

function placeOutsidePath(rng, minR, maxR, avoidView) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const point = pointInRing(rng, minR, maxR)
    if (blocksThePath(point)) continue
    if (avoidView && blocksTheView(point)) continue
    return point
  }
  return pointInRing(rng, maxR - 1, maxR)
}

function enableShadows(object) {
  object.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })
}

function createDeciduous(rng, materials) {
  const group = new THREE.Group()
  const trunkHeight = 1.15 + rng() * 1.15
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1 + rng() * 0.05, 0.18 + rng() * 0.06, trunkHeight, 5),
    materials.trunk,
  )
  trunk.position.y = trunkHeight / 2
  group.add(trunk)

  const blobs = 3 + Math.floor(rng() * 3)
  for (let i = 0; i < blobs; i += 1) {
    const radius = 0.55 + rng() * 0.6
    const leaf = new THREE.Mesh(
      new THREE.IcosahedronGeometry(radius, 0),
      materials.leaves[Math.floor(rng() * materials.leaves.length)],
    )
    leaf.position.set(
      (rng() - 0.5) * 0.95,
      trunkHeight + rng() * radius * 0.8,
      (rng() - 0.5) * 0.95,
    )
    group.add(leaf)
  }

  const scale = 1 + rng() * 0.35
  group.scale.setScalar(scale)
  return group
}

function createPine(rng, materials) {
  const group = new THREE.Group()
  const height = 3.6 + rng() * 2.1
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.75, 5), materials.trunk)
  trunk.position.y = 0.38
  const lower = new THREE.Mesh(new THREE.ConeGeometry(1.2, height * 0.55, 6), materials.pine)
  lower.position.y = 0.75 + height * 0.22
  const upper = new THREE.Mesh(new THREE.ConeGeometry(0.78, height * 0.4, 6), materials.pineDark)
  upper.position.y = 0.75 + height * 0.5
  group.add(trunk, lower, upper)
  return group
}

function createMushroom(materials) {
  const group = new THREE.Group()
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.2, 6), materials.stem)
  stem.position.y = 0.1
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.14, 7, 5), materials.cap)
  cap.scale.y = 0.5
  cap.position.y = 0.2
  group.add(stem, cap)
  return group
}

function scatterInstances(rng, mesh, count, minR, maxR, lift, color) {
  const dummy = new THREE.Object3D()
  const tint = new THREE.Color()
  for (let i = 0; i < count; i += 1) {
    const point = placeOutsidePath(rng, minR, maxR, false)
    dummy.position.set(point.x, lift, point.z)
    dummy.rotation.y = rng() * Math.PI * 2
    dummy.rotation.z = (rng() - 0.5) * 0.4
    const scale = 0.7 + rng() * 0.9
    dummy.scale.setScalar(scale)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
    if (color) {
      tint.set(color).offsetHSL((rng() - 0.5) * 0.04, (rng() - 0.5) * 0.08, (rng() - 0.5) * 0.08)
      mesh.setColorAt(i, tint)
    }
  }
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
}

export async function createWorld(scene, renderer) {
  const hdr = await new RGBELoader().loadAsync('/hdri/autumn_meadow_1k.hdr')
  hdr.mapping = THREE.EquirectangularReflectionMapping
  scene.background = hdr
  scene.environment = hdr
  scene.backgroundIntensity = 0.9
  scene.environmentIntensity = 0.65
  scene.backgroundRotation.y = 0.6
  scene.environmentRotation.y = 0.6
  scene.fog = new THREE.FogExp2(0xd7c4a4, 0.032)

  const sun = new THREE.DirectionalLight(0xfff0d2, 2.4)
  sun.position.set(-18, 24, 10)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.near = 2
  sun.shadow.camera.far = 90
  sun.shadow.camera.left = -36
  sun.shadow.camera.right = 36
  sun.shadow.camera.top = 36
  sun.shadow.camera.bottom = -36
  sun.shadow.bias = -0.00025
  sun.shadow.normalBias = 0.03
  scene.add(sun)
  scene.add(new THREE.HemisphereLight(0xffe2b8, 0x6a5a32, 0.45))

  const grassMap = grassTexture()
  const dirtMap = dirtTexture()
  const anisotropy = renderer.capabilities.getMaxAnisotropy()
  grassMap.anisotropy = anisotropy
  dirtMap.anisotropy = anisotropy

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(GROUND_RADIUS, 72),
    new THREE.MeshStandardMaterial({
      map: grassMap,
      roughness: 1,
      metalness: 0,
    }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  scene.add(ground)

  const path = new THREE.Mesh(
    new THREE.RingGeometry(PATH_RADIUS - 1.35, PATH_RADIUS + 1.35, 90),
    new THREE.MeshStandardMaterial({
      map: dirtMap,
      roughness: 1,
      metalness: 0,
    }),
  )
  path.rotation.x = -Math.PI / 2
  path.position.y = 0.03
  path.receiveShadow = true
  scene.add(path)

  const materials = {
    trunk: makeMaterial(0x5c3b28, 0.95),
    leaves: [
      makeMaterial(0xd4652f),
      makeMaterial(0xe0a23a),
      makeMaterial(0xb8432f),
      makeMaterial(0xc9842a),
      makeMaterial(0x8f4e2a),
      makeMaterial(0x6e8a3a),
    ],
    pine: makeMaterial(0x3f5a34),
    pineDark: makeMaterial(0x2f4630),
    rock: makeMaterial(0x8a8176, 0.98),
    rockDark: makeMaterial(0x6a635b, 0.98),
    stem: makeMaterial(0xefe6d6, 0.7),
    cap: makeMaterial(0xc4452d, 0.55),
  }

  const rng = mulberry32(20261026)

  for (let i = 0; i < 22; i += 1) {
    const tree = createDeciduous(rng, materials)
    const point = placeOutsidePath(rng, 11.5, 24, true)
    tree.position.copy(point)
    tree.rotation.y = rng() * Math.PI * 2
    enableShadows(tree)
    scene.add(tree)
  }

  for (let i = 0; i < 8; i += 1) {
    const tree = createPine(rng, materials)
    const point = placeOutsidePath(rng, 16, 28, true)
    tree.position.copy(point)
    tree.rotation.y = rng() * Math.PI * 2
    enableShadows(tree)
    scene.add(tree)
  }

  for (let i = 0; i < 9; i += 1) {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.28 + rng() * 0.45, 0),
      rng() > 0.4 ? materials.rock : materials.rockDark,
    )
    const inner = i < 4
    const point = inner
      ? pointInRing(rng, 0.4, 3.6)
      : placeOutsidePath(rng, 10.2, 15, false)
    rock.position.copy(point)
    rock.position.y = 0.12
    rock.rotation.set(rng(), rng(), rng())
    rock.scale.y = 0.55 + rng() * 0.4
    rock.castShadow = true
    rock.receiveShadow = true
    scene.add(rock)
  }

  const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, 0.46, 7), materials.trunk)
  stump.position.set(-1.4, 0.23, 0.55)
  stump.castShadow = true
  stump.receiveShadow = true
  scene.add(stump)

  const log = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 1.7, 6), materials.trunk)
  log.position.set(2.1, 0.16, -1.15)
  log.rotation.z = Math.PI / 2
  log.rotation.y = 0.5
  log.castShadow = true
  log.receiveShadow = true
  scene.add(log)

  for (let i = 0; i < 4; i += 1) {
    const mushroom = createMushroom(materials)
    const point = pointInRing(rng, 0.8, 3.2)
    mushroom.position.copy(point)
    mushroom.scale.setScalar(0.8 + rng() * 0.7)
    enableShadows(mushroom)
    scene.add(mushroom)
  }

  const tuftGeometry = new THREE.ConeGeometry(0.045, 0.32, 4)
  tuftGeometry.translate(0, 0.16, 0)
  const tufts = new THREE.InstancedMesh(tuftGeometry, makeMaterial(0xffffff), 340)
  scatterInstances(rng, tufts, 340, 0.2, 30, 0, 0x8a9a4a)
  tufts.receiveShadow = true
  scene.add(tufts)

  const leafGeometry = new THREE.CircleGeometry(0.11, 5)
  leafGeometry.rotateX(-Math.PI / 2)
  const leaves = new THREE.InstancedMesh(leafGeometry, makeMaterial(0xffffff, 1), 180)
  scatterInstances(rng, leaves, 180, 1, 22, 0.035, 0xd4652f)
  scene.add(leaves)
}

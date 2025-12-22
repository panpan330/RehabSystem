<template>
  <div ref="threeContainer" class="three-container"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const props = defineProps({
  csScore: { type: Number, default: 0 },
  medScore: { type: Number, default: 0 }
})

const threeContainer = ref(null)
let scene, camera, renderer, animationId
let robot = {} // 存储身体各部位

// 初始化 3D 场景
const initThree = () => {
  // 1. 场景与相机
  scene = new THREE.Scene()
  scene.background = new THREE.Color('#f0f2f5') // 背景色与网页一致

  camera = new THREE.PerspectiveCamera(50, 350 / 350, 0.1, 1000)
  camera.position.set(0, 2, 6)

  // 2. 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(350, 350) // 画布大小
  threeContainer.value.appendChild(renderer.domElement)

  // 3. 灯光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
  dirLight.position.set(5, 10, 7)
  scene.add(dirLight)

  // 4. 创建机器人 (简单的几何体拼接)
  createRobot()

  // 5. 控制器 (允许鼠标拖拽)
  new OrbitControls(camera, renderer.domElement)

  // 6. 开始动画循环
  animate()
}

// 创建赛博机器人
const createRobot = () => {
  const material = new THREE.MeshStandardMaterial({ color: 0xcccccc })
  
  // --- 头部 (代表医学/理论) ---
  const headGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8)
  robot.head = new THREE.Mesh(headGeo, material.clone())
  robot.head.position.y = 1.8
  scene.add(robot.head)

  // --- 身体 ---
  const bodyGeo = new THREE.CylinderGeometry(0.6, 0.4, 2, 32)
  robot.body = new THREE.Mesh(bodyGeo, material)
  robot.body.position.y = 0.5
  scene.add(robot.body)

  // --- 右手 (代表计算机/实操) ---
  const armGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.2)
  robot.rightArm = new THREE.Mesh(armGeo, material.clone())
  robot.rightArm.position.set(-0.9, 1, 0)
  robot.rightArm.rotation.z = Math.PI / 4 // 抬起手
  scene.add(robot.rightArm)

  // --- 左手 ---
  robot.leftArm = robot.rightArm.clone()
  robot.leftArm.position.set(0.9, 1, 0)
  robot.leftArm.rotation.z = -Math.PI / 4
  scene.add(robot.leftArm)

  // --- 核心底座 ---
  const baseGeo = new THREE.CylinderGeometry(1, 1, 0.2, 32)
  const baseMesh = new THREE.Mesh(baseGeo, new THREE.MeshStandardMaterial({ color: 0x409EFF }))
  baseMesh.position.y = -1
  scene.add(baseMesh)
  
  // 初始化颜色
  updateColors()
}

// 根据分数改变颜色 (高光逻辑)
const updateColors = () => {
  if (!robot.head) return

  // 逻辑：医学分高 -> 头部发红光 (脑力强)
  if (props.medScore > 80) {
    robot.head.material.color.set(0xF56C6C)
    robot.head.material.emissive.set(0x550000)
  } else {
    robot.head.material.color.set(0xcccccc)
    robot.head.material.emissive.set(0x000000)
  }

  // 逻辑：计算机分高 -> 右手发蓝光 (麒麟臂)
  if (props.csScore > 80) {
    robot.rightArm.material.color.set(0x409EFF)
    robot.rightArm.material.emissive.set(0x000055)
  } else {
    robot.rightArm.material.color.set(0xcccccc)
    robot.rightArm.material.emissive.set(0x000000)
  }
}

// 动画循环
const animate = () => {
  animationId = requestAnimationFrame(animate)
  // 缓慢旋转展示
  if (robot.body) {
    scene.rotation.y += 0.005
  }
  renderer.render(scene, camera)
}

// 监听分数变化，实时变色
watch(() => [props.csScore, props.medScore], updateColors)

onMounted(() => {
  initThree()
})

onBeforeUnmount(() => {
  // 清理内存，防止卡顿
  cancelAnimationFrame(animationId)
  renderer.dispose()
})
</script>

<style scoped>
.three-container {
  width: 350px;
  height: 350px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.1); /* 内阴影增加科技感 */
}
</style>
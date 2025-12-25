<template>
  <div ref="containerRef" class="three-container">
    <div v-if="!isReady" class="loading-mask">
      <div class="loading-spinner"></div>
      <p>正在生成 3D 模型...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, toRefs } from 'vue'
import * as THREE from 'three'

// 接收父组件传来的分数
const props = defineProps({
  csScore: { type: Number, default: 50 },
  medScore: { type: Number, default: 50 }
})

const { csScore, medScore } = toRefs(props)
const containerRef = ref(null)
const isReady = ref(false)

let scene, camera, renderer, animationId
let headMesh, rightArmMesh, group

// --- 材质定义 (高对比度) ---
// 蓝色材质 (代表 CS)
const blueMaterial = new THREE.MeshPhongMaterial({
  color: 0x409EFF,
  emissive: 0x002244,
  specular: 0xffffff,
  shininess: 30
})
// 红色材质 (代表 医学)
const redMaterial = new THREE.MeshPhongMaterial({
  color: 0xF56C6C,
  emissive: 0x440000,
  specular: 0xffffff,
  shininess: 30
})
// 基础灰色材质
const baseMaterial = new THREE.MeshPhongMaterial({
  color: 0x909399,
  flatShading: false
})

const initThree = () => {
  if (!containerRef.value) return
  
  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight

  // 如果容器还没被撑开，暂不渲染，等待 ResizeObserver 触发
  if (width === 0 || height === 0) return 
  if (renderer) return // 防止重复初始化

  // 1. 创建场景
  scene = new THREE.Scene()
  // ⭐ 设置浅灰色背景，不再使用透明，确保能看见！
  scene.background = new THREE.Color(0xf0f2f5) 

  // 2. 创建相机
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
  camera.position.set(0, 1.5, 6) // 相机位置

  // 3. 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.shadowMap.enabled = true
  containerRef.value.appendChild(renderer.domElement)

  // 4. 添加灯光
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0)
  dirLight.position.set(5, 10, 7)
  dirLight.castShadow = true
  scene.add(dirLight)

  // 5. 构建人体模型
  buildHuman()
  
  // 6. 根据初始分数上色
  updateColors()

  isReady.value = true
  animate()
}

const buildHuman = () => {
  group = new THREE.Group()

  // 头部 (球体)
  const headGeo = new THREE.SphereGeometry(0.5, 32, 32)
  headMesh = new THREE.Mesh(headGeo, baseMaterial.clone())
  headMesh.position.y = 2.6
  headMesh.castShadow = true
  group.add(headMesh)

  // 躯干 (圆柱)
  const torsoGeo = new THREE.CylinderGeometry(0.3, 0.5, 1.6, 32)
  const torsoMesh = new THREE.Mesh(torsoGeo, baseMaterial)
  torsoMesh.position.y = 1.4
  torsoMesh.castShadow = true
  group.add(torsoMesh)

  // 右臂 (CS能力 - 画面左侧)
  const armGeo = new THREE.CapsuleGeometry(0.15, 1.2, 4, 8)
  rightArmMesh = new THREE.Mesh(armGeo, baseMaterial.clone())
  rightArmMesh.position.set(-0.7, 1.6, 0)
  rightArmMesh.rotation.z = 0.3
  rightArmMesh.castShadow = true
  group.add(rightArmMesh)

  // 左臂 (普通)
  const leftArm = new THREE.Mesh(armGeo, baseMaterial)
  leftArm.position.set(0.7, 1.6, 0)
  leftArm.rotation.z = -0.3
  leftArm.castShadow = true
  group.add(leftArm)
  
  // 底部底座 (增加稳定性感)
  const planeGeo = new THREE.CylinderGeometry(1, 1, 0.1, 32)
  const planeMesh = new THREE.Mesh(planeGeo, new THREE.MeshPhongMaterial({ color: 0xffffff }))
  planeMesh.position.y = -0.05
  planeMesh.receiveShadow = true
  group.add(planeMesh)

  group.position.y = -1.0
  scene.add(group)
}

const updateColors = () => {
  if (!headMesh || !rightArmMesh) return

  // 逻辑：如果分数 > 60 则高亮，否则灰色
  // 头部 (医学)
  if (medScore.value > 60) {
    headMesh.material = redMaterial
  } else {
    headMesh.material = baseMaterial
  }

  // 手臂 (CS)
  if (csScore.value > 60) {
    rightArmMesh.material = blueMaterial
  } else {
    rightArmMesh.material = baseMaterial
  }
}

const animate = () => {
  animationId = requestAnimationFrame(animate)
  if (group) group.rotation.y += 0.01 // 自动旋转
  renderer.render(scene, camera)
}

watch([csScore, medScore], updateColors)

onMounted(() => {
  // ⭐ 使用 ResizeObserver 监听容器大小变化
  // 这是解决 el-dialog 中 Canvas 宽度为 0 的核心方法
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const w = entry.contentRect.width
      const h = entry.contentRect.height
      
      if (w > 0 && h > 0) {
        if (!renderer) {
          initThree() // 第一次有宽度时初始化
        } else {
          // 后续变化调整大小
          camera.aspect = w / h
          camera.updateProjectionMatrix()
          renderer.setSize(w, h)
        }
      }
    }
  })
  if (containerRef.value) observer.observe(containerRef.value)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  if (renderer) {
    renderer.dispose()
    renderer.forceContextLoss()
  }
})
</script>

<style scoped>
.three-container {
  /* ⭐ 强制高度，防止塌陷 */
  height: 400px !important; 
  width: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  background-color: #f0f2f5; /* 灰色背景确保对比度 */
}

.loading-mask {
  position: absolute; top:0; left:0; right:0; bottom:0;
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  background: #f0f2f5;
  z-index: 10;
}
.loading-spinner {
  width: 30px; height: 30px; border: 3px solid #ccc; 
  border-top-color: #409EFF; border-radius: 50%;
  animation: spin 1s linear infinite; margin-bottom: 10px;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
<template>
  <div class="login-container">
    <canvas id="particle-canvas"></canvas>
    <div class="login-box">
      <div class="header">
        <div class="logo">🏥</div>
        <div class="title">
          <h2>康复人才智脑</h2>
          <p>Interdisciplinary Talent Intelligence System</p>
        </div>
      </div>

      <el-form :model="form" class="login-form">
        <el-form-item>
          <el-input 
            v-model="form.username" 
            placeholder="请输入账号 (admin)" 
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>
        <el-form-item>
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="请输入密码 (123456)" 
            :prefix-icon="Lock"
            show-password
            size="large"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-button 
          type="primary" 
          class="login-btn" 
          :loading="loading" 
          @click="handleLogin"
          size="large"
        >
          🚀 立即进入系统
        </el-button>

        <div class="tips">
          <span>演示账号: admin / 123456</span>
          <span style="margin-left: 10px;">教师账号: teacher / 123456</span>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router' // ⭐ 引入路由钩子
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter() // ⭐ 初始化路由
const loading = ref(false)
const form = ref({ username: '', password: '' })

const handleLogin = async () => {
  if (!form.value.username || !form.value.password) {
    return ElMessage.warning('请输入账号密码')
  }
  
  loading.value = true
  try {
    const res = await axios.post('http://localhost:9090/api/user/login', form.value)
    
    if (res.data.code === 200) {
      ElMessage.success('登录成功，欢迎回来！')
      
      // 1. 保存 Token
      const token = res.data.token || ('mock-token-' + Date.now())
      localStorage.setItem('token', token)
      
      // 2. 保存用户信息 (必须保存，layout需要用到)
      const userData = res.data.userInfo || { name: form.value.username, role: 'GUEST' }
      localStorage.setItem('userInfo', JSON.stringify(userData))
      
      // ⭐ 3. 路由跳转 (根据角色跳转不同页面)
      if (userData.role === 'STUDENT') {
        router.push('/personal')
      } else {
        router.push('/dashboard') // 管理员/教师跳仪表盘
      }

    } else {
      ElMessage.error(res.data.msg || '登录失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('连接服务器失败')
  } finally {
    loading.value = false
  }
}

// --- 以下是粒子特效代码 (保持不变) ---
let canvas, ctx, animationFrameId
let particles = []

const initParticles = () => {
  canvas = document.getElementById('particle-canvas')
  if (!canvas) return
  ctx = canvas.getContext('2d')
  resizeCanvas()
  
  const particleCount = 80 
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      size: Math.random() * 2 + 1
    })
  }
  animate()
  window.addEventListener('resize', resizeCanvas)
}

const resizeCanvas = () => {
  if (canvas) {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
}

const animate = () => {
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  for (let i = 0; i < particles.length; i++) {
    let p = particles[i]
    p.x += p.vx
    p.y += p.vy
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(100, 200, 255, 0.5)'
    ctx.fill()
    for (let j = i + 1; j < particles.length; j++) {
      let p2 = particles[j]
      let dist = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2)
      if (dist < 150) {
        ctx.beginPath()
        ctx.strokeStyle = `rgba(100, 200, 255, ${1 - dist / 150})`
        ctx.lineWidth = 0.5
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(p2.x, p2.y)
        ctx.stroke()
      }
    }
  }
  animationFrameId = requestAnimationFrame(animate)
}

onMounted(() => { initParticles() })
onBeforeUnmount(() => {
  cancelAnimationFrame(animationFrameId)
  window.removeEventListener('resize', resizeCanvas)
})
</script>

<style scoped>
/* 样式保持原样 */
.login-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: radial-gradient(circle at center, #1b2735 0%, #090a0f 100%);
  display: flex;
  justify-content: center;
  align-items: center;
}
#particle-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}
.login-box {
  position: relative;
  z-index: 10;
  width: 420px;
  padding: 40px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  color: #fff;
  transition: transform 0.3s;
}
.login-box:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 100, 255, 0.15);
}
.header {
  text-align: center;
  margin-bottom: 30px;
}
.logo {
  font-size: 48px;
  margin-bottom: 10px;
  animation: float 3s ease-in-out infinite;
}
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}
.title h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  background: linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.title p {
  margin: 5px 0 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.login-form .el-input {
  --el-input-bg-color: rgba(0, 0, 0, 0.2);
  --el-input-border-color: rgba(255, 255, 255, 0.1);
  --el-input-text-color: #fff;
  --el-input-placeholder-color: rgba(255, 255, 255, 0.4);
  --el-input-hover-border-color: #409EFF;
  --el-input-focus-border-color: #409EFF;
}
.login-btn {
  width: 100%;
  margin-top: 10px;
  background: linear-gradient(90deg, #409EFF 0%, #36d1dc 100%);
  border: none;
  font-weight: bold;
  letter-spacing: 2px;
  transition: all 0.3s;
}
.login-btn:hover {
  opacity: 0.9;
  transform: scale(1.02);
}
.tips {
  margin-top: 20px;
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}
</style>
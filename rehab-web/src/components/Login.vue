<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <img src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" alt="logo" class="logo">
        <div class="title">康复人才智脑</div>
        <div class="subtitle">INTERDISCIPLINARY TALENT INTELLIGENCE SYSTEM</div>
      </div>
      
      <el-form :model="form" class="login-form">
        <el-form-item>
          <el-input v-model="form.username" placeholder="请输入账号" :prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="请输入密码" :prefix-icon="Lock" show-password size="large" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn" size="large" :loading="loading" @click="handleLogin">
            🚀 立即进入系统
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="footer-text">演示账号: admin / 123456</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const form = ref({
  username: '',
  password: ''
})

const handleLogin = () => {
  if (!form.value.username || !form.value.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }

  loading.value = true
  
  request.post('/api/user/login', form.value).then(res => {
    // ⭐⭐⭐ 核心修复：这里必须改成 '200' ⭐⭐⭐
    if (res.code === '200') {
      ElMessage.success('登录成功') // 这次是真的成功绿框了

      const { token, userInfo } = res.data
      
      // 存 Token
      localStorage.setItem('token', token)
      // 存用户信息
      localStorage.setItem('user', JSON.stringify(userInfo))

      // 跳转 (确保你的路由里有 path: '/')
      router.push('/') 

    } else {
      // 如果不是 200，才是真正的错误
      ElMessage.error(res.msg || '登录失败')
    }
  }).catch(err => {
    console.error(err)
    ElMessage.error('系统接口连接异常')
  }).finally(() => {
    loading.value = false
  })
}
</script>

<style scoped>
/* 保持原本漂亮的深色样式 */
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #0f172a; /* 深色背景 */
  background-image: radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%);
  position: relative;
  overflow: hidden;
}

/* 增加一点科技感的背景网格线 */
.login-container::before {
  content: "";
  position: absolute;
  width: 200%;
  height: 200%;
  background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
  linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  transform: rotate(45deg);
  pointer-events: none;
}

.login-box {
  width: 420px;
  padding: 40px;
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  z-index: 10;
  text-align: center;
}

.login-header {
  margin-bottom: 30px;
}

.logo {
  width: 60px;
  margin-bottom: 15px;
  filter: drop-shadow(0 0 10px rgba(64, 158, 255, 0.5));
}

.title {
  font-size: 28px;
  font-weight: bold;
  color: #f1f5f9;
  letter-spacing: 2px;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 10px;
  color: #94a3b8;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.login-form {
  margin-top: 20px;
}

.login-btn {
  width: 100%;
  font-weight: bold;
  letter-spacing: 1px;
  background: linear-gradient(90deg, #3b82f6, #06b6d4);
  border: none;
  transition: all 0.3s;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(6, 182, 212, 0.4);
}

.footer-text {
  margin-top: 20px;
  font-size: 12px;
  color: #64748b;
}

/* 覆盖 Element 输入框样式适配深色主题 */
:deep(.el-input__wrapper) {
  background-color: rgba(15, 23, 42, 0.6);
  box-shadow: none;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
}
:deep(.el-input__inner) {
  color: #e2e8f0;
}
:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #3b82f6 inset;
}
</style>
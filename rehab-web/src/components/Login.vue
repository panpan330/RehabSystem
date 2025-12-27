<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-left">
        <img src="../assets/logo.svg" alt="Logo" class="login-logo">
        <h2>康复人才智脑系统</h2>
        <p>Rehabilitation Talent Intelligence System</p>
      </div>
      <div class="login-right">
        <h3>欢迎登录</h3>
        <el-form :model="form" :rules="rules" ref="loginFormRef" size="large">
          <el-form-item prop="username">
            <el-input v-model="form.username" placeholder="请输入账号/学号" prefix-icon="User" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" placeholder="请输入密码" prefix-icon="Lock" show-password @keyup.enter="handleLogin" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" style="width: 100%;" :loading="loading" @click="handleLogin">
              {{ loading ? '登录中...' : '立即登录' }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const loginFormRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = () => {
  loginFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    loading.value = true
    try {
      const res = await request.post('/api/user/login', form)
      
      if (res.code === '200') {
        ElMessage.success('登录成功')
        
        // 1. 存储 Token 和 用户信息
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('userInfo', JSON.stringify(res.data.user))
        
        // 2. ⭐ 核心修复：根据角色跳转不同页面 ⭐
        const role = res.data.user.role
        
        if (role === 'ADMIN') {
            console.log('检测到管理员，跳转至驾驶舱')
            router.push('/home')
        } else {
            console.log('检测到普通用户，跳转至个人中心')
            router.push('/personal')
        }
        
      } else {
        ElMessage.error(res.msg || '登录失败')
      }
    } catch (e) {
      console.error(e)
      ElMessage.error('网络连接错误')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.login-box {
  width: 800px;
  height: 450px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  display: flex;
  overflow: hidden;
}

.login-left {
  flex: 1;
  background: linear-gradient(135deg, #409EFF 0%, #3a8ee6 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  padding: 40px;
}

.login-logo {
  width: 80px;
  height: 80px;
  margin-bottom: 20px;
  background: white;
  border-radius: 50%;
  padding: 10px;
}

.login-right {
  flex: 1;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

h2 { margin: 0 0 10px 0; font-size: 24px; }
h3 { margin-bottom: 30px; color: #303133; text-align: center; font-size: 22px; }
p { opacity: 0.8; font-size: 14px; text-align: center; }
</style>
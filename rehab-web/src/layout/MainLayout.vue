<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="aside">
      <div class="logo">
        <img src="../assets/logo.svg" alt="logo" />
        <span v-if="!isCollapse">康复智脑</span>
      </div>
      
      <el-menu
        :default-active="route.path"
        class="el-menu-vertical"
        background-color="#0E1C2F"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
        :collapse="isCollapse"
      >
        <div v-if="isAdmin">
          <el-menu-item index="/home">
            <el-icon><House /></el-icon>
            <template #title>系统驾驶舱</template>
          </el-menu-item>
          
          <el-menu-item index="/talent">
            <el-icon><User /></el-icon>
            <template #title>人才数据库</template>
          </el-menu-item>
          
          <el-menu-item index="/map">
            <el-icon><MapLocation /></el-icon>
            <template #title>时空轨迹</template>
          </el-menu-item>
          
          <el-menu-item index="/project">
            <el-icon><DataBoard /></el-icon>
            <template #title>科研项目</template>
          </el-menu-item>
          
          <el-menu-item index="/training">
            <el-icon><Reading /></el-icon>
            <template #title>培训计划</template>
          </el-menu-item>

          <el-menu-item index="/settings">
            <el-icon><Setting /></el-icon>
            <template #title>设置</template>
          </el-menu-item>
        </div>

        <el-menu-item index="/personal">
          <el-icon><UserFilled /></el-icon>
          <template #title>个人成长中心</template>
        </el-menu-item>

        <el-menu-item index="/asset">
          <el-icon><Box /></el-icon>
          <template #title>设备借用中心</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="fold-btn" @click="isCollapse = !isCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
        </div>
        
        <div class="header-right">
          <el-dropdown>
            <span class="el-dropdown-link">
              <el-avatar :size="32" :src="userInfo.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'" />
              <span class="username">{{ userInfo.name || userInfo.username || '用户' }}</span>
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="router.push('/personal')">个人中心</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  House, User, MapLocation, DataBoard, Box, Reading, 
  UserFilled, Setting, Fold, Expand, ArrowDown 
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const isCollapse = ref(false)

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const isAdmin = computed(() => userInfo && userInfo.role === 'ADMIN')

const handleLogout = () => {
  localStorage.clear()
  router.push('/login')
}
</script>

<style scoped>
.layout-container { height: 100vh; }
.aside { background-color: #0E1C2F; color: #fff; transition: width 0.3s; overflow-x: hidden; display: flex; flex-direction: column; }
.logo { height: 60px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; color: #fff; background-color: #0b1625; white-space: nowrap; }
.logo img { width: 30px; margin-right: 10px; }
.el-menu-vertical { border-right: none; }
.header { background-color: #fff; border-bottom: 1px solid #e6e6e6; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; }
.fold-btn { font-size: 20px; cursor: pointer; color: #606266; }
.fold-btn:hover { color: #409EFF; }
.header-right .el-dropdown-link { display: flex; align-items: center; cursor: pointer; outline: none; }
.username { margin-left: 10px; font-weight: 500; color: #606266; }
.main-content { background-color: #f0f2f5; padding: 20px; overflow-y: auto; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
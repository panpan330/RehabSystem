<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="aside">
      <div class="logo">🏥 康复人才智脑</div>
      <el-menu
        :router="true" 
        :default-active="$route.path"
        active-text-color="#409EFF"
        background-color="#304156"
        text-color="#bfcbd9"
      >
        <template v-if="userRole !== 'STUDENT'">
          <el-menu-item index="/home"><el-icon><House /></el-icon>系统首页</el-menu-item>
          
          
          <el-menu-item index="/map"><el-icon><MapLocation /></el-icon>时空轨迹</el-menu-item>
          <el-menu-item index="/project"><el-icon><List /></el-icon>项目管理</el-menu-item>
          <el-menu-item index="/asset"><el-icon><Box /></el-icon>资产设备</el-menu-item>
          <el-menu-item index="/training"><el-icon><Notebook /></el-icon>培训计划</el-menu-item>
          <el-menu-item index="/talent"><el-icon><UserFilled /></el-icon>人才信息</el-menu-item>
          <el-menu-item index="/settings"><el-icon><Setting /></el-icon>系统设置</el-menu-item>
        </template>
        
        <template v-else>
           <el-menu-item index="/personal"><el-icon><UserFilled /></el-icon>个人成长中心</el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="breadcrumb">当前位置 / {{ $route.meta.title }}</div>
        <div class="user-info">
          <el-dropdown @command="handleLogout">
            <span style="cursor: pointer;">{{ userInfo.name }} <el-icon><ArrowDown /></el-icon></span>
            <template #dropdown>
              <el-dropdown-menu><el-dropdown-item command="logout">退出登录</el-dropdown-item></el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main style="background: #f0f2f5;">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { useRouter } from 'vue-router'
// ⭐ 记得引入 House 图标
import { Odometer, UserFilled, Notebook, Setting, MapLocation, List, Box, ArrowDown, House } from '@element-plus/icons-vue'

const router = useRouter()
const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const userRole = userInfo.role

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  router.push('/login')
}
</script>

<style scoped>
.layout-container { height: 100vh; }
.aside { background-color: #304156; color: #fff; }
.logo { height: 60px; line-height: 60px; text-align: center; color: #fff; font-weight: bold; font-size: 18px;}
.header { background: #fff; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ddd; padding: 0 20px;}
</style>
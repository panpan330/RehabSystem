<template>
  <router-view />
</template>

<script setup>
// App.vue 现在不需要写任何逻辑了
// 逻辑都去哪了？
// 1. 登录判断 -> 移到了 router/index.js (路由守卫)
// 2. 页面布局 -> 移到了 layout/MainLayout.vue
// 3. 具体的业务 -> 移到了 views/TalentAdmin.vue 等文件中
</script>

<style>
/* 全局基础样式 (保留你原来的全局设置) */
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', Arial, sans-serif;
}

/* 注意：原来在这里定义的 .layout-container, .aside, .header 等样式 */
/* 应该都已经移动到了 src/layout/MainLayout.vue 的 <style scoped> 中 */
</style>
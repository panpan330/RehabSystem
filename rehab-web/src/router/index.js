import { createRouter, createWebHashHistory } from 'vue-router'

// 引入组件
import Login from '../components/Login.vue'
import MainLayout from '../layout/MainLayout.vue'
import Home from '../views/Home.vue'
import Dashboard from '../components/Dashboard.vue'
import TalentAdmin from '../views/TalentAdmin.vue'
import TalentView from '../components/TalentView.vue'
import MapView from '../components/MapView.vue'
import ProjectList from '../components/ProjectList.vue'
import AssetList from '../components/AssetList.vue'
import TrainingList from '../components/TrainingList.vue'
import Settings from '../components/Settings.vue'
// ❌ 已删除：import UserList ...

const routes = [
  { path: '/login', component: Login, meta: { title: '登录' } },
  { 
    path: '/', 
    component: MainLayout,
    redirect: '/home',
    children: [
      { path: 'home', component: Home, meta: { title: '系统驾驶舱' } },
      
      // ❌ 已删除：{ path: 'user-list' ... }

      { path: 'talent', component: TalentAdmin, meta: { title: '人才数据库' } },
      { path: 'map', component: MapView, meta: { title: '时空轨迹' } },
      { path: 'project', component: ProjectList, meta: { title: '科研项目' } },
      { path: 'asset', component: AssetList, meta: { title: '资产管理' } },
      { path: 'training', component: TrainingList, meta: { title: '培训计划' } },
      { path: 'settings', component: Settings, meta: { title: '设置' } },
      
      // 学生端路由
      { path: 'personal', component: TalentView, meta: { title: '个人成长中心' } }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
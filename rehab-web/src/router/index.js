import { createRouter, createWebHashHistory } from 'vue-router'

// 引入组件
import Login from '../components/Login.vue'
import MainLayout from '../layout/MainLayout.vue'
import Dashboard from '../components/Dashboard.vue'
import TalentAdmin from '../views/TalentAdmin.vue' // 刚才拆分出来的
import TalentView from '../components/TalentView.vue' // 学生端的个人中心
import MapView from '../components/MapView.vue'
import ProjectList from '../components/ProjectList.vue'
import AssetList from '../components/AssetList.vue'
import TrainingList from '../components/TrainingList.vue'
import Settings from '../components/Settings.vue'

const routes = [
  { path: '/login', component: Login, meta: { title: '登录' } },
  { 
    path: '/', 
    component: MainLayout,
    redirect: '/dashboard', // 默认跳去仪表盘
    children: [
      { path: 'dashboard', component: Dashboard, meta: { title: '决策仪表盘' } },
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

// 路由守卫：没登录不让进
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
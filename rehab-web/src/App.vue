<template>
  <Login v-if="!isLoggedIn" @login-success="handleLoginSuccess" />

  <el-container v-else class="layout-container">
    
    <el-aside width="220px" class="aside">
      <div class="logo">
        <span style="font-size: 24px; margin-right: 10px;">🏥</span>
        <span style="font-weight: bold;">康复人才智脑</span>
      </div>
      
      <el-menu
        :key="menuKey"
        active-text-color="#409EFF"
        background-color="#304156"
        text-color="#bfcbd9"
        :default-active="currentView"
        class="el-menu-vertical"
        @select="handleSelect"
      >
        <el-menu-item 
          v-for="item in visibleMenuItems" 
          :key="item.index" 
          :index="item.index"
        >
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="breadcrumb">
          <span style="color: #97a8be;">当前位置 / </span> 
          <span style="font-weight: bold; margin-left: 5px; color: #303133;">{{ pageTitle }}</span>
        </div>
        
        <div class="user-info">
          <el-dropdown @command="handleLogout">
            <span class="el-dropdown-link" style="display: flex; align-items: center; cursor: pointer;">
              <el-avatar :size="32" :src="userInfo.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'" />
              <span style="margin-left: 10px; color: #333; font-weight: 500;">
                {{ userInfo.name || '用户' }} 
                <el-tag size="small" effect="plain" style="margin-left: 5px;">{{ userInfo.role }}</el-tag>
              </span>
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main style="background-color: #f0f2f5; padding: 20px;">
        
        <div v-if="currentView === 'personal-center'">
            <TalentView />
        </div>

        <Dashboard v-if="currentView === 'dashboard'" />

        <div v-if="currentView === 'map-view'">
            <MapView />
        </div>

        <div v-if="currentView === 'project-list'">
            <ProjectList />
        </div>

        <div v-if="currentView === 'asset-list'">
            <AssetList />
        </div>

        <div v-if="currentView === 'training'">
            <TrainingList />
        </div>

        <div v-if="currentView === 'talent-list'">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span style="font-weight: bold;">人才数据库</span>
                <div>
                  <el-button type="warning" :icon="Download" @click="exportTalentExcel">导出Excel</el-button>
                  
                  <el-button 
                    v-if="hasPermission(['ADMIN', 'TEACHER'])"
                    type="success" 
                    :icon="Plus" 
                    @click="openAddDialog"
                  >
                    新增人才
                  </el-button>
                  <el-button type="primary" :icon="Refresh" @click="fetchData">刷新数据</el-button>
                </div>
              </div>
            </template>

            <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
              <el-table-column prop="id" label="ID" width="60" />
              <el-table-column prop="name" label="姓名" width="100" />
              <el-table-column prop="role" label="角色" width="120">
                <template #default="scope">
                  <el-tag :type="getTagType(scope.row.role)">{{ scope.row.role }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="CS能力" min-width="150">
                <template #default="scope">
                  <el-progress :percentage="scope.row.csScore" :status="scope.row.csScore>80?'success':'warning'" />
                </template>
              </el-table-column>
              <el-table-column label="医学能力" min-width="150">
                <template #default="scope">
                  <el-progress :percentage="scope.row.medScore" color="#f56c6c" />
                </template>
              </el-table-column>

              <el-table-column label="操作" width="200" fixed="right">
                <template #default="scope">
                  <el-button size="small" type="primary" plain @click="showRadar(scope.row)">
                    全息画像
                  </el-button>
                  
                  <el-popconfirm title="确定要删除吗？" @confirm="handleDelete(scope.row.id)">
                    <template #reference>
                      <el-button 
                        v-if="hasPermission(['ADMIN'])"
                        size="small" 
                        type="danger" 
                        plain
                        style="margin-left: 10px;"
                      >
                        删除
                      </el-button>
                    </template>
                  </el-popconfirm>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
        
        <div v-if="currentView === 'settings'">
           <Settings />
        </div>

      </el-main>
    </el-container>

    <el-dialog v-model="addDialogVisible" title="录入新人才" width="500px">
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="姓名">
          <el-input v-model="addForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="addForm.role" placeholder="请选择角色" style="width: 100%;">
            <el-option label="学生 (Student)" value="STUDENT" />
            <el-option label="医生 (Doctor)" value="DOCTOR" />
            <el-option label="科研人员 (Researcher)" value="RESEARCHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="计算机能力">
          <el-slider v-model="addForm.csScore" show-input />
        </el-form-item>
        <el-form-item label="医学能力">
          <el-slider v-model="addForm.medScore" show-input />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAdd">确认录入</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog
      v-model="dialogVisible"
      title="交叉人才智能全息画像"
      width="1100px"
      top="5vh"
      @opened="initChart"
    >
      <div id="report-content" style="display: flex; gap: 20px; align-items: flex-start; padding: 20px; background: white;">
        
        <el-card shadow="never" :body-style="{ padding: '10px' }">
          <div style="text-align: center; font-weight: bold; margin-bottom: 10px; color: #606266;">多维能力模型</div>
          <div id="radarChart" style="width: 300px; height: 300px;"></div>
        </el-card>

        <el-card shadow="never" :body-style="{ padding: '0px' }" style="border: 2px solid #409EFF; position: relative;">
           <ThreeBody :csScore="currentTalent.csScore" :medScore="currentTalent.medScore" />
           <div style="position: absolute; bottom: 0; width: 100%; text-align: center; padding: 8px 0; background: rgba(64,158,255,0.1); color: #409EFF; font-size: 12px; font-weight: bold;">
             🔵 蓝臂: 工程实践 | 🔴 红头: 医学理论
           </div>
        </el-card>

        <div style="flex: 1;">
          <div style="display: flex; align-items: center; margin-bottom: 15px;">
             <span style="font-size: 18px; margin-right: 5px;">🤖</span>
             <h3 style="margin: 0; color: #303133;">AI 智能决策支持</h3>
          </div>
          <el-alert :title="analysisReport.type" :type="analysisReport.colorType" :description="analysisReport.summary" show-icon :closable="false" style="margin-bottom: 15px;" />
          
          <div style="font-size: 14px; line-height: 1.8; color: #606266;">
             <p><strong>✨ 核心优势：</strong>{{ analysisReport.strength }}</p>
             <p><strong>⚠️ 技能短板：</strong>{{ analysisReport.weakness }}</p>
             
             <div style="background: #f4f4f5; padding: 12px; margin-top: 15px; border-radius: 4px;">
                <div style="font-weight: bold; color: #409EFF; margin-bottom: 5px;">📚 智能推荐课程：</div>
                <div v-if="analysisReport.courses.length > 0">
                    <el-tag v-for="c in analysisReport.courses" :key="c" size="small" style="margin-right: 5px;">{{ c }}</el-tag>
                </div>
                <div style="text-align: right; margin-top: 10px;">
                  <el-button 
                    v-if="hasPermission(['ADMIN', 'TEACHER'])"
                    type="success" 
                    size="small" 
                    @click="assignTraining"
                  >
                    一键加入培训计划 ➔
                  </el-button>
                </div>
             </div>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" plain @click="handleExport">📄 导出诊断报告 (PDF)</el-button>
          <el-button @click="dialogVisible = false">关闭窗口</el-button>
        </span>
      </template>

      <el-divider content-position="left">📅 该生当前的培训任务</el-divider>
      <el-table :data="trainingList" border size="small" style="width: 100%">
         <el-table-column prop="courseName" label="课程名称" />
         <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
                <el-tag size="small" :type="scope.row.status === 'DONE' ? 'success' : 'info'">
                    {{ scope.row.status === 'TO_DO' ? '待开始' : '进行中' }}
                </el-tag>
            </template>
         </el-table-column>
         <el-table-column prop="createTime" label="指派时间" />
      </el-table>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import axios from 'axios'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
// 引入所有图标
import { Odometer, UserFilled, Notebook, Setting, Refresh, ArrowDown, Plus, MapLocation, List, Box, Download } from '@element-plus/icons-vue'

// 引入所有组件
import Login from './components/Login.vue'
import Dashboard from './components/Dashboard.vue'
import ThreeBody from './components/ThreeBody.vue'
import Settings from './components/Settings.vue'
import MapView from './components/MapView.vue'
import ProjectList from './components/ProjectList.vue'
import AssetList from './components/AssetList.vue'
import TrainingList from './components/TrainingList.vue'
import TalentView from './components/TalentView.vue' // ⭐ 新增：个人中心组件
import { exportToPDF } from './utils/pdfExport'

// --- 全局状态 ---
const isLoggedIn = ref(false)
const userInfo = ref({})
const currentView = ref('dashboard')
const loading = ref(false)
const menuKey = ref(0) 

// --- 数据状态 ---
const tableData = ref([])
const trainingList = ref([]) 
const configRules = ref({ cs: 70, med: 70 })

// --- 表单与弹窗状态 ---
const addDialogVisible = ref(false)
const addForm = ref({ name: '', role: 'STUDENT', csScore: 50, medScore: 50 })
const dialogVisible = ref(false)
const currentTalent = ref({})
const analysisReport = ref({ type: '', colorType: 'info', summary: '', strength: '', weakness: '', courses: [] })
let myChart = null;

// --- ⭐ 权限配置 (菜单隔离核心) ---
const allMenuItems = [
  // 1. 学生专属菜单
  { index: 'personal-center', label: '个人成长中心', icon: UserFilled, roles: ['STUDENT'] },

  // 2. 管理员/教师专属菜单
  { index: 'dashboard', label: '宏观决策仪表盘', icon: Odometer, roles: ['ADMIN', 'TEACHER'] },
  { index: 'map-view', label: '时空轨迹监控', icon: MapLocation, roles: ['ADMIN', 'TEACHER'] },
  { index: 'project-list', label: '科研项目管理', icon: List, roles: ['ADMIN', 'TEACHER'] },
  { index: 'asset-list', label: '资产设备管理', icon: Box, roles: ['ADMIN', 'TEACHER'] },
  { index: 'training', label: '培训计划中心', icon: Notebook, roles: ['ADMIN', 'TEACHER'] }, 
  { index: 'talent-list', label: '人才信息管理', icon: UserFilled, roles: ['ADMIN', 'TEACHER'] },
  { index: 'settings', label: '系统设置', icon: Setting, roles: ['ADMIN'] } 
]

// 动态计算菜单
const visibleMenuItems = computed(() => {
  const currentRole = userInfo.value.role || 'GUEST'
  return allMenuItems.filter(item => {
    return !item.roles || item.roles.includes(currentRole)
  })
})

const hasPermission = (requiredRoles) => {
  const currentRole = userInfo.value.role || 'GUEST'
  return requiredRoles.includes(currentRole)
}

const pageTitle = computed(() => {
  const item = allMenuItems.find(i => i.index === currentView.value)
  return item ? item.label : '系统'
})

// --- ⭐ 登录成功与自动跳转 ---
const handleLoginSuccess = async (user) => {
  console.log('✅ 登录数据:', user)
  
  if (!user) {
    ElMessage.error('登录异常: 未获取到用户信息')
    return
  }

  // 1. 标准权限转换 (大写)
  if (user.role) {
    user.role = String(user.role).toUpperCase()
  } else {
    user.role = 'GUEST'
  }

  // 2. 更新状态
  userInfo.value = user
  isLoggedIn.value = true
  localStorage.setItem('userInfo', JSON.stringify(user))
  localStorage.setItem('token', 'mock-token-' + Date.now())

  // 3. 等待渲染
  await nextTick()
  menuKey.value++ 
  
  // ⭐ 4. 根据角色跳转不同首页
  if (user.role === 'STUDENT') {
    currentView.value = 'personal-center'
  } else {
    currentView.value = 'dashboard'
  }
}

const handleLogout = (command) => {
  if (command === 'logout') {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    isLoggedIn.value = false
    currentView.value = 'dashboard'
    userInfo.value = {}
  }
}

// 初始化 (刷新页面时恢复状态)
onMounted(() => {
  const token = localStorage.getItem('token')
  const storedUser = localStorage.getItem('userInfo')
  if (token && storedUser) {
    try {
      const user = JSON.parse(storedUser)
      if (user.role) user.role = user.role.toUpperCase()
      
      isLoggedIn.value = true
      userInfo.value = user

      // ⭐ 刷新页面也保持正确的视图逻辑
      if (user.role === 'STUDENT') {
        currentView.value = 'personal-center'
      }
    } catch (e) { console.error('Error parsing user data', e) }
  }
})

// --- 业务逻辑 ---
const handleSelect = (key) => {
  currentView.value = key
  if (key === 'talent-list') fetchData()
}

const getTagType = (role) => {
  if (role === 'DOCTOR') return 'success'
  if (role === 'RESEARCHER') return 'warning'
  return ''
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:9090/api/talent/list')
    tableData.value = res.data
  } catch (error) { ElMessage.error('获取人才数据失败') } 
  finally { loading.value = false }
}

// 导出Excel
const exportTalentExcel = () => {
  window.location.href = 'http://localhost:9090/api/excel/export/talent'
  ElMessage.success('正在下载人才报表...')
}

const fetchTraining = async (talentId) => {
  try {
    const res = await axios.get(`http://localhost:9090/api/training/list/${talentId}`)
    trainingList.value = res.data
  } catch (e) { console.error(e) }
}

const openAddDialog = () => {
  addForm.value = { name: '', role: 'STUDENT', csScore: 50, medScore: 50 }
  addDialogVisible.value = true
}

const submitAdd = async () => {
  if(!addForm.value.name) return ElMessage.warning('请输入姓名')
  try {
    await axios.post('http://localhost:9090/api/talent/add', addForm.value)
    ElMessage.success('录入成功')
    addDialogVisible.value = false
    fetchData()
  } catch (e) { ElMessage.error('录入失败') }
}

const handleDelete = async (id) => {
  try {
    await axios.delete(`http://localhost:9090/api/talent/delete/${id}`)
    ElMessage.success('删除成功')
    fetchData()
  } catch (e) { ElMessage.error('删除失败') }
}

const showRadar = async (row) => {
  currentTalent.value = row
  try {
    const res = await axios.get('http://localhost:9090/api/config/all')
    configRules.value = { cs: res.data.cs_threshold, med: res.data.med_threshold }
  } catch(e) { console.log('Config error') }

  dialogVisible.value = true
  fetchTraining(row.id)
}

const assignTraining = async () => {
  if (analysisReport.value.courses.length === 0) return;
  const payload = analysisReport.value.courses.map(course => ({
    talentId: currentTalent.value.id,
    courseName: course
  }))
  try {
    await axios.post('http://localhost:9090/api/training/assign', payload)
    ElMessage.success('指派成功')
    fetchTraining(currentTalent.value.id)
  } catch (e) { ElMessage.error('指派失败') }
}

const handleExport = () => {
  ElMessage.success('正在生成 PDF...')
  exportToPDF('report-content', `${currentTalent.value.name}-能力画像报告`)
}

// --- AI 诊断 ---
const generateReport = (cs, med) => {
  const thresholdCs = configRules.value.cs
  const thresholdMed = configRules.value.med

  if (cs > thresholdCs && med > thresholdMed) {
    analysisReport.value = {
      type: '🌟 卓越交叉型人才', colorType: 'success',
      summary: '兼具双重背景，稀缺复合型人才。',
      strength: '具备医学数据清洗与AI模型构建的双重能力。',
      weakness: '暂无明显短板，建议加强项目管理能力。',
      courses: ['《科研项目管理》', '《医学大数据伦理》']
    }
  } else if (cs > med + 20) {
    analysisReport.value = {
      type: '💻 技术驱动型人才', colorType: 'primary',
      summary: '编程强，缺乏临床常识。',
      strength: '熟练掌握 Python/Java，算法逻辑强。',
      weakness: '对人体解剖结构及医院业务流程缺乏认知。',
      courses: ['《人体解剖学基础》', '《康复评定技术》']
    }
  } else if (med > cs + 20) {
    analysisReport.value = {
      type: '🏥 临床应用型人才', colorType: 'warning',
      summary: '临床经验丰富，数字化能力弱。',
      strength: '熟悉康复治疗全流程，能准确把握患者痛点。',
      weakness: '无法处理复杂数据，缺乏编程思维。',
      courses: ['《Python 数据分析入门》', '《ECharts 可视化》']
    }
  } else {
    analysisReport.value = {
      type: '🌱 成长期待型人才', colorType: 'info',
      summary: '基础较为薄弱，需全面提升。',
      strength: '具备基本的学习潜力。',
      weakness: '计算机与医学专业知识均需系统提升。',
      courses: ['《计算机导论》', '《康复医学导论》']
    }
  }
}

const initChart = async () => {
  await nextTick()
  const chartDom = document.getElementById('radarChart')
  if (myChart) myChart.dispose();
  myChart = echarts.init(chartDom)
  
  const cs = currentTalent.value.csScore || 0
  const med = currentTalent.value.medScore || 0
  generateReport(cs, med)

  const option = {
    color: ['#67F9D8'],
    radar: {
      indicator: [
        { name: '编程 (CS)', max: 100 }, { name: '数据 (CS)', max: 100 }, { name: '交叉创新', max: 100 },
        { name: '评估 (Med)', max: 100 }, { name: '理论 (Med)', max: 100 }, { name: '沟通 (Med)', max: 100 }
      ],
      splitNumber: 4,
      axisName: { color: '#666', borderRadius: 3, padding: [3, 5] }
    },
    series: [{
      type: 'radar',
      data: [{
        value: [cs, cs*0.9, (cs+med)/2, med, med*0.95, med*0.8],
        name: '能力值',
        areaStyle: {
          color: new echarts.graphic.RadialGradient(0.1, 0.6, 1, [
            { color: 'rgba(103, 249, 216, 0.1)', offset: 0 },
            { color: 'rgba(103, 249, 216, 0.9)', offset: 1 }
          ])
        }
      }]
    }]
  }
  myChart.setOption(option)
}
</script>

<style>
html, body, #app { margin: 0; padding: 0; height: 100%; font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', Arial, sans-serif; }
.layout-container { height: 100vh; }
.aside { background-color: #304156; color: #fff; transition: width 0.3s; overflow-x: hidden; }
.logo { height: 60px; line-height: 60px; text-align: center; background: #2b2f3a; color: #fff; }
.header { background: #fff; border-bottom: 1px solid #dcdfe6; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; box-shadow: 0 1px 4px rgba(0,21,41,.08); }
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
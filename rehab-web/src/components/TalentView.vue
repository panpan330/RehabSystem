<template>
  <div class="user-center">
    <div class="welcome-header">
      <div class="welcome-text">
        <h2>👋 你好，{{ myProfile.name || '同学' }}</h2>
        <p>今天是 {{ today }}，科研之路，步履不停！</p>
      </div>
      <el-tag size="large" effect="dark" round color="rgba(255,255,255,0.2)" style="border:none; color:fff">
        {{ myProfile.role || '用户' }}
      </el-tag>
    </div>

    <el-row :gutter="20" style="margin-top: -30px;">
      <el-col :span="8">
        <el-card shadow="hover" class="profile-card">
          <div class="avatar-area">
            <el-avatar :size="80" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
            <h3 style="margin: 10px 0 5px 0">{{ myProfile.name }}</h3>
            <p style="color: #909399; font-size: 13px; margin:0">{{ myProfile.major || '暂无专业' }}</p>
          </div>
          
          <el-divider>能力雷达</el-divider>
          <div id="myRadar" style="width: 100%; height: 250px;"></div>

          <el-divider>基本信息</el-divider>
          <el-descriptions :column="1" size="small" class="info-desc">
            <el-descriptions-item label="📧 邮箱">{{ myProfile.email || '-' }}</el-descriptions-item>
            <el-descriptions-item label="📱 电话">{{ myProfile.phone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="🏠 地址">{{ myProfile.address || '-' }}</el-descriptions-item>
          </el-descriptions>

          <div style="margin-top: 20px; text-align: center; display: flex; justify-content: center; gap: 10px;">
            <el-button type="primary" plain round @click="editDialogVisible = true">✏️ 编辑资料</el-button>
            <el-button type="warning" plain round @click="passDialogVisible = true">🔑 修改密码</el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card shadow="hover" style="margin-bottom: 20px;">
          <template #header>
            <div class="card-header">
              <span>🔬 我的科研项目</span>
              <el-tag effect="plain" round>{{ myProjects.length }} 个参与中</el-tag>
            </div>
          </template>
          <el-empty v-if="myProjects.length === 0" description="暂未参与任何项目" :image-size="80" />
          <div v-else class="project-list">
             <div v-for="proj in myProjects" :key="proj.id" class="project-item">
                <div class="project-icon">🧪</div>
                <div class="project-info">
                   <div class="project-title">
                     {{ proj.name }}
                     <el-tag size="small" :type="proj.status === 'ONGOING' ? 'success' : 'info'" style="margin-left:5px">
                       {{ proj.status === 'ONGOING' ? '进行中' : '已结题' }}
                     </el-tag>
                   </div>
                   <div class="project-role">
                      <el-icon><User /></el-icon> 我的角色：<span style="color: #409EFF; font-weight: bold;">{{ proj.myRole }}</span>
                   </div>
                </div>
             </div>
          </div>
        </el-card>

        <el-card shadow="hover" style="margin-bottom: 20px;">
          <template #header>
            <div class="card-header">
              <span>📚 我的成长任务</span>
              <el-tag type="warning" round>{{ myTasks.length }} 个待办</el-tag>
            </div>
          </template>
          <el-empty v-if="myTasks.length === 0 && myDoneTasks.length === 0" description="暂无任务" :image-size="80" />
          <div v-else class="task-list">
            <div v-for="task in myTasks" :key="task.id" class="task-item">
              <div class="task-icon">📖</div>
              <div class="task-content">
                <div class="task-title">{{ task.courseName }}</div>
                <div class="task-time">发布时间: {{ formatDate(task.createTime) }}</div>
              </div>
              <el-button type="primary" size="small" round @click="startTask(task)" v-if="task.status === 'TO_DO'">开始学习</el-button>
              <el-button type="success" size="small" round @click="finishTask(task)" v-if="task.status === 'IN_PROGRESS'">标记完成</el-button>
            </div>
            <el-collapse v-if="myDoneTasks.length > 0" style="margin-top: 10px; border:none">
              <el-collapse-item title="查看已完成的历史任务" name="1">
                <div v-for="task in myDoneTasks" :key="task.id" class="task-item done">
                  <div class="task-icon">✅</div>
                  <div class="task-content"><div class="task-title">{{ task.courseName }}</div></div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-card>

        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>🎒 我的借用行囊</span>
              <el-button type="primary" link @click="$router.push('/asset')">去借设备</el-button>
            </div>
          </template>
          <el-table :data="myAssets" style="width: 100%" empty-text="暂无借用设备">
            <el-table-column prop="deviceName" label="设备名称" />
            <el-table-column prop="deviceCode" label="编号" width="120" />
            <el-table-column label="状态" width="100">
               <template #default><el-tag type="danger" effect="plain">借用中</el-tag></template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="right">
              <template #default="scope">
                <el-popconfirm title="确认归还？" @confirm="returnAsset(scope.row)">
                   <template #reference><el-button link type="primary">归还</el-button></template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="editDialogVisible" title="更新个人信息" width="400px">
      <el-form :model="editForm" label-width="60px">
        <el-form-item label="手机"><el-input v-model="editForm.phone" /></el-form-item>
        <el-form-item label="邮箱"><el-input v-model="editForm.email" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="editForm.address" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProfile">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="passDialogVisible" title="修改密码" width="400px">
      <el-form :model="passForm" label-width="80px">
        <el-form-item label="旧密码">
           <el-input v-model="passForm.oldPass" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码">
           <el-input v-model="passForm.newPass" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认新密码">
           <el-input v-model="passForm.confirmPass" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPass">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import request from '../utils/request'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { User } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router' // 引入路由

const router = useRouter()
const myProfile = ref({})
const allTraining = ref([])
const allAssets = ref([])
const myProjects = ref([])
const editDialogVisible = ref(false)
const editForm = ref({})
let radarChart = null
const today = dayjs().format('YYYY年MM月DD日')

// ⭐ 密码相关数据
const passDialogVisible = ref(false)
const passForm = ref({ oldPass: '', newPass: '', confirmPass: '' })

const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const userId = userInfo.id

const myTasks = computed(() => allTraining.value.filter(t => t.status !== 'DONE'))
const myDoneTasks = computed(() => allTraining.value.filter(t => t.status === 'DONE'))
const myAssets = computed(() => allAssets.value.filter(a => a.borrowerId == userId && a.status === 'BORROWED'))

const initData = async () => {
  if (!userId) return ElMessage.error('未登录状态')
  try {
    const resProfile = await request.get(`/api/talent/profile/${userId}`)
    if (resProfile.code === '200') {
      myProfile.value = resProfile.data
      editForm.value = { ...resProfile.data }
      renderRadar()
      const talentId = myProfile.value.id
      if (talentId) {
        const resTrain = await request.get(`/api/training/list/${talentId}`)
        if (resTrain.code === '200') allTraining.value = resTrain.data
        const resProj = await request.get(`/api/project/list/my/${talentId}`)
        if (resProj.code === '200') myProjects.value = resProj.data
      }
    }
    const resAsset = await request.get('/api/asset/list')
    if(resAsset.code === '200') allAssets.value = resAsset.data
  } catch (e) { console.error(e) }
}

const renderRadar = () => {
  nextTick(() => {
    const dom = document.getElementById('myRadar')
    if (!dom) return
    if (radarChart) radarChart.dispose()
    radarChart = echarts.init(dom)
    const cs = myProfile.value.csScore || 0
    const med = myProfile.value.medScore || 0
    radarChart.setOption({
      radar: {
        indicator: [
          { name: '计算机能力', max: 100 },
          { name: '数据分析', max: 100 },
          { name: '科研潜力', max: 100 },
          { name: '医学理论', max: 100 },
          { name: '临床实践', max: 100 },
        ],
        radius: '65%'
      },
      series: [{
        type: 'radar',
        data: [{
          value: [cs, cs*0.9, (cs+med)/2, med, med*0.8],
          name: '能力评估',
          areaStyle: { color: 'rgba(64,158,255, 0.2)' },
          itemStyle: { color: '#409EFF' }
        }]
      }]
    })
  })
}

const startTask = async (task) => {
  await request.post('/api/training/update-status', { id: task.id, status: 'IN_PROGRESS' })
  task.status = 'IN_PROGRESS'
  ElMessage.success('开始学习')
}
const finishTask = async (task) => {
  await request.post('/api/training/update-status', { id: task.id, status: 'DONE' })
  task.status = 'DONE'
  ElMessage.success('任务完成')
}
const returnAsset = async (row) => {
    await request.post('/api/asset/return', { assetId: row.id })
    ElMessage.success('归还成功')
    const res = await request.get('/api/asset/list')
    allAssets.value = res.data
}
const saveProfile = async () => {
    await request.put('/api/talent/update', editForm.value)
    myProfile.value = { ...editForm.value }
    editDialogVisible.value = false
    ElMessage.success('更新成功')
}
const formatDate = (str) => str ? str.split('T')[0] : '-'

// ⭐ 提交修改密码
const submitPass = async () => {
    if (!passForm.value.oldPass || !passForm.value.newPass) {
        return ElMessage.warning('请输入密码')
    }
    if (passForm.value.newPass !== passForm.value.confirmPass) {
        return ElMessage.warning('两次新密码输入不一致')
    }
    try {
        const res = await request.post('/api/user/password', {
            userId: userId,
            oldPass: passForm.value.oldPass,
            newPass: passForm.value.newPass
        })
        if (res.code === '200') {
            ElMessage.success('密码修改成功，请重新登录')
            passDialogVisible.value = false
            // 退出登录
            localStorage.clear()
            router.push('/login')
        } else {
            ElMessage.error(res.msg || '修改失败')
        }
    } catch(e) { ElMessage.error('网络错误') }
}

onMounted(() => initData())
</script>

<style scoped>
.user-center { padding: 20px; background: #f0f2f5; min-height: 100vh; }
.welcome-header { background: linear-gradient(135deg, #409EFF 0%, #3a8ee6 100%); padding: 30px 40px 60px 40px; color: white; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
.welcome-text h2 { margin: 0 0 10px 0; }
.welcome-text p { margin: 0; opacity: 0.9; }
.profile-card { text-align: center; }
.avatar-area { padding: 10px; }
.info-desc :deep(.el-descriptions__label) { width: 70px; text-align: right; }
.card-header { display: flex; justify-content: space-between; align-items: center; font-weight: bold; }
.project-list { display: flex; flex-direction: column; gap: 15px; }
.project-item { display: flex; align-items: center; background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #409EFF; }
.project-icon { font-size: 24px; margin-right: 15px; }
.project-info { flex: 1; }
.project-title { font-weight: bold; font-size: 15px; display: flex; align-items: center; }
.project-role { font-size: 13px; color: #606266; margin: 5px 0; display: flex; align-items: center; gap: 5px;}
.task-item { display: flex; align-items: center; background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 10px; }
.task-item.done { opacity: 0.6; background: #fff; border: 1px solid #eee; }
.task-icon { font-size: 24px; margin-right: 15px; }
.task-content { flex: 1; }
.task-title { font-weight: bold; }
.task-time { font-size: 12px; color: #909399; margin-top: 4px; }
</style>
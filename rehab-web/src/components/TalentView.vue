<template>
  <div class="user-center">
    <div class="welcome-header">
      <div class="welcome-text">
        <h2>👋 你好，{{ myProfile.name || '同学' }}</h2>
        <p>今天是 {{ today }}，保持进步，未来可期！</p>
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
          
          <el-divider>能力分布</el-divider>
          <div id="myRadar" style="width: 100%; height: 250px;"></div>

          <el-divider>基本信息</el-divider>
          <el-descriptions :column="1" size="small" class="info-desc">
            <el-descriptions-item label="📧 邮箱">{{ myProfile.email || '-' }}</el-descriptions-item>
            <el-descriptions-item label="📱 电话">{{ myProfile.phone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="🏠 地址">{{ myProfile.address || '-' }}</el-descriptions-item>
          </el-descriptions>

          <div style="margin-top: 20px; text-align: center;">
            <el-button type="primary" plain round @click="editDialogVisible = true">✏️ 编辑资料</el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card shadow="hover" style="margin-bottom: 20px;">
          <template #header>
            <div class="card-header">
              <span>📚 我的成长任务</span>
              <el-tag type="warning" round>{{ myTasks.length }} 个进行中</el-tag>
            </div>
          </template>
          
          <el-empty v-if="myTasks.length === 0 && myDoneTasks.length === 0" description="暂无任务，真是轻松的一天~" />
          
          <div v-else class="task-list">
            <div v-for="task in myTasks" :key="task.id" class="task-item">
              <div class="task-icon">📖</div>
              <div class="task-content">
                <div class="task-title">{{ task.courseName }}</div>
                <div class="task-time">指派时间: {{ formatDate(task.createTime) }}</div>
              </div>
              <el-button type="primary" size="small" round @click="startTask(task)" v-if="task.status === 'TO_DO'">开始学习</el-button>
              <el-button type="success" size="small" round @click="finishTask(task)" v-if="task.status === 'IN_PROGRESS'">标记完成</el-button>
            </div>
            
            <el-collapse v-if="myDoneTasks.length > 0" style="margin-top: 10px; border:none">
              <el-collapse-item title="查看已完成的历史任务" name="1">
                <div v-for="task in myDoneTasks" :key="task.id" class="task-item done">
                  <div class="task-icon">✅</div>
                  <div class="task-content">
                    <div class="task-title">{{ task.courseName }}</div>
                  </div>
                  <el-tag type="success" size="small">已完成</el-tag>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-card>

        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>🎒 我的借用行囊</span>
              <el-button type="text" style="padding:0">去申请借用</el-button>
            </div>
          </template>
          
          <el-table :data="myAssets" style="width: 100%" empty-text="两袖清风，快去实验室借点设备吧~">
            <el-table-column prop="deviceName" label="设备名称" />
            <el-table-column prop="deviceCode" label="资产编号" width="150" />
            <el-table-column label="状态" width="100">
               <template #default><el-tag type="danger">借用中</el-tag></template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <el-popconfirm title="请确认已将设备归还给管理员？" @confirm="returnAsset(scope.row)">
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import request from '../utils/request'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const myProfile = ref({})
const allTraining = ref([])
const allAssets = ref([]) // 实际上应该后端过滤，这里演示前端过滤
const editDialogVisible = ref(false)
const editForm = ref({})
let radarChart = null

const today = dayjs().format('YYYY年MM月DD日')

// 获取当前登录用户ID
const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const userId = userInfo.id

// 计算属性
const myTasks = computed(() => allTraining.value.filter(t => t.status !== 'DONE'))
const myDoneTasks = computed(() => allTraining.value.filter(t => t.status === 'DONE'))
// 假设资产数据里没有存 userId (简化版)，暂时把状态是 BORROWED 的全当做自己的做演示
// ⭐ 真实项目后端应该加 userId 字段，这里为了演示效果，我们过滤所有 BORROWED 的
const myAssets = computed(() => allAssets.value.filter(a => a.status === 'BORROWED'))

const initData = async () => {
  if (!userId) return ElMessage.error('未登录状态')
  
  try {
    // 1. 获取个人档案
    const resProfile = await request.get(`/api/talent/profile/${userId}`)
    if (resProfile.code === '200') {
      myProfile.value = resProfile.data
      editForm.value = { ...resProfile.data } // 复制给编辑表单
      renderRadar()
      
      // 2. 获取任务 (有了 TalentID 才能查任务)
      if (myProfile.value.id) {
        const resTrain = await request.get(`/api/training/list/${myProfile.value.id}`)
        if (resTrain.code === '200') allTraining.value = resTrain.data // 注意：如果后端没改 Result 包装，这里直接 resTrain
        // 如果后端 TrainingController 还是返回 List，请把上一行改成: allTraining.value = resTrain
      }
    }

    // 3. 获取资产 (这里查全部再前端过滤，偷懒做法)
    // 实际上你应该在 AssetController 加一个 /list/my
    const resAsset = await request.get('/api/asset/list')
    // 如果 AssetController 也没改 Result，直接 resAsset
    allAssets.value = Array.isArray(resAsset) ? resAsset : (resAsset.data || [])

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
          { name: '团队协作', max: 100 },
          { name: '医学理论', max: 100 },
          { name: '临床实践', max: 100 },
        ],
        radius: '70%'
      },
      series: [{
        type: 'radar',
        data: [{
          value: [cs, cs*0.9, 85, med, med*0.8],
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
  ElMessage.success('加油！开始学习')
}

const finishTask = async (task) => {
  await request.post('/api/training/update-status', { id: task.id, status: 'DONE' })
  task.status = 'DONE'
  ElMessage.success('太棒了！任务完成')
}

const returnAsset = async (row) => {
    // 假设后端 return 接口是 /api/asset/return/{id}
    await request.post(`/api/asset/return/${row.id}`)
    ElMessage.success('归还申请已提交')
    // 刷新列表
    const res = await request.get('/api/asset/list')
    allAssets.value = Array.isArray(res) ? res : (res.data || [])
}

const saveProfile = async () => {
    try {
        await request.put('/api/talent/update', editForm.value)
        myProfile.value = { ...editForm.value }
        editDialogVisible.value = false
        ElMessage.success('资料已更新')
    } catch(e) { ElMessage.error('保存失败') }
}

const formatDate = (str) => str ? str.split('T')[0] : ''

onMounted(() => {
  initData()
})
</script>

<style scoped>
.user-center { padding: 20px; background: #f0f2f5; min-height: 100vh; }

.welcome-header {
  background: linear-gradient(135deg, #409EFF 0%, #3a8ee6 100%);
  padding: 30px 40px 60px 40px; /* 底部留白给卡片上浮 */
  color: white;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.welcome-text h2 { margin: 0 0 10px 0; font-size: 26px; }
.welcome-text p { margin: 0; opacity: 0.9; }

.profile-card {
  text-align: center;
  position: relative;
  top: 0;
  transition: top 0.3s;
}
.avatar-area { padding: 10px; }
.info-desc :deep(.el-descriptions__label) { width: 70px; text-align: right; }

.card-header { display: flex; justify-content: space-between; align-items: center; font-weight: bold; }

.task-item {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 10px;
  transition: all 0.2s;
}
.task-item:hover { background: #ecf5ff; }
.task-item.done { opacity: 0.6; background: #fff; border: 1px solid #eee; }

.task-icon { font-size: 24px; margin-right: 15px; }
.task-content { flex: 1; }
.task-title { font-weight: bold; color: #303133; }
.task-time { font-size: 12px; color: #909399; margin-top: 4px; }
</style>
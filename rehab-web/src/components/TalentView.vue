<template>
  <div class="talent-dashboard">
    <el-card shadow="hover" class="info-card">
      <div class="profile-header">
        <el-avatar :size="80" :src="userInfo.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'" />
        <div class="profile-text">
          <h2>你好，{{ userInfo.name || userInfo.username }} 👋</h2>
          <p>
            <el-tag type="success">{{ userInfo.role }}</el-tag> 
            <span style="margin-left: 10px; color: #666;">越努力，越幸运！</span>
          </p>
        </div>
        <div style="flex: 1; text-align: right;">
           <el-statistic title="我的 CS 能力值" :value="myInfo.csScore" />
        </div>
        <div style="margin-left: 20px;">
           <el-statistic title="我的医学能力值" :value="myInfo.medScore" />
        </div>
      </div>
    </el-card>

    <div style="display: flex; gap: 20px; margin-top: 20px;">
      
      <el-card shadow="hover" style="width: 400px;">
        <template #header>
          <span style="font-weight: bold;">📊 我的能力模型</span>
        </template>
        <div id="personalRadar" style="width: 100%; height: 350px;"></div>
        <div style="text-align: center; margin-top: 10px; color: #999; font-size: 12px;">
           *该模型基于系统实时评估生成
        </div>
      </el-card>

      <el-card shadow="hover" style="flex: 1;">
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: bold;">📅 我的培训计划</span>
            <el-button type="primary" link @click="fetchMyTraining(myInfo.id)">刷新</el-button>
          </div>
        </template>
        
        <el-table :data="myTasks" stripe style="width: 100%" height="350">
          <el-table-column prop="courseName" label="课程名称" />
          <el-table-column prop="status" label="当前进度 (点击变更)" width="180">
            <template #default="scope">
              <el-tag 
                style="cursor: pointer" 
                :type="getStatusType(scope.row.status)"
                @click="updateStatus(scope.row)"
              >
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="指派时间">
             <template #default="scope">
               {{ scope.row.createTime ? scope.row.createTime.split('T')[0] : '' }}
             </template>
          </el-table-column>
          
          <template #empty>
            <el-empty description="暂无培训任务" />
          </template>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import axios from 'axios'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

const userInfo = ref({})
const myInfo = ref({ id: null, csScore: 0, medScore: 0 })
const myTasks = ref([])
let myChart = null

// 获取我的详细档案
const fetchTalentInfo = async () => {
  const userId = userInfo.value.id 
  console.log('正在获取档案, UserID:', userId) // 调试日志

  if (!userId) return

  try {
    const res = await axios.get(`http://localhost:9090/api/talent/me/${userId}`)
    console.log('档案接口返回:', res.data) // 调试日志
    
    // ⭐ 核心修复：使用 == (宽松相等) 或者 字符串比较
    if (res.data.code == 200) {
      const me = res.data.data
      myInfo.value = me
      
      // 拿到 Talent ID 后，再去查对应的培训任务
      if (me && me.id) {
        await fetchMyTraining(me.id) 
        initChart(me.csScore, me.medScore)
      }
    } else {
      ElMessage.warning(res.data.msg || '未关联档案信息')
    }
  } catch (e) { 
    console.error(e)
    ElMessage.error('获取档案失败，请检查网络') 
  }
}

// 获取我的任务
const fetchMyTraining = async (talentId) => {
  if (!talentId) return
  try {
    const res = await axios.get(`http://localhost:9090/api/training/list/${talentId}`)
    // 这里后端可能还没改 Result 封装，如果是直接返回 List，就不用判断 code
    // 如果你也把 TrainingController 改成了 Result，这里也要改判断
    // 假设目前 TrainingController 还是返回 List<Training>
    if (Array.isArray(res.data)) {
        myTasks.value = res.data
    } else if (res.data.data) {
        // 如果你也把 Training 改成了 Result 封装
        myTasks.value = res.data.data
    } else {
        myTasks.value = res.data
    }
  } catch (e) { console.error(e) }
}

// 更新状态
const updateStatus = async (row) => {
  let nextStatus = 'TO_DO'
  if (row.status === 'TO_DO') nextStatus = 'DOING'
  else if (row.status === 'DOING') nextStatus = 'DONE'
  else return 
  
  try {
    await axios.put('http://localhost:9090/api/training/update', {
      id: row.id,
      courseName: row.courseName,
      status: nextStatus
    })
    row.status = nextStatus
    ElMessage.success('进度已更新')
  } catch(e) { ElMessage.error('更新失败') }
}

const getStatusType = (status) => {
  if (status === 'DONE') return 'success'
  if (status === 'DOING') return 'primary'
  return 'info'
}
const getStatusText = (status) => {
  if (status === 'DONE') return '已完成'
  if (status === 'DOING') return '进行中'
  return '待开始'
}

// 绘制雷达图
const initChart = async (cs, med) => {
  await nextTick()
  const chartDom = document.getElementById('personalRadar')
  if (myChart) myChart.dispose();
  myChart = echarts.init(chartDom)
  
  // 防止空值报错
  cs = cs || 0
  med = med || 0

  const option = {
    radar: {
      indicator: [
        { name: '编程能力', max: 100 }, { name: '数据分析', max: 100 }, { name: '创新思维', max: 100 },
        { name: '医学评估', max: 100 }, { name: '理论基础', max: 100 }, { name: '临床沟通', max: 100 }
      ],
      radius: '65%'
    },
    series: [{
      type: 'radar',
      data: [{
        value: [cs, cs*0.9, (cs+med)/2, med, med*0.95, med*0.8],
        name: '能力值',
        areaStyle: { color: 'rgba(64, 158, 255, 0.5)' },
        itemStyle: { color: '#409EFF' }
      }]
    }]
  }
  myChart.setOption(option)
}

// 初始化
onMounted(async () => {
  const storedUser = localStorage.getItem('userInfo')
  if (storedUser) {
    userInfo.value = JSON.parse(storedUser)
    await fetchTalentInfo()
  }
})
</script>

<style scoped>
.talent-dashboard { padding: 0; }
.info-card { margin-bottom: 20px; }
.profile-header { display: flex; align-items: center; }
.profile-text { margin-left: 20px; }
.profile-text h2 { margin: 0 0 5px 0; }
.profile-text p { margin: 0; }
</style>
<template>
  <div class="home-container">
    
    <div class="welcome-banner">
      <div class="banner-content">
        <h2>👋 欢迎回来，管理员</h2>
        <p>这是您的康复人才智脑驾驶舱，实时监控人才库动态与能力分布。</p>
      </div>
      <div style="font-size: 60px;">🤖</div> 
    </div>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <div class="card-icon-wrapper" style="background: rgba(64, 158, 255, 0.1);">
            <el-icon :size="24" color="#409EFF"><User /></el-icon>
          </div>
          <div class="card-info">
            <div class="card-title">人才总数</div>
            <div class="card-num" style="color: #409EFF">{{ stats.totalCount }}</div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <div class="card-icon-wrapper" style="background: rgba(103, 194, 58, 0.1);">
            <el-icon :size="24" color="#67C23A"><Trophy /></el-icon>
          </div>
          <div class="card-info">
            <div class="card-title">卓越交叉人才</div>
            <div class="card-num" style="color: #67C23A">{{ stats.eliteCount }}</div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <div class="card-icon-wrapper" style="background: rgba(230, 162, 60, 0.1);">
            <el-icon :size="24" color="#E6A23C"><Monitor /></el-icon>
          </div>
          <div class="card-info">
            <div class="card-title">平均 CS 能力</div>
            <div class="card-num" style="color: #E6A23C">{{ stats.avgCs }}</div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <div class="card-icon-wrapper" style="background: rgba(245, 108, 108, 0.1);">
            <el-icon :size="24" color="#F56C6C"><FirstAidKit /></el-icon>
          </div>
          <div class="card-info">
            <div class="card-title">平均医学能力</div>
            <div class="card-num" style="color: #F56C6C">{{ stats.avgMed }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <div class="chart-header">
              <span>📊 人才角色分布</span>
            </div>
          </template>
          <div ref="pieChartRef" style="width: 100%; height: 380px;"></div>
        </el-card>
      </el-col>
      
      <el-col :span="16">
        <el-card shadow="hover">
          <template #header>
            <div class="chart-header">
              <span>🎯 医工交叉能力矩阵</span>
              <el-tag size="small" type="success" effect="plain">右上角为卓越区</el-tag>
            </div>
          </template>
          <div ref="scatterChartRef" style="width: 100%; height: 380px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import request from '../utils/request'
import * as echarts from 'echarts'
import { User, Trophy, Monitor, FirstAidKit } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const stats = ref({
  totalCount: 0,
  eliteCount: 0,
  avgCs: 0,
  avgMed: 0
})

const pieChartRef = ref(null)
const scatterChartRef = ref(null)
let pieChart = null
let scatterChart = null

// ⭐ 智能初始化函数：如果 DOM 没准备好，会自动重试
const initChartWithRetry = (chartRef, chartInstance, option, retryCount = 0) => {
  const dom = chartRef.value
  
  // 1. 检查 DOM 是否存在，以及宽度是否大于 0
  if (!dom || dom.clientWidth === 0) {
    if (retryCount < 5) { // 最多重试 5 次
      // console.log(`DOM 未就绪，500ms 后重试 (${retryCount + 1}/5)...`)
      setTimeout(() => initChartWithRetry(chartRef, chartInstance, option, retryCount + 1), 500)
    }
    return null
  }

  // 2. 如果准备好了，开始渲染
  if (chartInstance) chartInstance.dispose()
  const instance = echarts.init(dom)
  instance.setOption(option)
  return instance
}

// 饼图配置
const getPieOption = (data) => ({
  tooltip: { trigger: 'item' },
  legend: { bottom: '0%', left: 'center' },
  color: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C'],
  series: [{
    name: '角色分布',
    type: 'pie',
    radius: ['45%', '70%'],
    avoidLabelOverlap: false,
    itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
    label: { show: false, position: 'center' },
    emphasis: { label: { show: true, fontSize: 18, fontWeight: 'bold' } },
    data: data
  }]
})

// 散点图配置
const getScatterOption = (data) => ({
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    formatter: function (param) {
      return `
        <div style="font-weight:bold; margin-bottom:5px;">${param.data[2]}</div>
        <div style="font-size:12px; color:#666; margin-bottom:5px;">${param.data[3]}</div>
        <div>💻 CS: <span style="color:#409EFF; font-weight:bold">${param.data[0]}</span></div>
        <div>🏥 Med: <span style="color:#F56C6C; font-weight:bold">${param.data[1]}</span></div>
      `
    }
  },
  grid: { left: '8%', right: '10%', top: '10%', bottom: '15%' },
  xAxis: { name: '计算机 (CS)', min: 0, max: 100, splitLine: { show: true, lineStyle: { type: 'dashed' } } },
  yAxis: { name: '医学 (Med)', min: 0, max: 100, splitLine: { show: true, lineStyle: { type: 'dashed' } } },
  series: [{
    symbolSize: 15,
    data: data,
    type: 'scatter',
    itemStyle: {
        color: (p) => (p.data[0] >= 80 && p.data[1] >= 80) ? '#67C23A' : (p.data[0] > p.data[1] ? '#409EFF' : '#F56C6C'),
        shadowBlur: 5, shadowColor: 'rgba(0,0,0,0.2)'
    },
    markLine: { silent: true, lineStyle: { type: 'solid', color: '#DCDFE6' }, data: [{ xAxis: 60 }, { yAxis: 60 }] },
    markArea: { silent: true, itemStyle: { opacity: 0.08 }, data: [[{ xAxis: 80, yAxis: 80, itemStyle: { color: '#67C23A' } }, { xAxis: 100, yAxis: 100 }]] }
  }]
})

const loadData = async () => {
  try {
    const res = await request.get('/api/talent/dashboard')
    if (res && res.code === '200') {
      const { totalCount, avgCs, avgMed, pieData, scatterData } = res.data
      
      stats.value.totalCount = totalCount || 0
      stats.value.avgCs = avgCs || 0
      stats.value.avgMed = avgMed || 0
      stats.value.eliteCount = scatterData ? scatterData.filter(i => i[0] >= 80 && i[1] >= 80).length : 0
      
      // ⭐ 使用带重试机制的初始化
      pieChart = initChartWithRetry(pieChartRef, pieChart, getPieOption(pieData || []))
      scatterChart = initChartWithRetry(scatterChartRef, scatterChart, getScatterOption(scatterData || []))
    }
  } catch (e) {
    console.error(e)
  }
}

const resizeHandler = () => {
  pieChart?.resize()
  scatterChart?.resize()
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', resizeHandler)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeHandler)
  if (pieChart) pieChart.dispose()
  if (scatterChart) scatterChart.dispose()
})
</script>

<style scoped>
.home-container { padding: 0; }
.welcome-banner {
  background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
  border-radius: 12px;
  padding: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  box-shadow: 0 10px 20px rgba(59, 130, 246, 0.2);
}
.welcome-banner h2 { margin: 0 0 10px 0; font-size: 24px; }
.welcome-banner p { margin: 0; opacity: 0.9; }

.data-card {
  border: none;
  display: flex;
  align-items: center;
  border-radius: 12px;
  transition: transform 0.3s;
}
.data-card:hover { transform: translateY(-5px); }
:deep(.el-card__body) {
  width: 100%;
  padding: 20px;
  display: flex;
  align-items: center;
}
.card-icon-wrapper {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}
.card-info { flex: 1; }
.card-title { font-size: 14px; color: #909399; margin-bottom: 8px; }
.card-num { font-size: 28px; font-weight: bold; font-family: 'Helvetica Neue', sans-serif; }
.chart-header { display: flex; justify-content: space-between; align-items: center; font-weight: bold; color: #303133; }
</style>
<template>
  <div class="home-container">
    <div class="welcome-banner">
      <div class="banner-content">
        <h2>👋 欢迎回来，管理员</h2>
        <p>这是您的康复人才智脑驾驶舱，实时监控人才库动态。</p>
      </div>
      <img src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" class="banner-img" />
    </div>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="8">
        <el-card shadow="hover" class="data-card">
          <div class="card-title">👨‍🎓 人才总数</div>
          <div class="card-num" style="color: #409EFF">{{ stats.totalCount }}</div>
          <div class="card-desc">当前库内活跃档案</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="data-card">
          <div class="card-title">💻 平均 CS 能力</div>
          <div class="card-num" style="color: #67C23A">{{ stats.avgCs }}</div>
          <div class="card-desc">计算机技术平均水平</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="data-card">
          <div class="card-title">🏥 平均医学能力</div>
          <div class="card-num" style="color: #F56C6C">{{ stats.avgMed }}</div>
          <div class="card-desc">临床医学平均水平</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="10">
        <el-card shadow="hover">
          <template #header>
            <div class="chart-header">📊 人才结构分布</div>
          </template>
          <div id="pieChart" style="height: 350px;"></div>
        </el-card>
      </el-col>
      
      <el-col :span="14">
        <el-card shadow="hover">
          <template #header>
            <div class="chart-header">🎯 医工交叉能力象限</div>
          </template>
          <div id="scatterChart" style="height: 350px;"></div>
        </el-card>
      </el-col>
    </el-row>

  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import request from '../utils/request'
import * as echarts from 'echarts'

const stats = ref({
  totalCount: 0,
  avgCs: 0,
  avgMed: 0
})

let pieChart = null
let scatterChart = null

const initPieChart = (data) => {
  const chartDom = document.getElementById('pieChart')
  pieChart = echarts.init(chartDom)
  pieChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%', left: 'center' },
    series: [
      {
        name: '角色分布',
        type: 'pie',
        radius: ['40%', '70%'], // 环形图
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: { show: false, position: 'center' },
        emphasis: {
          label: { show: true, fontSize: 20, fontWeight: 'bold' }
        },
        data: data
      }
    ]
  })
}

const initScatterChart = (data) => {
  const chartDom = document.getElementById('scatterChart')
  scatterChart = echarts.init(chartDom)
  scatterChart.setOption({
    tooltip: {
      formatter: function (param) {
        return `<b>${param.data[2]}</b><br/>CS: ${param.data[0]}<br/>Med: ${param.data[1]}<br/>Role: ${param.data[3]}`
      }
    },
    xAxis: { 
      name: '计算机能力 (CS)', 
      min: 0, max: 100,
      splitLine: { show: false } 
    },
    yAxis: { 
      name: '医学能力 (Med)', 
      min: 0, max: 100,
      splitLine: { show: false }
    },
    // 绘制背景区域 (四个象限)
    graphic: [
      { type: 'rect', z: -10, left: 'center', top: 'middle', shape: { width: 5000, height: 5000 }, style: { fill: '#f4f4f5' } }
    ],
    series: [
      {
        symbolSize: 20,
        data: data,
        type: 'scatter',
        itemStyle: {
            // 根据分数动态变色
            color: (params) => {
                const cs = params.data[0]
                const med = params.data[1]
                if (cs > 60 && med > 60) return '#67C23A' // 双强 (绿色)
                if (cs > med) return '#409EFF' // CS强 (蓝色)
                return '#F56C6C' // 医强 (红色)
            },
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
        },
        markLine: {
            silent: true,
            lineStyle: { type: 'solid', color: '#909399' },
            data: [
                { xAxis: 50 }, // 竖线
                { yAxis: 50 }  // 横线
            ]
        }
      }
    ]
  })
}

const loadData = async () => {
  try {
    const res = await request.get('/api/talent/dashboard')
    if (res.code === '200') {
      stats.value.totalCount = res.data.totalCount
      stats.value.avgCs = res.data.avgCs
      stats.value.avgMed = res.data.avgMed
      
      await nextTick()
      initPieChart(res.data.pieData)
      initScatterChart(res.data.scatterData)
    }
  } catch (e) {
    console.error(e)
  }
}

// 监听窗口大小变化，图表自适应
window.addEventListener('resize', () => {
  pieChart?.resize()
  scatterChart?.resize()
})

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.home-container {
  padding: 0;
}
.welcome-banner {
  background: linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%);
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
.banner-img { width: 120px; height: 120px; object-fit: contain; }

.data-card { text-align: center; border-radius: 8px; }
.card-title { color: #909399; font-size: 14px; margin-bottom: 10px; }
.card-num { font-size: 32px; font-weight: bold; margin-bottom: 5px; }
.card-desc { font-size: 12px; color: #C0C4CC; }

.chart-header { font-weight: bold; color: #303133; }
</style>
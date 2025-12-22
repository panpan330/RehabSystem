<template>
  <div class="dashboard-container">
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="6" v-for="item in statsCards" :key="item.title">
        <el-card shadow="hover" :body-style="{ padding: '20px' }">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 14px; color: #909399;">{{ item.title }}</div>
              <div style="font-size: 24px; font-weight: bold; margin-top: 10px; color: #303133;">
                {{ item.value }}
              </div>
            </div>
            <el-icon :size="40" :color="item.color">
              <component :is="item.icon" />
            </el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">📊 人才类型分布 (宏观决策)</div>
          </template>
          <div id="pieChart" style="height: 350px;"></div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">📈 平均能力水平</div>
          </template>
          <div id="barChart" style="height: 350px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios' // 记得引入 axios
import { User, Trophy, Reading, DataAnalysis } from '@element-plus/icons-vue'

// 响应式数据
const statsCards = ref([
  { title: '人才总数', value: '...', icon: User, color: '#409EFF' },
  { title: '卓越交叉人才', value: '...', icon: Trophy, color: '#67C23A' },
  { title: '平均 CS 分数', value: '...', icon: Reading, color: '#E6A23C' },
  { title: '平均医学分数', value: '...', icon: DataAnalysis, color: '#F56C6C' },
])

// 初始化图表
let pieChart = null
let barChart = null

const initCharts = (data) => {
  // 1. 饼图 (使用后端返回的 typeDistribution)
  const pieDom = document.getElementById('pieChart')
  if (pieChart) pieChart.dispose()
  pieChart = echarts.init(pieDom)
  
  // 构造饼图数据
  const pieData = []
  for (const [key, val] of Object.entries(data.typeDistribution)) {
      pieData.push({ value: val, name: key })
  }

  pieChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%' },
    series: [{
      name: '人才分布',
      type: 'pie',
      radius: ['40%', '70%'],
      data: pieData,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}: {c}人' }
    }]
  })

  // 2. 柱状图 (平均分对比)
  const barDom = document.getElementById('barChart')
  if (barChart) barChart.dispose()
  barChart = echarts.init(barDom)
  
  barChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['平均计算机分', '平均医学分'] },
    yAxis: { type: 'value', max: 100 },
    series: [
      {
        type: 'bar',
        barWidth: '40%',
        data: [data.avgCsScore, data.avgMedScore],
        itemStyle: { 
            color: (params) => {
                return params.dataIndex === 0 ? '#409EFF' : '#F56C6C'
            },
            borderRadius: [5, 5, 0, 0] 
        }
      }
    ]
  })
}

// 获取后端统计数据
const fetchStats = async () => {
  try {
    const res = await axios.get('http://localhost:9090/api/stats/summary')
    const data = res.data
    
    // 更新卡片数字
    statsCards.value[0].value = data.totalTalent
    statsCards.value[1].value = data.typeDistribution['卓越交叉型'] || 0
    statsCards.value[2].value = data.avgCsScore
    statsCards.value[3].value = data.avgMedScore
    
    // 更新图表
    initCharts(data)
  } catch (error) {
    console.error("获取统计失败", error)
  }
}

onMounted(() => {
  // 页面加载后请求数据
  fetchStats()
})
</script>

<style scoped>
.dashboard-container { padding: 0px; }
.card-header { font-weight: bold; font-size: 16px; }
</style>
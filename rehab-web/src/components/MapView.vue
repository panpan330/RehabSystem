<template>
  <div class="map-container">
    <el-card shadow="never" class="map-card">
      <template #header>
        <div class="card-header">
          <span>🌍 人才时空分布图 (实时数据库)</span>
          <div>
            <el-button type="primary" size="small" @click="fetchData">🔄 刷新位置</el-button>
          </div>
        </div>
      </template>
      <div id="chinaMap" style="width: 100%; height: 600px;"></div>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import request from '../utils/request' // ⭐ 引入 request 获取真数据
import { ElMessage } from 'element-plus'

let myChart = null

const initMap = (talentData) => {
  const chartDom = document.getElementById('chinaMap')
  if (myChart) myChart.dispose()
  myChart = echarts.init(chartDom)

  // 1. 处理后端数据，转换成 ECharts 格式
  // 过滤掉没有经纬度的人
  const mapData = talentData
    .filter(item => item.lng && item.lat)
    .map(item => {
      return {
        name: item.name,
        value: [item.lng, item.lat, item.csScore + item.medScore] // 第3个值用作气泡大小参考
      }
    })

  const option = {
    backgroundColor: '#0E1C2F',
    title: {
      text: `共监控 ${mapData.length} 位人才位置`,
      left: 'center',
      textStyle: { color: '#fff' }
    },
    tooltip: {
      trigger: 'item',
      formatter: function (params) {
        // params.data.value[2] 是我们存的总分
        return `<div style="font-weight:bold">${params.name}</div>坐标: [${params.value[0].toFixed(2)}, ${params.value[1].toFixed(2)}]`
      }
    },
    geo: {
      map: 'china',
      roam: true,
      label: { emphasis: { show: false } },
      itemStyle: {
        normal: { areaColor: '#142957', borderColor: '#0692a4' },
        emphasis: { areaColor: '#0b1c2d' }
      }
    },
    series: [
      {
        name: '人才',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        data: mapData,
        symbolSize: 10,
        rippleEffect: { brushType: 'stroke' },
        label: { formatter: '{b}', position: 'right', show: true, color: '#fff' },
        itemStyle: { color: '#f4e925', shadowBlur: 10, shadowColor: '#333' },
      }
    ]
  };

  // 2. 加载地图 JSON (这里还是用在线数据，为了保证显示)
  fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
    .then(res => res.json())
    .then(geoJson => {
      echarts.registerMap('china', geoJson);
      myChart.setOption(option);
    })
    .catch(() => {
      // 离线保底方案：虽然没地图轮廓，但点还在
      myChart.setOption(option); 
    });
}

// ⭐ 获取真实数据
const fetchData = async () => {
  try {
    const res = await request.get('/api/talent/list')
    if (res.code === '200') {
        initMap(res.data)
        ElMessage.success('位置数据已同步')
    }
  } catch (e) {
    ElMessage.error('获取失败')
  }
}

const resizeHandler = () => myChart?.resize()

onMounted(() => {
  fetchData()
  window.addEventListener('resize', resizeHandler)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeHandler)
  myChart?.dispose()
})
</script>

<style scoped>
.map-container { padding: 0; }
.map-card { border: none; background: #0E1C2F; }
.card-header { color: white; display: flex; justify-content: space-between; align-items: center;}
</style>
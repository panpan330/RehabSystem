<template>
  <div class="map-container" v-loading="loading">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span style="font-weight: bold;">🌍 康复人才时空轨迹监控</span>
          <el-tag type="success">实时数据</el-tag>
        </div>
      </template>
      
      <div id="chinaMap" style="width: 100%; height: 600px;"></div>
      
      <div style="margin-top: 20px; font-size: 12px; color: #666;">
        <p>💡 图例说明：📍 红色图标代表合作基地（医院/实验室） | 🖱️ 鼠标悬停可查看基地详情</p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const bases = ref([]) // 存储从后端拿到的基地数据
let myChart = null

// 1. 获取后端数据 (通过 Service 层查出来的)
const fetchBases = async () => {
  try {
    const res = await axios.get('http://localhost:9090/api/location/bases')
    bases.value = res.data
  } catch (e) {
    ElMessage.error('获取基地数据失败')
  }
}

// 2. 初始化地图
const initMap = async () => {
  loading.value = true
  const chartDom = document.getElementById('chinaMap')
  myChart = echarts.init(chartDom)
  myChart.showLoading()

  try {
    // 🌍 关键点：从阿里云获取中国地图 JSON (免下载文件)
    const mapRes = await axios.get('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
    echarts.registerMap('china', mapRes.data)
    
    myChart.hideLoading()
    renderChart()
  } catch (e) {
    ElMessage.error('地图加载失败，请检查网络')
    myChart.hideLoading()
  } finally {
    loading.value = false
  }
}

// 3. 渲染图表数据
const renderChart = () => {
  // 把后端数据转换成 ECharts 需要的格式
  // 格式: { name: '基地名', value: [经度, 纬度, 原始对象] }
  const scatterData = bases.value.map(item => {
    return {
      name: item.name,
      value: [item.longitude, item.latitude, item.capacity], // value的前两项必须是经纬度
      raw: item // 把整个对象存进去方便 tooltip 读取
    }
  })

  const option = {
    backgroundColor: '#f0f2f5',
    title: {
      text: '全国实习与科研基地分布',
      left: 'center',
      top: 20
    },
    tooltip: {
      trigger: 'item',
      formatter: function (params) {
        // 鼠标悬停显示的详情
        const info = params.data.raw
        return `
          <div style="font-weight:bold">${info.name}</div>
          <div>类型：${info.type === 'HOSPITAL' ? '🏥 附属医院' : '🧪 科研实验室'}</div>
          <div>地址：${info.address}</div>
          <div>容纳人数：${info.capacity} 人</div>
          <div style="color:#aaa; font-size:11px; margin-top:5px;">${info.description || ''}</div>
        `
      }
    },
    geo: {
      map: 'china',
      roam: true, // 允许缩放和平移
      zoom: 1.2,
      label: { show: false }, // 不显示省份名字，太乱
      itemStyle: {
        areaColor: '#e0e0e0', // 地图底色
        borderColor: '#ffffff',
        borderWidth: 1
      },
      emphasis: {
        itemStyle: { areaColor: '#d9d9d9' }
      }
    },
    series: [
      {
        name: '基地',
        type: 'scatter', // 散点图
        coordinateSystem: 'geo',
        data: scatterData,
        symbol: 'pin', // 图标形状：大头针
        symbolSize: 20,
        itemStyle: {
          color: '#F56C6C', // 红色插旗
          shadowBlur: 10,
          shadowColor: '#333'
        },
        // 让大头针有动画效果
        rippleEffect: { brushType: 'stroke' },
        emphasis: {
          scale: 1.5 // 鼠标放上去变大
        }
      },
      {
        // 加一个涟漪动画效果，高亮显示
        name: 'Top 5',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        data: scatterData,
        symbolSize: 15,
        showEffectOn: 'render',
        rippleEffect: {
          brushType: 'stroke'
        },
        itemStyle: {
          color: '#409EFF',
          shadowBlur: 10,
          shadowColor: '#333'
        },
        zlevel: 1
      }
    ]
  }

  myChart.setOption(option)
}

onMounted(async () => {
  await fetchBases() // 先查数据
  await nextTick()
  initMap() // 再画图
  
  // 窗口大小改变时自动重绘
  window.addEventListener('resize', () => myChart && myChart.resize())
})
</script>

<style scoped>
.map-container {
  width: 100%;
}
</style>
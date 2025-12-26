<template>
  <div class="map-container">
    <el-card shadow="never" class="map-card">
      <template #header>
        <div class="card-header">
          <span>🌍 人才时空分布图 (模拟数据演示)</span>
          <el-tag type="success">实时监控</el-tag>
        </div>
      </template>
      <div id="chinaMap" style="width: 100%; height: 600px;"></div>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
// 引入中国地图数据 (需要先安装 npm install echarts-extension-amap 或者直接引入 json)
// 为了最简单，我们使用在线 JSON 方式，或者 ECharts 内置的 geo 坐标系简易版

// ⭐ 如果你没有 china.json，ECharts 默认没法画地图轮廓。
// 我们这里用一种“散点图 + 百度地图底图”的混合模式，或者简单的“地理坐标系”
// 鉴于环境限制，我们先做一个“模拟雷达扫描”的效果，不需要下载地图包也能跑。

let myChart = null

const initMap = () => {
  const chartDom = document.getElementById('chinaMap')
  myChart = echarts.init(chartDom)

  // 模拟的人才数据：[经度, 纬度, 强度]
  const data = [
    { name: '北京总部', value: [116.407526, 39.90403, 100] },
    { name: '上海分部', value: [121.473701, 31.230416, 80] },
    { name: '武汉研发中心', value: [114.305393, 30.593099, 60] },
    { name: '深圳实验室', value: [114.057868, 22.543099, 90] },
    { name: '成都办事处', value: [104.066541, 30.572269, 50] }
  ]

  const option = {
    backgroundColor: '#0E1C2F', // 深色背景，显高级
    title: {
      text: '全国人才分布热力图',
      left: 'center',
      textStyle: { color: '#fff' }
    },
    tooltip: {
      trigger: 'item',
      formatter: function (params) {
        return `${params.name}<br/>人才密度: ${params.value[2]}`
      }
    },
    // 地理坐标系组件
    geo: {
      map: 'china', // ⭐ 注意：这需要引入中国地图数据。如果没有，图表会不显示地图轮廓
      roam: true,
      label: { emphasis: { show: false } },
      itemStyle: {
        normal: {
          areaColor: '#142957',
          borderColor: '#0692a4'
        },
        emphasis: {
          areaColor: '#0b1c2d'
        }
      }
    },
    series: [
      {
        name: '人才分布',
        type: 'effectScatter', // 带有涟漪特效动画的散点（气泡）
        coordinateSystem: 'geo',
        data: data,
        symbolSize: function (val) {
          return val[2] / 4;
        },
        encode: {
          value: 2
        },
        showEffectOn: 'render',
        rippleEffect: {
          brushType: 'stroke'
        },
        label: {
          formatter: '{b}',
          position: 'right',
          show: true
        },
        itemStyle: {
          color: '#f4e925',
          shadowBlur: 10,
          shadowColor: '#333'
        },
        zlevel: 1
      }
    ]
  };

  // ⭐ 关键点：因为我们没有下载 china.json，ECharts 可能画不出底图。
  // 为了保证你能看到东西，我们这里做一个“注册地图”的动作。
  // 必须先获取地图 JSON。
  
  // 临时方案：从网上拉取 GeoJSON (需要联网)
  fetch('https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json')
    .then(response => response.json())
    .then(geoJson => {
      echarts.registerMap('china', geoJson);
      myChart.setOption(option);
    })
    .catch(err => {
      console.error('地图加载失败', err)
      // 如果加载失败，给个保底提示
      chartDom.innerHTML = '<div style="color:white; text-align:center; padding-top:200px;">地图数据加载失败，请检查网络</div>'
    });
}

const resizeHandler = () => myChart?.resize()

onMounted(() => {
  initMap()
  window.addEventListener('resize', resizeHandler)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeHandler)
  myChart?.dispose()
})
</script>

<style scoped>
.map-container { padding: 0; }
.map-card { border: none; background: #0E1C2F; } /* 让卡片背景也变黑 */
.card-header { color: white; display: flex; justify-content: space-between; align-items: center;}
</style>
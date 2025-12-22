<template>
  <div style="max-width: 600px; margin: 0 auto;">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span style="font-weight: bold;">⚙️ 智能诊断规则配置</span>
          <el-button type="primary" @click="saveConfig" :loading="loading">保存修改</el-button>
        </div>
      </template>

      <el-form :model="form" label-width="180px" style="margin-top: 20px;">
        <el-alert 
          title="修改这里的数值将实时影响全系统的 AI 诊断逻辑" 
          type="info" 
          show-icon 
          :closable="false" 
          style="margin-bottom: 20px;" 
        />

        <el-form-item label="计算机优秀阈值 (CS)">
          <el-input-number v-model="form.cs_threshold" :min="0" :max="100" />
          <span style="margin-left: 10px; color: #909399; font-size: 12px;">默认 70 分</span>
        </el-form-item>

        <el-form-item label="医学优秀阈值 (Med)">
          <el-input-number v-model="form.med_threshold" :min="0" :max="100" />
          <span style="margin-left: 10px; color: #909399; font-size: 12px;">默认 70 分</span>
        </el-form-item>
        
        <el-divider />
        
        <div style="font-size: 13px; color: #606266; line-height: 2;">
          <strong>当前规则预览：</strong><br>
          1. 卓越交叉型：CS > {{ form.cs_threshold }} 且 Med > {{ form.med_threshold }}<br>
          2. 技术驱动型：CS > Med + 20<br>
          3. 临床应用型：Med > CS + 20
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const form = ref({
  cs_threshold: 70,
  med_threshold: 70
})

// 加载配置
const loadConfig = async () => {
  try {
    const res = await axios.get('http://localhost:9090/api/config/all')
    form.value = res.data
  } catch (e) {
    ElMessage.error('加载配置失败')
  }
}

// 保存配置
const saveConfig = async () => {
  loading.value = true
  try {
    await axios.post('http://localhost:9090/api/config/update', form.value)
    ElMessage.success('规则已更新！AI 诊断标准已改变。')
    // 保存后，通知父组件或者强制刷新，这里简单处理，下次打开弹窗生效
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadConfig()
})
</script>
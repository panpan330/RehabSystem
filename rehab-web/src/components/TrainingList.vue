<template>
  <div class="training-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>📋 全院培训计划列表</span>
            <el-tag type="info" style="margin-left: 10px;">实时监控</el-tag>
          </div>
          
          <div v-if="isAdmin" class="header-right">
             <el-button type="primary" plain :icon="Setting" @click="openConfigDialog">配置智能指派规则</el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="talentName" label="受训人" width="120">
            <template #default="scope"><span style="font-weight: bold;">{{ scope.row.talentName || '未知' }}</span></template>
        </el-table-column>
        <el-table-column prop="courseName" label="课程名称" min-width="180" />
        <el-table-column prop="status" label="当前状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)" effect="light">{{ getStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="指派时间" width="180">
           <template #default="scope">{{ formatDate(scope.row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right" v-if="isAdmin">
           <template #default="scope">
               <el-popconfirm title="确定移除该任务？" @confirm="handleDelete(scope.row.id)">
                   <template #reference><el-button link type="danger" size="small">移除</el-button></template>
               </el-popconfirm>
           </template>
        </el-table-column>
      </el-table>
      
      <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
          <el-pagination background layout="prev, pager, next" :total="tableData.length" />
      </div>
    </el-card>

    <el-dialog v-model="configDialogVisible" title="⚙️ AI 智能指派规则配置" width="500px">
      <el-form :model="configForm" label-width="120px">
        <el-alert title="系统将根据分数阈值自动为人才推荐课程" type="info" :closable="false" style="margin-bottom: 20px;" />
        <el-form-item label="计算机分数阈值">
           <el-input-number v-model="configForm.csThreshold" :min="0" :max="100" />
           <div class="tips">低于此分数的将被推荐 CS 基础课</div>
        </el-form-item>
        <el-form-item label="医学分数阈值">
           <el-input-number v-model="configForm.medThreshold" :min="0" :max="100" />
           <div class="tips">低于此分数的将被推荐医学基础课</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="configDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveConfig">保存规则</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../utils/request'
import { Setting } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const loading = ref(false)
const tableData = ref([])
const configDialogVisible = ref(false)
const configForm = ref({ csThreshold: 60, medThreshold: 60 })

// ⭐ 权限判断逻辑
const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
// 确保比较时不会因为 null 报错
const isAdmin = userInfo && userInfo.role === 'ADMIN'

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const res = await request.get('/api/training/list') 
    if (res.code === '200') {
        tableData.value = res.data
    }
  } catch (e) { console.error(e) } 
  finally { loading.value = false }
}

const getStatusType = (status) => {
    if (status === 'DONE') return 'success'
    if (status === 'IN_PROGRESS') return 'primary'
    return 'warning'
}
const getStatusText = (status) => {
    if (status === 'DONE') return '已完成'
    if (status === 'IN_PROGRESS') return '进行中'
    return '待开始'
}
const formatDate = (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'

const openConfigDialog = () => { configDialogVisible.value = true }

const saveConfig = async () => {
    ElMessage.success('规则已更新')
    configDialogVisible.value = false
}

const handleDelete = async (id) => {
    await request.delete(`/api/training/delete/${id}`)
    ElMessage.success('删除成功')
    fetchData()
}

onMounted(() => {
    console.log('当前登录用户:', userInfo)
    console.log('是否为管理员 (isAdmin):', isAdmin)
    fetchData()
})
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.tips { font-size: 12px; color: #909399; margin-top: 5px; }
</style>
<template>
  <div class="asset-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>🎒 康复设备资源库</span>
          <el-button v-if="isAdmin" type="primary" :icon="Plus" @click="dialogVisible = true">录入新设备</el-button>
        </div>
      </template>

      <el-table :data="tableData" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="deviceName" label="设备名称" width="180">
           <template #default="scope"><span style="font-weight: bold">{{ scope.row.deviceName }}</span></template>
        </el-table-column>
        <el-table-column prop="deviceCode" label="资产编号" width="150" />
        
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
            <span v-if="scope.row.status === 'BORROWED' && isAdmin" style="font-size: 12px; color: #999; margin-left: 5px;">
               (借用人ID: {{ scope.row.borrowerId }})
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            
            <el-button 
                v-if="scope.row.status === 'IDLE' && !isAdmin" 
                size="small" type="success" plain 
                @click="handleBorrow(scope.row)">
                ✋ 申请借用
            </el-button>

            <template v-if="isAdmin">
                <el-button v-if="scope.row.status === 'BORROWED'" size="small" type="warning" plain @click="handleReturn(scope.row)">强制归还</el-button>
                <el-popconfirm title="确定报废该设备？" @confirm="handleDelete(scope.row.id)">
                   <template #reference><el-button size="small" type="danger" plain>报废</el-button></template>
                </el-popconfirm>
            </template>

          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="录入新设备" width="400px">
      <el-form :model="form">
        <el-form-item label="设备名称"><el-input v-model="form.deviceName" /></el-form-item>
        <el-form-item label="资产编号"><el-input v-model="form.deviceCode" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdd">确认入库</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../utils/request'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const tableData = ref([])
const dialogVisible = ref(false)
const form = ref({ deviceName: '', deviceCode: '' })

// 权限控制
const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const isAdmin = userInfo.role === 'ADMIN'
const currentUserId = userInfo.id

const fetchData = async () => {
  const res = await request.get('/api/asset/list')
  tableData.value = res.data
}

const getStatusType = (status) => {
  if (status === 'IDLE') return 'success'
  if (status === 'BORROWED') return 'warning'
  return 'info'
}

const getStatusText = (status) => {
  if (status === 'IDLE') return '✅ 空闲中'
  if (status === 'BORROWED') return '🔒 借用中'
  return status
}

// 借用逻辑
const handleBorrow = async (row) => {
    try {
        await request.post('/api/asset/borrow', { assetId: row.id, userId: currentUserId })
        ElMessage.success('借用成功，请在个人中心查看！')
        fetchData()
    } catch(e) { ElMessage.error('借用失败') }
}

// 归还逻辑 (管理员强制归还)
const handleReturn = async (row) => {
    try {
        await request.post('/api/asset/return', { assetId: row.id })
        ElMessage.success('设备已归还入库')
        fetchData()
    } catch(e) { ElMessage.error('操作失败') }
}

const submitAdd = async () => {
  await request.post('/api/asset/add', form.value)
  dialogVisible.value = false
  fetchData()
}

const handleDelete = async (id) => {
  await request.delete(`/api/asset/delete/${id}`)
  fetchData()
}

onMounted(() => fetchData())
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
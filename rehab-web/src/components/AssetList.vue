<template>
  <el-card shadow="hover">
    <template #header>
      <div class="card-header">
        <div style="display: flex; align-items: center;">
          <span style="font-weight: bold; margin-right: 10px;">📦 康复资产与设备管理</span>
          <el-tag type="info" round size="small">库存: {{ tableData.length }}</el-tag>
        </div>
        <div>
          <el-button type="warning" :icon="Download" @click="exportAssetExcel">导出台账</el-button>

          <el-button 
            v-if="isAdmin" 
            type="success" 
            :icon="Plus" 
            @click="openDialog()"
          >
            设备入库
          </el-button>
          <el-button type="primary" :icon="Refresh" @click="fetchData">刷新库存</el-button>
        </div>
      </div>
    </template>

    <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
      <el-table-column prop="deviceCode" label="资产编号" width="120" />
      <el-table-column prop="deviceName" label="设备名称" min-width="150" />
      
      <el-table-column prop="categoryName" label="分类" width="130">
        <template #default="scope">
          <el-tag effect="plain">{{ scope.row.categoryName || '未知分类' }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="price" label="单价" width="120">
        <template #default="scope">
          ¥ {{ scope.row.price }}
        </template>
      </el-table-column>

      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'IDLE' ? 'success' : 'danger'">
            {{ scope.row.status === 'IDLE' ? '空闲' : '已借出' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="220" fixed="right">
        <template #default="scope">
          <span v-if="scope.row.status === 'IDLE'">
            <el-button size="small" type="primary" @click="handleAction(scope.row.id, 'borrow')">借用</el-button>
          </span>
          <span v-else>
            <el-button size="small" type="warning" plain @click="handleAction(scope.row.id, 'return')">归还</el-button>
          </span>

          <span v-if="isAdmin" style="margin-left: 10px;">
            <el-button size="small" type="info" link :icon="Edit" @click="openDialog(scope.row)"></el-button>
            
            <el-popconfirm title="确定要报废该设备吗？" @confirm="handleDelete(scope.row.id)">
              <template #reference>
                <el-button size="small" type="danger" link :icon="Delete"></el-button>
              </template>
            </el-popconfirm>
          </span>

        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑设备信息' : '新设备入库'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="设备名称">
          <el-input v-model="form.deviceName" placeholder="例如：下肢外骨骼机器人" />
        </el-form-item>
        <el-form-item label="资产编号">
          <el-input v-model="form.deviceCode" placeholder="例如：EXO-2025-001" />
        </el-form-item>
        <el-form-item label="设备分类">
          <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%">
            <el-option label="外骨骼机器人" :value="1" />
            <el-option label="生物传感器" :value="2" />
            <el-option label="VR/AR设备" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="采购单价">
          <el-input-number v-model="form.price" :precision="2" :step="1000" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定入库</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { Refresh, Plus, Edit, Delete, Download } from '@element-plus/icons-vue' // 引入 Download

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const form = ref({ id: null, deviceName: '', deviceCode: '', categoryId: 1, price: 0 })

// 获取当前用户角色，用于前端权限控制
const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
const isAdmin = computed(() => userInfo.role === 'ADMIN')

const fetchData = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:9090/api/asset/list')
    tableData.value = res.data
  } catch (error) { ElMessage.error('获取资产数据失败') } 
  finally { loading.value = false }
}

// ⭐ 新增：资产导出 Excel 逻辑
const exportAssetExcel = () => {
  window.location.href = 'http://localhost:9090/api/excel/export/asset'
  ElMessage.success('正在下载资产台账...')
}

const handleAction = async (id, action) => {
  try {
    await axios.post(`http://localhost:9090/api/asset/${action}/${id}`)
    ElMessage.success(action === 'borrow' ? '借用成功' : '归还成功')
    fetchData()
  } catch (e) { ElMessage.error('操作失败') }
}

const openDialog = (row = null) => {
  if (row) {
    form.value = { ...row }
  } else {
    form.value = { id: null, deviceName: '', deviceCode: '', categoryId: 1, price: 0 }
  }
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!form.value.deviceName) return ElMessage.warning('请输入设备名称')
  try {
    if (form.value.id) {
      await axios.put('http://localhost:9090/api/asset/update', form.value)
      ElMessage.success('信息更新成功')
    } else {
      await axios.post('http://localhost:9090/api/asset/add', form.value)
      ElMessage.success('入库成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch (e) { ElMessage.error('操作失败') }
}

const handleDelete = async (id) => {
  try {
    await axios.delete(`http://localhost:9090/api/asset/delete/${id}`)
    ElMessage.success('设备已报废删除')
    fetchData()
  } catch (e) { ElMessage.error('删除失败') }
}

onMounted(() => {
  fetchData()
})
</script>
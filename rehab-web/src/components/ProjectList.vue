<template>
  <div class="project-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>🔬 科研项目管理</span>
          <el-button type="primary" @click="openAddDialog">立项申请</el-button>
        </div>
      </template>

      <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="项目名称" min-width="180" />
        <el-table-column prop="principal" label="负责人" width="100" />
        <el-table-column prop="totalBudget" label="经费(万)" width="100" />
        
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'ONGOING' ? 'success' : 'info'">
              {{ scope.row.status === 'ONGOING' ? '进行中' : '已结题' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="周期" width="200">
           <template #default="scope">
              {{ formatDate(scope.row.startDate) }} 至 {{ formatDate(scope.row.endDate) }}
           </template>
        </el-table-column>

        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-popconfirm title="确定删除该项目？" @confirm="handleDelete(scope.row.id)">
               <template #reference><el-button link type="danger" size="small">删除</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑项目' : '立项申请'" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="项目名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="负责人"><el-input v-model="form.principal" /></el-form-item>
        <el-form-item label="总经费"><el-input-number v-model="form.totalBudget" :precision="2" /></el-form-item>
        <el-form-item label="起止时间">
           <el-date-picker 
              v-model="dateRange" 
              type="daterange" 
              range-separator="至" 
              start-placeholder="开始" 
              end-placeholder="结束" 
              value-format="YYYY-MM-DD"
           />
        </el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import request from '../utils/request'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const form = ref({})
const dateRange = ref([])

const fetchData = async () => {
  loading.value = true
  try {
    const res = await request.get('/api/project/list')
    if (res.code === '200') {
      tableData.value = res.data
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  form.value = { status: 'ONGOING' }
  dateRange.value = []
  dialogVisible.value = true
}

const handleEdit = (row) => {
  form.value = { ...row }
  // 回显日期
  if (row.startDate && row.endDate) {
      dateRange.value = [row.startDate, row.endDate]
  } else {
      dateRange.value = []
  }
  dialogVisible.value = true
}

const handleDelete = async (id) => {
    // ⭐ 安全判断：防止 undefined 传给后端
    if (!id) return ElMessage.warning('数据ID异常')
    await request.delete(`/api/project/delete/${id}`)
    ElMessage.success('删除成功')
    fetchData()
}

const submitForm = async () => {
  // 处理日期
  if (dateRange.value && dateRange.value.length === 2) {
      form.value.startDate = dateRange.value[0]
      form.value.endDate = dateRange.value[1]
  }

  try {
      if (form.value.id) {
          await request.put('/api/project/update', form.value)
      } else {
          await request.post('/api/project/add', form.value)
      }
      ElMessage.success('操作成功')
      dialogVisible.value = false
      fetchData()
  } catch(e) {
      ElMessage.error('操作失败')
  }
}

const formatDate = (str) => str ? dayjs(str).format('YYYY-MM-DD') : '-'

onMounted(() => fetchData())
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
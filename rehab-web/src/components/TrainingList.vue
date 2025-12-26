<template>
  <el-card shadow="hover">
    <template #header>
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center;">
          <span style="font-weight: bold; margin-right: 10px;">🎓 全院培训监控中心</span>
          <el-tag type="warning" round size="small">进行中: {{ activeCount }}</el-tag>
        </div>
        <div>
          <el-button type="success" :icon="Plus" @click="openDialog()">直接指派</el-button>
          <el-button type="primary" :icon="Refresh" @click="fetchData">刷新列表</el-button>
        </div>
      </div>
    </template>

    <el-table :data="tableData" stripe style="width: 100%" v-loading="loading" border>
      <el-table-column prop="id" label="编号" width="80" />
      
      <el-table-column prop="talentName" label="受训人才" width="120">
        <template #default="scope">
          <el-tag effect="dark">{{ scope.row.talentName || '未知' }}</el-tag>
        </template>
      </el-table-column>
      
      <el-table-column prop="courseName" label="培训课程" min-width="150">
         <template #default="scope">
             <span style="font-weight: bold">{{ scope.row.courseName }}</span>
         </template>
      </el-table-column>
      
      <el-table-column prop="status" label="状态 (点击切换)" width="180">
        <template #default="scope">
          <el-tooltip content="点击切换状态" placement="top">
            <el-tag 
              style="cursor: pointer"
              :type="getStatusType(scope.row.status)"
              @click="toggleStatus(scope.row)"
            >
              {{ getStatusText(scope.row.status) }}
              <el-icon><Refresh /></el-icon>
            </el-tag>
          </el-tooltip>
        </template>
      </el-table-column>
      
      <el-table-column prop="createTime" label="下达时间" width="180">
        <template #default="scope">
           {{ scope.row.createTime ? scope.row.createTime.replace('T', ' ').split('.')[0] : '' }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="150" fixed="right">
        <template #default="scope">
          <el-button size="small" type="primary" link :icon="Edit" @click="openDialog(scope.row)">编辑</el-button>
          <el-popconfirm title="确定撤销该任务吗？" @confirm="handleDelete(scope.row.id)">
            <template #reference>
              <el-button size="small" type="danger" link :icon="Delete">撤销</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑任务' : '指派新任务'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="受训人才">
          <el-select 
            v-model="form.talentId" 
            placeholder="请选择人才" 
            style="width: 100%" 
            :disabled="!!form.id"
            filterable
          >
            <el-option v-for="person in talentList" :key="person.id" :label="person.name" :value="person.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="课程名称">
          <el-input v-model="form.courseName" placeholder="例如：医学伦理学基础" />
        </el-form-item>
        <el-form-item label="进度状态">
          <el-radio-group v-model="form.status">
            <el-radio-button label="TO_DO">待开始</el-radio-button>
            <el-radio-button label="IN_PROGRESS">进行中</el-radio-button>
            <el-radio-button label="DONE">已完成</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import request from '../utils/request' // ⭐ 改用 request 工具
import { ElMessage } from 'element-plus'
import { Refresh, Plus, Edit, Delete } from '@element-plus/icons-vue'

const loading = ref(false)
const tableData = ref([])
const talentList = ref([])
const dialogVisible = ref(false)
const form = ref({ id: null, talentId: null, courseName: '', status: 'TO_DO' })

const activeCount = computed(() => tableData.value.filter(i => i.status === 'IN_PROGRESS').length)

// 1. 获取培训列表 (适配 Result 格式)
const fetchData = async () => {
  loading.value = true
  try {
    const res = await request.get('/api/training/all')
    if (res.code === '200') {
        tableData.value = res.data
    } else {
        ElMessage.error(res.msg || '列表获取失败')
    }
  } catch (e) { ElMessage.error('网络异常') } 
  finally { loading.value = false }
}

const fetchTalents = async () => {
  try {
    const res = await request.get('/api/talent/list')
    if (res.code === '200') talentList.value = res.data
  } catch (e) { console.error(e) }
}

// 2. 状态切换
const getStatusType = (status) => {
  if (status === 'DONE') return 'success'
  if (status === 'IN_PROGRESS') return 'primary'
  return 'info'
}
const getStatusText = (status) => {
  if (status === 'DONE') return '已完成'
  if (status === 'IN_PROGRESS') return '进行中'
  return '待开始'
}
const toggleStatus = async (row) => {
  let nextStatus = 'TO_DO'
  if (row.status === 'TO_DO') nextStatus = 'IN_PROGRESS'
  else if (row.status === 'IN_PROGRESS') nextStatus = 'DONE'
  else return 
  
  try {
    // 调用 updateStatus 接口
    const res = await request.post('/api/training/update-status', {
      id: row.id,
      status: nextStatus
    })
    if (res.code === '200') {
        row.status = nextStatus
        ElMessage.success('状态已更新')
    }
  } catch(e) { ElMessage.error('更新失败') }
}

// 3. 弹窗操作
const openDialog = (row = null) => {
  if (row) {
    form.value = { id: row.id, talentId: row.talentId, courseName: row.courseName, status: row.status }
  } else {
    form.value = { id: null, talentId: null, courseName: '', status: 'TO_DO' }
  }
  if (talentList.value.length === 0) fetchTalents()
  dialogVisible.value = true
}

// 4. 提交
const submitForm = async () => {
  if (!form.value.talentId || !form.value.courseName) return ElMessage.warning('请填写完整')
  try {
    if (form.value.id) {
      await request.put('/api/training/update', form.value)
      ElMessage.success('更新成功')
    } else {
      await request.post('/api/training/add', form.value)
      ElMessage.success('指派成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch (e) { ElMessage.error('操作失败') }
}

const handleDelete = async (id) => {
  try {
    await request.delete(`/api/training/delete/${id}`)
    ElMessage.success('删除成功')
    fetchData()
  } catch (e) { ElMessage.error('删除失败') }
}

onMounted(() => {
  fetchData()
})
</script>
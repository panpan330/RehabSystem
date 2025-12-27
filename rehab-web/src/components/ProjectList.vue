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
        <el-table-column prop="name" label="项目名称" min-width="150" />
        <el-table-column prop="principal" label="负责人" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'ONGOING' ? 'success' : 'info'">
              {{ scope.row.status === 'ONGOING' ? '进行中' : '已结题' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="周期" width="200">
           <template #default="scope">{{ formatDate(scope.row.startDate) }} 至 {{ formatDate(scope.row.endDate) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button link type="primary" size="small" @click="openMemberDialog(scope.row)">👥 成员</el-button>
            <el-button link type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-popconfirm title="确定删除？" @confirm="handleDelete(scope.row.id)">
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
           <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" range-separator="至" start-placeholder="开始" end-placeholder="结束" />
        </el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" type="textarea" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="memberDialogVisible" title="项目成员管理" width="600px">
       <div style="margin-bottom: 20px; display: flex; gap: 10px;">
          <el-select v-model="newMemberId" placeholder="选择人才" style="width: 200px" filterable>
             <el-option v-for="t in allTalents" :key="t.id" :label="t.name" :value="t.id">
                <span style="float: left">{{ t.name }}</span>
                <span style="float: right; color: #8492a6; font-size: 13px">{{ t.role }}</span>
             </el-option>
          </el-select>
          <el-input v-model="newMemberRole" placeholder="担任角色 (如: 算法工程师)" style="width: 200px" />
          <el-button type="primary" @click="addMember">添加</el-button>
       </div>

       <el-table :data="memberList" border style="width: 100%" height="300">
          <el-table-column prop="talentName" label="姓名" width="120" />
          <el-table-column prop="role_in_proj" label="项目角色" />
          <el-table-column label="操作" width="100">
             <template #default="scope">
                <el-button link type="danger" size="small" @click="removeMember(scope.row.id)">移除</el-button>
             </template>
          </el-table-column>
       </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../utils/request'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const form = ref({})
const dateRange = ref([])

// 成员管理相关
const memberDialogVisible = ref(false)
const currentProjectId = ref(null)
const memberList = ref([])
const allTalents = ref([]) // 所有可选的人才
const newMemberId = ref(null)
const newMemberRole = ref('')

const fetchData = async () => {
  loading.value = true
  try {
    const res = await request.get('/api/project/list')
    if (res.code === '200') tableData.value = res.data
  } catch (e) { console.error(e) } finally { loading.value = false }
}

// 打开成员弹窗
const openMemberDialog = async (row) => {
    currentProjectId.value = row.id
    memberDialogVisible.value = true
    newMemberId.value = null
    newMemberRole.value = ''
    
    // 1. 获取当前成员
    fetchMembers()
    // 2. 获取所有人才列表 (供下拉选择)
    const res = await request.get('/api/talent/list')
    if (res.code === '200') allTalents.value = res.data
}

const fetchMembers = async () => {
    const res = await request.get(`/api/project/members/${currentProjectId.value}`)
    if (res.code === '200') memberList.value = res.data
}

const addMember = async () => {
    if (!newMemberId.value || !newMemberRole.value) return ElMessage.warning('请选择人才并填写角色')
    try {
        const res = await request.post('/api/project/member/add', {
            projectId: currentProjectId.value,
            talentId: newMemberId.value,
            roleInProj: newMemberRole.value
        })
        if (res.code === '200') {
            ElMessage.success('添加成功')
            fetchMembers() // 刷新列表
            newMemberId.value = null
            newMemberRole.value = ''
        } else {
            ElMessage.error(res.msg || '添加失败')
        }
    } catch(e) { ElMessage.error('网络错误') }
}

const removeMember = async (id) => {
    await request.delete(`/api/project/member/remove/${id}`)
    ElMessage.success('已移除')
    fetchMembers()
}

// 原有 CRUD 逻辑
const openAddDialog = () => {
  form.value = { status: 'ONGOING' }
  dateRange.value = []
  dialogVisible.value = true
}
const handleEdit = (row) => {
  form.value = { ...row }
  if (row.startDate && row.endDate) dateRange.value = [row.startDate, row.endDate]
  dialogVisible.value = true
}
const handleDelete = async (id) => {
    await request.delete(`/api/project/delete/${id}`)
    ElMessage.success('删除成功')
    fetchData()
}
const submitForm = async () => {
  if (dateRange.value && dateRange.value.length === 2) {
      form.value.startDate = dateRange.value[0]
      form.value.endDate = dateRange.value[1]
  }
  try {
      if (form.value.id) await request.put('/api/project/update', form.value)
      else await request.post('/api/project/add', form.value)
      ElMessage.success('操作成功')
      dialogVisible.value = false
      fetchData()
  } catch(e) { ElMessage.error('操作失败') }
}
const formatDate = (str) => str ? dayjs(str).format('YYYY-MM-DD') : '-'
onMounted(() => fetchData())
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
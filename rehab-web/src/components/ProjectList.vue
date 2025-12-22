<template>
  <div class="project-container">
    <div class="left-panel">
      <div class="panel-header">
        <div style="display: flex; align-items: center;">
          <span style="font-weight: bold; margin-right: 10px;">📋 项目列表</span>
          <el-tag type="info" round size="small">{{ projectList.length }}</el-tag>
        </div>
        <el-button type="primary" :icon="Plus" circle size="small" @click="openDialog()" />
      </div>
      
      <div class="project-scroll">
        <div 
          v-for="item in projectList" 
          :key="item.id" 
          class="project-card"
          :class="{ active: currentProjectId === item.id }"
          @click="selectProject(item.id)"
        >
          <div class="card-header-row">
            <div class="card-title">{{ item.name }}</div>
            <div class="card-actions">
              <el-button type="primary" link :icon="Edit" @click.stop="openDialog(item)" />
              <el-popconfirm title="确定删除该项目吗？" @confirm="handleDelete(item.id)">
                <template #reference>
                   <el-button type="danger" link :icon="Delete" @click.stop />
                </template>
              </el-popconfirm>
            </div>
          </div>

          <div class="card-info">
            <span>👤 {{ item.principal }}</span>
            <el-tag size="small" :type="getStatusType(item.status)">{{ item.status }}</el-tag>
          </div>
          <el-progress :percentage="item.status === 'FINISHED' ? 100 : (item.status==='ONGOING'?50:20)" :stroke-width="3" :show-text="false" style="margin-top:10px" />
        </div>
      </div>
    </div>

    <div class="right-panel">
      <div v-if="!currentProjectId" class="empty-tip">
        <el-empty description="👈 请点击左侧项目查看进度甘特图" />
      </div>
      <div v-show="currentProjectId" ref="ganttContainer" class="gantt-chart"></div>
    </div>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑项目' : '立项申请'" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="项目名称">
          <el-input v-model="form.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="form.principal" placeholder="项目负责人姓名" />
        </el-form-item>
        <el-form-item label="总经费">
          <el-input-number v-model="form.totalBudget" :precision="2" :step="10" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="项目周期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="当前状态">
          <el-select v-model="form.status" placeholder="请选择" style="width:100%">
            <el-option label="进行中 (ONGOING)" value="ONGOING" />
            <el-option label="已结题 (FINISHED)" value="FINISHED" />
            <el-option label="延期 (DELAYED)" value="DELAYED" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { gantt } from 'dhtmlx-gantt'
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css'
// 引入图标
import { Plus, Edit, Delete } from '@element-plus/icons-vue'

const projectList = ref([])
const currentProjectId = ref(null)
const ganttContainer = ref(null)

// 表单相关
const dialogVisible = ref(false)
const form = ref({ id: null, name: '', principal: '', totalBudget: 0, status: 'ONGOING' })
const dateRange = ref([]) // 用于绑定日期选择器

// 1. 获取列表
const fetchProjects = async () => {
  try {
    const res = await axios.get('http://localhost:9090/api/project/list')
    projectList.value = res.data
  } catch (e) { ElMessage.error('获取项目列表失败') }
}

// 2. 选中项目 (加载甘特图)
const selectProject = async (id) => {
  currentProjectId.value = id
  // 清空并重新加载甘特图数据
  gantt.clearAll()
  try {
    const res = await axios.get(`http://localhost:9090/api/project/tasks/${id}`)
    const tasks = res.data
    const ganttData = tasks.map(t => ({
      id: t.id,
      text: t.taskName,
      start_date: t.startDate,
      end_date: t.endDate,
      progress: (t.progress || 0) / 100
    }))
    gantt.parse({ data: ganttData })
  } catch (e) { ElMessage.error('加载任务失败') }
}

// 3. 打开弹窗 (新增或编辑)
const openDialog = (row = null) => {
  if (row) {
    // 编辑模式：回填数据
    form.value = { ...row }
    dateRange.value = [row.startDate, row.endDate]
  } else {
    // 新增模式：重置
    form.value = { id: null, name: '', principal: '', totalBudget: 100, status: 'ONGOING' }
    dateRange.value = []
  }
  dialogVisible.value = true
}

// 4. 提交表单 (新增/修改)
const submitForm = async () => {
  if (!form.value.name) return ElMessage.warning('项目名称不能为空')
  
  // 处理日期
  if (dateRange.value && dateRange.value.length === 2) {
    form.value.startDate = dateRange.value[0]
    form.value.endDate = dateRange.value[1]
  }

  try {
    if (form.value.id) {
      // 修改
      await axios.put('http://localhost:9090/api/project/update', form.value)
      ElMessage.success('更新成功')
    } else {
      // 新增
      await axios.post('http://localhost:9090/api/project/add', form.value)
      ElMessage.success('立项成功')
    }
    dialogVisible.value = false
    fetchProjects() // 刷新列表
  } catch (e) { ElMessage.error('操作失败') }
}

// 5. 删除项目
const handleDelete = async (id) => {
  try {
    await axios.delete(`http://localhost:9090/api/project/delete/${id}`)
    ElMessage.success('已撤项')
    // 如果删除的是当前选中的项目，清空右侧
    if (currentProjectId.value === id) {
      currentProjectId.value = null
      gantt.clearAll()
    }
    fetchProjects()
  } catch (e) { ElMessage.error('删除失败') }
}

const getStatusType = (status) => {
  if (status === 'ONGOING') return 'primary'
  if (status === 'FINISHED') return 'success'
  return 'danger'
}

const initGantt = () => {
  gantt.config.date_format = "%Y-%m-%d"
  gantt.config.readonly = true
  gantt.config.columns = [
    { name: "text", label: "任务名称", width: "*", tree: true },
    { name: "start_date", label: "开始", align: "center", width: 80 },
    { name: "duration", label: "工期", align: "center", width: 50 }
  ]
  gantt.init(ganttContainer.value)
}

onMounted(async () => {
  await fetchProjects()
  await nextTick()
  initGantt()
})
</script>

<style scoped>
.project-container {
  display: flex;
  height: calc(100vh - 120px);
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.left-panel {
  width: 320px; /* 稍微宽一点放按钮 */
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.panel-header {
  padding: 10px 15px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  height: 50px;
}

.project-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.project-card {
  background: #fff;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 6px;
  border: 1px solid #eee;
  cursor: pointer;
  transition: all 0.2s;
  position: relative; /* 方便定位 */
}

.project-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-color: #409EFF;
}

.project-card.active {
  background: #ecf5ff;
  border-color: #409EFF;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.card-title {
  font-weight: bold;
  color: #303133;
  width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 隐藏的按钮组，hover时或者选中时显示 */
.card-actions {
  display: none;
}
.project-card:hover .card-actions, .project-card.active .card-actions {
  display: block;
}

.card-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.right-panel {
  flex: 1;
  position: relative;
  background: #fff;
}

.empty-tip {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.gantt-chart {
  width: 100%;
  height: 100%;
}
</style>
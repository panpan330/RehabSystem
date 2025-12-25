<template>
  <div class="talent-admin-container">
    
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span style="font-weight: bold;">人才数据库</span>
          <div>
            <el-button type="warning" :icon="Download" @click="exportTalentExcel">导出Excel</el-button>
            <el-button type="success" :icon="Plus" @click="openAddDialog">新增人才</el-button>
            <el-button type="primary" :icon="Refresh" @click="fetchData">刷新数据</el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="scope">
            <el-tag :type="getTagType(scope.row.role)">{{ scope.row.role }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="CS能力" min-width="150">
          <template #default="scope">
            <el-progress :percentage="scope.row.csScore" :status="scope.row.csScore>80?'success':'warning'" />
          </template>
        </el-table-column>
        <el-table-column label="医学能力" min-width="150">
          <template #default="scope">
            <el-progress :percentage="scope.row.medScore" color="#f56c6c" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" plain @click="showRadar(scope.row)">全息画像</el-button>
            <el-popconfirm title="确定要删除吗？" @confirm="handleDelete(scope.row.id)">
              <template #reference>
                <el-button size="small" type="danger" plain style="margin-left: 10px;">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="addDialogVisible" title="录入新人才" width="500px">
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="姓名"><el-input v-model="addForm.name" /></el-form-item>
        <el-form-item label="角色">
          <el-select v-model="addForm.role" style="width: 100%;">
            <el-option label="学生" value="STUDENT" />
            <el-option label="医生" value="DOCTOR" />
            <el-option label="科研人员" value="RESEARCHER" />
          </el-select>
        </el-form-item>
        <el-form-item label="CS能力"><el-slider v-model="addForm.csScore" show-input /></el-form-item>
        <el-form-item label="医学能力"><el-slider v-model="addForm.medScore" show-input /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdd">确认录入</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="dialogVisible"
      title="交叉人才智能全息画像"
      width="1100px"
      top="5vh"
      @opened="initChart"
    >
      <div id="report-content" style="display: flex; gap: 20px; align-items: flex-start; padding: 20px; background: white;">
        
        <el-card shadow="never" :body-style="{ padding: '10px' }">
          <div style="text-align: center; font-weight: bold; margin-bottom: 10px; color: #606266;">多维能力模型</div>
          <div id="radarChart" style="width: 300px; height: 300px;"></div>
        </el-card>

        <el-card shadow="never" :body-style="{ padding: '0px' }" style="width: 300px; border: 2px solid #409EFF; position: relative;">
           <ThreeBody :csScore="currentTalent.csScore" :medScore="currentTalent.medScore" />
           <div style="position: absolute; bottom: 0; width: 100%; text-align: center; padding: 8px 0; background: rgba(64,158,255,0.1); color: #409EFF; font-size: 12px; font-weight: bold;">
             🔵 蓝臂: 工程实践 | 🔴 红头: 医学理论
           </div>
        </el-card>

        <div style="flex: 1;">
          <div style="display: flex; align-items: center; margin-bottom: 15px;">
             <span style="font-size: 18px; margin-right: 5px;">🤖</span>
             <h3 style="margin: 0; color: #303133;">AI 智能决策支持</h3>
          </div>
          <el-alert :title="analysisReport.type" :type="analysisReport.colorType" :description="analysisReport.summary" show-icon :closable="false" style="margin-bottom: 15px;" />
          
          <div style="font-size: 14px; line-height: 1.8; color: #606266;">
             <p><strong>✨ 核心优势：</strong>{{ analysisReport.strength }}</p>
             <p><strong>⚠️ 技能短板：</strong>{{ analysisReport.weakness }}</p>
             
             <div style="background: #f4f4f5; padding: 12px; margin-top: 15px; border-radius: 4px;">
                <div style="font-weight: bold; color: #409EFF; margin-bottom: 5px;">📚 智能推荐课程：</div>
                <div v-if="analysisReport.courses.length > 0">
                    <el-tag v-for="c in analysisReport.courses" :key="c" size="small" style="margin-right: 5px;">{{ c }}</el-tag>
                </div>
                <div style="text-align: right; margin-top: 10px;">
                  <el-button type="success" size="small" @click="assignTraining">
                    一键加入培训计划 ➔
                  </el-button>
                </div>
             </div>
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" plain @click="handleExport">📄 导出诊断报告 (PDF)</el-button>
          <el-button @click="dialogVisible = false">关闭窗口</el-button>
        </span>
      </template>

      <el-divider content-position="left">📅 该生当前的培训任务</el-divider>
      <el-table :data="trainingList" border size="small" style="width: 100%">
         <el-table-column prop="courseName" label="课程名称" />
         <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
                <el-tag size="small" :type="scope.row.status === 'DONE' ? 'success' : 'info'">
                    {{ scope.row.status === 'TO_DO' ? '待开始' : '进行中' }}
                </el-tag>
            </template>
         </el-table-column>
         <el-table-column prop="createTime" label="指派时间" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import axios from 'axios'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { Download, Plus, Refresh } from '@element-plus/icons-vue'
import ThreeBody from '../components/ThreeBody.vue' 
import { exportToPDF } from '../utils/pdfExport'

const tableData = ref([])
const loading = ref(false)
const addDialogVisible = ref(false)
const addForm = ref({ name: '', role: 'STUDENT', csScore: 50, medScore: 50 })
const dialogVisible = ref(false)
const currentTalent = ref({})
const trainingList = ref([])
const analysisReport = ref({ type: '', colorType: 'info', summary: '', strength: '', weakness: '', courses: [] })
let myChart = null

const getTagType = (role) => {
  if (role === 'DOCTOR') return 'success'
  if (role === 'RESEARCHER') return 'warning'
  return ''
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:9090/api/talent/list')
    tableData.value = res.data
  } catch (error) { ElMessage.error('获取失败') } 
  finally { loading.value = false }
}

const fetchTraining = async (talentId) => {
  try {
    const res = await axios.get(`http://localhost:9090/api/training/list/${talentId}`)
    trainingList.value = res.data
  } catch (e) { console.error(e) }
}

const exportTalentExcel = () => { window.location.href = 'http://localhost:9090/api/excel/export/talent' }
const openAddDialog = () => { addDialogVisible.value = true }
const submitAdd = async () => {
  try { await axios.post('http://localhost:9090/api/talent/add', addForm.value); fetchData(); addDialogVisible.value = false; ElMessage.success('录入成功') } catch(e){ ElMessage.error('录入失败') }
}
const handleDelete = async (id) => {
  try { await axios.delete(`http://localhost:9090/api/talent/delete/${id}`); fetchData(); ElMessage.success('删除成功') } catch(e){ ElMessage.error('删除失败') }
}
const showRadar = (row) => { currentTalent.value = row; dialogVisible.value = true; fetchTraining(row.id) }
const handleExport = () => { ElMessage.success('正在生成 PDF...'); exportToPDF('report-content', `${currentTalent.value.name}-能力画像报告`) }

const generateReport = (cs, med) => {
  if (cs > 70 && med > 70) {
    analysisReport.value = { type: '🌟 卓越交叉型人才', colorType: 'success', summary: '双强精英', strength: '医工双修', weakness: '无', courses: ['科研项目管理'] }
  } else if (cs > med + 20) {
    analysisReport.value = { type: '💻 技术驱动型人才', colorType: 'primary', summary: '代码强临床弱', strength: '编程思维', weakness: '临床知识', courses: ['人体解剖学', '康复评定'] }
  } else if (med > cs + 20) {
    analysisReport.value = { type: '🏥 临床应用型人才', colorType: 'warning', summary: '临床强技术弱', strength: '患者洞察', weakness: '数据处理', courses: ['Python基础', '数据分析'] }
  } else {
    analysisReport.value = { type: '🌱 成长期待型人才', colorType: 'info', summary: '基础薄弱', strength: '潜力', weakness: '全方位', courses: ['计算机导论', '康复导论'] }
  }
}

const initChart = async () => {
  await nextTick()
  const chartDom = document.getElementById('radarChart')
  if (chartDom) {
    if (myChart) myChart.dispose();
    myChart = echarts.init(chartDom);
    const cs = currentTalent.value.csScore || 0
    const med = currentTalent.value.medScore || 0
    generateReport(cs, med)
    myChart.setOption({
      radar: { indicator: [{name:'编程(CS)', max:100}, {name:'数据(CS)', max:100}, {name:'交叉', max:100}, {name:'评估(Med)', max:100}, {name:'理论(Med)', max:100}, {name:'沟通(Med)', max:100}] },
      series: [{ type: 'radar', data: [{ value: [cs, cs*0.9, (cs+med)/2, med, med*0.9, med*0.8] }] }]
    })
  }
}

const assignTraining = async () => {
  if (analysisReport.value.courses.length === 0) return;
  const payload = analysisReport.value.courses.map(course => ({ talentId: currentTalent.value.id, courseName: course }))
  try { await axios.post('http://localhost:9090/api/training/assign', payload); ElMessage.success('指派成功'); fetchTraining(currentTalent.value.id) } catch(e){}
}

onMounted(() => { fetchData() })
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
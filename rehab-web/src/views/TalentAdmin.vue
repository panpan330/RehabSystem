<template>
  <div class="talent-admin-container">
    
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span style="font-weight: bold;">人才数据库</span>
          <div style="display: flex; gap: 10px;">
            <el-upload
              action="http://localhost:9090/api/excel/import/talent"
              :show-file-list="false"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
              accept=".xlsx, .xls"
            >
              <el-button type="primary" plain :icon="Upload">导入Excel</el-button>
            </el-upload>

            <el-button type="warning" :icon="Download" @click="exportTalentExcel">导出Excel</el-button>
            <el-button type="success" :icon="Plus" @click="openAddDialog">新增人才</el-button>
            <el-button type="primary" :icon="Refresh" @click="fetchData">刷新数据</el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="姓名" width="100">
           <template #default="scope"><span style="font-weight: bold;">{{ scope.row.name }}</span></template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="120">
          <template #default="scope"><el-tag :type="getTagType(scope.row.role)">{{ scope.row.role }}</el-tag></template>
        </el-table-column>

        <el-table-column label="CS能力" min-width="150">
          <template #default="scope"><el-progress :percentage="scope.row.csScore" :status="scope.row.csScore>80?'success':'warning'" :stroke-width="12" /></template>
        </el-table-column>
        <el-table-column label="医学能力" min-width="150">
          <template #default="scope"><el-progress :percentage="scope.row.medScore" color="#f56c6c" :stroke-width="12" /></template>
        </el-table-column>
        
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" plain @click="showRadar(scope.row)">档案</el-button>
            <el-button size="small" type="warning" plain @click="openEditDialog(scope.row)">编辑</el-button>
            <el-popconfirm title="确定删除？" @confirm="handleDelete(scope.row.id)">
              <template #reference>
                <el-button size="small" type="danger" plain style="margin-left: 10px;">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="formDialogVisible" :title="isEditMode ? '✏️ 编辑人才档案' : '📄 录入新人才档案'" width="700px">
      <el-form :model="form" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="12"><el-form-item label="姓名"><el-input v-model="form.name" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="性别">
              <el-radio-group v-model="form.gender">
                <el-radio label="男">男</el-radio>
                <el-radio label="女">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="身份证号">
            <el-input v-model="form.idCard" placeholder="请输入18位身份证号" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
             <el-form-item label="出生日期">
               <el-date-picker v-model="form.birthday" type="date" style="width: 100%" value-format="YYYY-MM-DD" />
             </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色类型">
              <el-select v-model="form.role" style="width: 100%;">
                <el-option label="学生" value="STUDENT" />
                <el-option label="医生" value="DOCTOR" />
                <el-option label="研究员" value="RESEARCHER" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
           <el-col :span="12">
             <el-form-item label="学历">
               <el-select v-model="form.education" style="width: 100%">
                 <el-option label="本科" value="本科" />
                 <el-option label="硕士" value="硕士" />
                 <el-option label="博士" value="博士" />
               </el-select>
             </el-form-item>
           </el-col>
           <el-col :span="12"><el-form-item label="专业"><el-input v-model="form.major" /></el-form-item></el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12"><el-form-item label="手机号"><el-input v-model="form.phone" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="邮箱"><el-input v-model="form.email" /></el-form-item></el-col>
        </el-row>
        
        <el-form-item label="家庭地址">
            <el-input v-model="form.address" type="textarea" :rows="2" placeholder="请输入详细居住地址" />
        </el-form-item>

        <el-divider content-position="center">能力评估</el-divider>
        <el-form-item label="CS能力"><el-slider v-model="form.csScore" show-input /></el-form-item>
        <el-form-item label="医学能力"><el-slider v-model="form.medScore" show-input /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认{{ isEditMode ? '保存' : '录入' }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dialogVisible" title="人才综合电子档案" width="1100px" top="5vh" @opened="initChart">
      <div style="background: #f5f7fa; padding: 20px; border-radius: 4px;">
        <el-card shadow="never" style="margin-bottom: 20px;">
          <template #header>
            <div class="card-header">
              <span>👤 基础信息卡片</span>
              <el-tag :type="getTagType(currentTalent.role)" effect="dark">{{ currentTalent.role }}</el-tag>
            </div>
          </template>
          <el-descriptions border :column="3" size="small">
            <el-descriptions-item label="姓名">{{ currentTalent.name }}</el-descriptions-item>
            <el-descriptions-item label="性别">{{ currentTalent.gender || '-' }}</el-descriptions-item>
            <el-descriptions-item label="出生日期">{{ currentTalent.birthday || '-' }}</el-descriptions-item>
            
            <el-descriptions-item label="身份证号">{{ currentTalent.idCard || '-' }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ currentTalent.phone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="电子邮箱">{{ currentTalent.email || '-' }}</el-descriptions-item>

            <el-descriptions-item label="最高学历">{{ currentTalent.education || '-' }}</el-descriptions-item>
            <el-descriptions-item label="专业方向">{{ currentTalent.major || '-' }}</el-descriptions-item>
            <el-descriptions-item label="家庭地址" :span="1">{{ currentTalent.address || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <div style="display: flex; gap: 20px; align-items: flex-start;">
          <el-card shadow="never" :body-style="{ padding: '10px' }" style="flex-shrink: 0;">
            <div style="text-align: center; font-weight: bold; margin-bottom: 10px; color: #606266;">能力雷达</div>
            <div id="radarChart" style="width: 280px; height: 280px;"></div>
          </el-card>

          <el-card shadow="never" :body-style="{ padding: '0px' }" style="width: 300px; border: 2px solid #409EFF; position: relative; flex-shrink: 0;">
             <ThreeBody :csScore="currentTalent.csScore" :medScore="currentTalent.medScore" />
             <div style="position: absolute; bottom: 0; width: 100%; text-align: center; padding: 8px 0; background: rgba(64,158,255,0.1); color: #409EFF; font-size: 12px; font-weight: bold;">
               🔵 蓝臂: 工程实践 | 🔴 红头: 医学理论
             </div>
          </el-card>

          <div style="flex: 1; background: white; padding: 15px; border-radius: 4px; border: 1px solid #ebeef5;">
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
               <span style="font-size: 18px; margin-right: 5px;">🤖</span>
               <h3 style="margin: 0; color: #303133;">AI 决策分析</h3>
            </div>
            <el-alert :title="analysisReport.type" :type="analysisReport.colorType" :description="analysisReport.summary" show-icon :closable="false" style="margin-bottom: 15px;" />
            <div style="font-size: 13px; line-height: 1.8; color: #606266;">
               <p><strong>✨ 核心优势：</strong>{{ analysisReport.strength }}</p>
               <p><strong>⚠️ 技能短板：</strong>{{ analysisReport.weakness }}</p>
               <div style="background: #fdf6ec; padding: 10px; margin-top: 15px; border-radius: 4px; border: 1px solid #faecd8;">
                  <div style="font-weight: bold; color: #e6a23c; margin-bottom: 5px;">📚 推荐培养方案：</div>
                  <div v-if="analysisReport.courses.length > 0">
                      <el-tag v-for="c in analysisReport.courses" :key="c" size="small" type="warning" style="margin-right: 5px;">{{ c }}</el-tag>
                  </div>
                  <div style="text-align: right; margin-top: 10px;">
                    <el-button type="warning" plain size="small" @click="assignTraining">一键指派任务</el-button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" plain @click="handleExport">📄 打印档案 (PDF)</el-button>
          <el-button @click="dialogVisible = false">关闭</el-button>
        </span>
      </template>

      <el-divider content-position="left">📅 关联培训记录</el-divider>
      <el-table :data="trainingList" border size="small" style="width: 100%">
         <el-table-column prop="courseName" label="课程名称" />
         <el-table-column prop="status" label="状态">
            <template #default="scope">
                <el-tag size="small" :type="scope.row.status === 'DONE' ? 'success' : 'info'">{{ scope.row.status === 'TO_DO' ? '未开始' : '进行中' }}</el-tag>
            </template>
         </el-table-column>
         <el-table-column prop="createTime" label="时间" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import request from '../utils/request'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import { Download, Plus, Refresh, Upload } from '@element-plus/icons-vue' // ⭐ 记得引入 Upload 图标
import ThreeBody from '../components/ThreeBody.vue' 
import { exportToPDF } from '../utils/pdfExport'

const tableData = ref([])
const loading = ref(false)
const formDialogVisible = ref(false)
const isEditMode = ref(false)

const form = ref({ 
    id: null, name: '', gender: '男', birthday: '', 
    idCard: '', address: '',
    education: '本科', major: '', phone: '', email: '',
    role: 'STUDENT', csScore: 50, medScore: 50 
})

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
    const res = await request.get('/api/talent/list')
    if(res.code === '200') {
        tableData.value = res.data 
    } else {
        ElMessage.error(res.msg || '数据获取失败')
    }
  } catch (error) { 
      console.error(error)
      ElMessage.error('获取失败') 
  } 
  finally { loading.value = false }
}

const fetchTraining = async (talentId) => {
  try {
    const res = await request.get(`/api/training/list/${talentId}`)
    if(res.code === '200') {
       trainingList.value = res.data
    }
  } catch (e) { console.error(e) }
}

const exportTalentExcel = () => { window.location.href = 'http://localhost:9090/api/excel/export/talent' }

// ⭐ 新增：上传成功回调
const handleUploadSuccess = (res) => {
  if (res.code === '200') {
    ElMessage.success('导入成功！')
    fetchData() // 刷新列表
  } else {
    ElMessage.error('导入失败: ' + res.msg)
  }
}

// ⭐ 新增：上传失败回调
const handleUploadError = () => {
  ElMessage.error('上传网络错误')
}

const openAddDialog = () => { 
    isEditMode.value = false
    form.value = { 
        id: null, name: '', gender: '男', birthday: '', 
        idCard: '', address: '',
        education: '本科', major: '', phone: '', email: '', 
        role: 'STUDENT', csScore: 50, medScore: 50 
    }
    formDialogVisible.value = true 
}

const openEditDialog = (row) => {
    isEditMode.value = true
    form.value = JSON.parse(JSON.stringify(row))
    formDialogVisible.value = true
}

const submitForm = async () => {
  if(!form.value.name) { ElMessage.warning('姓名不能为空'); return; }
  try { 
      if (isEditMode.value) {
          await request.put('/api/talent/update', form.value)
          ElMessage.success('更新成功')
      } else {
          await request.post('/api/talent/add', form.value)
          ElMessage.success('录入成功')
      }
      fetchData()
      formDialogVisible.value = false 
  } catch(e){ 
      ElMessage.error('操作失败') 
  }
}

const handleDelete = async (id) => {
  try { 
      await request.delete(`/api/talent/delete/${id}`)
      fetchData()
      ElMessage.success('删除成功') 
  } catch(e){ 
      ElMessage.error('删除失败') 
  }
}

const showRadar = (row) => { 
  currentTalent.value = row; 
  dialogVisible.value = true; 
  fetchTraining(row.id) 
}
const handleExport = () => { ElMessage.success('正在生成 PDF...'); exportToPDF('report-content', `${currentTalent.value.name}-档案`) }

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
  if (analysisReport.value.courses.length === 0) {
      ElMessage.info('当前没有推荐课程，请先调整分数');
      return;
  }
  
  try {
    const res = await request.post(`/api/training/auto-assign/${currentTalent.value.id}`)
    
    if (res.code === '200') {
        const courses = res.data
        if (courses && courses.length > 0) {
            ElMessage.success(`AI 已智能指派 ${courses.length} 门课程！`)
        } else {
            ElMessage.info('该人才已拥有推荐的课程，无需重复指派')
        }
        fetchTraining(currentTalent.value.id)
    } else {
        ElMessage.error(res.msg)
    }
  } catch(e){
      console.error(e)
      ElMessage.error('指派失败')
  }
}

onMounted(() => { fetchData() })
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
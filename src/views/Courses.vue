<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">课程报名</div>
      <el-button type="primary" @click="openAddDialog">
        <el-icon><Plus /></el-icon>新建课程
      </el-button>
    </div>

    <div class="search-bar card-wrapper">
      <el-date-picker v-model="filterDate" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 180px" />
      <el-select v-model="filterType" placeholder="课程类型" style="width: 150px" clearable>
        <el-option v-for="t in courseStore.courseTypes" :key="t.value" :label="t.label" :value="t.value" />
      </el-select>
      <el-select v-model="filterSport" placeholder="运动项目" style="width: 150px" clearable>
        <el-option v-for="s in courseStore.sports" :key="s" :label="s" :value="s" />
      </el-select>
      <el-select v-model="filterCoach" placeholder="教练" style="width: 150px" clearable>
        <el-option v-for="c in courseStore.coaches" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
    </div>

    <div class="card-wrapper">
      <el-table :data="filteredCourses" stripe style="width: 100%">
        <el-table-column label="课程类型" width="90">
          <template #default="{ row }">
            <el-tag :color="courseStore.getTypeColor(row.type)" effect="dark" style="color:#fff" size="small">
              {{ courseStore.getTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="课程名称" min-width="180" />
        <el-table-column prop="sport" label="项目" width="90" />
        <el-table-column label="教练" width="90">
          <template #default="{ row }">{{ courseStore.getCoachName(row.coachId) }}</template>
        </el-table-column>
        <el-table-column prop="date" label="日期" width="110" />
        <el-table-column label="时间" width="120">
          <template #default="{ row }">{{ row.startTime }} - {{ row.endTime }}</template>
        </el-table-column>
        <el-table-column prop="venue" label="场地" width="110" />
        <el-table-column label="报名情况" width="130" align="center">
          <template #default="{ row }">
            <el-progress
              :percentage="row.capacity > 0 ? Math.round(row.enrolled / row.capacity * 100) : 0"
              :stroke-width="12"
              :color="row.enrolled >= row.capacity ? '#f56c6c' : '#67c23a'"
            >
              {{ row.enrolled }}/{{ row.capacity }}
            </el-progress>
          </template>
        </el-table-column>
        <el-table-column label="价格" width="90" align="right">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column label="操作" width="380" fixed="right" class="no-print">
            <template #default="{ row }">
              <div class="table-actions">
                <el-button size="small" type="success" @click="openEnrollDialog(row)">报名</el-button>
                <el-button size="small" type="primary" plain @click="openRosterDialog(row)" :disabled="row.enrolled === 0">
                  名单({{ row.enrolled }})
                </el-button>
                <el-button size="small" type="warning" plain @click="openWaitlistDialog(row)" :disabled="getWaitlistCount(row.id) === 0">
                  候补({{ getWaitlistCount(row.id) }})
                </el-button>
                <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deleteCourse(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="courseDialogVisible" :title="isEdit ? '编辑课程' : '新建课程'" width="550px">
      <el-form ref="courseFormRef" :model="courseForm" :rules="courseRules" label-width="100px">
        <el-form-item label="课程类型" prop="type">
          <el-select v-model="courseForm.type" style="width: 100%">
            <el-option v-for="t in courseStore.courseTypes" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="课程名称" prop="name">
          <el-input v-model="courseForm.name" placeholder="请输入课程名称" />
        </el-form-item>
        <el-form-item label="运动项目" prop="sport">
          <el-select v-model="courseForm.sport" style="width: 100%">
            <el-option v-for="s in courseStore.sports" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-form-item label="授课教练" prop="coachId">
          <el-select v-model="courseForm.coachId" style="width: 100%">
            <el-option v-for="c in courseStore.coaches" :key="c.id" :label="c.name + ' - ' + c.sport" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期" prop="date">
          <el-date-picker v-model="courseForm.date" type="date" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="时间段">
          <el-time-picker v-model="courseForm.startTime" placeholder="开始时间" format="HH:mm" value-format="HH:mm" style="width: 45%" />
          <span style="margin: 0 10px">-</span>
          <el-time-picker v-model="courseForm.endTime" placeholder="结束时间" format="HH:mm" value-format="HH:mm" style="width: 45%" />
        </el-form-item>
        <el-form-item label="场地" prop="venue">
          <el-input v-model="courseForm.venue" placeholder="请输入场地名称" />
        </el-form-item>
        <el-form-item label="名额(人)" prop="capacity">
          <el-input-number v-model="courseForm.capacity" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="价格(元)" prop="price">
          <el-input-number v-model="courseForm.price" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="courseForm.remark" type="textarea" :rows="2" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="courseDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCourse">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="enrollDialogVisible" title="会员报名" width="600px">
      <div v-if="currentCourse">
        <div style="margin-bottom: 16px; padding: 12px; background: #f5f7fa; border-radius: 4px">
          <strong>{{ currentCourse.name }}</strong>
          <span style="margin-left: 16px; color: #606266">{{ currentCourse.date }} {{ currentCourse.startTime }}-{{ currentCourse.endTime }}</span>
          <span style="margin-left: 16px; color: #606266">{{ currentCourse.enrolled }}/{{ currentCourse.capacity }}人</span>
        </div>
        <el-input v-model="enrollSearch" placeholder="搜索会员姓名或电话" style="margin-bottom: 12px">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-table :data="searchedMembers" size="small" max-height="300" style="width: 100%">
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="phone" label="电话" width="130" />
          <el-table-column label="等级" width="100">
            <template #default="{ row }">
              <el-tag :color="memberStore.getLevelColor(row.level)" effect="dark" style="color:#fff" size="small">
                {{ memberStore.getLevelLabel(row.level) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="剩余次数" width="90" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="row.remainingSessions < 5 ? 'danger' : 'info'">
                {{ row.remainingSessions }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="120" align="center">
            <template #default="{ row }">
              <el-tag v-if="isEnrolled(row.id)" type="info" size="small">已报名</el-tag>
              <el-tag v-else-if="getWaitlistPosition(row.id)" type="warning" size="small">
                候补第{{ getWaitlistPosition(row.id) }}位
              </el-tag>
              <el-tag v-else-if="currentCourse.enrolled >= currentCourse.capacity" type="danger" size="small">已满员</el-tag>
              <el-tag v-else type="success" size="small">可报名</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" align="center" class="no-print">
            <template #default="{ row }">
              <div class="table-actions">
                <el-button
                  v-if="!isEnrolled(row.id) && !getWaitlistPosition(row.id)"
                  size="small"
                  type="primary"
                  @click="doEnroll(row)"
                >{{ currentCourse.enrolled >= currentCourse.capacity ? '候补' : '报名' }}</el-button>
                <el-button
                  v-if="getWaitlistPosition(row.id)"
                  size="small"
                  type="danger"
                  plain
                  @click="cancelWaitlist(row)"
                >取消候补</el-button>
                <el-button
                  v-if="isEnrolled(row.id)"
                  size="small"
                  type="warning"
                  plain
                  @click="openTransferDialog(row)"
                >转课</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <el-dialog v-model="rosterDialogVisible" title="学员名单" width="600px">
      <div v-if="rosterCourse">
        <div style="margin-bottom: 16px; padding: 12px; background: #f5f7fa; border-radius: 4px">
          <strong>{{ rosterCourse.name }}</strong>
          <span style="margin-left: 16px; color: #606266">{{ rosterCourse.date }} {{ rosterCourse.startTime }}-{{ rosterCourse.endTime }}</span>
          <span style="margin-left: 16px; color: #606266">共 {{ rosterCourse.enrolled }} 人</span>
        </div>
        <el-table :data="rosterMembers" size="small" style="width: 100%">
          <el-table-column label="序号" width="60" align="center" type="index" />
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="phone" label="电话" width="130" />
          <el-table-column label="等级" width="100">
            <template #default="{ row }">
              <el-tag :color="memberStore.getLevelColor(row.level)" effect="dark" style="color:#fff" size="small">
                {{ memberStore.getLevelLabel(row.level) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="报名来源" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.fromWaitlist" type="warning" size="small">候补补入</el-tag>
              <el-tag v-else-if="row.transferred" type="primary" size="small">
                转入({{ row.fromCourseName }})
              </el-tag>
              <el-tag v-else type="info" size="small">正常报名</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="报名时间" width="150">
            <template #default="{ row }">{{ row.enrollDate }}</template>
          </el-table-column>
          <el-table-column label="剩余次数" width="90" align="center">
            <template #default="{ row }">{{ row.remainingSessions }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center" class="no-print">
            <template #default="{ row }">
              <el-button size="small" type="danger" plain @click="cancelEnroll(row)">取消报名</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="rosterMembers.length === 0" description="暂无学员报名" />
      </div>
    </el-dialog>

    <el-dialog v-model="waitlistDialogVisible" title="候补队列" width="500px">
      <div v-if="waitlistCourse">
        <div style="margin-bottom: 16px; padding: 12px; background: #f5f7fa; border-radius: 4px">
          <strong>{{ waitlistCourse.name }}</strong>
          <span style="margin-left: 16px; color: #606266">{{ waitlistCourse.date }} {{ waitlistCourse.startTime }}-{{ waitlistCourse.endTime }}</span>
          <span style="margin-left: 16px; color: #606266">候补 {{ waitlistMembers.length }} 人</span>
        </div>
        <el-table :data="waitlistMembers" size="small" style="width: 100%">
          <el-table-column label="顺位" width="60" align="center">
            <template #default="{ row }">{{ row.position }}</template>
          </el-table-column>
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="phone" label="电话" width="130" />
          <el-table-column label="等级" width="100">
            <template #default="{ row }">
              <el-tag :color="memberStore.getLevelColor(row.level)" effect="dark" style="color:#fff" size="small">
                {{ memberStore.getLevelLabel(row.level) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="候补时间" width="150">
            <template #default="{ row }">{{ row.waitDate }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100" align="center" class="no-print">
            <template #default="{ row }">
              <el-button size="small" type="danger" plain @click="removeWaitlistMember(row)">移除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="waitlistMembers.length === 0" description="暂无候补学员" />
      </div>
    </el-dialog>

    <el-dialog v-model="transferDialogVisible" title="课程转课" width="500px">
      <div v-if="transferMember">
        <div style="margin-bottom: 16px; padding: 12px; background: #f5f7fa; border-radius: 4px">
          <div><strong>转课会员</strong>: {{ transferMember.name }} ({{ transferMember.phone }})</div>
          <div style="margin-top: 8px">
            <strong>原课程</strong>: {{ currentCourse?.name }} ({{ currentCourse?.date }} {{ currentCourse?.startTime }})
          </div>
        </div>
        <el-form label-width="100px">
          <el-form-item label="目标课程" prop="toCourseId">
            <el-select v-model="toCourseId" placeholder="选择要转入的课程" style="width: 100%" filterable>
              <el-option
                v-for="c in availableTransferCourses"
                :key="c.id"
                :label="c.date + ' ' + c.startTime + ' ' + c.name + ' (' + c.enrolled + '/' + c.capacity + ')'"
                :value="c.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item v-if="toCourseId" label="目标课程">
            <div style="padding: 12px; background: #f5f7fa; border-radius: 4px; width: 100%">
              <div><strong>{{ toCourse?.name }}</strong></div>
              <div style="color: #606266; font-size: 13px; margin-top: 4px">
                {{ toCourse?.date }} {{ toCourse?.startTime }}-{{ toCourse?.endTime }} | {{ toCourse?.venue }}
              </div>
              <div style="color: #606266; font-size: 13px; margin-top: 4px">
                名额: {{ toCourse?.enrolled }}/{{ toCourse?.capacity }} | 教练: {{ courseStore.getCoachName(toCourse?.coachId) }}
              </div>
            </div>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="transferDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!toCourseId" @click="confirmTransfer">确认转课</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useCourseStore } from '@/stores/course'
import { useMemberStore } from '@/stores/member'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const courseStore = useCourseStore()
const memberStore = useMemberStore()

const filterDate = ref(dayjs().format('YYYY-MM-DD'))
const filterType = ref('')
const filterSport = ref('')
const filterCoach = ref('')

const filteredCourses = computed(() => {
  let list = courseStore.courses
  if (filterDate.value) list = list.filter(c => c.date === filterDate.value)
  if (filterType.value) list = list.filter(c => c.type === filterType.value)
  if (filterSport.value) list = list.filter(c => c.sport === filterSport.value)
  if (filterCoach.value) list = list.filter(c => c.coachId === filterCoach.value)
  return list.sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
})

const courseDialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref('')
const courseFormRef = ref()
const courseForm = reactive({
  type: 'group', name: '', sport: '羽毛球', coachId: '', date: '',
  startTime: '09:00', endTime: '10:00', venue: '', capacity: 10, price: 80, remark: ''
})
const courseRules = {
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  name: [{ required: true, message: '请输入课程名称', trigger: 'blur' }],
  sport: [{ required: true, message: '请选择项目', trigger: 'change' }],
  coachId: [{ required: true, message: '请选择教练', trigger: 'change' }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  venue: [{ required: true, message: '请输入场地', trigger: 'blur' }],
  capacity: [{ required: true, message: '请输入名额', trigger: 'blur' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }]
}

function resetCourseForm() {
  courseForm.type = 'group'
  courseForm.name = ''
  courseForm.sport = '羽毛球'
  courseForm.coachId = courseStore.coaches[0]?.id || ''
  courseForm.date = dayjs().add(1, 'day').format('YYYY-MM-DD')
  courseForm.startTime = '09:00'
  courseForm.endTime = '10:00'
  courseForm.venue = ''
  courseForm.capacity = 10
  courseForm.price = 80
  courseForm.remark = ''
}

function openAddDialog() {
  isEdit.value = false
  editingId.value = ''
  resetCourseForm()
  courseDialogVisible.value = true
}

function openEditDialog(row) {
  isEdit.value = true
  editingId.value = row.id
  Object.assign(courseForm, row)
  courseDialogVisible.value = true
}

function submitCourse() {
  courseFormRef.value.validate(valid => {
    if (!valid) return
    if (isEdit.value) {
      courseStore.updateCourse(editingId.value, courseForm)
      ElMessage.success('课程已更新')
    } else {
      courseStore.addCourse({ ...courseForm })
      ElMessage.success('课程创建成功')
    }
    courseDialogVisible.value = false
  })
}

function deleteCourse(row) {
  ElMessageBox.confirm(`确定删除课程「${row.name}」吗？相关报名记录将被清除。`, '删除确认', {
    type: 'warning'
  }).then(() => {
    courseStore.deleteCourse(row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

const enrollDialogVisible = ref(false)
const currentCourse = ref(null)
const enrollSearch = ref('')

const searchedMembers = computed(() => memberStore.searchMembers(enrollSearch.value))

function openEnrollDialog(row) {
  currentCourse.value = row
  enrollSearch.value = ''
  enrollDialogVisible.value = true
}

function isEnrolled(memberId) {
  return courseStore.isMemberEnrolled(currentCourse.value?.id, memberId)
}

function doEnroll(member) {
  const result = courseStore.enrollMember(currentCourse.value.id, member.id)
  if (result.success) {
    if (result.type === 'waitlist') {
      ElMessage.success(result.msg || '已加入候补队列')
    } else {
      ElMessage.success(`会员「${member.name}」报名成功`)
    }
  } else {
    ElMessage.error(result.msg)
  }
}

const rosterDialogVisible = ref(false)
const rosterCourse = ref(null)

const rosterMembers = computed(() => {
  if (!rosterCourse.value) return []
  const enrollments = courseStore.getEnrollmentsByCourse(rosterCourse.value.id)
  return enrollments.map(e => {
    const member = memberStore.getMemberById(e.memberId)
    if (!member) return null
    return { ...member, enrollDate: e.enrollDate, fromWaitlist: e.fromWaitlist, transferred: e.transferred, fromCourseName: e.fromCourseName }
  }).filter(Boolean)
})

function openRosterDialog(row) {
  rosterCourse.value = row
  rosterDialogVisible.value = true
}

function cancelEnroll(member) {
  ElMessageBox.confirm(
    `确定取消「${member.name}」的「${rosterCourse.value.name}」报名吗？名额将自动恢复。`,
    '取消报名确认',
    { type: 'warning' }
  ).then(() => {
    const result = courseStore.cancelEnrollment(rosterCourse.value.id, member.id)
    if (result.success) {
      let msg = '已取消报名，名额已恢复'
      if (result.promoted) {
        const promotedMember = memberStore.getMemberById(result.promoted.memberId)
        msg += `。候补会员「${promotedMember?.name || '未知'}」已自动补位`
      }
      ElMessage.success(msg)
    } else {
      ElMessage.error(result.msg || '操作失败')
    }
  }).catch(() => {})
}

const waitlistDialogVisible = ref(false)
const waitlistCourse = ref(null)

const waitlistMembers = computed(() => {
  if (!waitlistCourse.value) return []
  const waitlist = courseStore.getWaitlistByCourse(waitlistCourse.value.id)
  return waitlist.map(w => {
    const member = memberStore.getMemberById(w.memberId)
    if (!member) return null
    return { ...member, position: w.position, waitDate: w.waitDate }
  }).filter(Boolean)
})

function getWaitlistCount(courseId) {
  return courseStore.getWaitlistByCourse(courseId).length
}

function openWaitlistDialog(row) {
  waitlistCourse.value = row
  waitlistDialogVisible.value = true
}

function removeWaitlistMember(member) {
  ElMessageBox.confirm(
    `确定将「${member.name}」从候补队列中移除吗？`,
    '移除候补确认',
    { type: 'warning' }
  ).then(() => {
    const result = courseStore.removeFromWaitlist(waitlistCourse.value.id, member.id)
    if (result.success) {
      ElMessage.success('已从候补队列移除')
    } else {
      ElMessage.error(result.msg || '操作失败')
    }
  }).catch(() => {})
}

function getWaitlistPosition(memberId) {
  if (!currentCourse.value) return null
  return courseStore.getMemberWaitlistPosition(currentCourse.value.id, memberId)
}

function cancelWaitlist(member) {
  ElMessageBox.confirm(
    `确定取消「${member.name}」的候补吗？`,
    '取消候补确认',
    { type: 'warning' }
  ).then(() => {
    const result = courseStore.removeFromWaitlist(currentCourse.value.id, member.id)
    if (result.success) {
      ElMessage.success('已取消候补')
    } else {
      ElMessage.error(result.msg || '操作失败')
    }
  }).catch(() => {})
}

const transferDialogVisible = ref(false)
const transferMember = ref(null)
const toCourseId = ref('')

const availableTransferCourses = computed(() => {
  if (!currentCourse.value) return []
  return courseStore.courses.filter(c => {
    if (c.id === currentCourse.value.id) return false
    if (c.enrolled >= c.capacity) return false
    if (dayjs(c.date).isBefore(dayjs())) return false
    return true
  }).sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
})

const toCourse = computed(() => {
  if (!toCourseId.value) return null
  return courseStore.courses.find(c => c.id === toCourseId.value)
})

function openTransferDialog(member) {
  transferMember.value = member
  toCourseId.value = ''
  transferDialogVisible.value = true
}

function confirmTransfer() {
  if (!transferMember.value || !toCourseId.value || !currentCourse.value) return
  
  ElMessageBox.confirm(
    `确定将「${transferMember.value.name}」从「${currentCourse.value.name}」转到「${toCourse.value?.name}」吗？`,
    '转课确认',
    { type: 'warning' }
  ).then(() => {
    const result = courseStore.transferCourse(currentCourse.value.id, toCourseId.value, transferMember.value.id)
    if (result.success) {
      let msg = '转课成功'
      if (result.promoted) {
        const promotedMember = memberStore.getMemberById(result.promoted.memberId)
        msg += `。原课程候补会员「${promotedMember?.name || '未知'}」已自动补位`
      }
      ElMessage.success(msg)
      transferDialogVisible.value = false
    } else {
      ElMessage.error(result.msg || '操作失败')
    }
  }).catch(() => {})
}
</script>

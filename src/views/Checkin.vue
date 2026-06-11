<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">场次签到</div>
      <div>
        <el-button type="success" plain @click="printSignSheet" class="no-print">
          <el-icon><Printer /></el-icon>打印签到表
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="10">
        <div class="card-wrapper" style="min-height: 600px">
          <h3 style="margin-bottom: 16px">今日场次</h3>
          <div class="search-bar" style="margin-bottom: 12px">
            <el-date-picker v-model="currentDate" type="date" value-format="YYYY-MM-DD" style="width: 180px" />
          </div>
          <el-table :data="todayCourses" highlight-current-row @current-change="selectCourse" size="small" style="width: 100%">
            <el-table-column label="时间" width="110">
              <template #default="{ row }">{{ row.startTime }}</template>
            </el-table-column>
            <el-table-column label="课程名称" min-width="140" show-overflow-tooltip />
            <el-table-column label="教练" width="70">
              <template #default="{ row }">{{ courseStore.getCoachName(row.coachId) }}</template>
            </el-table-column>
            <el-table-column label="人数" width="70" align="center">
              <template #default="{ row }">{{ row.enrolled }}</template>
            </el-table-column>
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="selectedCourse?.id === row.id ? 'primary' : 'info'">
                  {{ selectedCourse?.id === row.id ? '当前' : '待签到' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>

      <el-col :span="14">
        <div class="card-wrapper" style="min-height: 600px">
          <div v-if="selectedCourse">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px">
              <h3>
                {{ selectedCourse.name }}
                <el-tag size="small" style="margin-left: 8px">{{ selectedCourse.date }} {{ selectedCourse.startTime }}-{{ selectedCourse.endTime }}</el-tag>
              </h3>
              <div>
                <span style="color: #606266; margin-right: 16px">
                  已签到: <strong style="color: #67c23a">{{ checkedCount }}</strong> / {{ selectedCourse.enrolled }}
                </span>
              </div>
            </div>

            <div class="search-bar" style="margin-bottom: 16px">
              <el-input v-model="quickSearch" placeholder="扫码或搜索会员ID/姓名/电话快速签到" style="width: 340px" clearable @keyup.enter="quickCheckin">
                <template #prefix><el-icon><Camera /></el-icon></template>
                <template #append>
                  <el-button @click="quickCheckin">快速签到</el-button>
                </template>
              </el-input>
            </div>

            <el-table :data="enrolledMembers" size="small" style="width: 100%">
              <el-table-column prop="name" label="姓名" width="100" />
              <el-table-column prop="phone" label="电话" width="130" />
              <el-table-column label="等级" width="90">
                <template #default="{ row }">
                  <el-tag :color="memberStore.getLevelColor(row.level)" effect="dark" style="color:#fff" size="small">
                    {{ memberStore.getLevelLabel(row.level) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="剩余次数" width="90" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.remainingSessions < 1 ? 'danger' : row.remainingSessions < 5 ? 'warning' : 'success'">
                    {{ row.remainingSessions }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="签到状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.checkStatus" :type="checkinStore.getStatusType(row.checkStatus)" size="small">
                    {{ checkinStore.getStatusLabel(row.checkStatus) }}
                  </el-tag>
                  <el-tag v-else type="info" size="small">未签到</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="签到时间" width="150">
                <template #default="{ row }">{{ row.checkTime || '-' }}</template>
              </el-table-column>
              <el-table-column label="备注" min-width="100" show-overflow-tooltip>
                <template #default="{ row }">{{ row.checkRemark || '-' }}</template>
              </el-table-column>
              <el-table-column label="操作" width="280" fixed="right" class="no-print">
                <template #default="{ row }">
                  <div class="table-actions">
                    <el-button size="small" type="success" @click="doCheckin(row, 'checked')" :disabled="row.checkStatus === 'checked' || row.remainingSessions < 1">签到</el-button>
                    <el-button size="small" type="warning" @click="openLeaveDialog(row)" :disabled="row.checkStatus">请假</el-button>
                    <el-button size="small" type="primary" @click="doCheckin(row, 'makeup')" :disabled="row.checkStatus === 'checked' || row.remainingSessions < 1">补课</el-button>
                    <el-button size="small" type="danger" @click="doCheckin(row, 'absent')" :disabled="row.checkStatus">爽约</el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
            <el-empty v-if="enrolledMembers.length === 0" description="暂无学员报名此课程" />
          </div>
          <el-empty v-else description="请在左侧选择一个场次" />
        </div>
      </el-col>
    </el-row>

    <el-dialog v-model="leaveDialogVisible" title="请假登记" width="400px">
      <el-form label-width="80px">
        <el-form-item label="会员">{{ leaveMember?.name }}</el-form-item>
        <el-form-item label="原因">
          <el-input v-model="leaveRemark" type="textarea" :rows="3" placeholder="请输入请假原因" />
        </el-form-item>
        <el-form-item label="补课安排">
          <el-select v-model="makeupCourseId" placeholder="选择补课场次（选填）" clearable style="width: 100%">
            <el-option v-for="c in makeupCourses" :key="c.id" :label="c.date + ' ' + c.startTime + ' ' + c.name" :value="c.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="leaveDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmLeave">确认请假</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCourseStore } from '@/stores/course'
import { useMemberStore } from '@/stores/member'
import { useCheckinStore } from '@/stores/checkin'
import { useConsumptionStore } from '@/stores/consumption'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const courseStore = useCourseStore()
const memberStore = useMemberStore()
const checkinStore = useCheckinStore()
const consumptionStore = useConsumptionStore()

const currentDate = ref(dayjs().format('YYYY-MM-DD'))
const selectedCourse = ref(null)
const quickSearch = ref('')

const todayCourses = computed(() => {
  return courseStore.courses
    .filter(c => c.date === currentDate.value && c.enrolled > 0)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
})

watch(todayCourses, list => {
  if (list.length > 0 && !selectedCourse.value) {
    selectedCourse.value = list[0]
  }
}, { immediate: true })

watch(currentDate, () => {
  selectedCourse.value = null
})

function selectCourse(row) {
  selectedCourse.value = row
}

const enrolledMembers = computed(() => {
  if (!selectedCourse.value) return []
  const enrollments = courseStore.getEnrollmentsByCourse(selectedCourse.value.id)
  return enrollments.map(e => {
    const member = memberStore.getMemberById(e.memberId)
    if (!member) return null
    const status = checkinStore.getMemberCheckinStatus(selectedCourse.value.id, member.id)
    const record = checkinStore.checkins.find(c => c.courseId === selectedCourse.value.id && c.memberId === member.id)
    return { ...member, checkStatus: status, checkTime: record?.checkTime, checkRemark: record?.remark }
  }).filter(Boolean)
})

const checkedCount = computed(() => enrolledMembers.value.filter(m => m.checkStatus === 'checked').length)

const makeupCourses = computed(() => {
  return courseStore.getUpcomingCourses(14).filter(c => c.id !== selectedCourse.value?.id)
})

function hasDeductedSession(memberId, courseId) {
  const existingDeduct = consumptionStore.transactions.find(t => 
    t.memberId === memberId && 
    t.courseId === courseId && 
    t.type === 'deduct'
  )
  return !!existingDeduct
}

function validateBeforeCheckin(member, status) {
  const courseId = selectedCourse.value.id
  
  if (status === 'checked' || status === 'makeup') {
    if (hasDeductedSession(member.id, courseId)) {
      ElMessage.warning(`会员「${member.name}」本场次已扣过课时，无法重复扣次`)
      return false
    }
    if (!memberStore.hasEnoughSessions(member.id)) {
      ElMessage.error(`会员「${member.name}」剩余次数不足，无法${status === 'checked' ? '签到' : '补课'}！当前剩余：${member.remainingSessions}次`)
      return false
    }
  }
  if (member.checkStatus === 'checked') {
    ElMessage.warning('该会员已完成签到')
    return false
  }
  if (member.checkStatus === 'makeup' && (status === 'checked' || status === 'makeup')) {
    ElMessage.warning('该会员已完成补课登记，本场次无法再扣次')
    return false
  }
  return true
}

function doCheckin(member, status) {
  if (!validateBeforeCheckin(member, status)) return

  const courseId = selectedCourse.value.id
  const msg = status === 'checked' ? '签到成功' : status === 'absent' ? '已标记爽约' : status === 'makeup' ? '补课登记成功' : '已处理'
  const confirmMsg = status === 'checked'
    ? `确定为「${member.name}」签到吗？将扣除1次课时。当前剩余：${member.remainingSessions}次`
    : status === 'makeup'
    ? `确定为「${member.name}」登记补课吗？将扣除1次课时。当前剩余：${member.remainingSessions}次`
    : status === 'absent'
    ? `确定标记「${member.name}」为爽约吗？爽约次数将累计。`
    : `确定为「${member.name}」执行${checkinStore.getStatusLabel(status)}吗？`

  ElMessageBox.confirm(confirmMsg, '确认操作', { type: 'warning' }).then(() => {
    checkinStore.addCheckin({
      courseId,
      memberId: member.id,
      status,
      remark: ''
    })
    
    if (status === 'checked' || status === 'makeup') {
      if (!hasDeductedSession(member.id, courseId)) {
        const deductResult = memberStore.deductSession(member.id)
        if (!deductResult) {
          ElMessage.error('扣次失败，请检查账户状态')
          return
        }
        consumptionStore.addTransaction({
          memberId: member.id,
          type: 'deduct',
          amount: 0,
          sessions: 1,
          method: 'balance',
          remark: selectedCourse.value.name + (status === 'checked' ? ' 签到扣次' : ' 补课扣次'),
          courseId: courseId
        })
      }
      if (status === 'checked') {
        memberStore.resetAbsent(member.id)
      }
    } else if (status === 'absent') {
      memberStore.incrementAbsent(member.id)
    }
    
    ElMessage.success(msg)
    quickSearch.value = ''
  }).catch(() => {})
}

function quickCheckin() {
  if (!quickSearch.value || !selectedCourse.value) return
  const members = memberStore.searchMembers(quickSearch.value)
  if (members.length === 0) {
    ElMessage.warning('未找到该会员')
    return
  }
  if (members.length > 1) {
    ElMessage.info('找到多个会员，请点击右侧操作按钮签到')
    return
  }
  const member = members[0]
  const isEnrolled = courseStore.isMemberEnrolled(selectedCourse.value.id, member.id)
  if (!isEnrolled) {
    ElMessage.warning(`会员「${member.name}」未报名本场次，无法签到`)
    return
  }
  const enrolledMember = enrolledMembers.value.find(m => m.id === member.id)
  if (enrolledMember) {
    doCheckin(enrolledMember, 'checked')
  }
}

const leaveDialogVisible = ref(false)
const leaveMember = ref(null)
const leaveRemark = ref('')
const makeupCourseId = ref('')

function openLeaveDialog(row) {
  leaveMember.value = row
  leaveRemark.value = ''
  makeupCourseId.value = ''
  leaveDialogVisible.value = true
}

function confirmLeave() {
  checkinStore.addCheckin({
    courseId: selectedCourse.value.id,
    memberId: leaveMember.value.id,
    status: 'leave',
    remark: leaveRemark.value
  })
  if (makeupCourseId.value) {
    const enrollResult = courseStore.enrollMember(makeupCourseId.value, leaveMember.value.id)
    if (!enrollResult.success) {
      ElMessage.warning(`补课报名失败：${enrollResult.msg}`)
    }
  }
  ElMessage.success('请假登记成功')
  leaveDialogVisible.value = false
}

function printSignSheet() {
  if (!selectedCourse.value) {
    ElMessage.warning('请先选择场次')
    return
  }
  window.print()
}
</script>

<style scoped>
.el-table >>> .current-row {
  background-color: #ecf5ff !important;
}
</style>

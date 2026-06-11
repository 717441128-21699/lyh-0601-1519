<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">会员档案</div>
      <el-button type="primary" @click="openAddDialog">
        <el-icon><Plus /></el-icon>新建会员
      </el-button>
    </div>

    <div class="search-bar card-wrapper">
      <el-input v-model="searchKeyword" placeholder="搜索姓名、电话、会员ID" style="width: 280px" clearable>
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="filterLevel" placeholder="会员等级" style="width: 150px" clearable>
        <el-option v-for="lvl in memberStore.levels" :key="lvl.value" :label="lvl.label" :value="lvl.value" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="会员状态" style="width: 150px" clearable>
        <el-option label="已激活" value="active" />
        <el-option label="即将到期" value="expiring" />
        <el-option label="已过期" value="expired" />
      </el-select>
    </div>

    <div class="card-wrapper">
      <el-table :data="filteredMembers" stripe style="width: 100%">
        <el-table-column prop="id" label="会员ID" width="120" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="phone" label="联系电话" width="140" />
        <el-table-column label="等级" width="110">
          <template #default="{ row }">
            <el-tag :color="memberStore.getLevelColor(row.level)" effect="dark" style="color:#fff">
              {{ memberStore.getLevelLabel(row.level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="joinDate" label="入会日期" width="120" />
        <el-table-column label="到期日" width="130">
          <template #default="{ row }">
            <span :style="{ color: isExpiring(row) ? '#f56c6c' : '' }">{{ row.expireDate }}</span>
          </template>
        </el-table-column>
        <el-table-column label="余额(元)" width="100" align="right">
          <template #default="{ row }">¥{{ row.balance.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="剩余次数" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.remainingSessions < 5 ? 'danger' : 'info'" size="small">
              {{ row.remainingSessions }}/{{ row.totalSessions }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="340" fixed="right" class="no-print">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button size="small" type="primary" @click="openDetailDialog(row)">详情</el-button>
              <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
              <el-button size="small" type="success" @click="openRechargeDialog(row)">充值</el-button>
              <el-button size="small" type="danger" @click="deleteMember(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top: 16px; text-align: right">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredMembers.length"
          layout="total, prev, pager, next"
        />
      </div>
    </div>

    <el-dialog v-model="memberDialogVisible" :title="isEdit ? '编辑会员' : '新建会员'" width="550px">
      <el-form ref="memberFormRef" :model="memberForm" :rules="memberRules" label-width="100px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="memberForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="memberForm.phone" placeholder="请输入手机号码" />
        </el-form-item>
        <el-form-item label="会员等级" prop="level">
          <el-select v-model="memberForm.level" style="width: 100%">
            <el-option v-for="lvl in memberStore.levels" :key="lvl.value" :label="lvl.label" :value="lvl.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="到期日" prop="expireDate">
          <el-date-picker v-model="memberForm.expireDate" type="date" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="初始余额">
          <el-input-number v-model="memberForm.balance" :min="0" :step="100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="初始次数">
          <el-input-number v-model="memberForm.remainingSessions" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="memberForm.remark" type="textarea" :rows="3" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="memberDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitMember">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rechargeDialogVisible" title="会员充值" width="550px">
      <el-form label-width="100px">
        <el-form-item label="会员">
          <span>{{ rechargeMember?.name }} ({{ rechargeMember?.phone }})</span>
        </el-form-item>
        <el-form-item label="充值方式">
          <el-radio-group v-model="rechargeMode">
            <el-radio value="custom">自定义充值</el-radio>
            <el-radio value="package">选择套餐</el-radio>
          </el-radio-group>
        </el-form-item>
        <template v-if="rechargeMode === 'package'">
          <el-form-item label="选择套餐">
            <el-select v-model="selectedPackageId" style="width: 100%" @change="onPackageChange">
              <el-option-group v-for="group in packageGroups" :key="group.type" :label="group.label">
                <el-option v-for="pkg in group.packages" :key="pkg.id" :label="pkg.name + ' - ¥' + pkg.price" :value="pkg.id">
                  <span>{{ pkg.name }}</span>
                  <span style="float: right; color: #67c23a">¥{{ pkg.price }}</span>
                </el-option>
              </el-option-group>
            </el-select>
          </el-form-item>
          <el-form-item v-if="selectedPackage" label="套餐详情">
            <div style="padding: 12px; background: #f5f7fa; border-radius: 4px; width: 100%">
              <div><strong>{{ selectedPackage.name }}</strong></div>
              <div style="color: #606266; font-size: 13px; margin-top: 4px">{{ selectedPackage.description }}</div>
              <div style="margin-top: 8px; font-size: 13px">
                <span v-if="selectedPackage.sessions > 0" style="margin-right: 16px">包含次数: <strong>{{ selectedPackage.sessions }}</strong>次</span>
                <span v-if="selectedPackage.balance > 0" style="margin-right: 16px">储值余额: <strong>¥{{ selectedPackage.balance + (selectedPackage.bonus || 0) }}</strong></span>
                <span v-if="selectedPackage.duration > 0">有效期: <strong>{{ selectedPackage.duration }}</strong>天</span>
                <span v-if="selectedPackage.bonus" style="margin-left: 16px; color: #f56c6c">赠送: ¥{{ selectedPackage.bonus }}</span>
              </div>
            </div>
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="充值金额(元)">
            <el-input-number v-model="rechargeAmount" :min="0" :step="100" style="width: 100%" />
          </el-form-item>
          <el-form-item label="充值次数">
            <el-input-number v-model="rechargeSessions" :min="0" style="width: 100%" />
          </el-form-item>
        </template>
        <el-form-item label="支付方式">
          <el-select v-model="rechargeMethod" style="width: 100%">
            <el-option v-for="m in consumptionStore.paymentMethods" :key="m.value" :label="m.label" :value="m.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="rechargeRemark" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rechargeDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!canConfirmRecharge" @click="confirmRecharge">确认充值</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="会员详情" width="920px" top="5vh">
      <div v-if="detailMember">
        <div class="detail-header">
          <div class="detail-avatar" :style="{ background: memberStore.getLevelColor(detailMember.level) }">
            {{ detailMember.name.charAt(0) }}
          </div>
          <div class="detail-basic">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 6px">
              <span class="detail-name">{{ detailMember.name }}</span>
              <el-tag :color="memberStore.getLevelColor(detailMember.level)" effect="dark" style="color:#fff; font-size: 12px">
                {{ memberStore.getLevelLabel(detailMember.level) }}
              </el-tag>
            </div>
            <div class="detail-meta">
              <span>ID：{{ detailMember.id }}</span>
              <span>电话：{{ detailMember.phone }}</span>
              <span>入会：{{ detailMember.joinDate }}</span>
              <span :style="{ color: isExpiring(detailMember) ? '#f56c6c' : '' }">到期：{{ detailMember.expireDate }}</span>
            </div>
          </div>
          <div class="detail-stats">
            <div class="detail-stat-item">
              <div class="ds-value blue">¥{{ detailMember.balance.toFixed(2) }}</div>
              <div class="ds-label">当前余额</div>
            </div>
            <div class="detail-stat-item">
              <div class="ds-value green">{{ detailMember.remainingSessions }}/{{ detailMember.totalSessions }}</div>
              <div class="ds-label">剩余次数/总次数</div>
            </div>
          </div>
        </div>

        <el-row :gutter="12" style="margin: 20px 0">
          <el-col :span="6">
            <div class="detail-mini-card">
              <div class="dmc-num blue">{{ memberTimelineStats.packageCount }}</div>
              <div class="dmc-label">购买套餐</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="detail-mini-card">
              <div class="dmc-num green">¥{{ memberTimelineStats.rechargeTotal.toFixed(2) }}</div>
              <div class="dmc-label">累计充值</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="detail-mini-card">
              <div class="dmc-num orange">{{ memberTimelineStats.checkinCount }}</div>
              <div class="dmc-label">签到次数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="detail-mini-card">
              <div class="dmc-num">{{ memberTimelineStats.enrollCount }}</div>
              <div class="dmc-label">报名课程</div>
            </div>
          </el-col>
        </el-row>

        <div class="timeline-filter">
          <el-radio-group v-model="timelineFilter" size="default">
            <el-radio-button value="all">全部</el-radio-button>
            <el-radio-button value="package">套餐购买</el-radio-button>
            <el-radio-button value="txn">充值/退款/消费</el-radio-button>
            <el-radio-button value="checkin">签到扣次</el-radio-button>
            <el-radio-button value="course">报名转课</el-radio-button>
            <el-radio-button value="follow">跟进记录</el-radio-button>
          </el-radio-group>
        </div>

        <div class="timeline-wrapper">
          <el-timeline style="padding: 8px 20px">
            <el-timeline-item
              v-for="(item, idx) in filteredTimeline"
              :key="idx"
              :timestamp="item.time"
              :type="item.dotType"
              :color="item.dotColor"
              size="large"
              hollow
            >
              <div class="tl-card">
                <div class="tl-header">
                  <el-tag :type="item.tagType" size="small" effect="light">{{ item.category }}</el-tag>
                  <span class="tl-title">{{ item.title }}</span>
                </div>
                <div class="tl-body">{{ item.description }}</div>
                <div v-if="item.meta" class="tl-meta">{{ item.meta }}</div>
              </div>
            </el-timeline-item>
            <div v-if="filteredTimeline.length === 0" style="text-align: center; padding: 40px; color: #909399">暂无相关记录</div>
          </el-timeline>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="openRechargeDialog(detailMember)">充值/购套餐</el-button>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useMemberStore } from '@/stores/member'
import { useConsumptionStore } from '@/stores/consumption'
import { useCourseStore } from '@/stores/course'
import { useCheckinStore } from '@/stores/checkin'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const memberStore = useMemberStore()
const consumptionStore = useConsumptionStore()
const courseStore = useCourseStore()
const checkinStore = useCheckinStore()

const searchKeyword = ref('')
const filterLevel = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = 10

const filteredMembers = computed(() => {
  let list = memberStore.searchMembers(searchKeyword.value)
  if (filterLevel.value) list = list.filter(m => m.level === filterLevel.value)
  if (filterStatus.value) {
    const now = dayjs()
    list = list.filter(m => {
      const daysLeft = dayjs(m.expireDate).diff(now, 'day')
      if (filterStatus.value === 'active') return daysLeft >= 0
      if (filterStatus.value === 'expiring') return daysLeft >= 0 && daysLeft <= 30
      if (filterStatus.value === 'expired') return daysLeft < 0
      return true
    })
  }
  return list
})

function isExpiring(row) {
  return dayjs(row.expireDate).diff(dayjs(), 'day') <= 7
}

const memberDialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref('')
const memberFormRef = ref()
const memberForm = reactive({
  name: '', phone: '', level: 'normal', expireDate: '', balance: 0, remainingSessions: 0, totalSessions: 0, remark: ''
})
const memberRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入电话', trigger: 'blur' }],
  level: [{ required: true, message: '请选择等级', trigger: 'change' }],
  expireDate: [{ required: true, message: '请选择到期日', trigger: 'change' }]
}

function resetForm() {
  memberForm.name = ''
  memberForm.phone = ''
  memberForm.level = 'normal'
  memberForm.expireDate = dayjs().add(1, 'year').format('YYYY-MM-DD')
  memberForm.balance = 0
  memberForm.remainingSessions = 0
  memberForm.totalSessions = 0
  memberForm.remark = ''
}

function openAddDialog() {
  isEdit.value = false
  editingId.value = ''
  resetForm()
  memberDialogVisible.value = true
}

function openEditDialog(row) {
  isEdit.value = true
  editingId.value = row.id
  Object.assign(memberForm, row)
  memberDialogVisible.value = true
}

function submitMember() {
  memberFormRef.value.validate(valid => {
    if (!valid) return
    memberForm.totalSessions = Math.max(memberForm.totalSessions, memberForm.remainingSessions)
    if (isEdit.value) {
      memberStore.updateMember(editingId.value, memberForm)
      ElMessage.success('会员信息已更新')
    } else {
      memberStore.addMember({ ...memberForm })
      ElMessage.success('会员创建成功')
    }
    memberDialogVisible.value = false
  })
}

function deleteMember(row) {
  ElMessageBox.confirm(`确定删除会员「${row.name}」吗？此操作不可恢复。`, '删除确认', {
    type: 'warning'
  }).then(() => {
    memberStore.deleteMember(row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

const rechargeDialogVisible = ref(false)
const rechargeMember = ref(null)
const rechargeAmount = ref(0)
const rechargeSessions = ref(0)
const rechargeMethod = ref('wechat')
const rechargeRemark = ref('')
const rechargeMode = ref('custom')
const selectedPackageId = ref('')

const selectedPackage = computed(() => {
  if (!selectedPackageId.value) return null
  return memberStore.getPackageById(selectedPackageId.value)
})

const packageGroups = computed(() => {
  const groups = [
    { type: 'time', label: '时间卡', packages: [] },
    { type: 'session', label: '次卡', packages: [] },
    { type: 'private', label: '私教包', packages: [] },
    { type: 'balance', label: '储值卡', packages: [] }
  ]
  memberStore.packages.forEach(pkg => {
    const group = groups.find(g => g.type === pkg.type)
    if (group) group.packages.push(pkg)
  })
  return groups
})

const canConfirmRecharge = computed(() => {
  if (rechargeMode.value === 'package') {
    return selectedPackageId.value
  }
  return rechargeAmount.value > 0 || rechargeSessions.value > 0
})

function onPackageChange() {
  if (selectedPackage.value) {
    rechargeAmount.value = selectedPackage.value.price
    rechargeSessions.value = 0
  }
}

function openRechargeDialog(row) {
  rechargeMember.value = row
  rechargeAmount.value = 0
  rechargeSessions.value = 0
  rechargeMethod.value = 'wechat'
  rechargeRemark.value = ''
  rechargeMode.value = 'custom'
  selectedPackageId.value = ''
  rechargeDialogVisible.value = true
}

function confirmRecharge() {
  if (rechargeMode.value === 'package') {
    if (!selectedPackageId.value) {
      ElMessage.warning('请选择套餐')
      return
    }
    const result = memberStore.purchasePackage(rechargeMember.value.id, selectedPackageId.value, rechargeMethod.value)
    if (result.success) {
      consumptionStore.addTransaction({
        memberId: rechargeMember.value.id,
        type: 'recharge',
        amount: selectedPackage.value.price,
        sessions: selectedPackage.value.sessions,
        method: rechargeMethod.value,
        remark: `购买套餐: ${selectedPackage.value.name}${rechargeRemark.value ? ' - ' + rechargeRemark.value : ''}`,
        packageId: selectedPackageId.value,
        packageName: selectedPackage.value.name
      })
      ElMessage.success(`成功购买「${selectedPackage.value.name}」`)
      rechargeDialogVisible.value = false
    } else {
      ElMessage.error(result.msg || '购买失败')
    }
  } else {
    if (rechargeAmount.value <= 0 && rechargeSessions.value <= 0) {
      ElMessage.warning('请输入充值金额或次数')
      return
    }
    if (rechargeAmount.value > 0) memberStore.addBalance(rechargeMember.value.id, rechargeAmount.value)
    if (rechargeSessions.value > 0) memberStore.addSessions(rechargeMember.value.id, rechargeSessions.value)
    consumptionStore.addTransaction({
      memberId: rechargeMember.value.id,
      type: 'recharge',
      amount: rechargeAmount.value,
      sessions: rechargeSessions.value,
      method: rechargeMethod.value,
      remark: rechargeRemark.value
    })
    ElMessage.success('充值成功')
    rechargeDialogVisible.value = false
  }
}

const detailDialogVisible = ref(false)
const detailMember = ref(null)
const timelineFilter = ref('all')

function openDetailDialog(row) {
  detailMember.value = row
  timelineFilter.value = 'all'
  detailDialogVisible.value = true
}

const memberTimelineStats = computed(() => {
  const id = detailMember.value?.id
  if (!id) return { packageCount: 0, rechargeTotal: 0, checkinCount: 0, enrollCount: 0 }
  const packages = memberStore.packageSales.filter(s => s.memberId === id)
  const txns = consumptionStore.transactions.filter(t => t.memberId === id)
  const checkins = checkinStore.checkins.filter(c => c.memberId === id && (c.status === 'checked' || c.status === 'makeup'))
  const enrolls = courseStore.enrollments.filter(e => e.memberId === id)
  const rechargeTotal = txns.filter(t => t.type === 'recharge').reduce((s, t) => s + t.amount, 0)
  return {
    packageCount: packages.length,
    rechargeTotal,
    checkinCount: checkins.length,
    enrollCount: enrolls.length
  }
})

const memberTimeline = computed(() => {
  const id = detailMember.value?.id
  if (!id) return []
  const events = []

  memberStore.packageSales
    .filter(s => s.memberId === id)
    .forEach(s => {
      events.push({
        time: s.date,
        sortTime: dayjs(s.date).valueOf(),
        category: '套餐购买',
        title: `购买「${s.packageName}」`,
        description: memberStore.getPackageTypeLabel(s.packageType),
        meta: `金额 ¥${s.amount.toFixed(2)} · 支付方式：${consumptionStore.getMethodLabel(s.paymentMethod)}`,
        tagType: 'success',
        dotType: 'success',
        dotColor: '#67c23a',
        filterType: 'package'
      })
    })

  consumptionStore.transactions
    .filter(t => t.memberId === id)
    .forEach(t => {
      const typeLabel = consumptionStore.getTypeLabel(t.type)
      const colorMap = { recharge: 'success', deduct: 'primary', refund: 'warning', consume: 'danger' }
      const tagMap = { recharge: 'success', deduct: 'primary', refund: 'warning', consume: 'danger' }
      const amountStr = t.amount > 0 ? `金额 ¥${t.amount.toFixed(2)}` : ''
      const sessionStr = t.sessions > 0 ? ` · ${t.sessions}次` : ''
      events.push({
        time: t.date,
        sortTime: dayjs(t.date).valueOf(),
        category: typeLabel,
        title: `${typeLabel}${t.packageName ? `（${t.packageName}）` : ''}`,
        description: t.remark || '-',
        meta: `${amountStr}${sessionStr} · 方式：${consumptionStore.getMethodLabel(t.method)}`,
        tagType: tagMap[t.type] || 'info',
        dotType: colorMap[t.type] || 'info',
        dotColor: consumptionStore.getTypeColor(t.type) || '#909399',
        filterType: 'txn'
      })
    })

  checkinStore.checkins
    .filter(c => c.memberId === id)
    .forEach(c => {
      const course = courseStore.courses.find(k => k.id === c.courseId)
      const statusLabel = checkinStore.getStatusLabel(c.status)
      const ok = c.status === 'checked' || c.status === 'makeup'
      events.push({
        time: c.checkTime,
        sortTime: dayjs(c.checkTime).valueOf(),
        category: '签到',
        title: `${course?.name || '未知课程'} · ${statusLabel}`,
        description: course ? `${course.date} ${course.startTime}-${course.endTime} · ${course.venue}` : '',
        meta: c.operator ? `操作人：${c.operator}` : '',
        tagType: ok ? 'primary' : 'warning',
        dotType: ok ? 'primary' : 'warning',
        dotColor: ok ? '#409eff' : '#e6a23c',
        filterType: 'checkin'
      })
    })

  courseStore.enrollments
    .filter(e => e.memberId === id)
    .forEach(e => {
      const course = courseStore.courses.find(k => k.id === e.courseId)
      if (e.transferred) {
        events.push({
          time: e.enrollDate,
          sortTime: dayjs(e.enrollDate).valueOf(),
          category: '转课',
          title: `从「${e.fromCourseName || '原课程'}」转入「${course?.name || '目标课程'}」`,
          description: course ? `${course.date} ${course.startTime}-${course.endTime}` : '',
          meta: '转课成功',
          tagType: 'warning',
          dotType: 'warning',
          dotColor: '#e6a23c',
          filterType: 'course'
        })
      } else {
        events.push({
          time: e.enrollDate,
          sortTime: dayjs(e.enrollDate).valueOf(),
          category: '报名',
          title: e.fromWaitlist ? `候补转正：「${course?.name || '课程'}」` : `报名「${course?.name || '课程'}」`,
          description: course ? `${course.date} ${course.startTime}-${course.endTime} · 教练：${courseStore.getCoachName(course.coachId)}` : '',
          meta: '',
          tagType: 'primary',
          dotType: 'primary',
          dotColor: '#409eff',
          filterType: 'course'
        })
      }
    })

  memberStore.getFollowRecordsByMember(id).forEach(r => {
    events.push({
      time: r.date,
      sortTime: dayjs(r.date).valueOf(),
      category: '跟进记录',
      title: `${r.type}`,
      description: r.content,
      meta: '',
      tagType: 'info',
      dotType: 'info',
      dotColor: '#909399',
      filterType: 'follow'
    })
  })

  return events.sort((a, b) => b.sortTime - a.sortTime)
})

const filteredTimeline = computed(() => {
  if (timelineFilter.value === 'all') return memberTimeline.value
  return memberTimeline.value.filter(e => e.filterType === timelineFilter.value)
})
</script>

<style scoped>
.detail-header {
  display: flex;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #ecf5ff 100%);
  border-radius: 8px;
  gap: 20px;
}

.detail-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 30px;
  font-weight: bold;
  flex-shrink: 0;
}

.detail-basic {
  flex: 1;
}

.detail-name {
  font-size: 22px;
  font-weight: bold;
  color: #303133;
}

.detail-meta {
  color: #606266;
  font-size: 13px;
  display: flex;
  gap: 20px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.detail-stats {
  display: flex;
  gap: 20px;
}

.detail-stat-item {
  text-align: center;
  min-width: 100px;
}

.ds-value {
  font-size: 22px;
  font-weight: bold;
}

.ds-value.blue { color: #409eff; }
.ds-value.green { color: #67c23a; }

.ds-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.detail-mini-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 14px;
  text-align: center;
}

.dmc-num {
  font-size: 20px;
  font-weight: bold;
}
.dmc-num.blue { color: #409eff; }
.dmc-num.green { color: #67c23a; }
.dmc-num.orange { color: #e6a23c; }

.dmc-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.timeline-filter {
  margin-bottom: 12px;
  text-align: center;
}

.timeline-wrapper {
  max-height: 450px;
  overflow-y: auto;
  border: 1px solid #f5f7fa;
  border-radius: 8px;
  background: #fafafa;
}

.tl-card {
  background: #fff;
  padding: 12px 16px;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  margin-left: 8px;
}

.tl-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.tl-title {
  font-weight: bold;
  color: #303133;
  font-size: 14px;
}

.tl-body {
  color: #606266;
  font-size: 13px;
  line-height: 1.6;
}

.tl-meta {
  color: #909399;
  font-size: 12px;
  margin-top: 6px;
}
</style>

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
        <el-table-column label="操作" width="260" fixed="right" class="no-print">
          <template #default="{ row }">
            <div class="table-actions">
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
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useMemberStore } from '@/stores/member'
import { useConsumptionStore } from '@/stores/consumption'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const memberStore = useMemberStore()
const consumptionStore = useConsumptionStore()

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
</script>

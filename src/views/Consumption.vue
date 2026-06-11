<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">储值消费</div>
      <div>
        <el-button type="success" @click="openRechargeDialog" class="no-print">
          <el-icon><Plus /></el-icon>会员充值
        </el-button>
        <el-button type="primary" @click="openConsumeDialog" class="no-print" style="margin-left: 8px">
          <el-icon><ShoppingCart /></el-icon>商品消费
        </el-button>
        <el-button type="warning" @click="openRefundDialog" class="no-print" style="margin-left: 8px">
          <el-icon><RefreshLeft /></el-icon>退款处理
        </el-button>
      </div>
    </div>

    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <div class="stat-card">
          <div class="label">总储值余额</div>
          <div class="value blue">¥{{ memberStore.totalBalance.toLocaleString() }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="label">本月充值</div>
          <div class="value green">¥{{ monthRecharge.toLocaleString() }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="label">本月消费</div>
          <div class="value orange">¥{{ monthConsume.toLocaleString() }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="label">交易笔数</div>
          <div class="value">{{ consumptionStore.transactions.length }}</div>
        </div>
      </el-col>
    </el-row>

    <div class="search-bar card-wrapper">
      <el-input v-model="searchKeyword" placeholder="搜索会员姓名/电话" style="width: 220px" clearable>
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="filterType" placeholder="交易类型" style="width: 150px" clearable>
        <el-option v-for="t in consumptionStore.txnTypes" :key="t.value" :label="t.label" :value="t.value" />
      </el-select>
      <el-select v-model="filterMethod" placeholder="支付方式" style="width: 150px" clearable>
        <el-option v-for="m in consumptionStore.paymentMethods" :key="m.value" :label="m.label" :value="m.value" />
      </el-select>
      <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 260px" />
    </div>

    <div class="card-wrapper">
      <el-table :data="filteredTransactions" stripe style="width: 100%">
        <el-table-column prop="date" label="交易时间" width="170" />
        <el-table-column label="会员" width="140">
          <template #default="{ row }">
            <span v-if="getMember(row.memberId)">{{ getMember(row.memberId).name }} ({{ getMember(row.memberId).phone }})</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="90">
          <template #default="{ row }">
            <el-tag :color="consumptionStore.getTypeColor(row.type)" effect="dark" style="color:#fff" size="small">
              {{ consumptionStore.getTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额(元)" width="110" align="right">
          <template #default="{ row }">
            <span v-if="row.amount > 0" :style="{ color: row.type === 'refund' || row.type === 'consume' ? '#f56c6c' : '#67c23a' }">
              {{ row.type === 'refund' || row.type === 'consume' ? '-' : '+' }}¥{{ row.amount.toFixed(2) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="次数" width="80" align="center">
          <template #default="{ row }">
            <span v-if="row.sessions > 0">{{ row.type === 'refund' || row.type === 'consume' || row.type === 'deduct' ? '-' : '+' }}{{ row.sessions }}次</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="支付方式" width="100">
          <template #default="{ row }">{{ consumptionStore.getMethodLabel(row.method) }}</template>
        </el-table-column>
        <el-table-column prop="operator" label="操作员" width="90" />
        <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
      </el-table>
    </div>

    <el-dialog v-model="rechargeDialogVisible" title="会员充值" width="500px">
      <el-form ref="rechargeFormRef" :model="rechargeForm" :rules="rechargeRules" label-width="100px">
        <el-form-item label="选择会员" prop="memberId">
          <el-select v-model="rechargeForm.memberId" filterable placeholder="搜索会员姓名" style="width: 100%" @change="updateRechargeMemberInfo">
            <el-option v-for="m in memberStore.members" :key="m.id" :label="m.name + ' - ' + m.phone" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="currentRechargeMember" label="当前账户">
          <span>余额: <strong>¥{{ currentRechargeMember.balance }}</strong> | 次数: <strong>{{ currentRechargeMember.remainingSessions }}/{{ currentRechargeMember.totalSessions }}</strong></span>
        </el-form-item>
        <el-form-item label="充值金额" prop="amount">
          <el-input-number v-model="rechargeForm.amount" :min="0" :step="100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="赠送次数">
          <el-input-number v-model="rechargeForm.sessions" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="支付方式" prop="method">
          <el-select v-model="rechargeForm.method" style="width: 100%">
            <el-option v-for="m in consumptionStore.paymentMethods.filter(p => p.value !== 'balance')" :key="m.value" :label="m.label" :value="m.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="rechargeForm.remark" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rechargeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRecharge">确认充值</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="consumeDialogVisible" title="商品/服务消费" width="500px">
      <el-form ref="consumeFormRef" :model="consumeForm" :rules="consumeRules" label-width="100px">
        <el-form-item label="选择会员" prop="memberId">
          <el-select v-model="consumeForm.memberId" filterable placeholder="搜索会员姓名" style="width: 100%" @change="updateConsumeMemberInfo">
            <el-option v-for="m in memberStore.members" :key="m.id" :label="m.name + ' 余额:¥' + m.balance + ' 次数:' + m.remainingSessions" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="currentConsumeMember" label="当前账户">
          <span :style="{ color: currentConsumeMember.balance < 200 ? '#f56c6c' : '' }">余额: <strong>¥{{ currentConsumeMember.balance }}</strong></span>
          <span style="margin-left: 20px; color: currentConsumeMember.remainingSessions < 5 ? '#f56c6c' : ''">次数: <strong>{{ currentConsumeMember.remainingSessions }}/{{ currentConsumeMember.totalSessions }}</strong></span>
        </el-form-item>
        <el-form-item label="消费项目" prop="remark">
          <el-input v-model="consumeForm.remark" placeholder="请输入消费项目，如：场地费、饮料等" />
        </el-form-item>
        <el-form-item label="消费金额" prop="amount">
          <el-input-number v-model="consumeForm.amount" :min="0" :step="10" style="width: 100%" />
        </el-form-item>
        <el-form-item label="扣次">
          <el-input-number v-model="consumeForm.sessions" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="支付方式" prop="method">
          <el-select v-model="consumeForm.method" style="width: 100%">
            <el-option v-for="m in consumptionStore.paymentMethods" :key="m.value" :label="m.label" :value="m.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="currentConsumeMember && consumeForm.method === 'balance' && consumeForm.amount > 0" label="余额校验">
          <el-tag :type="canConsumeBalance ? 'success' : 'danger'">
            {{ canConsumeBalance ? '余额充足' : '余额不足：需¥' + consumeForm.amount + '，仅有¥' + currentConsumeMember.balance }}
          </el-tag>
        </el-form-item>
        <el-form-item v-if="currentConsumeMember && consumeForm.sessions > 0" label="次数校验">
          <el-tag :type="canConsumeSessions ? 'success' : 'danger'">
            {{ canConsumeSessions ? '次数充足' : '次数不足：需' + consumeForm.sessions + '次，仅有' + currentConsumeMember.remainingSessions + '次' }}
          </el-tag>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="consumeDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!canSubmitConsume" @click="submitConsume">确认消费</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="refundDialogVisible" title="退款处理" width="500px">
      <el-form ref="refundFormRef" :model="refundForm" :rules="refundRules" label-width="100px">
        <el-form-item label="选择会员" prop="memberId">
          <el-select v-model="refundForm.memberId" filterable placeholder="搜索会员姓名" style="width: 100%" @change="updateRefundMemberInfo">
            <el-option v-for="m in memberStore.members" :key="m.id" :label="m.name + ' 余额:¥' + m.balance + ' 次数:' + m.remainingSessions" :value="m.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="currentRefundMember" label="当前账户">
          <span>余额: <strong>¥{{ currentRefundMember.balance }}</strong></span>
          <span style="margin-left: 20px">次数: <strong>{{ currentRefundMember.remainingSessions }}/{{ currentRefundMember.totalSessions }}</strong></span>
        </el-form-item>
        <el-form-item label="退款金额" prop="amount">
          <el-input-number v-model="refundForm.amount" :min="0" :step="10" style="width: 100%" />
        </el-form-item>
        <el-form-item label="退次">
          <el-input-number v-model="refundForm.sessions" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="退款原因" prop="remark">
          <el-input v-model="refundForm.remark" type="textarea" :rows="2" placeholder="请输入退款原因" />
        </el-form-item>
        <el-form-item label="退款方式">
          <el-select v-model="refundForm.method" style="width: 100%">
            <el-option v-for="m in consumptionStore.paymentMethods.filter(p => p.value !== 'balance')" :key="m.value" :label="m.label" :value="m.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="currentRefundMember" label="退款校验">
          <el-tag :type="canRefund ? 'success' : 'danger'">
            {{ canRefund ? '可以退款' : '退款超出账户余额/次数' }}
          </el-tag>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="refundDialogVisible = false">取消</el-button>
        <el-button type="danger" :disabled="!canRefund" @click="submitRefund">确认退款</el-button>
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
const filterType = ref('')
const filterMethod = ref('')
const dateRange = ref([])

const monthRecharge = computed(() => {
  const now = dayjs()
  return consumptionStore.transactions
    .filter(t => t.type === 'recharge' && dayjs(t.date).isSame(now, 'month'))
    .reduce((s, t) => s + t.amount, 0)
})

const monthConsume = computed(() => {
  const now = dayjs()
  return consumptionStore.transactions
    .filter(t => t.type === 'consume' && dayjs(t.date).isSame(now, 'month'))
    .reduce((s, t) => s + t.amount, 0)
})

function getMember(id) {
  return memberStore.getMemberById(id)
}

const filteredTransactions = computed(() => {
  let list = consumptionStore.transactions
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(t => {
      const m = getMember(t.memberId)
      return m && (m.name.toLowerCase().includes(kw) || m.phone.includes(kw))
    })
  }
  if (filterType.value) list = list.filter(t => t.type === filterType.value)
  if (filterMethod.value) list = list.filter(t => t.method === filterMethod.value)
  if (dateRange.value && dateRange.value.length === 2) {
    list = list.filter(t => t.date >= dateRange.value[0] && t.date <= dateRange.value[1] + ' 23:59:59')
  }
  return list
})

const rechargeDialogVisible = ref(false)
const rechargeFormRef = ref()
const currentRechargeMember = ref(null)
const rechargeForm = reactive({ memberId: '', amount: 0, sessions: 0, method: 'wechat', remark: '' })
const rechargeRules = {
  memberId: [{ required: true, message: '请选择会员', trigger: 'change' }],
  amount: [{ required: true, message: '请输入充值金额', trigger: 'blur' }],
  method: [{ required: true, message: '请选择支付方式', trigger: 'change' }]
}

function updateRechargeMemberInfo() {
  currentRechargeMember.value = getMember(rechargeForm.memberId)
}

function openRechargeDialog() {
  rechargeForm.memberId = ''
  rechargeForm.amount = 0
  rechargeForm.sessions = 0
  rechargeForm.method = 'wechat'
  rechargeForm.remark = ''
  currentRechargeMember.value = null
  rechargeDialogVisible.value = true
}

function submitRecharge() {
  rechargeFormRef.value.validate(valid => {
    if (!valid) return
    memberStore.addBalance(rechargeForm.memberId, rechargeForm.amount)
    if (rechargeForm.sessions > 0) memberStore.addSessions(rechargeForm.memberId, rechargeForm.sessions)
    consumptionStore.addTransaction({ ...rechargeForm, type: 'recharge' })
    updateRechargeMemberInfo()
    ElMessage.success('充值成功')
    rechargeDialogVisible.value = false
  })
}

const consumeDialogVisible = ref(false)
const consumeFormRef = ref()
const currentConsumeMember = ref(null)
const consumeForm = reactive({ memberId: '', amount: 0, sessions: 0, method: 'balance', remark: '' })
const consumeRules = {
  memberId: [{ required: true, message: '请选择会员', trigger: 'change' }],
  remark: [{ required: true, message: '请输入消费项目', trigger: 'blur' }],
  method: [{ required: true, message: '请选择支付方式', trigger: 'change' }]
}

const canConsumeBalance = computed(() => {
  if (!currentConsumeMember.value || consumeForm.method !== 'balance') return true
  return memberStore.hasEnoughBalance(consumeForm.memberId, consumeForm.amount)
})

const canConsumeSessions = computed(() => {
  if (!currentConsumeMember.value || consumeForm.sessions <= 0) return true
  return memberStore.hasEnoughSessions(consumeForm.memberId, consumeForm.sessions)
})

const canSubmitConsume = computed(() => {
  return currentConsumeMember.value && canConsumeBalance.value && canConsumeSessions.value &&
         (consumeForm.amount > 0 || consumeForm.sessions > 0) && consumeForm.remark
})

function updateConsumeMemberInfo() {
  currentConsumeMember.value = getMember(consumeForm.memberId)
}

function openConsumeDialog() {
  consumeForm.memberId = ''
  consumeForm.amount = 0
  consumeForm.sessions = 0
  consumeForm.method = 'balance'
  consumeForm.remark = ''
  currentConsumeMember.value = null
  consumeDialogVisible.value = true
}

function submitConsume() {
  consumeFormRef.value.validate(valid => {
    if (!valid) return

    if (consumeForm.amount > 0 || consumeForm.method === 'balance') {
      if (consumeForm.method === 'balance' && !canConsumeBalance.value) {
        ElMessage.error(`储值余额不足！需¥${consumeForm.amount}，当前仅有¥${currentConsumeMember.value.balance}`)
        return
      }
    }
    if (consumeForm.sessions > 0 && !canConsumeSessions.value) {
      ElMessage.error(`剩余次数不足！需${consumeForm.sessions}次，当前仅有${currentConsumeMember.value.remainingSessions}次`)
      return
    }

    const deductDesc = []
    if (consumeForm.amount > 0) deductDesc.push(`¥${consumeForm.amount}`)
    if (consumeForm.sessions > 0) deductDesc.push(`${consumeForm.sessions}次`)
    
    ElMessageBox.confirm(
      `确认扣除「${currentConsumeMember.value.name}」的${deductDesc.join(' ')}吗？`,
      '消费确认',
      { type: 'warning' }
    ).then(() => {
      if (consumeForm.amount > 0 && consumeForm.method === 'balance') {
        const result = memberStore.deductBalance(consumeForm.memberId, consumeForm.amount)
        if (!result) {
          ElMessage.error('扣款失败，请检查账户余额')
          return
        }
      }
      if (consumeForm.sessions > 0) {
        for (let i = 0; i < consumeForm.sessions; i++) {
          const result = memberStore.deductSession(consumeForm.memberId)
          if (!result) {
            ElMessage.error('扣次失败，请检查剩余次数')
            return
          }
        }
      }
      consumptionStore.addTransaction({ ...consumeForm, type: 'consume' })
      updateConsumeMemberInfo()
      ElMessage.success('消费登记成功')
      consumeDialogVisible.value = false
    }).catch(() => {})
  })
}

const refundDialogVisible = ref(false)
const refundFormRef = ref()
const currentRefundMember = ref(null)
const refundForm = reactive({ memberId: '', amount: 0, sessions: 0, method: 'wechat', remark: '' })
const refundRules = {
  memberId: [{ required: true, message: '请选择会员', trigger: 'change' }],
  amount: [{ required: true, message: '请输入退款金额', trigger: 'blur' }],
  remark: [{ required: true, message: '请输入退款原因', trigger: 'blur' }]
}

const canRefund = computed(() => {
  if (!currentRefundMember.value) return false
  if (refundForm.amount > currentRefundMember.value.balance) return false
  if (refundForm.sessions > currentRefundMember.value.remainingSessions) return false
  return refundForm.amount > 0 || refundForm.sessions > 0
})

function updateRefundMemberInfo() {
  currentRefundMember.value = getMember(refundForm.memberId)
}

function openRefundDialog() {
  refundForm.memberId = ''
  refundForm.amount = 0
  refundForm.sessions = 0
  refundForm.method = 'wechat'
  refundForm.remark = ''
  currentRefundMember.value = null
  refundDialogVisible.value = true
}

function submitRefund() {
  refundFormRef.value.validate(valid => {
    if (!valid) return
    if (!canRefund.value) {
      ElMessage.error('退款金额/次数超出账户可用额度')
      return
    }
    ElMessageBox.confirm(
      `确认退还「${currentRefundMember.value.name}」${refundForm.amount > 0 ? '¥' + refundForm.amount : ''}${refundForm.sessions > 0 ? ' ' + refundForm.sessions + '次' : ''}吗？`,
      '退款确认',
      { type: 'warning' }
    ).then(() => {
      if (refundForm.amount > 0) {
        memberStore.addBalance(refundForm.memberId, -refundForm.amount)
      }
      if (refundForm.sessions > 0) {
        memberStore.addSessions(refundForm.memberId, -refundForm.sessions)
      }
      consumptionStore.addTransaction({ ...refundForm, type: 'refund' })
      updateRefundMemberInfo()
      ElMessage.success('退款成功')
      refundDialogVisible.value = false
    }).catch(() => {})
  })
}
</script>

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
          <el-select v-model="rechargeForm.memberId" filterable placeholder="搜索会员姓名" style="width: 100%">
            <el-option v-for="m in memberStore.members" :key="m.id" :label="m.name + ' - ' + m.phone" :value="m.id" />
          </el-select>
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
          <el-select v-model="consumeForm.memberId" filterable placeholder="搜索会员姓名" style="width: 100%">
            <el-option v-for="m in memberStore.members" :key="m.id" :label="m.name + ' 余额:¥' + m.balance + ' 次数:' + m.remainingSessions" :value="m.id" />
          </el-select>
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
      </el-form>
      <template #footer>
        <el-button @click="consumeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitConsume">确认消费</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="refundDialogVisible" title="退款处理" width="500px">
      <el-form ref="refundFormRef" :model="refundForm" :rules="refundRules" label-width="100px">
        <el-form-item label="选择会员" prop="memberId">
          <el-select v-model="refundForm.memberId" filterable placeholder="搜索会员姓名" style="width: 100%">
            <el-option v-for="m in memberStore.members" :key="m.id" :label="m.name + ' 余额:¥' + m.balance + ' 次数:' + m.remainingSessions" :value="m.id" />
          </el-select>
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
      </el-form>
      <template #footer>
        <el-button @click="refundDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="submitRefund">确认退款</el-button>
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
const rechargeForm = reactive({ memberId: '', amount: 0, sessions: 0, method: 'wechat', remark: '' })
const rechargeRules = {
  memberId: [{ required: true, message: '请选择会员', trigger: 'change' }],
  amount: [{ required: true, message: '请输入充值金额', trigger: 'blur' }],
  method: [{ required: true, message: '请选择支付方式', trigger: 'change' }]
}

function openRechargeDialog() {
  rechargeForm.memberId = ''
  rechargeForm.amount = 0
  rechargeForm.sessions = 0
  rechargeForm.method = 'wechat'
  rechargeForm.remark = ''
  rechargeDialogVisible.value = true
}

function submitRecharge() {
  rechargeFormRef.value.validate(valid => {
    if (!valid) return
    memberStore.addBalance(rechargeForm.memberId, rechargeForm.amount)
    if (rechargeForm.sessions > 0) memberStore.addSessions(rechargeForm.memberId, rechargeForm.sessions)
    consumptionStore.addTransaction({ ...rechargeForm, type: 'recharge' })
    ElMessage.success('充值成功')
    rechargeDialogVisible.value = false
  })
}

const consumeDialogVisible = ref(false)
const consumeFormRef = ref()
const consumeForm = reactive({ memberId: '', amount: 0, sessions: 0, method: 'balance', remark: '' })
const consumeRules = {
  memberId: [{ required: true, message: '请选择会员', trigger: 'change' }],
  amount: [{ required: true, message: '请输入消费金额', trigger: 'blur' }],
  remark: [{ required: true, message: '请输入消费项目', trigger: 'blur' }],
  method: [{ required: true, message: '请选择支付方式', trigger: 'change' }]
}

function openConsumeDialog() {
  consumeForm.memberId = ''
  consumeForm.amount = 0
  consumeForm.sessions = 0
  consumeForm.method = 'balance'
  consumeForm.remark = ''
  consumeDialogVisible.value = true
}

function submitConsume() {
  consumeFormRef.value.validate(valid => {
    if (!valid) return
    const member = getMember(consumeForm.memberId)
    if (consumeForm.method === 'balance') {
      if (member.balance < consumeForm.amount) {
        ElMessage.error('储值余额不足')
        return
      }
      memberStore.deductBalance(consumeForm.memberId, consumeForm.amount)
    }
    if (consumeForm.sessions > 0) {
      if (member.remainingSessions < consumeForm.sessions) {
        ElMessage.error('剩余次数不足')
        return
      }
      for (let i = 0; i < consumeForm.sessions; i++) {
        memberStore.deductSession(consumeForm.memberId)
      }
    }
    consumptionStore.addTransaction({ ...consumeForm, type: 'consume' })
    ElMessage.success('消费登记成功')
    consumeDialogVisible.value = false
  })
}

const refundDialogVisible = ref(false)
const refundFormRef = ref()
const refundForm = reactive({ memberId: '', amount: 0, sessions: 0, method: 'wechat', remark: '' })
const refundRules = {
  memberId: [{ required: true, message: '请选择会员', trigger: 'change' }],
  amount: [{ required: true, message: '请输入退款金额', trigger: 'blur' }],
  remark: [{ required: true, message: '请输入退款原因', trigger: 'blur' }]
}

function openRefundDialog() {
  refundForm.memberId = ''
  refundForm.amount = 0
  refundForm.sessions = 0
  refundForm.method = 'wechat'
  refundForm.remark = ''
  refundDialogVisible.value = true
}

function submitRefund() {
  refundFormRef.value.validate(valid => {
    if (!valid) return
    ElMessageBox.confirm('确认执行退款操作吗？', '退款确认', { type: 'warning' }).then(() => {
      memberStore.addBalance(refundForm.memberId, -refundForm.amount)
      if (refundForm.sessions > 0) memberStore.addSessions(refundForm.memberId, -refundForm.sessions)
      consumptionStore.addTransaction({ ...refundForm, type: 'refund' })
      ElMessage.success('退款成功')
      refundDialogVisible.value = false
    }).catch(() => {})
  })
}
</script>

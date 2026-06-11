<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">经营统计</div>
      <div class="no-print">
        <el-tabs v-model="activeTab" style="margin-right: 20px">
          <el-tab-pane label="综合统计" name="overview" />
          <el-tab-pane label="前台日报" name="daily" />
          <el-tab-pane label="套餐销售" name="packages" />
        </el-tabs>
        <el-select v-if="activeTab !== 'daily'" v-model="statRange" style="width: 150px; margin-right: 12px">
          <el-option label="近7天" value="7" />
          <el-option label="近30天" value="30" />
          <el-option label="本月" value="month" />
          <el-option label="全部" value="all" />
        </el-select>
        <el-date-picker v-if="activeTab === 'daily'" v-model="dailyDate" type="date" style="width: 150px; margin-right: 12px" />
        <el-button type="primary" @click="printReport">
          <el-icon><Printer /></el-icon>{{ activeTab === 'daily' ? '打印交班' : '导出报表' }}
        </el-button>
      </div>
    </div>
    
    <div v-if="activeTab === 'overview'">

    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="4">
        <div class="stat-card">
          <div class="label">会员总数</div>
          <div class="value blue">{{ memberStore.members.length }}</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <div class="label">活跃会员</div>
          <div class="value green">{{ memberStore.activeCount }}</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <div class="label">本月新增</div>
          <div class="value orange">{{ monthNewMembers }}</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <div class="label">课程总数</div>
          <div class="value">{{ courseStore.courses.length }}</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <div class="label">总收入(元)</div>
          <div class="value green">¥{{ totalIncome.toLocaleString() }}</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card">
          <div class="label">复购率</div>
          <div class="value blue">{{ repurchaseRate }}%</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="12">
        <div class="card-wrapper">
          <h4 style="margin-bottom: 16px">会员增长趋势（近6个月）</h4>
          <div ref="memberGrowthChartRef" style="width: 100%; height: 300px"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card-wrapper">
          <h4 style="margin-bottom: 16px">收入趋势（近6个月）</h4>
          <div ref="incomeTrendChartRef" style="width: 100%; height: 300px"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="8">
        <div class="card-wrapper">
          <h4 style="margin-bottom: 16px">教练课时统计</h4>
          <div ref="coachHoursChartRef" style="width: 100%; height: 300px"></div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="card-wrapper">
          <h4 style="margin-bottom: 16px">课程满班率 Top 10</h4>
          <div ref="fillRateChartRef" style="width: 100%; height: 300px"></div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="card-wrapper">
          <h4 style="margin-bottom: 16px">收入构成</h4>
          <div ref="incomePieChartRef" style="width: 100%; height: 300px"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="card-wrapper">
          <h4 style="margin-bottom: 16px">会员等级分布</h4>
          <el-table :data="levelDistribution" size="small" style="width: 100%">
            <el-table-column prop="label" label="等级" />
            <el-table-column prop="count" label="人数" width="100" align="center" />
            <el-table-column label="占比" width="150">
              <template #default="{ row }">
                <el-progress :percentage="row.percent" :stroke-width="12" />
              </template>
            </el-table-column>
            <el-table-column label="平均余额" width="120" align="right">
              <template #default="{ row }">¥{{ row.avgBalance.toFixed(0) }}</template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card-wrapper">
          <h4 style="margin-bottom: 16px">会员提醒</h4>
          <el-tabs v-model="activeReminderTab">
            <el-tab-pane label="即将到期" name="expire">
              <el-table :data="memberStore.getExpiringMembers()" size="small" style="width: 100%">
                <el-table-column prop="name" label="姓名" width="80" />
                <el-table-column prop="phone" label="电话" width="120" />
                <el-table-column prop="expireDate" label="到期日" width="110" />
                <el-table-column label="剩余" width="80" align="center">
                  <template #default="{ row }">
                    <el-tag :type="row.daysLeft <= 3 ? 'danger' : row.daysLeft <= 7 ? 'warning' : 'success'" size="small">
                      {{ row.daysLeft }}天
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
            <el-tab-pane label="余额不足" name="balance">
              <el-table :data="memberStore.getLowBalanceMembers()" size="small" style="width: 100%">
                <el-table-column prop="name" label="姓名" width="80" />
                <el-table-column prop="phone" label="电话" width="120" />
                <el-table-column label="余额(元)" width="100" align="right">
                  <template #default="{ row }">
                    <span style="color: #f56c6c">¥{{ row.balance }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="剩余次数" width="90" align="center">
                  <template #default="{ row }">
                    <el-tag type="danger" size="small">{{ row.remainingSessions }}次</el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
            <el-tab-pane label="连续缺席" name="absent">
              <el-table :data="memberStore.getAbsentMembers()" size="small" style="width: 100%">
                <el-table-column prop="name" label="姓名" width="80" />
                <el-table-column prop="phone" label="电话" width="120" />
                <el-table-column label="缺席次数" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag type="danger" size="small">{{ row.absentCount }}次</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="remark" label="备注" />
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-col>
    </el-row>
    </div>
    
    <div v-if="activeTab === 'daily'">
      <div class="daily-report">
        <div class="report-header">
          <h2>前台日报 - {{ dailyDateStr }}</h2>
          <div class="report-meta">打印时间：{{ dayjs().format('YYYY-MM-DD HH:mm:ss') }}</div>
        </div>
        
        <el-row :gutter="20" style="margin-bottom: 20px">
          <el-col :span="4">
            <div class="stat-card">
              <div class="label">新增报名</div>
              <div class="value blue">{{ dailyStats.newEnrollments }}</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="stat-card">
              <div class="label">签到人次</div>
              <div class="value green">{{ dailyStats.checkins }}</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="stat-card">
              <div class="label">充值金额</div>
              <div class="value orange">¥{{ dailyStats.recharge.toFixed(2) }}</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="stat-card">
              <div class="label">退款金额</div>
              <div class="value red">¥{{ dailyStats.refund.toFixed(2) }}</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="stat-card">
              <div class="label">扣次数量</div>
              <div class="value blue">{{ dailyStats.sessionsDeducted }}</div>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="stat-card">
              <div class="label">实际收入</div>
              <div class="value green">¥{{ dailyStats.actualIncome.toFixed(2) }}</div>
            </div>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="card-wrapper">
              <h4 style="margin-bottom: 16px">当日充值明细</h4>
              <el-table :data="dailyRechargeList" size="small" style="width: 100%" max-height="300">
                <el-table-column prop="memberName" label="会员" width="100" />
                <el-table-column label="金额" width="100" align="right">
                  <template #default="{ row }">¥{{ row.amount.toFixed(2) }}</template>
                </el-table-column>
                <el-table-column label="次数" width="80" align="center">
                  <template #default="{ row }">{{ row.sessions || 0 }}次</template>
                </el-table-column>
                <el-table-column prop="method" label="方式" width="80" />
                <el-table-column prop="remark" label="备注" />
                <el-table-column prop="time" label="时间" width="160" />
              </el-table>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="card-wrapper">
              <h4 style="margin-bottom: 16px">当日签到明细</h4>
              <el-table :data="dailyCheckinList" size="small" style="width: 100%" max-height="300">
                <el-table-column prop="memberName" label="会员" width="100" />
                <el-table-column prop="courseName" label="课程" width="150" />
                <el-table-column label="状态" width="80" align="center">
                  <template #default="{ row }">
                    <el-tag :type="row.status === 'checked' ? 'success' : row.status === 'makeup' ? 'primary' : row.status === 'absent' ? 'danger' : 'info'" size="small">
                      {{ row.statusLabel }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="扣次" width="60" align="center">
                  <template #default="{ row }">{{ row.sessionsDeducted ? '是' : '否' }}</template>
                </el-table-column>
                <el-table-column prop="time" label="时间" width="160" />
              </el-table>
            </div>
          </el-col>
        </el-row>
        
        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="12">
            <div class="card-wrapper">
              <h4 style="margin-bottom: 16px">当日消费明细</h4>
              <el-table :data="dailyConsumeList" size="small" style="width: 100%" max-height="300">
                <el-table-column prop="memberName" label="会员" width="100" />
                <el-table-column label="金额" width="100" align="right">
                  <template #default="{ row }">¥{{ row.amount.toFixed(2) }}</template>
                </el-table-column>
                <el-table-column label="次数" width="80" align="center">
                  <template #default="{ row }">{{ row.sessions || 0 }}次</template>
                </el-table-column>
                <el-table-column prop="method" label="方式" width="80" />
                <el-table-column prop="remark" label="项目" />
                <el-table-column prop="time" label="时间" width="160" />
              </el-table>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="card-wrapper">
              <h4 style="margin-bottom: 16px">当日退款明细</h4>
              <el-table :data="dailyRefundList" size="small" style="width: 100%" max-height="300">
                <el-table-column prop="memberName" label="会员" width="100" />
                <el-table-column label="金额" width="100" align="right">
                  <template #default="{ row }">¥{{ row.amount.toFixed(2) }}</template>
                </el-table-column>
                <el-table-column label="次数" width="80" align="center">
                  <template #default="{ row }">{{ row.sessions || 0 }}次</template>
                </el-table-column>
                <el-table-column prop="method" label="方式" width="80" />
                <el-table-column prop="remark" label="原因" />
                <el-table-column prop="time" label="时间" width="160" />
              </el-table>
            </div>
          </el-col>
        </el-row>
        
        <div class="report-footer no-print" style="margin-top: 30px; text-align: center">
          <el-button type="primary" size="large" @click="printDailyReport">
            <el-icon><Printer /></el-icon>打印交班单
          </el-button>
        </div>
      </div>
    </div>
    
    <div v-if="activeTab === 'packages'">
      <el-row :gutter="20" style="margin-bottom: 20px">
        <el-col :span="6">
          <div class="stat-card">
            <div class="label">套餐销售总数</div>
            <div class="value blue">{{ packageSalesStats.totalCount }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="label">套餐销售总额</div>
            <div class="value green">¥{{ packageSalesStats.totalAmount.toFixed(2) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="label">最畅销套餐</div>
            <div class="value orange">{{ packageSalesStats.topPackage?.name || '-' }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="label">最畅销套餐销量</div>
            <div class="value">{{ packageSalesStats.topPackage?.count || 0 }}份</div>
          </div>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="card-wrapper">
            <h4 style="margin-bottom: 16px">套餐销售统计（按类型）</h4>
            <div ref="packageTypeChartRef" style="width: 100%; height: 350px"></div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="card-wrapper">
            <h4 style="margin-bottom: 16px">套餐销售排行</h4>
            <div ref="packageRankChartRef" style="width: 100%; height: 350px"></div>
          </div>
        </el-col>
      </el-row>
      
      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="24">
          <div class="card-wrapper">
            <h4 style="margin-bottom: 16px">套餐销售明细</h4>
            <el-table :data="packageSalesList" size="small" style="width: 100%" max-height="400">
              <el-table-column prop="memberName" label="会员" width="100" />
              <el-table-column prop="packageName" label="套餐名称" min-width="150" />
              <el-table-column prop="type" label="类型" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.type === 'time' ? 'primary' : row.type === 'session' ? 'success' : row.type === 'private' ? 'warning' : 'info'" size="small">
                    {{ row.typeLabel }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="价格" width="100" align="right">
                <template #default="{ row }">¥{{ row.price.toFixed(2) }}</template>
              </el-table-column>
              <el-table-column prop="paymentMethod" label="支付方式" width="100">
                <template #default="{ row }">
                  <el-tag type="info" size="small">{{ row.paymentMethodLabel }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="saleTime" label="购买时间" width="160" />
            </el-table>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { useMemberStore } from '@/stores/member'
import { useCourseStore } from '@/stores/course'
import { useConsumptionStore } from '@/stores/consumption'
import { useCheckinStore } from '@/stores/checkin'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const memberStore = useMemberStore()
const courseStore = useCourseStore()
const consumptionStore = useConsumptionStore()
const checkinStore = useCheckinStore()

const statRange = ref('30')
const activeReminderTab = ref('expire')
const activeTab = ref('overview')
const dailyDate = ref(dayjs().toDate())

const dailyDateStr = computed(() => dayjs(dailyDate.value).format('YYYY年MM月DD日'))

const monthNewMembers = computed(() => {
  const now = dayjs()
  return memberStore.members.filter(m => dayjs(m.joinDate).isSame(now, 'month')).length
})

const totalIncome = computed(() => consumptionStore.totalRecharge + consumptionStore.totalConsume)

const repurchaseRate = computed(() => {
  const activeMembers = memberStore.members.filter(m => m.totalSessions > 0).length
  if (activeMembers === 0) return 0
  const repurchased = memberStore.members.filter(m => m.totalSessions >= 20).length
  return Math.round(repurchased / activeMembers * 100)
})

const levelDistribution = computed(() => {
  return memberStore.levels.map(lvl => {
    const members = memberStore.members.filter(m => m.level === lvl.value)
    const avgBalance = members.length > 0 ? members.reduce((s, m) => s + m.balance, 0) / members.length : 0
    return {
      label: lvl.label,
      count: members.length,
      percent: memberStore.members.length > 0 ? Math.round(members.length / memberStore.members.length * 100) : 0,
      avgBalance
    }
  })
})

const isSameDay = (timestamp) => {
  return dayjs(timestamp).isSame(dayjs(dailyDate.value), 'day')
}

const getMemberName = (memberId) => {
  const member = memberStore.members.find(m => m.id === memberId)
  return member ? member.name : '未知会员'
}

const getCourseName = (courseId) => {
  const course = courseStore.courses.find(c => c.id === courseId)
  return course ? course.name : '未知课程'
}

const dailyStats = computed(() => {
  const enrollments = courseStore.enrollments.filter(e => isSameDay(e.enrolledAt))
  const checkins = checkinStore.checkins.filter(c => isSameDay(c.checkTime))
  const recharges = consumptionStore.transactions.filter(t => t.type === 'recharge' && isSameDay(t.createdAt))
  const refunds = consumptionStore.transactions.filter(t => t.type === 'refund' && isSameDay(t.createdAt))
  const deducts = consumptionStore.transactions.filter(t => t.type === 'deduct' && isSameDay(t.createdAt))
  
  const rechargeTotal = recharges.reduce((sum, t) => sum + t.amount, 0)
  const refundTotal = refunds.reduce((sum, t) => sum + t.amount, 0)
  const sessionsDeducted = deducts.reduce((sum, t) => sum + t.sessions, 0)
  
  return {
    newEnrollments: enrollments.length,
    checkins: checkins.filter(c => c.status === 'checked' || c.status === 'makeup').length,
    recharge: Math.round(rechargeTotal * 100) / 100,
    refund: Math.round(refundTotal * 100) / 100,
    sessionsDeducted,
    actualIncome: Math.round((rechargeTotal - refundTotal) * 100) / 100
  }
})

const dailyRechargeList = computed(() => {
  return consumptionStore.transactions
    .filter(t => t.type === 'recharge' && isSameDay(t.createdAt))
    .map(t => ({
      ...t,
      memberName: getMemberName(t.memberId),
      time: dayjs(t.createdAt).format('YYYY-MM-DD HH:mm:ss')
    }))
    .sort((a, b) => b.createdAt - a.createdAt)
})

const dailyConsumeList = computed(() => {
  return consumptionStore.transactions
    .filter(t => t.type === 'consume' && isSameDay(t.createdAt))
    .map(t => ({
      ...t,
      memberName: getMemberName(t.memberId),
      time: dayjs(t.createdAt).format('YYYY-MM-DD HH:mm:ss')
    }))
    .sort((a, b) => b.createdAt - a.createdAt)
})

const dailyRefundList = computed(() => {
  return consumptionStore.transactions
    .filter(t => t.type === 'refund' && isSameDay(t.createdAt))
    .map(t => ({
      ...t,
      memberName: getMemberName(t.memberId),
      time: dayjs(t.createdAt).format('YYYY-MM-DD HH:mm:ss')
    }))
    .sort((a, b) => b.createdAt - a.createdAt)
})

const dailyCheckinList = computed(() => {
  return checkinStore.checkins
    .filter(c => isSameDay(c.checkTime))
    .map(c => {
      const hasDeduct = consumptionStore.transactions.find(t => 
        t.memberId === c.memberId && 
        t.courseId === c.courseId && 
        t.type === 'deduct'
      )
      return {
        ...c,
        memberName: getMemberName(c.memberId),
        courseName: getCourseName(c.courseId),
        statusLabel: checkinStore.getStatusLabel(c.status),
        sessionsDeducted: !!hasDeduct,
        time: dayjs(c.checkTime).format('YYYY-MM-DD HH:mm:ss')
      }
    })
    .sort((a, b) => b.checkTime - a.checkTime)
})

const packageSalesList = computed(() => {
  const typeLabels = { time: '时间卡', session: '次卡', private: '私教包', stored: '储值卡' }
  const methodLabels = { wechat: '微信', alipay: '支付宝', cash: '现金', card: '刷卡', balance: '余额' }
  
  return memberStore.packageSales.map(s => ({
    ...s,
    memberName: getMemberName(s.memberId),
    typeLabel: typeLabels[s.type] || s.type,
    paymentMethodLabel: methodLabels[s.paymentMethod] || s.paymentMethod,
    saleTime: dayjs(s.saleTime).format('YYYY-MM-DD HH:mm:ss')
  })).sort((a, b) => b.saleTime - a.saleTime)
})

const packageSalesStats = computed(() => {
  const stats = memberStore.getPackageSalesStats()
  return {
    totalCount: stats.totalCount,
    totalAmount: stats.totalAmount,
    topPackage: stats.byPackage[0] || null
  }
})

const memberGrowthChartRef = ref(null)
const incomeTrendChartRef = ref(null)
const coachHoursChartRef = ref(null)
const fillRateChartRef = ref(null)
const incomePieChartRef = ref(null)
const packageTypeChartRef = ref(null)
const packageRankChartRef = ref(null)

let charts = []

function initCharts() {
  if (memberGrowthChartRef.value) {
    const chart = echarts.init(memberGrowthChartRef.value)
    const data = memberStore.getNewMembersByMonth()
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, top: 30, bottom: 30 },
      xAxis: { type: 'category', data: data.map(d => d.month) },
      yAxis: { type: 'value', minInterval: 1 },
      series: [{
        name: '新增会员',
        type: 'line',
        smooth: true,
        data: data.map(d => d.count),
        areaStyle: { color: 'rgba(64, 158, 255, 0.2)' },
        lineStyle: { color: '#409eff', width: 3 },
        itemStyle: { color: '#409eff' }
      }]
    })
    charts.push(chart)
  }

  if (incomeTrendChartRef.value) {
    const chart = echarts.init(incomeTrendChartRef.value)
    const data = consumptionStore.getIncomeByMonth()
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['充值收入', '消费收入'], top: 0 },
      grid: { left: 50, right: 20, top: 40, bottom: 30 },
      xAxis: { type: 'category', data: data.map(d => d.month) },
      yAxis: { type: 'value' },
      series: [
        { name: '充值收入', type: 'bar', stack: 'total', data: data.map(d => d['充值收入']), itemStyle: { color: '#67c23a' } },
        { name: '消费收入', type: 'bar', stack: 'total', data: data.map(d => d['消费收入']), itemStyle: { color: '#e6a23c' } }
      ]
    })
    charts.push(chart)
  }

  if (coachHoursChartRef.value) {
    const chart = echarts.init(coachHoursChartRef.value)
    const data = courseStore.getCoachHoursByMonth()
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 60, right: 20, top: 20, bottom: 30 },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: data.map(d => d.name) },
      series: [{
        type: 'bar',
        data: data.map(d => d.hours),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#409eff' },
            { offset: 1, color: '#67c23a' }
          ]),
          borderRadius: [0, 4, 4, 0]
        },
        label: { show: true, position: 'right', formatter: '{c}h' }
      }]
    })
    charts.push(chart)
  }

  if (fillRateChartRef.value) {
    const chart = echarts.init(fillRateChartRef.value)
    const data = courseStore.getFillRateData()
    chart.setOption({
      tooltip: { trigger: 'axis', formatter: '{b}: {c}%' },
      grid: { left: 70, right: 30, top: 20, bottom: 30 },
      xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
      yAxis: { type: 'category', data: data.map(d => d.name) },
      series: [{
        type: 'bar',
        data: data.map(d => d.rate),
        itemStyle: {
          color: params => {
            const v = params.value
            return v >= 90 ? '#67c23a' : v >= 70 ? '#409eff' : v >= 50 ? '#e6a23c' : '#f56c6c'
          },
          borderRadius: [0, 4, 4, 0]
        },
        label: { show: true, position: 'right', formatter: '{c}%' }
      }]
    })
    charts.push(chart)
  }

  if (incomePieChartRef.value) {
    const chart = echarts.init(incomePieChartRef.value)
    const data = consumptionStore.getIncomeComposition()
    chart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left', top: 'center' },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: data,
        color: ['#409eff', '#67c23a', '#e6a23c']
      }]
    })
    charts.push(chart)
  }
}

function resizeCharts() {
  charts.forEach(c => c.resize())
}

function initPackageCharts() {
  if (packageTypeChartRef.value) {
    const chart = echarts.init(packageTypeChartRef.value)
    const stats = memberStore.getPackageSalesStats()
    const data = stats.byType.map(t => ({
      name: t.typeLabel,
      value: t.count
    }))
    chart.setOption({
      tooltip: { trigger: 'item', formatter: '{b}: {c}份 ({d}%)' },
      legend: { orient: 'vertical', left: 'left', top: 'center' },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}\n{c}份' },
        data: data,
        color: ['#409eff', '#67c23a', '#e6a23c', '#f56c6c']
      }]
    })
    charts.push(chart)
  }

  if (packageRankChartRef.value) {
    const chart = echarts.init(packageRankChartRef.value)
    const stats = memberStore.getPackageSalesStats()
    const data = stats.byPackage.slice(0, 8)
    chart.setOption({
      tooltip: { trigger: 'axis', formatter: '{b}: {c}份' },
      grid: { left: 140, right: 30, top: 20, bottom: 30 },
      xAxis: { type: 'value', minInterval: 1 },
      yAxis: { type: 'category', data: data.map(d => d.name) },
      series: [{
        type: 'bar',
        data: data.map(d => d.count),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#67c23a' },
            { offset: 1, color: '#409eff' }
          ]),
          borderRadius: [0, 4, 4, 0]
        },
        label: { show: true, position: 'right', formatter: '{c}份' }
      }]
    })
    charts.push(chart)
  }
}

function printReport() {
  if (activeTab.value === 'daily') {
    printDailyReport()
  } else {
    window.print()
    ElMessage.success('报表已发送至打印机')
  }
}

function printDailyReport() {
  const printContent = document.querySelector('.daily-report')
  if (printContent) {
    const originalContents = document.body.innerHTML
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>前台日报 - ${dailyDateStr.value}</title>
          <style>
            body { font-family: 'Microsoft YaHei', sans-serif; padding: 20px; font-size: 12px; }
            .report-header { text-align: center; margin-bottom: 20px; }
            .report-header h2 { margin: 0 0 10px 0; }
            .report-meta { color: #666; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; }
            .stat-row { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .stat-item { text-align: center; }
            .stat-item .label { color: #666; margin-bottom: 5px; }
            .stat-item .value { font-size: 18px; font-weight: bold; }
            .value.blue { color: #409eff; }
            .value.green { color: #67c23a; }
            .value.orange { color: #e6a23c; }
            .value.red { color: #f56c6c; }
            h4 { margin: 20px 0 10px 0; border-left: 4px solid #409eff; padding-left: 10px; }
            .sign-area { display: flex; justify-content: space-between; margin-top: 40px; }
            .sign-box { width: 200px; text-align: center; }
            .sign-line { border-bottom: 1px solid #000; height: 40px; margin-bottom: 5px; }
            @media print {
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML.replace(/class="no-print"[^>]*>.*?<\/[^>]*>/g, '')}
          <div class="sign-area">
            <div class="sign-box">
              <div class="sign-line"></div>
              <div>交班人签字</div>
            </div>
            <div class="sign-box">
              <div class="sign-line"></div>
              <div>接班人签字</div>
            </div>
            <div class="sign-box">
              <div class="sign-line"></div>
              <div>店长签字</div>
            </div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      ElMessage.success('交班单已发送至打印机')
    }, 500)
  }
}

watch(activeTab, (newTab) => {
  nextTick(() => {
    charts.forEach(c => c.dispose())
    charts = []
    if (newTab === 'overview') {
      initCharts()
    } else if (newTab === 'packages') {
      initPackageCharts()
    }
  })
})

watch(dailyDate, () => {})

onMounted(() => {
  nextTick(() => {
    initCharts()
    window.addEventListener('resize', resizeCharts)
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  charts.forEach(c => c.dispose())
  charts = []
})
</script>

<style scoped>
.report-header {
  text-align: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #409eff;
}

.report-header h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.report-meta {
  color: #909399;
  font-size: 13px;
}

.value.red {
  color: #f56c6c !important;
}

@media print {
  .no-print {
    display: none !important;
  }
  
  .daily-report {
    padding: 0;
  }
  
  .stat-card {
    break-inside: avoid;
    border: 1px solid #ddd !important;
    margin-bottom: 10px !important;
  }
  
  .card-wrapper {
    break-inside: avoid;
    border: 1px solid #ddd !important;
    margin-bottom: 15px !important;
  }
  
  .el-table {
    font-size: 11px !important;
  }
  
  .el-table th, .el-table td {
    padding: 4px 8px !important;
  }
}
</style>

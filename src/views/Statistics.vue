<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">经营统计</div>
      <div class="no-print">
        <el-select v-model="statRange" style="width: 150px; margin-right: 12px">
          <el-option label="近7天" value="7" />
          <el-option label="近30天" value="30" />
          <el-option label="本月" value="month" />
          <el-option label="全部" value="all" />
        </el-select>
        <el-button type="primary" @click="printReport">
          <el-icon><Printer /></el-icon>导出报表
        </el-button>
      </div>
    </div>

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
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { useMemberStore } from '@/stores/member'
import { useCourseStore } from '@/stores/course'
import { useConsumptionStore } from '@/stores/consumption'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const memberStore = useMemberStore()
const courseStore = useCourseStore()
const consumptionStore = useConsumptionStore()

const statRange = ref('30')
const activeReminderTab = ref('expire')

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

const memberGrowthChartRef = ref(null)
const incomeTrendChartRef = ref(null)
const coachHoursChartRef = ref(null)
const fillRateChartRef = ref(null)
const incomePieChartRef = ref(null)

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

function printReport() {
  window.print()
  ElMessage.success('报表已发送至打印机')
}

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

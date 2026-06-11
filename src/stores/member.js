import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import { persist } from '@/utils/persist'

const LEVELS = [
  { value: 'normal', label: '普通会员', color: '#909399' },
  { value: 'silver', label: '银卡会员', color: '#c0c4cc' },
  { value: 'gold', label: '金卡会员', color: '#e6a23c' },
  { value: 'diamond', label: '钻石会员', color: '#409eff' }
]

const MEMBERSHIP_PACKAGES = [
  { id: 'pkg_month', name: '月卡会员', type: 'time', price: 299, duration: 30, sessions: 30, balance: 0, description: '30天有效期，30次课程', color: '#409eff' },
  { id: 'pkg_quarter', name: '季卡会员', type: 'time', price: 799, duration: 90, sessions: 90, balance: 0, description: '90天有效期，90次课程', color: '#67c23a' },
  { id: 'pkg_year', name: '年卡会员', type: 'time', price: 2888, duration: 365, sessions: 365, balance: 0, description: '365天有效期，全年畅练', color: '#e6a23c' },
  { id: 'pkg_10', name: '10次课包', type: 'session', price: 680, duration: 180, sessions: 10, balance: 0, description: '180天有效期，10次课程', color: '#409eff' },
  { id: 'pkg_30', name: '30次课包', type: 'session', price: 1800, duration: 365, sessions: 30, balance: 0, description: '365天有效期，30次课程', color: '#67c23a' },
  { id: 'pkg_50', name: '50次课包', type: 'session', price: 2800, duration: 730, sessions: 50, balance: 0, description: '730天有效期，50次课程', color: '#e6a23c' },
  { id: 'pkg_private_10', name: '私教10节', type: 'private', price: 2800, duration: 180, sessions: 10, balance: 0, description: '180天有效期，10节私教课', color: '#f56c6c' },
  { id: 'pkg_private_30', name: '私教30节', type: 'private', price: 7800, duration: 365, sessions: 30, balance: 0, description: '365天有效期，30节私教课', color: '#909399' },
  { id: 'pkg_balance_500', name: '储值500', type: 'balance', price: 500, duration: 0, sessions: 0, balance: 500, description: '赠送50元', color: '#409eff', bonus: 50 },
  { id: 'pkg_balance_1000', name: '储值1000', type: 'balance', price: 1000, duration: 0, sessions: 0, balance: 1000, description: '赠送150元', color: '#67c23a', bonus: 150 },
  { id: 'pkg_balance_2000', name: '储值2000', type: 'balance', price: 2000, duration: 0, sessions: 0, balance: 2000, description: '赠送400元', color: '#e6a23c', bonus: 400 }
]

const INITIAL_MEMBERS = [
  { id: 'm001', name: '张伟', phone: '13800138001', level: 'gold', joinDate: '2025-01-15', expireDate: '2026-06-20', balance: 3280, remainingSessions: 45, totalSessions: 100, absentCount: 0, remark: '羽毛球爱好者，每周三次', activePackage: null },
  { id: 'm002', name: '李娜', phone: '13800138002', level: 'diamond', joinDate: '2024-08-10', expireDate: '2026-08-10', balance: 12500, remainingSessions: 120, totalSessions: 200, absentCount: 0, remark: 'VIP客户，篮球私教课', activePackage: null },
  { id: 'm003', name: '王强', phone: '13800138003', level: 'silver', joinDate: '2025-03-20', expireDate: '2026-06-15', balance: 580, remainingSessions: 8, totalSessions: 30, absentCount: 3, remark: '', activePackage: null },
  { id: 'm004', name: '刘洋', phone: '13800138004', level: 'normal', joinDate: '2025-06-01', expireDate: '2026-06-25', balance: 120, remainingSessions: 3, totalSessions: 10, absentCount: 2, remark: '新人，参加体验课', activePackage: null },
  { id: 'm005', name: '陈静', phone: '13800138005', level: 'gold', joinDate: '2024-12-01', expireDate: '2026-12-01', balance: 5600, remainingSessions: 68, totalSessions: 150, absentCount: 1, remark: '', activePackage: null }
]

const INITIAL_PACKAGE_SALES = []

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export const useMemberStore = defineStore('member', {
  state: () => ({
    members: [...INITIAL_MEMBERS],
    levels: LEVELS,
    packages: MEMBERSHIP_PACKAGES,
    packageSales: [...INITIAL_PACKAGE_SALES],
    followRecords: []
  }),

  getters: {
    activeCount: (state) => state.members.filter(m => dayjs(m.expireDate).isAfter(dayjs())).length,
    totalBalance: (state) => state.members.reduce((sum, m) => sum + m.balance, 0)
  },

  actions: {
    getLevelLabel(value) {
      const level = LEVELS.find(l => l.value === value)
      return level ? level.label : value
    },
    getLevelColor(value) {
      const level = LEVELS.find(l => l.value === value)
      return level ? level.color : '#909399'
    },
    getPackageById(id) {
      return MEMBERSHIP_PACKAGES.find(p => p.id === id)
    },
    getPackageTypeLabel(type) {
      const labels = { time: '时间卡', session: '次卡', private: '私教包', balance: '储值卡' }
      return labels[type] || type
    },
    purchasePackage(memberId, packageId, paymentMethod = 'wechat') {
      const member = this.getMemberById(memberId)
      const pkg = this.getPackageById(packageId)
      if (!member || !pkg) return { success: false, msg: '会员或套餐不存在' }

      if (pkg.sessions > 0) {
        member.remainingSessions += pkg.sessions
        member.totalSessions += pkg.sessions
      }
      if (pkg.balance > 0) {
        const addAmount = pkg.balance + (pkg.bonus || 0)
        member.balance = Math.round((member.balance + addAmount) * 100) / 100
      }
      if (pkg.duration > 0) {
        const newExpire = dayjs().add(pkg.duration, 'day')
        if (dayjs(member.expireDate).isBefore(newExpire)) {
          member.expireDate = newExpire.format('YYYY-MM-DD')
        }
      }

      member.activePackage = {
        packageId: pkg.id,
        packageName: pkg.name,
        purchaseDate: dayjs().format('YYYY-MM-DD HH:mm')
      }

      const saleRecord = {
        id: generateId(),
        memberId,
        memberName: member.name,
        packageId: pkg.id,
        packageName: pkg.name,
        packageType: pkg.type,
        amount: pkg.price,
        paymentMethod,
        date: dayjs().format('YYYY-MM-DD HH:mm')
      }
      this.packageSales.unshift(saleRecord)
      persist()
      return { success: true, sale: saleRecord, member }
    },
    getPackageSalesStats() {
      let totalCount = 0
      let totalAmount = 0
      const byTypeMap = {
        time: { typeLabel: '时间卡', type: 'time', count: 0, amount: 0 },
        session: { typeLabel: '次卡', type: 'session', count: 0, amount: 0 },
        private: { typeLabel: '私教包', type: 'private', count: 0, amount: 0 },
        balance: { typeLabel: '储值卡', type: 'balance', count: 0, amount: 0 }
      }
      const byPackageMap = {}
      MEMBERSHIP_PACKAGES.forEach(pkg => {
        byPackageMap[pkg.id] = { name: pkg.name, type: pkg.type, count: 0, amount: 0 }
      })
      this.packageSales.forEach(sale => {
        totalCount += 1
        totalAmount += sale.amount
        if (byTypeMap[sale.packageType]) {
          byTypeMap[sale.packageType].count += 1
          byTypeMap[sale.packageType].amount += sale.amount
        }
        if (byPackageMap[sale.packageId]) {
          byPackageMap[sale.packageId].count += 1
          byPackageMap[sale.packageId].amount += sale.amount
        }
      })
      return {
        totalCount,
        totalAmount,
        byType: Object.values(byTypeMap),
        byPackage: Object.values(byPackageMap).filter(p => p.count > 0 || p.amount > 0)
      }
    },
    getPackageSalesByDate(date) {
      return this.packageSales.filter(s => s.date.startsWith(date))
    },
    addMember(data) {
      const member = {
        id: generateId(),
        ...data,
        joinDate: dayjs().format('YYYY-MM-DD'),
        balance: data.balance || 0,
        remainingSessions: data.remainingSessions || 0,
        totalSessions: data.totalSessions || data.remainingSessions || 0,
        absentCount: 0
      }
      this.members.unshift(member)
      persist()
      return member
    },
    updateMember(id, data) {
      const index = this.members.findIndex(m => m.id === id)
      if (index !== -1) {
        this.members[index] = { ...this.members[index], ...data }
        persist()
      }
    },
    deleteMember(id) {
      this.members = this.members.filter(m => m.id !== id)
      persist()
    },
    searchMembers(keyword) {
      if (!keyword) return this.members
      const kw = keyword.toLowerCase()
      return this.members.filter(m =>
        m.name.toLowerCase().includes(kw) ||
        m.phone.includes(kw) ||
        m.id.toLowerCase().includes(kw)
      )
    },
    getMemberById(id) {
      return this.members.find(m => m.id === id)
    },
    addBalance(id, amount) {
      const member = this.getMemberById(id)
      if (member) {
        member.balance = Math.round((member.balance + Number(amount)) * 100) / 100
        persist()
      }
    },
    deductBalance(id, amount) {
      const member = this.getMemberById(id)
      if (member && member.balance >= Number(amount)) {
        member.balance = Math.round((member.balance - Number(amount)) * 100) / 100
        persist()
        return true
      }
      return false
    },
    addSessions(id, count) {
      const member = this.getMemberById(id)
      if (member) {
        member.remainingSessions += Number(count)
        member.totalSessions += Number(count)
        persist()
      }
    },
    deductSession(id) {
      const member = this.getMemberById(id)
      if (member && member.remainingSessions > 0) {
        member.remainingSessions -= 1
        persist()
        return true
      }
      return false
    },
    hasEnoughSessions(id, count = 1) {
      const member = this.getMemberById(id)
      return member && member.remainingSessions >= count
    },
    hasEnoughBalance(id, amount) {
      const member = this.getMemberById(id)
      return member && member.balance >= Number(amount)
    },
    incrementAbsent(id) {
      const member = this.getMemberById(id)
      if (member) {
        member.absentCount += 1
        persist()
      }
    },
    resetAbsent(id) {
      const member = this.getMemberById(id)
      if (member) {
        member.absentCount = 0
        persist()
      }
    },
    getExpiringMembers() {
      const now = dayjs()
      return this.members
        .map(m => {
          const daysLeft = dayjs(m.expireDate).diff(now, 'day')
          return { ...m, daysLeft }
        })
        .filter(m => m.daysLeft >= 0 && m.daysLeft <= 30)
        .sort((a, b) => a.daysLeft - b.daysLeft)
    },
    getLowBalanceMembers() {
      return this.members.filter(m => m.balance < 200 || m.remainingSessions < 5)
    },
    getAbsentMembers() {
      return this.members.filter(m => m.absentCount >= 2)
    },
    getNewMembersByMonth() {
      const result = []
      for (let i = 5; i >= 0; i--) {
        const month = dayjs().subtract(i, 'month')
        const count = this.members.filter(m => dayjs(m.joinDate).isSame(month, 'month')).length
        result.push({ month: month.format('MM月'), count })
      }
      return result
    },
    addFollowRecord(memberId, content, type = 'visit') {
      const member = this.getMemberById(memberId)
      if (!member) return null
      const record = {
        id: generateId(),
        memberId,
        memberName: member.name,
        content,
        type,
        date: dayjs().format('YYYY-MM-DD HH:mm')
      }
      this.followRecords.unshift(record)
      persist()
      return record
    },
    getFollowRecordsByMember(memberId) {
      return this.followRecords.filter(r => r.memberId === memberId)
    },
    getRecentPackageBuyers(days = 30) {
      const cutoff = dayjs().subtract(days, 'day')
      return this.packageSales
        .filter(s => dayjs(s.date).isAfter(cutoff))
        .map(sale => {
          const member = this.getMemberById(sale.memberId)
          return { ...sale, memberInfo: member || null }
        })
    },
    async getLongAbsentMembers(days = 30) {
      const { useCheckinStore } = await import('@/stores/checkin')
      const checkinStore = useCheckinStore()
      const cutoff = dayjs().subtract(days, 'day')
      return this.members.map(member => {
        const memberCheckins = checkinStore.getCheckinsByMember(member.id)
        if (memberCheckins.length === 0) {
          return { ...member, lastCheckin: null, absentDays: Infinity }
        }
        const lastCheckin = memberCheckins.reduce((latest, c) => {
          return dayjs(c.checkTime).isAfter(dayjs(latest)) ? c.checkTime : latest
        }, memberCheckins[0].checkTime)
        const absentDays = dayjs().diff(dayjs(lastCheckin), 'day')
        return { ...member, lastCheckin, absentDays }
      }).filter(m => m.absentDays >= days)
    }
  }
})

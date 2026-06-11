import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import { persist } from '@/utils/persist'

const LEVELS = [
  { value: 'normal', label: '普通会员', color: '#909399' },
  { value: 'silver', label: '银卡会员', color: '#c0c4cc' },
  { value: 'gold', label: '金卡会员', color: '#e6a23c' },
  { value: 'diamond', label: '钻石会员', color: '#409eff' }
]

const INITIAL_MEMBERS = [
  { id: 'm001', name: '张伟', phone: '13800138001', level: 'gold', joinDate: '2025-01-15', expireDate: '2026-06-20', balance: 3280, remainingSessions: 45, totalSessions: 100, absentCount: 0, remark: '羽毛球爱好者，每周三次' },
  { id: 'm002', name: '李娜', phone: '13800138002', level: 'diamond', joinDate: '2024-08-10', expireDate: '2026-08-10', balance: 12500, remainingSessions: 120, totalSessions: 200, absentCount: 0, remark: 'VIP客户，篮球私教课' },
  { id: 'm003', name: '王强', phone: '13800138003', level: 'silver', joinDate: '2025-03-20', expireDate: '2026-06-15', balance: 580, remainingSessions: 8, totalSessions: 30, absentCount: 3, remark: '' },
  { id: 'm004', name: '刘洋', phone: '13800138004', level: 'normal', joinDate: '2025-06-01', expireDate: '2026-06-25', balance: 120, remainingSessions: 3, totalSessions: 10, absentCount: 2, remark: '新人，参加体验课' },
  { id: 'm005', name: '陈静', phone: '13800138005', level: 'gold', joinDate: '2024-12-01', expireDate: '2026-12-01', balance: 5600, remainingSessions: 68, totalSessions: 150, absentCount: 1, remark: '' }
]

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export const useMemberStore = defineStore('member', {
  state: () => ({
    members: [...INITIAL_MEMBERS],
    levels: LEVELS
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
    }
  }
})

import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import { persist } from '@/utils/persist'

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

const CHECKIN_STATUS = [
  { value: 'checked', label: '已签到', color: '#67c23a', type: 'success' },
  { value: 'absent', label: '爽约', color: '#f56c6c', type: 'danger' },
  { value: 'leave', label: '请假', color: '#e6a23c', type: 'warning' },
  { value: 'makeup', label: '补课', color: '#409eff', type: 'primary' }
]

const INITIAL_CHECKINS = []

export const useCheckinStore = defineStore('checkin', {
  state: () => ({
    checkins: [...INITIAL_CHECKINS],
    statusList: CHECKIN_STATUS
  }),

  actions: {
    getStatusLabel(value) {
      const s = CHECKIN_STATUS.find(s => s.value === value)
      return s ? s.label : value
    },
    getStatusType(value) {
      const s = CHECKIN_STATUS.find(s => s.value === value)
      return s ? s.type : 'info'
    },
    addCheckin(data) {
      const existing = this.checkins.find(c => c.courseId === data.courseId && c.memberId === data.memberId)
      if (existing) {
        Object.assign(existing, {
          ...data,
          checkTime: dayjs().format('YYYY-MM-DD HH:mm'),
          id: existing.id
        })
        persist()
        return existing
      }
      const record = {
        id: generateId(),
        ...data,
        checkTime: dayjs().format('YYYY-MM-DD HH:mm'),
        operator: '前台'
      }
      this.checkins.unshift(record)
      persist()
      return record
    },
    updateCheckin(id, data) {
      const index = this.checkins.findIndex(c => c.id === id)
      if (index !== -1) {
        this.checkins[index] = { ...this.checkins[index], ...data }
        persist()
      }
    },
    deleteCheckin(id) {
      this.checkins = this.checkins.filter(c => c.id !== id)
      persist()
    },
    getCheckinsByCourse(courseId) {
      return this.checkins.filter(c => c.courseId === courseId)
    },
    getCheckinsByMember(memberId) {
      return this.checkins.filter(c => c.memberId === memberId)
    },
    getCheckinsByDate(date) {
      return this.checkins.filter(c => c.checkTime.startsWith(date))
    },
    getMemberCheckinStatus(courseId, memberId) {
      const record = this.checkins.find(c => c.courseId === courseId && c.memberId === memberId)
      return record ? record.status : null
    }
  }
})

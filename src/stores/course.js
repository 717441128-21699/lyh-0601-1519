import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import { persist } from '@/utils/persist'

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

const COURSE_TYPES = [
  { value: 'group', label: '团课', color: '#409eff' },
  { value: 'private', label: '私教课', color: '#67c23a' },
  { value: 'activity', label: '活动', color: '#e6a23c' }
]

const SPORTS = ['羽毛球', '篮球', '乒乓球', '网球', '游泳', '瑜伽', '健身']

const COACHES = [
  { id: 'c001', name: '李明', sport: '羽毛球', phone: '13900139001' },
  { id: 'c002', name: '王芳', sport: '羽毛球', phone: '13900139002' },
  { id: 'c003', name: '赵磊', sport: '篮球', phone: '13900139003' },
  { id: 'c004', name: '孙丽', sport: '瑜伽', phone: '13900139004' }
]

const today = dayjs()
const INITIAL_COURSES = [
  {
    id: 'k001', type: 'group', name: '羽毛球基础班', sport: '羽毛球', coachId: 'c001',
    date: today.add(1, 'day').format('YYYY-MM-DD'), startTime: '09:00', endTime: '11:00',
    venue: '1号场地', capacity: 12, enrolled: 0, price: 80, status: 'open', remark: ''
  },
  {
    id: 'k002', type: 'group', name: '篮球提高班', sport: '篮球', coachId: 'c003',
    date: today.add(1, 'day').format('YYYY-MM-DD'), startTime: '14:00', endTime: '16:00',
    venue: '篮球馆A', capacity: 15, enrolled: 0, price: 100, status: 'open', remark: ''
  },
  {
    id: 'k003', type: 'private', name: '羽毛球私教课', sport: '羽毛球', coachId: 'c002',
    date: today.add(2, 'day').format('YYYY-MM-DD'), startTime: '10:00', endTime: '11:00',
    venue: '2号场地', capacity: 1, enrolled: 0, price: 300, status: 'open', remark: ''
  },
  {
    id: 'k004', type: 'activity', name: '周末羽毛球友谊赛', sport: '羽毛球', coachId: 'c001',
    date: today.add(3, 'day').format('YYYY-MM-DD'), startTime: '15:00', endTime: '18:00',
    venue: '主馆', capacity: 24, enrolled: 0, price: 50, status: 'open', remark: '欢迎所有会员参加'
  },
  {
    id: 'k005', type: 'group', name: '瑜伽放松班', sport: '瑜伽', coachId: 'c004',
    date: today.add(1, 'day').format('YYYY-MM-DD'), startTime: '19:00', endTime: '20:30',
    venue: '瑜伽室', capacity: 20, enrolled: 0, price: 60, status: 'open', remark: ''
  }
]

const INITIAL_ENROLLMENTS = []

export const useCourseStore = defineStore('course', {
  state: () => ({
    courses: [...INITIAL_COURSES],
    enrollments: [...INITIAL_ENROLLMENTS],
    coaches: [...COACHES],
    sports: SPORTS,
    courseTypes: COURSE_TYPES
  }),

  actions: {
    getCoachName(id) {
      const coach = this.coaches.find(c => c.id === id)
      return coach ? coach.name : '未知'
    },
    getTypeLabel(value) {
      const type = COURSE_TYPES.find(t => t.value === value)
      return type ? type.label : value
    },
    getTypeColor(value) {
      const type = COURSE_TYPES.find(t => t.value === value)
      return type ? type.color : ''
    },
    addCourse(data) {
      const course = {
        id: generateId(),
        ...data,
        enrolled: 0,
        status: 'open'
      }
      this.courses.unshift(course)
      persist()
      return course
    },
    updateCourse(id, data) {
      const index = this.courses.findIndex(c => c.id === id)
      if (index !== -1) {
        this.courses[index] = { ...this.courses[index], ...data }
        persist()
      }
    },
    deleteCourse(id) {
      this.courses = this.courses.filter(c => c.id !== id)
      this.enrollments = this.enrollments.filter(e => e.courseId !== id)
      persist()
    },
    enrollMember(courseId, memberId) {
      const course = this.courses.find(c => c.id === courseId)
      if (!course) return { success: false, msg: '课程不存在' }
      if (course.enrolled >= course.capacity) return { success: false, msg: '课程已满' }
      const exists = this.enrollments.find(e => e.courseId === courseId && e.memberId === memberId)
      if (exists) return { success: false, msg: '该会员已报名此课程' }
      this.enrollments.push({
        id: generateId(),
        courseId,
        memberId,
        enrollDate: dayjs().format('YYYY-MM-DD HH:mm'),
        status: 'enrolled'
      })
      course.enrolled += 1
      persist()
      return { success: true }
    },
    cancelEnrollment(courseId, memberId) {
      const enrollment = this.enrollments.find(e => e.courseId === courseId && e.memberId === memberId)
      if (enrollment) {
        this.enrollments = this.enrollments.filter(e => e.id !== enrollment.id)
        const course = this.courses.find(c => c.id === courseId)
        if (course && course.enrolled > 0) {
          course.enrolled -= 1
        }
        persist()
        return { success: true }
      }
      return { success: false, msg: '未找到报名记录' }
    },
    getEnrollmentsByCourse(courseId) {
      return this.enrollments.filter(e => e.courseId === courseId)
    },
    getEnrollmentsByMember(memberId) {
      return this.enrollments.filter(e => e.memberId === memberId)
    },
    isMemberEnrolled(courseId, memberId) {
      return this.enrollments.some(e => e.courseId === courseId && e.memberId === memberId)
    },
    getCoursesByDate(date) {
      return this.courses.filter(c => c.date === date)
    },
    getUpcomingCourses(days = 7) {
      const start = dayjs().format('YYYY-MM-DD')
      const end = dayjs().add(days, 'day').format('YYYY-MM-DD')
      return this.courses.filter(c => c.date >= start && c.date <= end)
    },
    getCoachHoursByMonth() {
      const result = {}
      this.coaches.forEach(c => { result[c.name] = 0 })
      const thisMonth = dayjs().format('YYYY-MM')
      this.courses.forEach(c => {
        if (dayjs(c.date).format('YYYY-MM') === thisMonth) {
          const coach = this.coaches.find(co => co.id === c.coachId)
          if (coach) {
            const [sh, sm] = c.startTime.split(':').map(Number)
            const [eh, em] = c.endTime.split(':').map(Number)
            const hours = (eh * 60 + em - sh * 60 - sm) / 60
            result[coach.name] += hours * c.enrolled
          }
        }
      })
      return Object.entries(result).map(([name, hours]) => ({ name, hours: Math.round(hours * 10) / 10 }))
    },
    getFillRateData() {
      return this.courses
        .filter(c => c.enrolled > 0 || dayjs(c.date).isBefore(dayjs().add(1, 'day')))
        .slice(0, 10)
        .map(c => ({
          name: c.name.slice(0, 8),
          rate: c.capacity > 0 ? Math.round(c.enrolled / c.capacity * 100) : 0
        }))
    }
  }
})

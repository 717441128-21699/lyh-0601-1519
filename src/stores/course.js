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
  { id: 'c001', name: '李明', sport: '羽毛球', phone: '13900139001', hourlyRate: 100, privateRate: 200 },
  { id: 'c002', name: '王芳', sport: '羽毛球', phone: '13900139002', hourlyRate: 100, privateRate: 200 },
  { id: 'c003', name: '赵磊', sport: '篮球', phone: '13900139003', hourlyRate: 100, privateRate: 200 },
  { id: 'c004', name: '孙丽', sport: '瑜伽', phone: '13900139004', hourlyRate: 100, privateRate: 200 }
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
const INITIAL_WAITLISTS = []
const INITIAL_TRANSFERS = []

export const useCourseStore = defineStore('course', {
  state: () => ({
    courses: [...INITIAL_COURSES],
    enrollments: [...INITIAL_ENROLLMENTS],
    waitlists: [...INITIAL_WAITLISTS],
    transfers: [...INITIAL_TRANSFERS],
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
    enrollMember(courseId, memberId, { allowWaitlist = true } = {}) {
      const course = this.courses.find(c => c.id === courseId)
      if (!course) return { success: false, msg: '课程不存在' }
      const exists = this.enrollments.find(e => e.courseId === courseId && e.memberId === memberId)
      if (exists) return { success: false, msg: '该会员已报名此课程' }
      const inWaitlist = this.waitlists.find(w => w.courseId === courseId && w.memberId === memberId)
      if (inWaitlist) return { success: false, msg: '该会员已在候补队列中' }
      
      if (course.enrolled >= course.capacity) {
        if (allowWaitlist) {
          return this.addToWaitlist(courseId, memberId)
        }
        return { success: false, msg: '课程已满' }
      }
      
      this.enrollments.push({
        id: generateId(),
        courseId,
        memberId,
        enrollDate: dayjs().format('YYYY-MM-DD HH:mm'),
        status: 'enrolled'
      })
      course.enrolled += 1
      persist()
      return { success: true, type: 'enrolled' }
    },
    addToWaitlist(courseId, memberId) {
      const course = this.courses.find(c => c.id === courseId)
      if (!course) return { success: false, msg: '课程不存在' }
      const position = this.waitlists.filter(w => w.courseId === courseId).length + 1
      this.waitlists.push({
        id: generateId(),
        courseId,
        memberId,
        position,
        waitDate: dayjs().format('YYYY-MM-DD HH:mm')
      })
      persist()
      return { success: true, type: 'waitlist', position, msg: `已加入候补队列，当前第${position}位` }
    },
    getWaitlistByCourse(courseId) {
      return this.waitlists.filter(w => w.courseId === courseId).sort((a, b) => a.position - b.position)
    },
    isMemberInWaitlist(courseId, memberId) {
      return this.waitlists.some(w => w.courseId === courseId && w.memberId === memberId)
    },
    getMemberWaitlistPosition(courseId, memberId) {
      const item = this.waitlists.find(w => w.courseId === courseId && w.memberId === memberId)
      return item ? item.position : null
    },
    removeFromWaitlist(courseId, memberId) {
      const item = this.waitlists.find(w => w.courseId === courseId && w.memberId === memberId)
      if (item) {
        this.waitlists = this.waitlists.filter(w => w.id !== item.id)
        const courseWaitlist = this.waitlists.filter(w => w.courseId === courseId).sort((a, b) => a.position - b.position)
        courseWaitlist.forEach((w, index) => {
          w.position = index + 1
        })
        persist()
        return { success: true }
      }
      return { success: false, msg: '未找到候补记录' }
    },
    processWaitlist(courseId) {
      const course = this.courses.find(c => c.id === courseId)
      if (!course) return null
      if (course.enrolled >= course.capacity) return null
      
      const courseWaitlist = this.getWaitlistByCourse(courseId)
      if (courseWaitlist.length === 0) return null
      
      const nextMember = courseWaitlist[0]
      this.enrollments.push({
        id: generateId(),
        courseId,
        memberId: nextMember.memberId,
        enrollDate: dayjs().format('YYYY-MM-DD HH:mm'),
        status: 'enrolled',
        fromWaitlist: true
      })
      course.enrolled += 1
      this.waitlists = this.waitlists.filter(w => w.id !== nextMember.id)
      const remainingWaitlist = this.waitlists.filter(w => w.courseId === courseId).sort((a, b) => a.position - b.position)
      remainingWaitlist.forEach((w, index) => {
        w.position = index + 1
      })
      persist()
      return nextMember
    },
    cancelEnrollment(courseId, memberId) {
      const enrollment = this.enrollments.find(e => e.courseId === courseId && e.memberId === memberId)
      if (enrollment) {
        this.enrollments = this.enrollments.filter(e => e.id !== enrollment.id)
        const course = this.courses.find(c => c.id === courseId)
        if (course && course.enrolled > 0) {
          course.enrolled -= 1
        }
        const promoted = this.processWaitlist(courseId)
        persist()
        return { success: true, promoted }
      }
      return { success: false, msg: '未找到报名记录' }
    },
    transferCourse(fromCourseId, toCourseId, memberId) {
      if (fromCourseId === toCourseId) {
        return { success: false, msg: '不能转到同一节课' }
      }
      const fromEnrollment = this.enrollments.find(e => e.courseId === fromCourseId && e.memberId === memberId)
      if (!fromEnrollment) return { success: false, msg: '原课程报名记录不存在' }
      
      const toCourse = this.courses.find(c => c.id === toCourseId)
      if (!toCourse) return { success: false, msg: '目标课程不存在' }
      
      const alreadyEnrolled = this.enrollments.find(e => e.courseId === toCourseId && e.memberId === memberId)
      if (alreadyEnrolled) return { success: false, msg: '该会员已报名目标课程' }
      
      if (toCourse.enrolled >= toCourse.capacity) {
        return { success: false, msg: '目标课程已满' }
      }
      
      this.enrollments = this.enrollments.filter(e => e.id !== fromEnrollment.id)
      const fromCourse = this.courses.find(c => c.id === fromCourseId)
      if (fromCourse && fromCourse.enrolled > 0) {
        fromCourse.enrolled -= 1
      }
      
      this.enrollments.push({
        id: generateId(),
        courseId: toCourseId,
        memberId,
        enrollDate: dayjs().format('YYYY-MM-DD HH:mm'),
        status: 'enrolled',
        transferred: true,
        fromCourseId,
        fromCourseName: fromCourse?.name
      })
      toCourse.enrolled += 1
      
      const transferRecord = {
        id: generateId(),
        memberId,
        fromCourseId,
        fromCourseName: fromCourse?.name,
        toCourseId,
        toCourseName: toCourse?.name,
        date: dayjs().format('YYYY-MM-DD HH:mm')
      }
      this.transfers.unshift(transferRecord)
      
      const promoted = this.processWaitlist(fromCourseId)
      persist()
      return { success: true, transferRecord, promoted }
    },
    getTransfersByMember(memberId) {
      return this.transfers.filter(t => t.memberId === memberId)
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
    },
    async getCoachSettlement(month) {
      const { useCheckinStore } = await import('@/stores/checkin')
      const checkinStore = useCheckinStore()
      return this.coaches.map(coach => {
        const coachCourses = this.courses.filter(c => c.coachId === coach.id && dayjs(c.date).format('YYYY-MM') === month)
        let groupHours = 0, groupCount = 0
        let privateHours = 0, privateCount = 0
        let activityHours = 0, activityCount = 0
        coachCourses.forEach(course => {
          const [sh, sm] = course.startTime.split(':').map(Number)
          const [eh, em] = course.endTime.split(':').map(Number)
          const hours = (eh * 60 + em - sh * 60 - sm) / 60
          const courseCheckins = checkinStore.checkins.filter(c =>
            c.courseId === course.id && (c.status === 'checked' || c.status === 'makeup')
          )
          const count = courseCheckins.length
          if (course.type === 'group') {
            groupHours += hours
            groupCount += count
          } else if (course.type === 'private') {
            privateHours += hours
            privateCount += count
          } else if (course.type === 'activity') {
            activityHours += hours
            activityCount += count
          }
        })
        const groupCommission = groupHours * coach.hourlyRate
        const privateCommission = privateHours * coach.privateRate
        const activityCommission = activityHours * coach.hourlyRate * 0.5
        const totalHours = groupHours + privateHours + activityHours
        const totalCommission = groupCommission + privateCommission + activityCommission
        return {
          coachId: coach.id,
          coachName: coach.name,
          groupHours: Math.round(groupHours * 10) / 10,
          groupCount,
          privateHours: Math.round(privateHours * 10) / 10,
          privateCount,
          activityHours: Math.round(activityHours * 10) / 10,
          activityCount,
          totalHours: Math.round(totalHours * 10) / 10,
          groupCommission: Math.round(groupCommission * 100) / 100,
          privateCommission: Math.round(privateCommission * 100) / 100,
          activityCommission: Math.round(activityCommission * 100) / 100,
          totalCommission: Math.round(totalCommission * 100) / 100
        }
      })
    }
  }
})

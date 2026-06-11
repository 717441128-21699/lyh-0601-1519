import { storage } from './storage'
import { useMemberStore } from '@/stores/member'
import { useCourseStore } from '@/stores/course'
import { useCheckinStore } from '@/stores/checkin'
import { useConsumptionStore } from '@/stores/consumption'

let inited = false
let persistTimer = null

export function initStores() {
  if (inited) return
  const data = storage.loadData()

  const memberStore = useMemberStore()
  const courseStore = useCourseStore()
  const checkinStore = useCheckinStore()
  const consumptionStore = useConsumptionStore()

  if (data) {
    const STORAGE_KEY = 'sports_club_data_v1'
    const restoredKeys = Object.keys(data).filter(k => Array.isArray(data[k]) && data[k].length === 0)
    memberStore.$patch({
      members: Array.isArray(data.members) ? data.members : [],
      packageSales: Array.isArray(data.packageSales) ? data.packageSales : [],
      followRecords: Array.isArray(data.followRecords) ? data.followRecords : []
    })
    courseStore.$patch({
      courses: Array.isArray(data.courses) ? data.courses : [],
      enrollments: Array.isArray(data.enrollments) ? data.enrollments : [],
      waitlists: Array.isArray(data.waitlists) ? data.waitlists : [],
      transfers: Array.isArray(data.transfers) ? data.transfers : []
    })
    checkinStore.$patch({
      checkins: Array.isArray(data.checkins) ? data.checkins : []
    })
    consumptionStore.$patch({
      transactions: Array.isArray(data.transactions) ? data.transactions : []
    })
  }

  inited = true
}

export function persist() {
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    const memberStore = useMemberStore()
    const courseStore = useCourseStore()
    const checkinStore = useCheckinStore()
    const consumptionStore = useConsumptionStore()

    storage.saveData({
      members: memberStore.members,
      packageSales: memberStore.packageSales,
      followRecords: memberStore.followRecords,
      courses: courseStore.courses,
      enrollments: courseStore.enrollments,
      waitlists: courseStore.waitlists || [],
      transfers: courseStore.transfers || [],
      checkins: checkinStore.checkins,
      transactions: consumptionStore.transactions
    })
  }, 100)
}

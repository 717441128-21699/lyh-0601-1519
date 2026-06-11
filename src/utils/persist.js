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
    if (data.members && data.members.length > 0) {
      memberStore.$patch({ members: data.members })
    }
    if (data.courses && data.courses.length > 0) {
      courseStore.$patch({ courses: data.courses })
    }
    if (data.enrollments && data.enrollments.length > 0) {
      courseStore.$patch({ enrollments: data.enrollments })
    }
    if (data.checkins && data.checkins.length > 0) {
      checkinStore.$patch({ checkins: data.checkins })
    }
    if (data.transactions && data.transactions.length > 0) {
      consumptionStore.$patch({ transactions: data.transactions })
    }
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
      courses: courseStore.courses,
      enrollments: courseStore.enrollments,
      checkins: checkinStore.checkins,
      transactions: consumptionStore.transactions
    })
  }, 100)
}

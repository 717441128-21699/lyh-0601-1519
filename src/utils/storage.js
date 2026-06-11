const STORAGE_KEY = 'sports_club_data_v1'

const defaultData = {
  members: [],
  courses: [],
  enrollments: [],
  checkins: [],
  transactions: []
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const data = JSON.parse(raw)
    return { ...defaultData, ...data }
  } catch (e) {
    console.error('Failed to load data from localStorage:', e)
    return null
  }
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (e) {
    console.error('Failed to save data to localStorage:', e)
    return false
  }
}

function clearData() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (e) {
    console.error('Failed to clear data:', e)
    return false
  }
}

function hasData() {
  return localStorage.getItem(STORAGE_KEY) !== null
}

export const storage = {
  loadData,
  saveData,
  clearData,
  hasData
}

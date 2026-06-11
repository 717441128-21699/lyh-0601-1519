import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/members' },
  { path: '/members', name: 'Members', component: () => import('@/views/Members.vue'), meta: { title: '会员档案', icon: 'User' } },
  { path: '/courses', name: 'Courses', component: () => import('@/views/Courses.vue'), meta: { title: '课程报名', icon: 'Calendar' } },
  { path: '/checkin', name: 'Checkin', component: () => import('@/views/Checkin.vue'), meta: { title: '场次签到', icon: 'Tickets' } },
  { path: '/consumption', name: 'Consumption', component: () => import('@/views/Consumption.vue'), meta: { title: '储值消费', icon: 'Wallet' } },
  { path: '/statistics', name: 'Statistics', component: () => import('@/views/Statistics.vue'), meta: { title: '经营统计', icon: 'DataAnalysis' } }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router

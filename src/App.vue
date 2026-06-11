<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="sidebar">
      <div class="logo">
        <el-icon :size="32" color="#409eff"><Trophy /></el-icon>
        <span>智慧体育俱乐部</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="menu"
        background-color="#1f2d3d"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        router
      >
        <el-menu-item v-for="route in menuRoutes" :key="route.path" :index="route.path">
          <el-icon><component :is="route.meta.icon" /></el-icon>
          <span>{{ route.meta.title }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header no-print">
        <div class="header-left">
          <h2>{{ currentTitle }}</h2>
        </div>
        <div class="header-right">
          <el-badge :value="reminderCount" :max="99" class="reminder-badge" v-if="reminderCount > 0">
            <el-button type="warning" plain circle @click="showReminders">
              <el-icon><Bell /></el-icon>
            </el-button>
          </el-badge>
          <el-button type="primary" plain circle @click="printCurrentPage">
            <el-icon><Printer /></el-icon>
          </el-button>
          <span class="today">{{ todayStr }}</span>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>

    <el-dialog v-model="reminderDialogVisible" title="会员提醒" width="600px">
      <el-tabs v-model="activeReminderTab">
        <el-tab-pane label="即将到期" :name="'expire'">
          <el-table :data="expiringMembers" size="small">
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="phone" label="电话" />
            <el-table-column prop="level" label="等级" />
            <el-table-column prop="expireDate" label="到期日" />
            <el-table-column prop="daysLeft" label="剩余天数">
              <template #default="{ row }">
                <el-tag type="danger" v-if="row.daysLeft <= 3">{{ row.daysLeft }}天</el-tag>
                <el-tag type="warning" v-else-if="row.daysLeft <= 7">{{ row.daysLeft }}天</el-tag>
                <el-tag v-else>{{ row.daysLeft }}天</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="余额不足" :name="'balance'">
          <el-table :data="lowBalanceMembers" size="small">
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="phone" label="电话" />
            <el-table-column prop="balance" label="余额(元)" />
            <el-table-column prop="remainingSessions" label="剩余次数" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="连续缺席" :name="'absent'">
          <el-table :data="absentMembers" size="small">
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="phone" label="电话" />
            <el-table-column prop="absentCount" label="连续缺席次数">
              <template #default="{ row }">
                <el-tag type="danger">{{ row.absentCount }}次</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { useMemberStore } from '@/stores/member'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const memberStore = useMemberStore()

const menuRoutes = computed(() => router.options.routes.filter(r => r.meta && r.meta.title))
const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta?.title || '')
const todayStr = computed(() => dayjs().format('YYYY年MM月DD日 dddd'))

const reminderDialogVisible = ref(false)
const activeReminderTab = ref('expire')

const expiringMembers = computed(() => memberStore.getExpiringMembers())
const lowBalanceMembers = computed(() => memberStore.getLowBalanceMembers())
const absentMembers = computed(() => memberStore.getAbsentMembers())
const reminderCount = computed(() => expiringMembers.value.length + lowBalanceMembers.value.length + absentMembers.value.length)

function showReminders() {
  reminderDialogVisible.value = true
}

function printCurrentPage() {
  window.print()
  ElMessage.success('正在打印...')
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background: #1f2d3d;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #2d3e53;
}

.menu {
  border-right: none;
}

.menu :deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
}

.header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
}

.header-left h2 {
  font-size: 18px;
  color: #303133;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.reminder-badge {
  margin-right: 0;
}

.today {
  color: #606266;
  font-size: 14px;
  margin-left: 12px;
}

.main-content {
  padding: 0;
  background: #f5f7fa;
  overflow: auto;
}
</style>

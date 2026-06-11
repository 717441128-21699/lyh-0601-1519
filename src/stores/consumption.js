import { defineStore } from 'pinia'
import dayjs from 'dayjs'
import { persist } from '@/utils/persist'

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

const TXN_TYPES = [
  { value: 'recharge', label: '充值', color: '#67c23a' },
  { value: 'deduct', label: '扣次', color: '#409eff' },
  { value: 'refund', label: '退款', color: '#e6a23c' },
  { value: 'consume', label: '消费', color: '#f56c6c' }
]

const PAYMENT_METHODS = [
  { value: 'cash', label: '现金' },
  { value: 'wechat', label: '微信' },
  { value: 'alipay', label: '支付宝' },
  { value: 'card', label: '银行卡' },
  { value: 'balance', label: '储值余额' }
]

const INITIAL_TRANSACTIONS = []

export const useConsumptionStore = defineStore('consumption', {
  state: () => ({
    transactions: [...INITIAL_TRANSACTIONS],
    txnTypes: TXN_TYPES,
    paymentMethods: PAYMENT_METHODS
  }),

  getters: {
    totalRecharge: (state) => state.transactions.filter(t => t.type === 'recharge').reduce((s, t) => s + t.amount, 0),
    totalConsume: (state) => state.transactions.filter(t => t.type === 'consume').reduce((s, t) => s + t.amount, 0)
  },

  actions: {
    getTypeLabel(value) {
      const t = TXN_TYPES.find(t => t.value === value)
      return t ? t.label : value
    },
    getTypeColor(value) {
      const t = TXN_TYPES.find(t => t.value === value)
      return t ? t.color : ''
    },
    getMethodLabel(value) {
      const m = PAYMENT_METHODS.find(m => m.value === value)
      return m ? m.label : value
    },
    addTransaction(data) {
      const txn = {
        id: generateId(),
        ...data,
        date: dayjs().format('YYYY-MM-DD HH:mm'),
        operator: '前台'
      }
      this.transactions.unshift(txn)
      persist()
      return txn
    },
    deleteTransaction(id) {
      this.transactions = this.transactions.filter(t => t.id !== id)
      persist()
    },
    getTransactionsByMember(memberId) {
      return this.transactions.filter(t => t.memberId === memberId)
    },
    getIncomeByMonth() {
      const result = []
      for (let i = 5; i >= 0; i--) {
        const month = dayjs().subtract(i, 'month')
        const recharge = this.transactions
          .filter(t => t.type === 'recharge' && dayjs(t.date).isSame(month, 'month'))
          .reduce((s, t) => s + t.amount, 0)
        const consume = this.transactions
          .filter(t => t.type === 'consume' && dayjs(t.date).isSame(month, 'month'))
          .reduce((s, t) => s + t.amount, 0)
        result.push({ month: month.format('MM月'), 充值收入: recharge, 消费收入: consume })
      }
      return result
    },
    getIncomeComposition() {
      const recharge = this.transactions.filter(t => t.type === 'recharge').reduce((s, t) => s + t.amount, 0)
      const consume = this.transactions.filter(t => t.type === 'consume').reduce((s, t) => s + t.amount, 0)
      const activity = 800
      return [
        { name: '储值充值', value: recharge },
        { name: '课程消费', value: consume },
        { name: '活动收入', value: activity }
      ]
    }
  }
})

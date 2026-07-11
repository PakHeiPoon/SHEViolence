// 伪装页：一个刻意平庸、可正常使用的记账本
// 解锁方式：在「金额」输入框输入解锁密码（默认 1234，可在「我的→隐私设置」修改），
// 点键盘确认或点「记一笔」即解锁跳转真实首页。
// 输错不提示、不锁定——密码之外的任何数字都会被当成一笔正常记账。
const util = require('../../utils/util.js')

const CATS = ['餐饮', '交通', '买菜', '日用品', '话费', '其他']

// 首次使用预置几笔记录，降低可疑度
const SEED = [
  { date: '07-10', cat: '餐饮', amount: '23.50', note: '午饭' },
  { date: '07-09', cat: '交通', amount: '4.00', note: '' },
  { date: '07-08', cat: '日用品', amount: '56.80', note: '超市' }
]

Page({
  data: {
    cats: CATS,
    catIndex: 0,
    amount: '',
    note: '',
    records: [],
    total: '0.00'
  },

  onShow() {
    // 回到伪装页即上锁
    getApp().globalData.unlocked = false
    let records = wx.getStorageSync('ledger_records')
    if (!records || !records.length) {
      records = SEED
      wx.setStorageSync('ledger_records', records)
    }
    this.setData({ records, total: this.sum(records) })
  },

  sum(records) {
    return util.fmtAmount(records.reduce((s, r) => s + (Number(r.amount) || 0), 0))
  },

  onCatChange(e) { this.setData({ catIndex: Number(e.detail.value) }) },
  onAmount(e) { this.setData({ amount: e.detail.value }) },
  onNote(e) { this.setData({ note: e.detail.value }) },

  // 金额键盘「完成」/「记一笔」按钮共用入口
  onConfirm() {
    const v = String(this.data.amount || '').trim()
    if (!v) return
    const pwd = String(wx.getStorageSync('unlock_pwd') || '1234')
    if (v === pwd) {
      this.unlock()
      return
    }
    this.addRecord(v)
  },

  addRecord(v) {
    const n = Number(v)
    if (isNaN(n) || n <= 0) {
      wx.showToast({ title: '请输入正确金额', icon: 'none' })
      return
    }
    const rec = {
      date: util.todayStr(),
      cat: CATS[this.data.catIndex],
      amount: util.fmtAmount(n),
      note: this.data.note
    }
    const records = [rec].concat(this.data.records)
    wx.setStorageSync('ledger_records', records)
    this.setData({ records, amount: '', note: '', total: this.sum(records) })
  },

  // 备用隐藏入口：1.2 秒内连点「本月支出」3 次也可解锁（防真机键盘确认不灵）
  onTitleTap() {
    const now = Date.now()
    if (!this._taps) this._taps = []
    this._taps = this._taps.filter(t => now - t < 1200)
    this._taps.push(now)
    if (this._taps.length >= 3) {
      this._taps = []
      this.unlock()
    }
  },

  unlock() {
    getApp().globalData.unlocked = true
    this.setData({ amount: '', note: '' })
    wx.switchTab({ url: '/pages/home/home' })
  }
})

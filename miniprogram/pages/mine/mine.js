// 我的：匿名身份 / 紧急联系人 / 隐私设置（解锁密码）/ 一键清除
const util = require('../../utils/util.js')

Page({
  data: {
    nickname: '',
    contacts: [],
    cName: '',
    cTel: '',
    pwd: '',
    showContactForm: false,
    showPwdForm: false
  },

  onShow() {
    if (!util.ensureUnlocked()) return
    this.setData({
      nickname: getApp().globalData.nickname,
      contacts: wx.getStorageSync('emg_contacts') || []
    })
  },

  // 换一个匿名昵称
  regen() {
    const nick = util.genNickname()
    wx.setStorageSync('nickname', nick)
    getApp().globalData.nickname = nick
    this.setData({ nickname: nick })
    wx.showToast({ title: '已换新身份', icon: 'success' })
  },

  // ---- 紧急联系人 ----
  toggleContactForm() { this.setData({ showContactForm: !this.data.showContactForm }) },
  onCName(e) { this.setData({ cName: e.detail.value }) },
  onCTel(e) { this.setData({ cTel: e.detail.value }) },

  addContact() {
    const name = this.data.cName.trim()
    const tel = this.data.cTel.trim()
    if (!name || !/^\d{3,20}$/.test(tel)) {
      wx.showToast({ title: '请填写称呼和正确号码', icon: 'none' })
      return
    }
    if (this.data.contacts.length >= 3) {
      wx.showToast({ title: '最多 3 位紧急联系人', icon: 'none' })
      return
    }
    const contacts = this.data.contacts.concat([{ name, tel }])
    wx.setStorageSync('emg_contacts', contacts)
    this.setData({ contacts, cName: '', cTel: '', showContactForm: false })
  },

  delContact(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const contacts = this.data.contacts.filter((_, i) => i !== idx)
    wx.setStorageSync('emg_contacts', contacts)
    this.setData({ contacts })
  },

  callContact(e) {
    wx.makePhoneCall({ phoneNumber: e.currentTarget.dataset.tel })
  },

  // ---- 解锁密码 ----
  togglePwdForm() { this.setData({ showPwdForm: !this.data.showPwdForm }) },
  onPwd(e) { this.setData({ pwd: e.detail.value }) },

  savePwd() {
    const p = this.data.pwd.trim()
    if (!/^\d{4,8}$/.test(p)) {
      wx.showToast({ title: '请输入 4-8 位数字', icon: 'none' })
      return
    }
    wx.setStorageSync('unlock_pwd', p)
    this.setData({ pwd: '', showPwdForm: false })
    wx.showToast({ title: '解锁密码已更新', icon: 'success' })
  },

  // ---- 一键清除 ----
  clearAll() {
    wx.showModal({
      title: '清除全部数据？',
      content: '将删除本机上的所有记录（记账、证据、联系人、对话痕迹）并退回记账本。此操作不可恢复。',
      confirmText: '立即清除',
      confirmColor: '#C2503C',
      success: r => {
        if (!r.confirm) return
        wx.clearStorageSync()
        getApp().globalData.unlocked = false
        wx.reLaunch({ url: '/pages/disguise/disguise' })
      }
    })
  },

  about() {
    wx.showModal({
      title: '关于「暖芽」',
      content: '为家庭暴力受害者提供隐蔽、匿名、即时可用的援助工具。AI 内容仅供参考，不替代专业法律/医疗/心理服务。紧急情况请拨打 110。\n\n黑客松演示版 v1.2',
      showCancel: false,
      confirmText: '好的'
    })
  }
})

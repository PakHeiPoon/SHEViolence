// 真实首页：问候 + 一键求助 + 功能入口 + 科普信息流
const util = require('../../utils/util.js')
const knowledge = require('../../data/knowledge.js')

Page({
  data: {
    nickname: '',
    knowledge,
    expandedId: '',
    today: ''
  },

  onShow() {
    if (!util.ensureUnlocked()) return
    this.setData({
      nickname: getApp().globalData.nickname,
      today: util.todayStr()
    })
  },

  // 一键求助：进入紧急求助页（长按仍直拨110）
  sosTap() {
    wx.redirectTo({ url: '/pages/sos/sos' })
  },

  // 长按大按钮：直接确认拨 110
  sosLong() {
    wx.vibrateShort({ type: 'medium' })
    wx.showModal({
      title: '紧急求助',
      content: '立即拨打 110 报警？',
      confirmText: '立即拨打',
      confirmColor: '#C2503C',
      success: r => { if (r.confirm) wx.makePhoneCall({ phoneNumber: '110' }) }
    })
  },

  // 展示当前位置（便于向救助人员描述所在地）
  showLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: res => {
        wx.openLocation({ latitude: res.latitude, longitude: res.longitude, scale: 17, name: '我的当前位置' })
      },
      fail: () => {
        wx.showToast({ title: '定位不可用（正式版需配置隐私协议）', icon: 'none' })
      }
    })
  },

  goChat() { wx.navigateTo({ url: '/pages/chat/chat' }) },
  goLegal() { wx.navigateTo({ url: '/pages/legal/legal' }) },
  goRisk() { wx.navigateTo({ url: '/pages/risk/risk' }) },
  goEvidence() { wx.navigateTo({ url: '/pages/evidence/evidence' }) },
  goCommunity() { wx.redirectTo({ url: '/pages/community/community' }) },

  toggleCard(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ expandedId: this.data.expandedId === id ? '' : id })
  }
})

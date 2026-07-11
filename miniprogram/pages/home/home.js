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

  // 一键求助：轻触弹出选项
  sosTap() {
    const contacts = wx.getStorageSync('emg_contacts') || []
    const items = ['拨打 110（报警）', '拨打 12338（妇女维权热线）', '查看我的当前位置']
      .concat(contacts.slice(0, 3).map(c => '联系 ' + c.name))
    wx.showActionSheet({
      itemList: items,
      success: res => {
        const i = res.tapIndex
        if (i === 0) wx.makePhoneCall({ phoneNumber: '110' })
        else if (i === 1) wx.makePhoneCall({ phoneNumber: '12338' })
        else if (i === 2) this.showLocation()
        else {
          const c = contacts[i - 3]
          if (c) wx.makePhoneCall({ phoneNumber: c.tel })
        }
      }
    })
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

  goChat() { wx.switchTab({ url: '/pages/chat/chat' }) },
  goLegal() { wx.navigateTo({ url: '/pages/legal/legal' }) },
  goRisk() { wx.navigateTo({ url: '/pages/risk/risk' }) },
  goEvidence() { wx.navigateTo({ url: '/pages/evidence/evidence' }) },
  goCommunity() { wx.switchTab({ url: '/pages/community/community' }) },

  toggleCard(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ expandedId: this.data.expandedId === id ? '' : id })
  }
})

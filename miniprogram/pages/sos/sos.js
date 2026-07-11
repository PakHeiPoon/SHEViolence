// 紧急求助独立页（暖芽设计）：巨字热线 + 快速行动格 + 安全三步 + 紧急联系人
const util = require('../../utils/util.js')

Page({
  data: {
    contacts: []
  },

  onShow() {
    if (!util.ensureUnlocked()) return
    this.setData({ contacts: wx.getStorageSync('emg_contacts') || [] })
  },

  call110() {
    wx.vibrateShort({ type: 'medium' })
    wx.makePhoneCall({ phoneNumber: '110' })
  },
  call(e) {
    wx.makePhoneCall({ phoneNumber: e.currentTarget.dataset.tel })
  },

  // 展示当前位置（便于向救助人员描述所在地）
  showLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: res => {
        wx.openLocation({ latitude: res.latitude, longitude: res.longitude, scale: 17, name: '我的当前位置' })
      },
      fail: () => {
        wx.showToast({ title: '定位不可用（需授权位置权限）', icon: 'none' })
      }
    })
  },

  goMine() {
    wx.redirectTo({ url: '/pages/mine/mine' })
  }
})

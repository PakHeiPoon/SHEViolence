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

  // 12110 短信报警话术：复制后粘贴到短信（小程序无法直接代发短信）
  copySms() {
    wx.setClipboardData({
      data: '我被打了，我在【小区名+门牌号】，对方还在现场，请求出警。我不方便接电话，请短信联系。',
      success: () => wx.showModal({
        title: '话术已复制',
        content: '打开短信，新建收件人 12110，粘贴后把【】里改成你的地址再发送。',
        showCancel: false, confirmText: '知道了'
      })
    })
  },

  goOrgs() {
    wx.navigateTo({ url: '/pages/orgs/orgs' })
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

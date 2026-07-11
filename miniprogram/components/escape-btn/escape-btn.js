// 快速离开：一键切回伪装记账本（所有真实页面右下角常驻）
Component({
  methods: {
    go() {
      getApp().globalData.unlocked = false
      wx.reLaunch({ url: '/pages/disguise/disguise' })
    }
  }
})

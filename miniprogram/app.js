// 反家暴援助小程序 · 应用入口
// 注意：启动页是伪装记账本（pages/disguise/disguise），
// 只有输入解锁密码后 globalData.unlocked 才为 true。
const util = require('./utils/util.js')
const config = require('./config/config.js')

App({
  globalData: {
    unlocked: false, // 是否已通过伪装页解锁
    nickname: ''     // 随机匿名昵称，如「勇敢的云朵」
  },

  onLaunch() {
    // 云开发初始化（config.cloudEnv 填了环境 ID 才生效；traceUser 关闭，贯彻匿名原则）
    if (config.cloudEnv && wx.cloud) {
      wx.cloud.init({ env: config.cloudEnv, traceUser: false })
    }

    // 初始化匿名昵称（不采集任何真实身份信息）
    let nick = wx.getStorageSync('nickname')
    if (!nick) {
      nick = util.genNickname()
      wx.setStorageSync('nickname', nick)
    }
    this.globalData.nickname = nick

    // 截图监听：无法阻止截图，只能事后温和提醒（平台限制）
    if (wx.onUserCaptureScreen) {
      wx.onUserCaptureScreen(() => {
        if (this.globalData.unlocked) {
          wx.showToast({ title: '提醒：截图会留在相册中，注意及时清理', icon: 'none', duration: 2500 })
        }
      })
    }
  }
})

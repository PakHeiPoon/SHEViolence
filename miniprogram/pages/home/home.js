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
  goLegal() { wx.navigateTo({ url: '/pages/chat/chat?mode=legal' }) },
  goRisk() { wx.navigateTo({ url: '/pages/risk/risk' }) },
  goEvidence() { wx.navigateTo({ url: '/pages/evidence/evidence' }) },
  goOrgs() { wx.navigateTo({ url: '/pages/orgs/orgs' }) },

  // 隐私信任条 → 完整说明（口径：只承诺做到的事，不写"不留存/加密"）
  showPrivacy() {
    wx.showModal({
      title: '你的隐私',
      content: '暖芽没有账号体系，不建用户档案。你的聊天、证据时间线、紧急联系人都只保存在这台手机上，「我的 → 一键清除」可随时全部删除。\n\n与暖芽对话时，内容会交给 AI 模型生成回应，不关联你的身份、不用于其他用途。',
      showCancel: false, confirmText: '我知道了'
    })
  },
  goCommunity() { wx.redirectTo({ url: '/pages/community/community' }) },

  toggleCard(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ expandedId: this.data.expandedId === id ? '' : id })
  }
})

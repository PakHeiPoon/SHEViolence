// 悬浮 dock 导航（移植自暖芽设计）：胶囊四格 + 气泡滑块 + 独立暖芽头像按钮
const ITEMS = [
  { key: 'home', url: '/pages/home/home', icon: '/static/icon-home.png' },
  { key: 'sos', url: '/pages/sos/sos', icon: '/static/icon-sos.png' },
  { key: 'community', url: '/pages/community/community', icon: '/static/icon-community.png' },
  { key: 'settings', url: '/pages/mine/mine', icon: '/static/icon-settings.png' }
]

Component({
  properties: {
    active: { type: String, value: '' }
  },
  data: {
    items: ITEMS,
    activeIndex: -1
  },
  observers: {
    active(val) {
      this.setData({ activeIndex: ITEMS.findIndex(i => i.key === val) })
    }
  },
  methods: {
    go(e) {
      const { key, url } = e.currentTarget.dataset
      if (key === this.data.active) return
      wx.redirectTo({ url })
    },
    openChat() {
      wx.navigateTo({ url: '/pages/chat/chat' })
    }
  }
})

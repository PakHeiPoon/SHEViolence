// 救助机构名录：5 条国家热线 + 14 家全国机构 + 18 家区域机构（附件二）+ 文书模板一键复制
const util = require('../../utils/util.js')
const orgs = require('../../data/orgs.js')
const templates = require('../../data/templates.js')

Page({
  data: {
    hotlines: orgs.hotlines,
    national: orgs.national,
    regional: orgs.regional,
    showRegional: false
  },

  onShow() { util.ensureUnlocked() },

  call(e) {
    const tel = e.currentTarget.dataset.tel
    if (tel) wx.makePhoneCall({ phoneNumber: tel })
  },

  toggleRegional() { this.setData({ showRegional: !this.data.showRegional }) },

  // 文书模板 → 复制到剪贴板（AI 填空为后续版本；当前为带【】填空位的标准模板）
  copyTpl(e) {
    const key = e.currentTarget.dataset.key
    const text = key === 'protect' ? templates.protectOrder : templates.divorceSuit
    wx.setClipboardData({
      data: text,
      success: () => wx.showModal({
        title: '模板已复制',
        content: '粘贴到备忘录，把【】处补全即可。此为模板，正式提交前建议由律师或 12348 法律援助审阅。',
        showCancel: false, confirmText: '知道了'
      })
    })
  }
})

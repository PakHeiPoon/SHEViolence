// AI 对话页：双模式（暖暖陪伴 / 法律问答RAG）+ 双层危机检测
const util = require('../../utils/util.js')
const api = require('../../utils/api.js')

const CHIPS = {
  companion: ['我不知道该怎么办', '他昨天又动手了', '我想离开但很害怕'],
  legal: ['人身安全保护令怎么申请？', '只有辱骂没动手算家暴吗？', '离婚时家暴证据怎么认定？']
}

// 结论卡片：AI 回复里出现 ≥2 个可执行行动信号时，生成一张可操作卡片
const ACTION_HINTS = ['报警', '110', '12338', '保护令', '证据', '取证', '离开', '庇护', '验伤', '伤情', '告诫书', '申请', '记录']
function detectCard(reply) {
  const hits = ACTION_HINTS.filter(w => reply.indexOf(w) > -1)
  if (hits.length < 2) return null
  return { summary: reply.length > 64 ? reply.slice(0, 62) + '…' : reply, saved: false }
}

Page({
  data: {
    mode: 'companion',           // companion | legal
    chips: CHIPS.companion,
    messages: [],                // {role, content, sources?}
    inputValue: '',
    aiTyping: false,
    crisisLevel: 0,              // 0 无 / 2 高风险 / 3 生命危险
    toView: ''
  },

  onShow() {
    if (!util.ensureUnlocked()) return
    if (!wx.getStorageSync('chat_disclaimer_shown')) {
      wx.setStorageSync('chat_disclaimer_shown', true)
      wx.showModal({
        title: '温柔的提醒',
        content: '暖暖是 AI 伙伴，能陪伴你、提供参考信息，但不能替代专业的法律、医疗与心理援助。紧急情况请直接拨打 110 或 12338。本次对话不会自动保存。',
        showCancel: false,
        confirmText: '我知道了'
      })
    }
  },

  switchMode(e) {
    const m = e.currentTarget.dataset.mode
    if (m === this.data.mode) return
    this.setData({ mode: m, chips: CHIPS[m] })
  },

  onInput(e) { this.setData({ inputValue: e.detail.value }) },
  tapChip(e) {
    this.setData({ inputValue: e.currentTarget.dataset.text })
    this.send()
  },

  async send() {
    const text = String(this.data.inputValue || '').trim()
    if (!text || this.data.aiTyping) return

    // 第一层危机检测：本地关键词，毫秒级、确定性
    const crisis = api.detectCrisis(text)
    if (crisis.level >= 3) wx.vibrateShort({ type: 'heavy' })

    const messages = this.data.messages.concat([{ role: 'user', content: text }])
    this.setData({
      messages,
      inputValue: '',
      aiTyping: true,
      crisisLevel: Math.max(this.data.crisisLevel, crisis.level),
      toView: 'anchor-bottom'
    })

    try {
      let msg
      if (this.data.mode === 'legal') {
        const r = await api.legalQa(text)
        msg = { role: 'assistant', content: r.answer, sources: r.sources }
      } else {
        const r = await api.chat(messages)
        msg = { role: 'assistant', content: r.reply, card: detectCard(r.reply) }
      }
      this.setData({
        messages: this.data.messages.concat([msg]),
        aiTyping: false,
        toView: 'anchor-bottom'
      })
    } catch (e) {
      // api 层已有 mock 兜底，这里理论到不了；再兜一层
      this.setData({
        messages: this.data.messages.concat([{ role: 'assistant', content: '我在的。刚才信号不太好，可以再说一遍吗？' }]),
        aiTyping: false,
        toView: 'anchor-bottom'
      })
    }
  },

  call110() { wx.makePhoneCall({ phoneNumber: '110' }) },
  call12338() { wx.makePhoneCall({ phoneNumber: '12338' }) },
  closeBanner() { this.setData({ crisisLevel: 0 }) },

  // 结论卡片 → 存到「我的记录」（证据库）
  saveCardToEvidence(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const msg = this.data.messages[idx]
    if (!msg || !msg.card || msg.card.saved) return
    const list = wx.getStorageSync('evidence_list') || []
    const item = {
      id: 'adv' + idx + '_' + list.length,
      type: 'text',
      date: util.todayStr(),
      title: '💡 暖暖的建议',
      desc: msg.content,
      tag: '建议'
    }
    wx.setStorageSync('evidence_list', [item].concat(list))
    const messages = this.data.messages.map((m, i) =>
      i === idx ? Object.assign({}, m, { card: Object.assign({}, m.card, { saved: true }) }) : m
    )
    this.setData({ messages })
    wx.showToast({ title: '已存到「我的记录」', icon: 'success' })
  },

  // 结论卡片 → 一键求助
  sosFromCard() {
    wx.showActionSheet({
      itemList: ['拨打 110（报警）', '拨打 12338（妇女维权热线）'],
      success: res => {
        wx.makePhoneCall({ phoneNumber: res.tapIndex === 0 ? '110' : '12338' })
      }
    })
  }
})

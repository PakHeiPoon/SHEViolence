// 暖暖陪伴页：多会话 + 上下文记忆 + 多模态发图 + 双层危机检测 + 结论卡片
const util = require('../../utils/util.js')
const api = require('../../utils/api.js')
const session = require('../../utils/session.js')
const voice = require('../../utils/voice.js')

const CHIPS = ['我不知道该怎么办', '他昨天又动手了', '我想离开但很害怕']

// 结论卡片：优先解析 AI 主动输出的 [[CARD:摘要]]；否则命中强行动词兜底
const STRONG_HINTS = ['报警', '110', '12338', '保护令', '证据', '取证', '告诫书', '验伤', '庇护', '离开', '安全计划']
function extractCard(reply) {
  const m = reply.match(/\[\[CARD[:：]([\s\S]+?)\]\]/) // 兼容半角/全角冒号
  const text = util.stripMd(reply) // 清 markdown + 兜底剔除卡片标记
  if (m) return { text, card: { summary: util.stripMd(m[1]), saved: false } }
  // 兜底出卡收紧：过程话（"我来搜索/查一下/稍等"）绝不出卡；太短的也不出（没有可执行内容）
  const isProcess = /(搜索|查询|查一下|搜一下|稍等|帮你查|我来搜|我去查)/.test(text)
  const hit = STRONG_HINTS.some(w => text.indexOf(w) > -1)
  const card = (!isProcess && hit && text.length >= 60)
    ? { summary: text.length > 64 ? text.slice(0, 62) + '…' : text, saved: false }
    : null
  return { text, card }
}

Page({
  data: {
    sid: '',
    messages: [],
    inputValue: '',
    imagePath: '',        // 待发送图片本地路径
    aiTyping: false,
    agentStatus: '',
    crisisLevel: 0,
    chips: CHIPS,
    toView: '',
    showSessions: false,
    sessions: [],
    recing: false,
    recHint: ''
  },

  onLoad() {
    // 语音输入：识别结果追加到输入框（用户可修改后再发送）
    this.voice = voice.setup(this, text => {
      this.setData({ inputValue: (this.data.inputValue || '') + text })
    })
  },

  voiceStart() { this.voice.start() },
  voiceStop() { if (this.data.recing) this.voice.stop() },

  onShow() {
    if (!util.ensureUnlocked()) return
    this.loadCurrent()
    if (!wx.getStorageSync('chat_disclaimer_shown')) {
      wx.setStorageSync('chat_disclaimer_shown', true)
      wx.showModal({
        title: '温柔的提醒',
        content: '暖芽是 AI 伙伴，能陪伴你、提供参考信息，但不能替代专业的法律、医疗与心理援助。紧急情况请直接拨打 110 或 12338。对话仅保存在你的手机本地。',
        showCancel: false,
        confirmText: '我知道了'
      })
    }
  },

  loadCurrent() {
    const sid = session.currentId()
    const s = session.get(sid)
    this.setData({ sid, messages: s ? s.messages : [], crisisLevel: 0, toView: 'anchor-bottom' })
  },

  // ---------- 会话管理 ----------
  openSessions() {
    const sessions = session.all().map(s => ({
      id: s.id, title: s.title, time: session.relTime(s.updatedAt), active: s.id === this.data.sid
    }))
    this.setData({ sessions, showSessions: true })
  },
  closeSessions() { this.setData({ showSessions: false }) },

  newSession() {
    const s = session.create()
    this.setData({ sid: s.id, messages: [], showSessions: false, crisisLevel: 0 })
  },

  switchSession(e) {
    const id = e.currentTarget.dataset.id
    session.setCurrent(id)
    const s = session.get(id)
    this.setData({ sid: id, messages: s ? s.messages : [], showSessions: false, crisisLevel: 0, toView: 'anchor-bottom' })
  },

  delSession(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除这个会话？', content: '删除后不可恢复。', confirmColor: '#C2503C',
      success: r => {
        if (!r.confirm) return
        session.remove(id)
        if (id === this.data.sid) this.loadCurrent()
        this.openSessions()
      }
    })
  },

  onInput(e) { this.setData({ inputValue: e.detail.value }) },
  tapChip(e) { this.setData({ inputValue: e.currentTarget.dataset.text }); this.send() },

  // ---------- 多模态：选图 / 清图 ----------
  chooseImage() {
    wx.chooseMedia({
      count: 1, mediaType: ['image'], sizeType: ['compressed'],
      success: res => this.setData({ imagePath: res.tempFiles[0].tempFilePath })
    })
  },
  clearImage() { this.setData({ imagePath: '' }) },

  async send() {
    const text = String(this.data.inputValue || '').trim()
    const image = this.data.imagePath
    if ((!text && !image) || this.data.aiTyping) return

    const crisis = api.detectCrisis(text)
    if (crisis.level >= 3) wx.vibrateShort({ type: 'heavy' })

    const userMsg = image ? { role: 'user', content: text, image } : { role: 'user', content: text }
    const messages = this.data.messages.concat([userMsg])
    this.setData({
      messages,
      inputValue: '', imagePath: '', aiTyping: true,
      agentStatus: image ? '👀 暖芽正在看你发的照片…' : '💛 暖芽正在认真想…',
      crisisLevel: Math.max(this.data.crisisLevel, crisis.level),
      toView: 'anchor-bottom'
    })

    try {
      const r = await api.chat(messages, s => this.setData({ agentStatus: s }))
      const parsed = extractCard(r.reply)
      this.streamReply(parsed.text, parsed.card, r.sources || [])
    } catch (e) {
      this.streamReply('我在的。刚才信号不太好，可以再说一遍吗？', null, [])
    }
  },

  // 打字机流式：逐字追加显示，完成后挂结论卡片/联网来源并存会话
  streamReply(fullText, card, sources) {
    const idx = this.data.messages.length
    this.setData({
      messages: this.data.messages.concat([{ role: 'assistant', content: '', card: null }]),
      aiTyping: false, agentStatus: ''
    })
    let i = 0
    const step = () => {
      i += 3
      this.setData({ ['messages[' + idx + '].content']: fullText.slice(0, i), toView: 'anchor-bottom' })
      if (i < fullText.length) {
        this._typer = setTimeout(step, 38)
      } else {
        if (card) this.setData({ ['messages[' + idx + '].card']: card })
        if (sources && sources.length) this.setData({ ['messages[' + idx + '].sources']: sources })
        session.updateMessages(this.data.sid, this.data.messages)
      }
    }
    step()
  },

  // 点网络来源可复制链接
  copySource(e) {
    const url = e.currentTarget.dataset.url
    if (!url) return
    wx.setClipboardData({ data: url, success: () => wx.showToast({ title: '来源链接已复制', icon: 'none' }) })
  },

  onUnload() { if (this._typer) clearTimeout(this._typer) },

  call110() { wx.makePhoneCall({ phoneNumber: '110' }) },
  call12338() { wx.makePhoneCall({ phoneNumber: '12338' }) },
  closeBanner() { this.setData({ crisisLevel: 0 }) },

  // ---------- 结论卡片 ----------
  saveCardToEvidence(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const msg = this.data.messages[idx]
    if (!msg || !msg.card || msg.card.saved) return
    const list = wx.getStorageSync('evidence_list') || []
    const item = { id: 'adv' + Date.now(), type: 'text', date: util.todayStr(), title: '💡 暖芽的建议', desc: msg.content, tag: '建议' }
    wx.setStorageSync('evidence_list', [item].concat(list))
    const messages = this.data.messages.map((m, i) =>
      i === idx ? Object.assign({}, m, { card: Object.assign({}, m.card, { saved: true }) }) : m
    )
    this.setData({ messages })
    session.updateMessages(this.data.sid, messages)
    wx.showToast({ title: '已存到「我的记录」', icon: 'success' })
  },

  sosFromCard() {
    wx.showActionSheet({
      itemList: ['拨打 110（报警）', '拨打 12338（妇女维权热线）'],
      success: res => wx.makePhoneCall({ phoneNumber: res.tapIndex === 0 ? '110' : '12338' })
    })
  }
})

// 统一聊天页（暖芽陪伴 / 法律援助 顶部切换）· 移植队友「暖芽」设计 + 我们全部真后端
// 保留：多会话 · 上下文记忆 · 多模态发图 · 语音 · 打字机流式 · Agent状态/搜索可视化 · 危机检测 · 结论卡片 · 来源引用
const util = require('../../utils/util.js')
const api = require('../../utils/api.js')
const session = require('../../utils/session.js')
const voice = require('../../utils/voice.js')

const MODES = {
  companion: { label: '暖芽陪伴', desc: '情绪陪伴，慢慢倾诉' },
  legal: { label: '法律援助', desc: '法律咨询与取证指引' }
}
const QUICK = {
  companion: ['我现在很害怕', '我想找人说说话', '我不知道该不该离开', '我想离开但没地方去'],
  legal: ['他这样算家暴吗？', '我该怎么收集证据？', '怎么申请人身安全保护令？', '起诉离婚要准备什么？']
}

// 人工介入接管话术（《家暴高危词识别与人工介入触发》skill 标准模板：本轮只输出此内容，不追问不科普）
const HUMAN_SCRIPT = '你告诉我的这些，需要很大勇气。\n\n你现在的处境，已经超出了我能帮你的范围。我想帮你接一位真人——她们更懂怎么帮你。\n\n在接通之前，我先确认一件事：\n你现在人在哪里？身边安全吗？'
const HOLD_KEY = 'crisis_hold_until' // 命中 L4/L3 后 24h 内求助入口保持可见（"她说安全≠她安全"）

// 结论卡片（仅陪伴模式）：优先 AI 的 [[CARD:摘要]]，否则强行动词兜底；过程话不出卡
const STRONG_HINTS = ['报警', '110', '12338', '保护令', '证据', '取证', '告诫书', '验伤', '庇护', '离开', '安全计划']
function extractCard(reply) {
  const m = reply.match(/\[\[CARD[:：]([\s\S]+?)\]\]/)
  const text = util.stripMd(reply)
  if (m) return { text, card: { summary: util.stripMd(m[1]), saved: false } }
  const isProcess = /(搜索|查询|查一下|搜一下|稍等|帮你查|我来搜|我去查)/.test(text)
  const hit = STRONG_HINTS.some(w => text.indexOf(w) > -1)
  const card = (!isProcess && hit && text.length >= 60)
    ? { summary: text.length > 64 ? text.slice(0, 62) + '…' : text, saved: false } : null
  return { text, card }
}

Page({
  data: {
    mode: 'companion',
    modeLabel: '暖芽陪伴',
    modes: [
      { key: 'companion', label: MODES.companion.label, desc: MODES.companion.desc },
      { key: 'legal', label: MODES.legal.label, desc: MODES.legal.desc }
    ],
    showModePanel: false,
    quick: QUICK.companion,
    sid: '',
    messages: [],
    inputValue: '',
    imagePath: '',
    aiTyping: false,
    agentStatus: '',
    crisisLevel: 0,
    toView: '',
    showSessions: false,
    sessions: [],
    recing: false,
    recHint: ''
  },

  onLoad(q) {
    if (q && q.mode === 'legal') {
      this.setData({ mode: 'legal', modeLabel: MODES.legal.label, quick: QUICK.legal })
    }
    this.voice = voice.setup(this, text => this.setData({ inputValue: (this.data.inputValue || '') + text }))
  },

  onShow() {
    if (!util.ensureUnlocked()) return
    this.loadCurrent()
    if (!wx.getStorageSync('chat_disclaimer_shown')) {
      wx.setStorageSync('chat_disclaimer_shown', true)
      wx.showModal({
        title: '温柔的提醒',
        content: '暖芽是 AI 伙伴，能陪伴你、提供参考信息，但不能替代专业的法律、医疗与心理援助。紧急情况请直接拨打 110 或 12338。对话仅保存在你的手机本地。',
        showCancel: false, confirmText: '我知道了'
      })
    }
  },

  onUnload() { if (this._typer) clearTimeout(this._typer) },

  // 24h 高危保持期内，求助 Banner 至少 level 2 可见
  holdLevel() { return (wx.getStorageSync(HOLD_KEY) || 0) > Date.now() ? 2 : 0 },

  loadCurrent() {
    const sid = session.currentId()
    const s = session.get(sid)
    this.setData({ sid, messages: s ? s.messages : [], crisisLevel: this.holdLevel(), toView: 'anchor-bottom' })
  },

  // ---------- Agent 模式切换 ----------
  toggleModePanel() { this.setData({ showModePanel: !this.data.showModePanel }) },
  closeModePanel() { this.setData({ showModePanel: false }) },
  pickMode(e) {
    const key = e.currentTarget.dataset.mode
    this.setData({ mode: key, modeLabel: MODES[key].label, quick: QUICK[key], showModePanel: false })
  },

  // ---------- 会话管理（菜单按钮 → 抽屉）----------
  openSessions() {
    const sessions = session.all().map(s => ({ id: s.id, title: s.title, time: session.relTime(s.updatedAt), active: s.id === this.data.sid }))
    this.setData({ sessions, showSessions: true })
  },
  closeSessions() { this.setData({ showSessions: false }) },
  newSession() {
    const s = session.create()
    this.setData({ sid: s.id, messages: [], showSessions: false, crisisLevel: this.holdLevel() })
  },
  switchSession(e) {
    const id = e.currentTarget.dataset.id
    session.setCurrent(id)
    const s = session.get(id)
    this.setData({ sid: id, messages: s ? s.messages : [], showSessions: false, crisisLevel: this.holdLevel(), toView: 'anchor-bottom' })
  },
  delSession(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除这个会话？', content: '删除后不可恢复。', confirmColor: '#D64541',
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
  chooseImage() {
    wx.chooseMedia({ count: 1, mediaType: ['image'], sizeType: ['compressed'], success: res => this.setData({ imagePath: res.tempFiles[0].tempFilePath }) })
  },
  clearImage() { this.setData({ imagePath: '' }) },
  voiceStart() { this.voice.start() },
  voiceStop() { if (this.data.recing) this.voice.stop() },

  async send(e) {
    const preset = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.text : ''
    const text = String((preset || this.data.inputValue) || '').trim()
    const mode = this.data.mode
    const image = mode === 'companion' ? this.data.imagePath : ''
    if ((!text && !image) || this.data.aiTyping) return

    // 两种模式都做本地高危检测（毫秒级、确定性；词表 data/crisis-words.js 来自高危词skill）
    const crisis = api.detectCrisis(text)
    if (crisis.level >= 3) wx.vibrateShort({ type: 'heavy' })

    const userMsg = image ? { role: 'user', content: text, image } : { role: 'user', content: text }
    const messages = this.data.messages.concat([userMsg])

    // L4/L3 命中 → 中断一切 AI 流程，本轮只输出人工介入接管卡（宁可误触发，不可漏判）
    if (crisis.level >= 3) {
      wx.setStorageSync(HOLD_KEY, Date.now() + 24 * 3600 * 1000)
      this.setData({ messages, inputValue: '', imagePath: '', aiTyping: true, agentStatus: '', crisisLevel: 3, toView: 'anchor-bottom' })
      setTimeout(() => this.streamReply(HUMAN_SCRIPT, { human: true }), 600)
      return
    }

    this.setData({
      messages, inputValue: '', imagePath: '', aiTyping: true,
      agentStatus: mode === 'legal' ? '🔍 正在检索 569 篇知识库…' : (image ? '👀 暖芽正在看你发的照片…' : '💛 暖芽正在认真想…'),
      crisisLevel: Math.max(this.data.crisisLevel, crisis.level),
      toView: 'anchor-bottom'
    })

    try {
      if (mode === 'legal') {
        const r = await api.legalQa(text)
        const n = (r.sources && r.sources.length) || 0
        this.setData({ agentStatus: '✍️ 依据 ' + n + ' 篇资料作答…' })
        await new Promise(res => setTimeout(res, 400))
        this.streamReply(r.answer, { sources: r.sources || [] })
      } else {
        const r = await api.chat(messages, s => this.setData({ agentStatus: s }))
        const parsed = extractCard(r.reply)
        this.streamReply(parsed.text, { card: parsed.card, sources: r.sources || [] })
      }
    } catch (err) {
      this.streamReply(mode === 'legal' ? '抱歉，刚才没能查到相关资料，可以换个说法再问，或拨打 12338 咨询。' : '我在的。刚才信号不太好，可以再说一遍吗？', {})
    }
  },

  // 打字机流式：逐字追加，完成后挂结论卡片/来源并存会话
  streamReply(fullText, extra) {
    fullText = util.stripMd(fullText || '')
    const idx = this.data.messages.length
    this.setData({
      messages: this.data.messages.concat([{ role: 'assistant', content: '', card: null, sources: null }]),
      aiTyping: false, agentStatus: ''
    })
    let i = 0
    const step = () => {
      i += 3
      this.setData({ ['messages[' + idx + '].content']: fullText.slice(0, i), toView: 'anchor-bottom' })
      if (i < fullText.length) {
        this._typer = setTimeout(step, 32)
      } else {
        if (extra && extra.card) this.setData({ ['messages[' + idx + '].card']: extra.card })
        if (extra && extra.human) this.setData({ ['messages[' + idx + '].human']: true })
        if (extra && extra.sources && extra.sources.length) this.setData({ ['messages[' + idx + '].sources']: extra.sources })
        session.updateMessages(this.data.sid, this.data.messages)
      }
    }
    step()
  },

  // ---------- 消息级操作 ----------
  saveCardToEvidence(e) {
    const idx = Number(e.currentTarget.dataset.idx)
    const msg = this.data.messages[idx]
    if (!msg || !msg.card || msg.card.saved) return
    const list = wx.getStorageSync('evidence_list') || []
    const item = { id: 'adv' + Date.now(), type: 'text', date: util.todayStr(), title: '💡 暖芽的建议', desc: msg.content, tag: '建议' }
    wx.setStorageSync('evidence_list', [item].concat(list))
    const messages = this.data.messages.map((m, i) => i === idx ? Object.assign({}, m, { card: Object.assign({}, m.card, { saved: true }) }) : m)
    this.setData({ messages })
    session.updateMessages(this.data.sid, messages)
    wx.showToast({ title: '已存到「我的记录」', icon: 'success' })
  },
  copySource(e) {
    const url = e.currentTarget.dataset.url
    if (!url) return
    wx.setClipboardData({ data: url, success: () => wx.showToast({ title: '来源链接已复制', icon: 'none' }) })
  },
  goSos() { wx.navigateTo({ url: '/pages/sos/sos' }) },
  call110() { wx.makePhoneCall({ phoneNumber: '110' }) },
  call12338() { wx.makePhoneCall({ phoneNumber: '12338' }) },
  closeBanner() { this.setData({ crisisLevel: 0 }) },

  // ---------- 人工介入接管卡 ----------
  // 接通真人热线：真实号码直拨（志愿者排队为后续版本，先接现有公开热线）
  humanHotline() {
    const items = ['源众个案热线 177-0124-2202', '妇联维权热线 12338', '白丝带热线 400-0110-391', '查看全部机构名录']
    const tels = ['17701242202', '12338', '4000110391', '']
    wx.showActionSheet({
      itemList: items,
      success: r => {
        if (r.tapIndex === 3) wx.navigateTo({ url: '/pages/orgs/orgs' })
        else if (tels[r.tapIndex]) wx.makePhoneCall({ phoneNumber: tels[r.tapIndex] })
      }
    })
  },
  // 隐藏此对话：一键回到伪装记账本（清空页面栈，外人拿到手机只见记账）
  hideChat() { wx.reLaunch({ url: '/pages/disguise/disguise' }) }
})

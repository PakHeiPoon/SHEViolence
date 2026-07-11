// 安全自查：DA 改编量表 → 本地计分兜底 + AI（deepseek-r1）分析增强
const util = require('../../utils/util.js')
const api = require('../../utils/api.js')
const da = require('../../data/da-questions.js')

Page({
  data: {
    started: false,
    questions: da.questions,
    answers: {},        // qid → 选项下标
    answeredCount: 0,
    submitting: false,
    result: null        // { score, maxScore, level, levelText, suggestions, aiAnalysis, resources }
  },

  onShow() { util.ensureUnlocked() },

  start() { this.setData({ started: true }) },

  pick(e) {
    const { qid, idx } = e.currentTarget.dataset
    const answers = Object.assign({}, this.data.answers, { [qid]: Number(idx) })
    this.setData({ answers, answeredCount: Object.keys(answers).length })
  },

  async submit() {
    if (this.data.answeredCount < this.data.questions.length || this.data.submitting) return
    this.setData({ submitting: true })

    const answerList = this.data.questions.map(q => {
      const idx = this.data.answers[q.id]
      const opt = q.options[idx]
      return { q: q.text, answer: opt.label, score: opt.score }
    })

    const result = await api.risk(answerList)
    result.aiAnalysis = util.stripMd(result.aiAnalysis)
    result.suggestions = (result.suggestions || []).map(s => util.stripMd(s))
    this.setData({ result, submitting: false })
    wx.pageScrollTo({ scrollTop: 0, duration: 200 })
  },

  reset() {
    this.setData({ started: true, answers: {}, answeredCount: 0, result: null })
  },

  call(e) {
    wx.makePhoneCall({ phoneNumber: e.currentTarget.dataset.tel })
  },

  goChat() { wx.switchTab({ url: '/pages/chat/chat' }) }
})

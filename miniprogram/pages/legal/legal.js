// 法律问答页（独立）：真 RAG 检索 + 来源引用
const util = require('../../utils/util.js')
const api = require('../../utils/api.js')

const CHIPS = [
  '人身安全保护令怎么申请？',
  '只有辱骂没动手算家暴吗？',
  '离婚时家暴证据怎么认定？',
  '遭受家暴，孩子抚养权归谁？'
]

Page({
  data: {
    chips: CHIPS,
    messages: [],
    inputValue: '',
    aiTyping: false,
    agentStatus: '',
    toView: ''
  },

  onShow() { util.ensureUnlocked() },

  onInput(e) { this.setData({ inputValue: e.detail.value }) },
  tapChip(e) {
    this.setData({ inputValue: e.currentTarget.dataset.text })
    this.send()
  },

  async send() {
    const text = String(this.data.inputValue || '').trim()
    if (!text || this.data.aiTyping) return
    this.setData({
      messages: this.data.messages.concat([{ role: 'user', content: text }]),
      inputValue: '',
      aiTyping: true,
      agentStatus: '🔍 正在检索 569 篇知识库…',
      toView: 'anchor-bottom'
    })
    try {
      const r = await api.legalQa(text)
      const n = (r.sources && r.sources.length) || 0
      this.setData({ agentStatus: '✍️ deepseek-v3 依据 ' + n + ' 篇资料作答…' })
      await new Promise(res => setTimeout(res, 500))
      this.streamReply(r.answer, r.sources)
    } catch (e) {
      this.streamReply('抱歉，刚才没能查到相关资料。可以换个说法再问，或拨打 12338 咨询。', null)
    }
  },

  // 打字机流式：逐字追加，完成后在回答下方展示来源引用
  streamReply(fullText, sources) {
    const idx = this.data.messages.length
    this.setData({
      messages: this.data.messages.concat([{ role: 'assistant', content: '', sources: null }]),
      aiTyping: false, agentStatus: ''
    })
    let i = 0
    const step = () => {
      i += 3
      this.setData({ ['messages[' + idx + '].content']: fullText.slice(0, i), toView: 'anchor-bottom' })
      if (i < fullText.length) {
        this._typer = setTimeout(step, 36)
      } else if (sources && sources.length) {
        this.setData({ ['messages[' + idx + '].sources']: sources, toView: 'anchor-bottom' })
      }
    }
    step()
  },

  onUnload() { if (this._typer) clearTimeout(this._typer) }
})

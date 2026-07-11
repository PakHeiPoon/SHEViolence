// 我的记录（证据库）：上传伤情照片 → qwen3-vl 多模态生成专业描述 → 本地时间线归档
// 黑客松版为本地演示存储；正式版设计为 AES-256 端到端加密后存云端（见开发文档）。
const util = require('../../utils/util.js')
const api = require('../../utils/api.js')
const mockData = require('../../data/mock-replies.js')

Page({
  data: {
    list: [],
    analyzing: false,
    draft: null // 待确认的分析结果 { path, ai: {injury_desc, medical_tip, suggest_police, timeline} }
  },

  onShow() {
    if (!util.ensureUnlocked()) return
    let list = wx.getStorageSync('evidence_list')
    if (!list) {
      list = mockData.evidencePreset
      wx.setStorageSync('evidence_list', list)
    }
    this.setData({ list })
  },

  async add() {
    if (this.data.analyzing) return
    try {
      const res = await wx.chooseMedia({ count: 1, mediaType: ['image'], sizeType: ['compressed'] })
      const path = res.tempFiles[0].tempFilePath
      this.setData({ analyzing: true, draft: null })
      const ai = await api.vision(path, '')
      this.setData({ analyzing: false, draft: { path, ai } })
    } catch (e) {
      // 用户取消选图
      this.setData({ analyzing: false })
    }
  },

  saveDraft() {
    const d = this.data.draft
    if (!d) return
    const item = {
      id: 'ev' + Date.now(),
      type: 'image',
      date: util.todayStr(),
      title: '伤情照片 · AI 辅助描述',
      path: d.path,
      desc: d.ai.injury_desc,
      medical: d.ai.medical_tip,
      police: d.ai.suggest_police,
      timeline: d.ai.timeline,
      tag: '图片'
    }
    const list = [item].concat(this.data.list)
    wx.setStorageSync('evidence_list', list)
    this.setData({ list, draft: null })
    wx.showToast({ title: '已加入时间线', icon: 'success' })
  },

  discardDraft() { this.setData({ draft: null }) },

  del(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除这条记录？',
      content: '删除后不可恢复。',
      confirmColor: '#C2503C',
      success: r => {
        if (!r.confirm) return
        const list = this.data.list.filter(x => x.id !== id)
        wx.setStorageSync('evidence_list', list)
        this.setData({ list })
      }
    })
  }
})

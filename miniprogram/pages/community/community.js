// 互助社群（黑客松版：静态演示数据，不做后端写入）
const util = require('../../utils/util.js')
const posts = require('../../data/community-posts.js')

const TAGS = ['全部', '法律', '心理', '庇护', '取证', '倾诉']

Page({
  data: {
    tags: TAGS,
    activeTag: '全部',
    posts,
    shown: posts,
    expandedId: ''
  },

  onShow() { util.ensureUnlocked() },

  switchTag(e) {
    const tag = e.currentTarget.dataset.tag
    const shown = tag === '全部' ? this.data.posts : this.data.posts.filter(p => p.tag === tag)
    this.setData({ activeTag: tag, shown })
  },

  toggle(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ expandedId: this.data.expandedId === id ? '' : id })
  },

  report() {
    wx.showToast({ title: '已收到举报，将尽快处理（演示）', icon: 'none' })
  },

  newPost() {
    wx.showToast({ title: '发帖功能开发中（演示版）', icon: 'none' })
  }
})

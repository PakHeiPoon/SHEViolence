// 暖暖陪伴 · 多会话数据层（本地存储，匿名不上云）
// 每个会话：{ id, title, updatedAt, messages: [{role, content, image?, card?}] }
const KEY = 'chat_sessions'
const CUR = 'chat_current'

function all() {
  return wx.getStorageSync(KEY) || []
}

function persist(list) {
  wx.setStorageSync(KEY, list)
}

function deriveTitle(messages) {
  const firstUser = messages.find(m => m.role === 'user')
  if (!firstUser) return ''
  const t = String(firstUser.content || (firstUser.image ? '[图片]' : '')).trim()
  return t.length > 16 ? t.slice(0, 15) + '…' : (t || '新的倾诉')
}

// 新建会话并置为当前，返回会话对象
function create() {
  const s = { id: 'sess_' + Date.now() + '_' + Math.floor(Math.random() * 1000), title: '新的倾诉', updatedAt: Date.now(), messages: [] }
  persist([s].concat(all()))
  wx.setStorageSync(CUR, s.id)
  return s
}

// 当前会话 id（无则自动新建）
function currentId() {
  const list = all()
  let id = wx.getStorageSync(CUR)
  if (!id || !list.find(s => s.id === id)) {
    id = list.length ? list[0].id : create().id
    wx.setStorageSync(CUR, id)
  }
  return id
}

function get(id) {
  return all().find(s => s.id === id) || null
}

// 保存会话消息（更新标题 + 时间，并置顶为最近活跃）
function updateMessages(id, messages) {
  const list = all()
  const idx = list.findIndex(s => s.id === id)
  if (idx === -1) return
  const updated = Object.assign({}, list[idx], {
    messages,
    title: deriveTitle(messages) || list[idx].title,
    updatedAt: Date.now()
  })
  const rest = list.filter((_, i) => i !== idx)
  persist([updated].concat(rest))
}

function remove(id) {
  const list = all().filter(s => s.id !== id)
  persist(list)
  if (wx.getStorageSync(CUR) === id) {
    wx.setStorageSync(CUR, list.length ? list[0].id : '')
  }
}

function setCurrent(id) {
  wx.setStorageSync(CUR, id)
}

// 相对时间：今天 / 昨天 / N天前（隐私考虑不显示精确时间）
function relTime(ts) {
  const days = Math.floor((Date.now() - ts) / 86400000)
  if (days <= 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 30) return days + '天前'
  return '较早'
}

module.exports = { all, create, currentId, get, updateMessages, remove, setCurrent, relTime }

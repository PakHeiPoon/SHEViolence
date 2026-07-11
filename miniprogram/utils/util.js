// 通用工具
const ADJS = ['勇敢的', '温柔的', '坚强的', '发光的', '自由的', '安静的', '向阳的', '柔软的', '明亮的']
const NOUNS = ['云朵', '小鹿', '海豚', '萤火', '枝芽', '山雀', '月亮', '蒲公英', '晨星']

// 生成随机匿名昵称（不含任何真实身份信息）
function genNickname() {
  const a = ADJS[Math.floor(Math.random() * ADJS.length)]
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  return a + n
}

// 页面守卫：未解锁时强制回到伪装页（防止通过转发等路径直达内页）
function ensureUnlocked() {
  const app = getApp()
  if (!app.globalData.unlocked) {
    wx.reLaunch({ url: '/pages/disguise/disguise' })
    return false
  }
  return true
}

// 今日日期 MM-DD
function todayStr() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return mm + '-' + dd
}

// 金额格式化
function fmtAmount(n) {
  const v = Number(n)
  if (isNaN(v)) return '0.00'
  return v.toFixed(2)
}

module.exports = { genNickname, ensureUnlocked, todayStr, fmtAmount }

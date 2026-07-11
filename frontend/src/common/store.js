// 本地 mock 数据层。所有读写走 uni storage,后续整体替换为后端 API。
const K = {
  EVIDENCE: 'evidences',
  SESSIONS: 'chat_sessions',
  CUR_SESSION: 'cur_session_id',
  POSTS: 'posts',
  DISGUISE_ON: 'disguise_on',
  DISGUISE_PWD: 'disguise_pwd',
  NICK: 'anon_nick',
  POST_PREFILL: 'post_prefill',
  LEDGER: 'fake_ledger',
  CONTACTS: 'emergency_contacts',
  RISK_RESULT: 'risk_result',
  DISCLAIMER_OK: 'disclaimer_ok',
  SEEDED: 'seeded_v2'
}
export const KEYS = K

export function get(key, def) {
  const v = uni.getStorageSync(key)
  return v === '' || v === null || v === undefined ? def : v
}
export function set(key, val) {
  uni.setStorageSync(key, val)
}

export function genId() {
  return Date.now().toString(36) + Math.floor(Math.random() * 1000)
}

export function fmt(ts) {
  const d = new Date(ts)
  const p = n => (n < 10 ? '0' + n : '' + n)
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

// ---- 证据 ----
export function getEvidences() {
  return get(K.EVIDENCE, [])
}
export function addEvidence(e) {
  const list = getEvidences()
  const now = Date.now()
  const item = {
    id: genId(),
    time: now,
    // 存证信息由服务端固化,此处为 mock 回执
    certNo: 'CERT-' + now.toString(36).toUpperCase(),
    certTime: now,
    ...e
  }
  list.unshift(item)
  set(K.EVIDENCE, list)
  return item
}
export function updateEvidence(id, patch) {
  const list = getEvidences()
  const i = list.findIndex(x => x.id === id)
  if (i > -1) {
    list[i] = { ...list[i], ...patch }
    set(K.EVIDENCE, list)
  }
}
export function removeEvidence(id) {
  set(K.EVIDENCE, getEvidences().filter(x => x.id !== id))
}

// ---- 会话 ----
export function getSessions() {
  return get(K.SESSIONS, [])
}
export function saveSession(session) {
  const list = getSessions()
  const i = list.findIndex(x => x.id === session.id)
  if (i > -1) list[i] = session
  else list.unshift(session)
  set(K.SESSIONS, list)
}
export function removeSession(id) {
  set(K.SESSIONS, getSessions().filter(x => x.id !== id))
  if (get(K.CUR_SESSION, '') === id) set(K.CUR_SESSION, '')
}

// ---- 社群 ----
export function ensureSeed() {
  if (get(K.SEEDED, false)) return
  set(K.POSTS, [
    {
      id: genId(),
      content: '结婚三年,他一吵架就摔东西、堵门不让我出去,这算家暴吗?要怎么收集证据?',
      tag: '取证指导',
      time: Date.now() - 86400000 * 2,
      nick: '匿名用户-a3f',
      likes: 23,
      replies: [
        {
          staff: true,
          name: '市妇联-王老师',
          content: '堵门限制人身自由、摔东西恐吓属于家庭暴力范畴。建议:1) 发生时尽量录音录像;2) 保留损坏物品照片;3) 可先到社区妇联备案。需要可以私信我。',
          time: Date.now() - 86400000
        }
      ]
    },
    {
      id: genId(),
      content: '想离开但没有收入,孩子还小,有没有临时庇护的地方?',
      tag: '庇护安置',
      time: Date.now() - 86400000 * 5,
      nick: '匿名用户-k92',
      likes: 18,
      replies: [
        {
          staff: true,
          name: '区救助站-李老师',
          content: '各区救助管理站设有家暴庇护点,可携带子女短期入住,拨打12338可协调安置。',
          time: Date.now() - 86400000 * 4
        },
        { staff: false, name: '匿名用户-p71', content: '我去年住过,工作人员很好,别怕。', time: Date.now() - 86400000 * 3 }
      ]
    },
    {
      id: genId(),
      content: '离开半年了，还是会做噩梦，听到开门声就发抖。明明已经安全了，为什么身体还是记得害怕？',
      tag: '心理支持',
      time: Date.now() - 86400000,
      nick: '匿名用户-moon',
      likes: 41,
      replies: [
        { staff: true, name: '心理咨询师-陈老师', content: '这是创伤后的常见应激反应，不是软弱。规律作息和身体运动会有帮助；如果持续影响生活，建议拨打12320咨询专业支持。', time: Date.now() - 43200000 }
      ]
    },
    {
      id: genId(),
      content: '他打我之后写了保证书，离婚的时候有用吗？已经是第三次了，我留着所有保证书。',
      tag: '法律咨询',
      time: Date.now() - 86400000 * 3,
      nick: '匿名用户-r82',
      likes: 56,
      replies: [
        { staff: true, name: '认证律师-林律师', content: '保证书、悔过书可以作为认定家暴事实的重要材料。请保存原件，并与照片、病历和报警记录共同形成证据链。', time: Date.now() - 86400000 * 2 }
      ]
    },
    {
      id: genId(),
      content: '今天终于去做了伤情检查。在医院走廊哭了很久，但走出来的时候觉得自己迈出了第一步。',
      tag: '互助倾诉',
      time: Date.now() - 86400000 * 4,
      nick: '匿名用户-light',
      likes: 89,
      replies: [
        { staff: true, name: '认证社工-王老师', content: '你已经迈出了很重要的一步。记得复印病历并拍照备份，相关票据和检查材料也请按日期保存。', time: Date.now() - 86400000 * 3 },
        { staff: false, name: '匿名用户-sun', content: '第一步最难，你已经做到了。', time: Date.now() - 86400000 * 3 }
      ]
    }
  ])
  set(K.SEEDED, true)
}
export function getPosts() {
  ensureSeed()
  return get(K.POSTS, [])
}
export function addPost(p) {
  const list = getPosts()
  const item = { id: genId(), time: Date.now(), replies: [], ...p }
  list.unshift(item)
  set(K.POSTS, list)
  return item
}
export function addReply(postId, reply) {
  const list = getPosts()
  const p = list.find(x => x.id === postId)
  if (p) {
    p.replies.push({ time: Date.now(), ...reply })
    set(K.POSTS, list)
  }
}

export function togglePostLike(postId) {
  const list = getPosts()
  const p = list.find(x => x.id === postId)
  if (!p) return false
  p.liked = !p.liked
  p.likes = Math.max(0, Number(p.likes || 0) + (p.liked ? 1 : -1))
  set(K.POSTS, list)
  return p.liked
}

export function reportPost(postId) {
  const list = getPosts()
  const p = list.find(x => x.id === postId)
  if (p) {
    p.reported = true
    set(K.POSTS, list)
  }
}

// ---- 紧急联系人 ----
export function getContacts() {
  return get(K.CONTACTS, [])
}
export function addContact(contact) {
  const list = getContacts()
  if (list.length >= 3) return null
  const item = { id: genId(), ...contact }
  list.push(item)
  set(K.CONTACTS, list)
  return item
}
export function removeContact(id) {
  set(K.CONTACTS, getContacts().filter(x => x.id !== id))
}

// ---- 风险自查 ----
export function getRiskResult() {
  return get(K.RISK_RESULT, null)
}
export function saveRiskResult(result) {
  set(K.RISK_RESULT, { time: Date.now(), ...result })
}

// ---- 匿名身份 ----
export function getNick() {
  let n = get(K.NICK, '')
  if (!n) {
    n = '匿名用户-' + Math.random().toString(36).slice(2, 5)
    set(K.NICK, n)
  }
  return n
}
export function resetNick() {
  set(K.NICK, '')
  return getNick()
}

// ---- 伪装模式 ----
export function disguiseOn() {
  return get(K.DISGUISE_ON, false)
}
export function getPwd() {
  return get(K.DISGUISE_PWD, '1314')
}

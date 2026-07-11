// AI 能力统一入口 · 三模式：mock（断网兜底）/ direct（开发者工具直连）/ cloud（云函数，待正式AppID）
// 所有调用失败自动降级到 mock，保证演示永不翻车。
const config = require('../config/config.js')
const prompts = require('./prompts.js')
const mockData = require('../data/mock-replies.js')
const crisisWords = require('../data/crisis-words.js')
const da = require('../data/da-questions.js')
const hotlines = require('../data/hotlines.js')

function mode() {
  if (config.mode === 'auto') return config.apiKey ? 'direct' : 'mock'
  return config.mode
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// wx.request Promise 封装（带超时）
function rq(path, body) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: config.baseUrl + path,
      method: 'POST',
      timeout: config.requestTimeoutMs,
      header: { 'content-type': 'application/json', Authorization: 'Bearer ' + config.apiKey },
      data: body,
      success(res) {
        if (res.statusCode === 200 && res.data) resolve(res.data)
        else reject(new Error('API ' + res.statusCode + ': ' + JSON.stringify(res.data).slice(0, 200)))
      },
      fail: reject
    })
  })
}

// RAG 小服务请求（本机/云服务器）
function rqRag(path, body) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: config.ragBaseUrl + path,
      method: 'POST',
      timeout: config.requestTimeoutMs,
      header: { 'content-type': 'application/json' },
      data: body,
      success(res) {
        if (res.statusCode === 200 && res.data) resolve(res.data)
        else reject(new Error('RAG ' + res.statusCode))
      },
      fail: reject
    })
  })
}

// 云函数封装（cloud 模式，待正式 AppID 后启用）
function callCloud(name, data) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({ name, data, success: r => resolve(r.result), fail: reject })
  })
}

// deepseek-r1 等模型会输出 <think>，展示前剥离
function stripThink(s) {
  return String(s || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim()
}

// 宽松 JSON 解析：容忍代码块围栏与前后杂讯
function parseJsonLoose(s) {
  const t = stripThink(s).replace(/```json|```/g, '')
  const a = t.indexOf('{')
  const b = t.lastIndexOf('}')
  if (a === -1 || b === -1) return null
  try { return JSON.parse(t.slice(a, b + 1)) } catch (e) { return null }
}

// ---------- 危机检测（第一层：本地关键词，毫秒级、确定性，演示可靠） ----------
function detectCrisis(text) {
  let level = 0
  const hits = []
  crisisWords.forEach(item => {
    if (text.indexOf(item.w) > -1) {
      hits.push(item.w)
      if (item.level > level) level = item.level
    }
  })
  return { level, hits }
}

// ---------- 情感陪伴对话 ----------
async function chat(messages) {
  const m = mode()
  if (m !== 'mock') {
    try {
      if (m === 'cloud') {
        const r = await callCloud('chat', { messages: messages.slice(-12) })
        return { reply: r.reply, source: 'cloud' }
      }
      const data = await rq('/chat/completions', {
        model: config.models.chat,
        temperature: 0.7,
        max_tokens: 600,
        messages: [{ role: 'system', content: prompts.CHAT_SYSTEM }].concat(
          messages.slice(-12).map(x => ({ role: x.role, content: x.content }))
        )
      })
      return { reply: stripThink(data.choices[0].message.content), source: 'direct' }
    } catch (e) {
      console.warn('[api.chat] 降级 mock:', e)
    }
  }
  await sleep(800)
  const last = messages.length ? messages[messages.length - 1].content : ''
  const isCrisis = detectCrisis(last).level >= 2
  return { reply: mockData.pickChatReply(messages.length, isCrisis), source: 'mock' }
}

// ---------- 法律问答（真 RAG：检索 + 生成 + 来源引用） ----------
async function legalQa(question) {
  const m = mode()
  if (m !== 'mock') {
    try {
      if (m === 'cloud') {
        const r = await callCloud('rag', { question })
        return { answer: r.answer, sources: r.sources || [], source: 'cloud' }
      }
      const r = await rqRag('/api/legal-qa', { question })
      return { answer: r.answer, sources: r.sources || [], source: 'rag' }
    } catch (e) {
      console.warn('[api.legalQa] RAG 不可用，降级 mock:', e)
    }
  }
  await sleep(800)
  return Object.assign({ source: 'mock' }, mockData.legalMock(question))
}

// ---------- 风险评估（本地量表计分兜底 + AI 分析增强） ----------
async function risk(answerList) {
  const score = answerList.reduce((s, x) => s + x.score, 0)
  const levelInfo = da.levelOf(score)
  const base = {
    score,
    maxScore: da.maxScore,
    level: levelInfo.level,
    levelText: levelInfo.text,
    suggestions: da.suggestions[levelInfo.level],
    resources: hotlines,
    aiAnalysis: '',
    source: 'local'
  }
  const m = mode()
  if (m === 'mock') {
    await sleep(600)
    base.aiAnalysis = mockData.riskAnalysisMock(levelInfo.level)
    return base
  }
  try {
    if (m === 'cloud') {
      const r = await callCloud('risk', { answers: answerList })
      return Object.assign(base, r, { source: 'cloud' })
    }
    const data = await rq('/chat/completions', {
      model: config.models.reason,
      temperature: 0.2,
      max_tokens: 900,
      messages: [
        { role: 'system', content: prompts.RISK_SYSTEM },
        { role: 'user', content: JSON.stringify({ 总分: score, 满分: da.maxScore, 答卷: answerList }) }
      ]
    })
    const j = parseJsonLoose(data.choices[0].message.content)
    if (j) {
      if (j.analysis) base.aiAnalysis = j.analysis
      if (Array.isArray(j.actions) && j.actions.length) base.suggestions = j.actions
      // AI 只允许上调等级，不允许下调（安全第一）
      const order = ['low', 'medium', 'high', 'critical']
      if (j.risk_level && order.indexOf(j.risk_level) > order.indexOf(base.level)) {
        base.level = j.risk_level
        base.levelText = da.levelTextOf(j.risk_level)
      }
      base.source = 'direct'
    }
    return base
  } catch (e) {
    console.warn('[api.risk] 降级本地计分:', e)
    base.aiAnalysis = mockData.riskAnalysisMock(levelInfo.level)
    return base
  }
}

// ---------- 伤情图片多模态分析 ----------
function readFileBase64(filePath) {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({ filePath, encoding: 'base64', success: r => resolve(r.data), fail: reject })
  })
}

async function vision(filePath, desc) {
  const m = mode()
  if (m !== 'mock') {
    try {
      if (m === 'cloud') {
        // 云模式：先传云存储拿 fileID，云函数下载后做多模态分析
        const up = await new Promise((resolve, reject) => {
          wx.cloud.uploadFile({
            cloudPath: 'evidence/' + Date.now() + '_' + Math.floor(Math.random() * 1e6) + '.jpg',
            filePath,
            success: resolve,
            fail: reject
          })
        })
        const r = await callCloud('vision', { fileID: up.fileID, desc })
        return Object.assign({ source: 'cloud' }, r)
      }
      const b64 = await readFileBase64(filePath)
      const data = await rq('/chat/completions', {
        model: config.models.vision,
        temperature: 0.2,
        max_tokens: 600,
        messages: [
          { role: 'system', content: prompts.VISION_SYSTEM },
          {
            role: 'user',
            content: [
              { type: 'text', text: desc || '请分析这张照片中的伤情并按要求输出 JSON。' },
              { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + b64 } }
            ]
          }
        ]
      })
      const j = parseJsonLoose(data.choices[0].message.content)
      if (j && j.injury_desc) return Object.assign({ source: 'direct' }, j)
      throw new Error('vision JSON 解析失败')
    } catch (e) {
      console.warn('[api.vision] 降级 mock:', e)
    }
  }
  await sleep(1200)
  return Object.assign({ source: 'mock' }, mockData.visionMock)
}

module.exports = { mode, detectCrisis, chat, legalQa, risk, vision }

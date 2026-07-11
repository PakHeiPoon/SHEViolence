// 云函数 rag · 法律问答（真 RAG：向量检索 + deepseek-v3 生成 + 来源引用）
// 依赖同目录 index.json（由 node rag/build-index.js 自动同步过来；语料更新后重新部署本函数）
const fs = require('fs')
const path = require('path')
const axios = require('axios')

const BASE_URL = 'https://api.openai-next.com/v1'
const GEN_MODELS = ['claude-opus-4-8', 'claude-sonnet-5'] // 主 opus，饱和自动降级
const EMB_MODEL = 'text-embedding-3-small'
const TOP_K = 4
const MIN_SCORE = 0.25

const RAG_SYSTEM = `你是反家暴法律援助助手。请仅依据我提供的【资料】回答用户问题：
- 引用资料时标注编号，如「根据资料[1]」；
- 资料里没有的内容明确说"资料中未提及"，并建议拨打12338咨询，绝不编造；
- 用通俗中文回答，条理清晰，不超过250字；先给结论，再给步骤；
- 纯文本输出，禁止 markdown 符号（**、#、-列表等），分点用 1. 2. 3.；始终使用简体中文。`

let index = null
try {
  index = JSON.parse(fs.readFileSync(path.join(__dirname, 'index.json'), 'utf8'))
} catch (e) {
  console.error('[rag] index.json 缺失，将使用降级回答。请运行 node rag/build-index.js 后重新部署本函数')
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i] }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1)
}

function keywordScore(query, text) {
  const grams = new Set()
  for (let i = 0; i < query.length - 1; i++) grams.add(query.slice(i, i + 2))
  let hit = 0
  grams.forEach(g => { if (text.includes(g)) hit++ })
  return grams.size ? hit / grams.size : 0
}

async function api(pathName, body, timeout) {
  const res = await axios.post(BASE_URL + pathName, body, {
    timeout: timeout || 12000,
    headers: { Authorization: 'Bearer ' + process.env.OPENAI_NEXT_KEY }
  })
  return res.data
}

async function retrieve(question) {
  let scored
  try {
    const emb = await api('/embeddings', { model: EMB_MODEL, input: [question], dimensions: 256 })
    const qv = emb.data[0].embedding
    scored = index.chunks.map(c => ({ c, score: cosine(qv, c.vec) }))
  } catch (e) {
    console.warn('[rag] embedding 失败，降级关键词检索:', e.message)
    scored = index.chunks.map(c => ({ c, score: keywordScore(question, c.text) }))
  }
  return scored
    .sort((x, y) => y.score - x.score)
    .slice(0, TOP_K)
    .filter(x => x.score >= MIN_SCORE)
    .map((x, i) => ({ ref: i + 1, source: x.c.source, text: x.c.text, score: Math.round(x.score * 100) / 100 }))
}

const MOCK_ANSWER = '（离线兜底）遭受家暴或面临现实危险时，可向法院申请人身安全保护令，一般72小时内裁定、紧急24小时，无需起诉离婚且免费；同时保留报警记录、病历、照片等证据。详细情况建议拨打 12338 妇女维权热线咨询。'

exports.main = async (event) => {
  const question = String(event.question || '').trim()
  if (!question) return { answer: '请告诉我你想了解的法律问题。', sources: [], source: 'cloud' }
  if (!index) return { answer: MOCK_ANSWER, sources: [], source: 'cloud-mock' }

  try {
    const hits = await retrieve(question)
    const materials = hits.map(h => `[${h.ref}]（来源：${h.source}）${h.text}`).join('\n\n')

    let answer = ''
    for (const model of GEN_MODELS) {
      try {
        const data = await api('/chat/completions', {
          model,
          temperature: 0.2,
          max_tokens: 700,
          messages: [
            { role: 'system', content: RAG_SYSTEM },
            { role: 'user', content: `【资料】\n${materials || '（未检索到相关资料）'}\n\n【用户问题】${question}` }
          ]
        }, 15000)
        answer = String(data.choices[0].message.content || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim()
        if (answer) break
      } catch (e) {
        console.warn('[rag] ' + model + ' 失败:', e.message)
      }
    }
    if (!answer) throw new Error('全部生成模型失败')
    return {
      answer,
      sources: hits.map(h => ({ ref: h.ref, source: h.source, excerpt: h.text.slice(0, 60) + (h.text.length > 60 ? '…' : ''), score: h.score })),
      source: 'cloud'
    }
  } catch (e) {
    console.error('[rag] 降级 mock:', e.message)
    return { answer: MOCK_ANSWER, sources: [], source: 'cloud-mock' }
  }
}

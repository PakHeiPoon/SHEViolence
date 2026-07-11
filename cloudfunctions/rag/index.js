// 云函数 rag · 法律问答（真 RAG：向量检索 + deepseek-v3 生成 + 来源引用）
// 依赖同目录 index.json（由 node rag/build-index.js 自动同步过来；语料更新后重新部署本函数）
const fs = require('fs')
const path = require('path')
const axios = require('axios')

const BASE_URL = 'https://api.openai-next.com/v1'
const GEN_MODELS = ['deepseek-v3', 'claude-sonnet-5'] // RAG生成靠检索质量,用快模型:deepseek中文法律快又准,sonnet兜底(opus太慢撞超时)
const VERSION = 'rag-v2-fast'
const EMB_MODEL = 'text-embedding-3-small'
const TOP_K = 4
const MIN_SCORE = 0.25

const RAG_SYSTEM = `你是反家暴法律援助助手。请仅依据我提供的资料回答用户问题：
- 资料分两类：【知识库资料】编号 K1、K2…（法条/司法解释/典型案例，优先采信）；【网络资料】编号 W1、W2…（补充最新信息，采信前注意甄别）；
- 每个要点末尾必须标注依据编号，如「（K1)」「（W2)」；没有资料支撑的内容绝不要写；
- 资料里没有的内容明确说"资料中未提及"，并建议拨打12338咨询，绝不编造；
- 用通俗中文回答，条理清晰，不超过280字；先给结论，再给步骤；
- 纯文本输出，禁止 markdown 符号（**、#、-列表等），分点用 1. 2. 3.；始终使用简体中文。`

// Tavily 网络搜索（第二证据源）；未配 TAVILY_KEY 或失败时自动跳过，绝不阻塞
async function tavily(question) {
  if (!process.env.TAVILY_KEY) return []
  try {
    const res = await axios.post('https://api.tavily.com/search', {
      query: '中国 反家庭暴力 ' + question,
      max_results: 3,
      search_depth: 'basic'
    }, {
      headers: { Authorization: 'Bearer ' + process.env.TAVILY_KEY },
      timeout: 6000
    })
    return (res.data.results || []).map(r => ({
      title: String(r.title || '').slice(0, 60),
      url: r.url,
      content: String(r.content || '').slice(0, 300)
    }))
  } catch (e) {
    console.warn('[rag] tavily 搜索失败(跳过):', e.message)
    return []
  }
}

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
    const emb = await api('/embeddings', { model: EMB_MODEL, input: [question], dimensions: 256 }, 8000)
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
    // 双证据源并行：本地知识库向量检索 + Tavily 网络搜索
    const [hits, webs] = await Promise.all([retrieve(question), tavily(question)])
    const kbPart = hits.map((h, i) => `[K${i + 1}]（来源：${h.source}）${h.text}`).join('\n\n')
    const webPart = webs.map((w, i) => `[W${i + 1}]（来源：${w.title} ${w.url}）${w.content}`).join('\n\n')
    const materials = ['【知识库资料】', kbPart || '（无）', '', '【网络资料】', webPart || '（无）'].join('\n')

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
        }, 13000)
        answer = String(data.choices[0].message.content || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim()
        if (answer) break
      } catch (e) {
        console.warn('[rag] ' + model + ' 失败:', e.message)
      }
    }
    if (!answer) throw new Error('全部生成模型失败')
    return {
      answer,
      sources: hits.map((h, i) => ({
        ref: 'K' + (i + 1), type: 'kb', source: h.source,
        excerpt: h.text.slice(0, 60) + (h.text.length > 60 ? '…' : ''), score: h.score
      })).concat(webs.map((w, i) => ({
        ref: 'W' + (i + 1), type: 'web', source: w.title, url: w.url,
        excerpt: w.content.slice(0, 60) + '…'
      }))),
      source: 'cloud', v: VERSION
    }
  } catch (e) {
    console.error('[rag] 降级 mock:', e.message)
    return { answer: MOCK_ANSWER, sources: [], source: 'cloud-mock', v: VERSION, err: String(e.message || e).slice(0, 300) }
  }
}

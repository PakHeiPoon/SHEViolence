// RAG 公共库：配置加载 / OpenAI 兼容接口调用 / 向量检索
// 零 npm 依赖，Node 18+（内置 fetch）直接运行
const fs = require('fs')
const path = require('path')

function loadConfig() {
  const localPath = path.join(__dirname, 'config.local.js')
  if (fs.existsSync(localPath)) return require(localPath)
  const cfg = require('./config.example.js')
  if (!cfg.apiKey) {
    console.error('❌ 缺少 API Key：请复制 rag/config.example.js 为 rag/config.local.js 并填入 Key，或设置环境变量 OPENAI_NEXT_KEY')
    process.exit(1)
  }
  return cfg
}

async function callApi(cfg, apiPath, body, timeoutMs = 30000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(cfg.baseUrl + apiPath, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: 'Bearer ' + cfg.apiKey },
      body: JSON.stringify(body),
      signal: ctrl.signal
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`API ${res.status}: ${text.slice(0, 300)}`)
    }
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

// 批量 embedding
async function embed(cfg, texts) {
  // 降维到 256（text-embedding-3 支持）：索引体积压到 1/6，检索质量仍优于旧一代
  // 带重试：大批量构建时防单次网络抖动导致整体失败
  let lastErr
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const data = await callApi(cfg, '/embeddings', { model: cfg.embeddingModel, input: texts, dimensions: cfg.embeddingDim || 256 })
      return data.data.map(d => d.embedding)
    } catch (e) {
      lastErr = e
      await new Promise(r => setTimeout(r, 1500))
    }
  }
  throw lastErr
}

function cosine(a, b) {
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1)
}

// 关键词兜底打分（embedding 不可用时）：按双字词重合率
function keywordScore(query, text) {
  const grams = new Set()
  for (let i = 0; i < query.length - 1; i++) grams.add(query.slice(i, i + 2))
  let hit = 0
  grams.forEach(g => { if (text.includes(g)) hit++ })
  return grams.size ? hit / grams.size : 0
}

function loadIndex() {
  const p = path.join(__dirname, 'index.json')
  if (!fs.existsSync(p)) return null
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

// 检索 Top-K：优先向量相似度，embedding 失败时降级关键词
async function retrieve(cfg, index, question) {
  let scored
  try {
    const [qv] = await embed(cfg, [question])
    scored = index.chunks.map(c => ({ c, score: cosine(qv, c.vec) }))
  } catch (e) {
    console.warn('[retrieve] embedding 失败，降级关键词检索:', e.message)
    scored = index.chunks.map(c => ({ c, score: keywordScore(question, c.text) }))
  }
  return scored
    .sort((x, y) => y.score - x.score)
    .slice(0, cfg.topK)
    .filter(x => x.score >= cfg.minScore)
    .map((x, i) => ({ ref: i + 1, source: x.c.source, text: x.c.text, score: Math.round(x.score * 100) / 100 }))
}

module.exports = { loadConfig, callApi, embed, cosine, keywordScore, loadIndex, retrieve }

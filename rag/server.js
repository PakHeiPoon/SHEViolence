#!/usr/bin/env node
// 法律 RAG 问答服务（零依赖，Node 18+）
// 用法：node rag/server.js   （先运行 node rag/build-index.js 生成索引）
// 接口：POST /api/legal-qa {question} → {answer, sources:[{ref,source,excerpt,score}]}
//       GET  /health
// 部署：本机开发直接跑；也可原样拷到云服务器 node 运行，前端 config.ragBaseUrl 改成服务器地址。
const http = require('http')
const { loadConfig, callApi, loadIndex, retrieve } = require('./lib.js')

const RAG_SYSTEM = `你是反家暴法律援助助手。请仅依据我提供的【资料】回答用户问题：
- 引用资料时标注编号，如「根据资料[1]」；
- 资料里没有的内容明确说"资料中未提及"，并建议拨打12338咨询，绝不编造；
- 用通俗中文回答，条理清晰，不超过250字；先给结论，再给步骤。`

const cfg = loadConfig()
let index = loadIndex()
if (!index) {
  console.error('❌ 缺少索引文件 rag/index.json，请先运行: node rag/build-index.js')
  process.exit(1)
}
console.log(`📖 已加载索引：${index.chunks.length} 块 / ${index.files.length} 篇`)

async function legalQa(question) {
  const hits = await retrieve(cfg, index, question)
  const materials = hits.map(h => `[${h.ref}]（来源：${h.source}）${h.text}`).join('\n\n')

  const data = await callApi(cfg, '/chat/completions', {
    model: cfg.genModel,
    temperature: 0.2,
    max_tokens: 700,
    messages: [
      { role: 'system', content: RAG_SYSTEM },
      { role: 'user', content: `【资料】\n${materials || '（未检索到相关资料）'}\n\n【用户问题】${question}` }
    ]
  }, 25000)

  const answer = String(data.choices[0].message.content || '')
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .trim()

  return {
    answer,
    sources: hits.map(h => ({
      ref: h.ref,
      source: h.source,
      excerpt: h.text.slice(0, 60) + (h.text.length > 60 ? '…' : ''),
      score: h.score
    }))
  }
}

const server = http.createServer((req, res) => {
  res.setHeader('content-type', 'application/json; charset=utf-8')

  if (req.method === 'GET' && req.url === '/health') {
    res.end(JSON.stringify({ ok: true, chunks: index.chunks.length }))
    return
  }

  if (req.method === 'POST' && req.url === '/api/legal-qa') {
    let body = ''
    req.on('data', d => { body += d })
    req.on('end', async () => {
      try {
        const { question } = JSON.parse(body || '{}')
        if (!question || !String(question).trim()) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: 'question 不能为空' }))
          return
        }
        console.log('❓', question)
        const result = await legalQa(String(question).trim())
        res.end(JSON.stringify(result))
      } catch (e) {
        console.error('💥', e.message)
        res.statusCode = 500
        res.end(JSON.stringify({ error: e.message }))
      }
    })
    return
  }

  res.statusCode = 404
  res.end(JSON.stringify({ error: 'not found' }))
})

server.listen(cfg.port, () => {
  console.log(`🚀 法律 RAG 服务已启动: http://127.0.0.1:${cfg.port}`)
  console.log('   测试: curl -X POST http://127.0.0.1:' + cfg.port + '/api/legal-qa -H "content-type: application/json" -d \'{"question":"保护令怎么申请"}\'')
})

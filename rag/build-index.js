#!/usr/bin/env node
// 构建向量索引：读取 corpus/ 下所有 .md/.txt → 切块 → embedding → 写入 index.json
// 用法：node rag/build-index.js
// 队友的语料文档：直接丢进 rag/corpus/ 再跑一遍本脚本即可。
const fs = require('fs')
const path = require('path')
const { loadConfig, embed } = require('./lib.js')

const CORPUS_DIR = path.join(__dirname, 'corpus')
const OUT = path.join(__dirname, 'index.json')
const MAX_CHUNK = 420 // 每块最大字符数
const BATCH = 32      // embedding 批大小

// 按空行分段，再把小段合并到 MAX_CHUNK 以内
function chunkText(text) {
  const paras = text
    .split(/\n\s*\n/)
    .map(p => p.replace(/\s+/g, ' ').trim())
    .filter(p => p.length >= 10)

  const chunks = []
  let buf = ''
  for (const p of paras) {
    if (p.length > MAX_CHUNK) {
      if (buf) { chunks.push(buf); buf = '' }
      // 超长段按句号切
      let seg = ''
      for (const s of p.split(/(?<=[。！？；])/)) {
        if ((seg + s).length > MAX_CHUNK) { if (seg) chunks.push(seg); seg = s }
        else seg += s
      }
      if (seg) chunks.push(seg)
    } else if ((buf + ' ' + p).length > MAX_CHUNK) {
      chunks.push(buf)
      buf = p
    } else {
      buf = buf ? buf + ' ' + p : p
    }
  }
  if (buf) chunks.push(buf)
  return chunks
}

async function main() {
  const cfg = loadConfig()
  if (!fs.existsSync(CORPUS_DIR)) {
    console.error('❌ 缺少语料目录 rag/corpus/')
    process.exit(1)
  }

  const files = fs.readdirSync(CORPUS_DIR).filter(f => /\.(md|txt)$/i.test(f))
  if (!files.length) {
    console.error('❌ rag/corpus/ 下没有 .md/.txt 语料文件')
    process.exit(1)
  }

  const chunks = []
  for (const f of files) {
    const text = fs.readFileSync(path.join(CORPUS_DIR, f), 'utf8')
    for (const c of chunkText(text)) {
      chunks.push({ id: 'c' + chunks.length, source: f, text: c })
    }
  }
  console.log(`📚 ${files.length} 个文件 → ${chunks.length} 个知识块，开始 embedding…`)

  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH)
    const vecs = await embed(cfg, batch.map(c => c.text))
    batch.forEach((c, j) => { c.vec = vecs[j] })
    console.log(`  ✅ ${Math.min(i + BATCH, chunks.length)}/${chunks.length}`)
  }

  const payload = JSON.stringify({
    model: cfg.embeddingModel,
    builtAt: new Date().toISOString(),
    files,
    chunks
  })
  fs.writeFileSync(OUT, payload)
  console.log(`🎉 索引已写入 ${OUT}（${chunks.length} 块）。启动服务：node rag/server.js`)

  // 同步一份到 rag 云函数目录（存在才写），重新部署 rag 云函数即生效
  const cfOut = path.join(__dirname, '..', 'cloudfunctions', 'rag', 'index.json')
  if (fs.existsSync(path.dirname(cfOut))) {
    fs.writeFileSync(cfOut, payload)
    console.log('☁️  已同步索引到 cloudfunctions/rag/index.json（记得重新部署 rag 云函数）')
  }
}

main().catch(e => { console.error('❌ 构建失败:', e); process.exit(1) })

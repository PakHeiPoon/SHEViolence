#!/usr/bin/env node
// 把外部语料（.doc/.docx 经 textutil 提取 + .md/.txt）清洗后导入 rag/corpus/
// 用法：node rag/import-corpus.js <源目录> [子目录名] [--limit N]
//   例：node rag/import-corpus.js "/Users/xxx/Downloads/反家暴-信息" law
//       node rag/import-corpus.js "/Users/xxx/Downloads/549典型家暴案例" cases --limit 200
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const SRC = process.argv[2]
const SUBDIR = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : ''
const limitArg = process.argv.indexOf('--limit')
const LIMIT = limitArg > -1 ? parseInt(process.argv[limitArg + 1], 10) : Infinity

if (!SRC || !fs.existsSync(SRC)) { console.error('❌ 用法: node rag/import-corpus.js <源目录> [子目录名] [--limit N]'); process.exit(1) }

const OUT = path.join(__dirname, 'corpus', SUBDIR)
fs.mkdirSync(OUT, { recursive: true })

// 清洗：去掉 Word 域码、法宝引证码、pkulaw 链接、多余空白
function clean(t) {
  return String(t)
    .replace(/HYPERLINK\s+"[^"]*"(\s*\\t\s*"[^"]*")?/g, '')
    .replace(/javascript:void\(0\);?/g, '')
    .replace(/https?:\/\/[^\s)]+/g, '')
    .replace(/【法宝引证码】[^\n]*/g, '')
    .replace(/>\s*【法宝引证码】[^\n]*/g, '')
    .replace(/\[原文链接\]\([^)]*\)/g, '')
    .replace(/　/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function walk(dir) {
  let out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === '__pycache__') continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) out = out.concat(walk(p))
    else if (/\.(docx?|md|txt)$/i.test(e.name)) out.push(p)
  }
  return out
}

function readText(f) {
  if (/\.docx?$/i.test(f)) {
    return execSync(`textutil -convert txt -stdout "${f}"`, { maxBuffer: 80 * 1024 * 1024 }).toString('utf8')
  }
  return fs.readFileSync(f, 'utf8')
}

function safeName(f) {
  // 保留完整文件名（含 FBM 引证码）确保唯一，避免截断重名互相覆盖
  return path.basename(f)
    .replace(/\.(docx?|md|txt)$/i, '')
    .replace(/[\/\\:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150)
}

const files = walk(SRC).slice(0, LIMIT)
console.log(`发现 ${files.length} 个可导入文件 → 输出到 ${OUT}`)
let ok = 0, skip = 0
for (const f of files) {
  try {
    const cleaned = clean(readText(f))
    if (cleaned.length < 80) { skip++; continue }
    fs.writeFileSync(path.join(OUT, safeName(f) + '.txt'), cleaned)
    ok++
  } catch (e) {
    console.log(`❌ ${path.basename(f)}: ${String(e.message).slice(0, 60)}`)
    skip++
  }
}
console.log(`✅ 导入 ${ok} 篇，跳过 ${skip} 篇。接着运行: node rag/build-index.js`)

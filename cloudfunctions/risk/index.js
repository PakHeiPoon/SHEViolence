// 云函数 risk · 风险评估（deepseek-r1 推理 + 本地量表计分兜底）
// 安全规则：AI 只允许上调危险等级，绝不下调
const axios = require('axios')

const BASE_URL = 'https://api.openai-next.com/v1'
const MODEL = 'deepseek-r1'

const RISK_SYSTEM = `你是家暴风险评估专家。用户完成了一份改编自 Danger Assessment 的危险评估量表，我会给你题目、回答与得分。
请综合评估并只输出 JSON（不要任何多余文字、不要 markdown 代码块）：
{"risk_level":"low|medium|high|critical","analysis":"80字以内的中文分析，语气温和但不回避风险","actions":["3-5条具体可执行的行动建议，按优先级排序"]}
评估原则：出现凶器、掐颈、死亡威胁、分手期暴力升级任一项，风险等级不得低于 high。`

const ORDER = ['low', 'medium', 'high', 'critical']
const LEVEL_TEXT = { low: '较低风险', medium: '中度风险', high: '高度风险', critical: '极高风险' }

const SUGGESTIONS = {
  low: ['养成记录习惯：每次冲突记下时间、地点、经过', '把 12338 和求助热线存在安全的地方', '告诉一位你信任的人目前的情况', '了解证据收集方法，有备无患'],
  medium: ['开始系统收集证据：照片、录音、病历、报警记录', '设置 1-3 位紧急联系人', '制定安全离开计划：证件、现金、药品放在能快速拿到的地方', '拨打 12338 咨询你所在地的具体支持资源'],
  high: ['尽快报警，并要求公安出具《告诫书》', '向法院申请人身安全保护令（72小时内裁定，紧急24小时）', '把孩子和重要证件转移到安全的地方', '确保家人朋友知情，约定求救暗号', '了解就近庇护所位置（可拨打 12338 询问）'],
  critical: ['你的处境很危险，请优先考虑立即离开，前往亲友家或庇护所', '遇到暴力立刻拨打 110，不要犹豫', '随身携带手机、证件、少量现金', '避免单独与他见面，见面选公共场所并有人陪同', '立即申请紧急人身安全保护令（法院24小时内裁定）']
}

const ANALYSIS_FALLBACK = {
  low: '目前风险信号较少，但请保持警惕并养成记录习惯。任何升级迹象都值得重视。',
  medium: '存在明确的风险信号，暴力模式可能正在形成。建议从现在开始系统性取证，并提前准备安全计划。',
  high: '多项高危因素同时存在，请认真对待自己的处境，尽快启动报警取证与保护令申请。',
  critical: '你的回答中出现了与严重伤害高度相关的危险信号。请把人身安全放在第一位，优先考虑离开并立即寻求外部保护。'
}

function levelOf(score) {
  if (score <= 3) return 'low'
  if (score <= 8) return 'medium'
  if (score <= 14) return 'high'
  return 'critical'
}

function parseJsonLoose(s) {
  const t = String(s || '').replace(/<think>[\s\S]*?<\/think>/g, '').replace(/```json|```/g, '')
  const a = t.indexOf('{')
  const b = t.lastIndexOf('}')
  if (a === -1 || b === -1) return null
  try { return JSON.parse(t.slice(a, b + 1)) } catch (e) { return null }
}

exports.main = async (event) => {
  const answers = Array.isArray(event.answers) ? event.answers : []
  const score = answers.reduce((s, x) => s + (Number(x.score) || 0), 0)
  let level = levelOf(score)

  const base = {
    level,
    levelText: LEVEL_TEXT[level],
    aiAnalysis: ANALYSIS_FALLBACK[level],
    suggestions: SUGGESTIONS[level],
    source: 'cloud-local'
  }

  try {
    const res = await axios.post(BASE_URL + '/chat/completions', {
      model: MODEL,
      temperature: 0.2,
      max_tokens: 900,
      messages: [
        { role: 'system', content: RISK_SYSTEM },
        { role: 'user', content: JSON.stringify({ 总分: score, 答卷: answers }) }
      ]
    }, {
      timeout: 15000,
      headers: { Authorization: 'Bearer ' + process.env.OPENAI_NEXT_KEY }
    })
    const j = parseJsonLoose(res.data.choices[0].message.content)
    if (j) {
      if (j.analysis) base.aiAnalysis = j.analysis
      if (Array.isArray(j.actions) && j.actions.length) base.suggestions = j.actions
      // 只上调不下调
      if (j.risk_level && ORDER.indexOf(j.risk_level) > ORDER.indexOf(base.level)) {
        base.level = j.risk_level
        base.levelText = LEVEL_TEXT[j.risk_level]
      }
      base.source = 'cloud'
    }
  } catch (e) {
    console.error('[risk] 降级本地计分:', e.message)
  }
  return base
}

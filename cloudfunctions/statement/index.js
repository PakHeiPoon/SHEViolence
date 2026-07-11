// 云函数 statement · 证据整理生成书面陈述（claude-sonnet-4-6 长文）
const axios = require('axios')

const BASE_URL = 'https://api.openai-next.com/v1'
const MODEL = 'claude-sonnet-4-6'

const STATEMENT_SYSTEM = `你是协助家庭暴力受害者的法律文书助手。我会给你一份按时间整理的证据记录，请据此起草一份可用于报警或起诉的《家庭暴力情况书面陈述》。
要求：
- 客观、条理清晰、规范书面语，以第一人称"我"陈述，不带情绪化措辞
- 结构：①基本情况（当事人关系，未提及处用"我与对方"）②家庭暴力事实经过（按时间顺序逐条：时间、地点、经过、伤情、对应证据）③证据清单（编号列出）④诉求（如请求出具告诫书、申请人身安全保护令、依法追究责任）
- 只依据我提供的记录，不编造情节；关键信息缺失用"（此处待补充）"标注
- 结尾另起两行："陈述人：＿＿＿＿"、"日期：＿＿＿＿"
- 全文纯文本，不使用 markdown 符号（**、#等），不超过 800 字`

exports.main = async (event) => {
  const digest = String(event.digest || '（暂无记录）')
  try {
    const res = await axios.post(BASE_URL + '/chat/completions', {
      model: MODEL,
      temperature: 0.3,
      max_tokens: 1200,
      messages: [
        { role: 'system', content: STATEMENT_SYSTEM },
        { role: 'user', content: '【证据记录】\n' + digest }
      ]
    }, {
      timeout: 18000,
      headers: { Authorization: 'Bearer ' + process.env.OPENAI_NEXT_KEY }
    })
    return { text: String(res.data.choices[0].message.content).trim(), source: 'cloud' }
  } catch (e) {
    console.error('[statement] 生成失败:', e.message)
    return { text: '（生成失败，请检查网络或稍后重试）', source: 'cloud-mock' }
  }
}

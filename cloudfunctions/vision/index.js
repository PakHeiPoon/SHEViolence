// 云函数 vision · 伤情图片多模态分析（qwen3-vl-max）
// 流程：前端 wx.cloud.uploadFile 传图 → 传 fileID 进来 → 下载转 base64 → 多模态分析
const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const BASE_URL = 'https://api.openai-next.com/v1'
// 主用 opus（实测看图3s）；饱和自动降级 sonnet-5。qwen3-vl-max 平台通道已挂弃用
const MODELS = ['claude-opus-4-8', 'claude-sonnet-5']

const VISION_SYSTEM = `你是协助家暴受害者做证据记录的专业记录员。请客观、克制、专业地描述照片中的伤情，用于事后就医和法律程序参考。
只输出 JSON（不要任何多余文字、不要 markdown 代码块）：
{"injury_desc":"若照片显示人体伤情，客观描述部位、形态、大小估计、颜色、推测成因与大致时间；若照片并非人体伤情（如物品、环境、聊天记录等），如实说明'照片中未见明显人体伤情'并简述实际看到的内容","medical_tip":"就医与病历留档建议一句话；无伤情则写'如有伤情请及时就医并留存病历'","suggest_police":"是否建议报警及理由，一句话","timeline":"归档建议，一句话"}
注意：这是辅助记录，不是医疗诊断；只描述能从图中真实看到的内容，绝不编造图中不存在的伤情；所有字段用简体中文。`

const MOCK = {
  injury_desc: '（离线兜底）照片已收到。请尽量在光线充足处补拍近景与含面部的远景各一张，便于后续鉴定。',
  medical_tip: '建议 48 小时内就医并请医生在病历中注明伤情与致伤原因。',
  suggest_police: '如伤情明显，建议报警并要求伤情鉴定与出具告诫书。',
  timeline: '建议与当日聊天记录、就诊票据一起按日期归档。'
}

function parseJsonLoose(s) {
  const t = String(s || '').replace(/<think>[\s\S]*?<\/think>/g, '').replace(/```json|```/g, '')
  const a = t.indexOf('{')
  const b = t.lastIndexOf('}')
  if (a === -1 || b === -1) return null
  try { return JSON.parse(t.slice(a, b + 1)) } catch (e) { return null }
}

exports.main = async (event) => {
  try {
    if (!event.fileID) throw new Error('缺少 fileID')
    // 首选临时URL直链（免云函数上传大包超时）；失败再降级 base64
    let imageUrlPart = null
    try {
      const t = await cloud.getTempFileURL({ fileList: [event.fileID] })
      const u = (t.fileList && t.fileList[0] && t.fileList[0].tempFileURL) || ''
      if (u) imageUrlPart = { type: 'image_url', image_url: { url: u } }
    } catch (e) {
      console.warn('[vision] 取临时URL失败:', e.message)
    }
    if (!imageUrlPart) {
      const dl = await cloud.downloadFile({ fileID: event.fileID })
      const b64 = dl.fileContent.toString('base64')
      imageUrlPart = { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + b64 } }
    }

    for (const model of MODELS) {
      try {
        const res = await axios.post(BASE_URL + '/chat/completions', {
          model,
          temperature: 0.2,
          max_tokens: 600,
          messages: [
            { role: 'system', content: VISION_SYSTEM },
            {
              role: 'user',
              content: [
                { type: 'text', text: event.desc || '请分析这张照片中的伤情并按要求输出 JSON。' },
                imageUrlPart
              ]
            }
          ]
        }, {
          timeout: 15000,
          headers: { Authorization: 'Bearer ' + process.env.OPENAI_NEXT_KEY }
        })
        const j = parseJsonLoose(res.data.choices[0].message.content)
        if (j && j.injury_desc) return Object.assign({ source: 'cloud', model }, j)
        throw new Error('JSON 解析失败')
      } catch (e) {
        console.warn('[vision] ' + model + ' 失败:', e.message)
      }
    }
    throw new Error('全部模型失败')
  } catch (e) {
    console.error('[vision] 降级 mock:', e.message)
    return Object.assign({ source: 'cloud-mock' }, MOCK)
  }
}

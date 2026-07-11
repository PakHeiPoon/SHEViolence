// 云函数 asr · 语音转文字
// 主模型 gpt-4o-transcribe（中文/嘈杂环境更强，已实测），失败自动降级 whisper-1
const cloud = require('wx-server-sdk')
const axios = require('axios')
const FormData = require('form-data')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const MODELS = ['gpt-4o-transcribe', 'whisper-1']

async function transcribe(model, buffer) {
  const fd = new FormData()
  fd.append('file', buffer, { filename: 'voice.mp3', contentType: 'audio/mpeg' })
  fd.append('model', model)
  fd.append('language', 'zh')
  fd.append('prompt', '这是中文求助语音，请逐字转写。')
  const res = await axios.post('https://api.openai-next.com/v1/audio/transcriptions', fd, {
    headers: Object.assign({ Authorization: 'Bearer ' + process.env.OPENAI_NEXT_KEY }, fd.getHeaders()),
    timeout: 12000,
    maxBodyLength: Infinity
  })
  return String(res.data.text || '').trim()
}

exports.main = async (event) => {
  try {
    if (!event.fileID) throw new Error('缺少 fileID')
    const dl = await cloud.downloadFile({ fileID: event.fileID })

    for (const model of MODELS) {
      try {
        const text = await transcribe(model, dl.fileContent)
        if (text) return { text, model, source: 'cloud' }
      } catch (e) {
        console.warn('[asr] ' + model + ' 失败:', e.message)
      }
    }
    return { text: '', source: 'cloud-mock', error: '全部模型转写失败' }
  } catch (e) {
    console.error('[asr] 失败:', e.message)
    return { text: '', source: 'cloud-mock', error: e.message }
  }
}

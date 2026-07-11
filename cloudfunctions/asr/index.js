// 云函数 asr · 语音转文字（whisper-1，已实测中文识别准确）
// 流程：前端录音传云存储 → 传 fileID 进来 → 下载 → multipart 转发 whisper
const cloud = require('wx-server-sdk')
const axios = require('axios')
const FormData = require('form-data')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  try {
    if (!event.fileID) throw new Error('缺少 fileID')
    const dl = await cloud.downloadFile({ fileID: event.fileID })

    const fd = new FormData()
    fd.append('file', dl.fileContent, { filename: 'voice.mp3', contentType: 'audio/mpeg' })
    fd.append('model', 'whisper-1')
    fd.append('language', 'zh')

    const res = await axios.post('https://api.openai-next.com/v1/audio/transcriptions', fd, {
      headers: Object.assign({ Authorization: 'Bearer ' + process.env.OPENAI_NEXT_KEY }, fd.getHeaders()),
      timeout: 15000,
      maxBodyLength: Infinity
    })
    return { text: String(res.data.text || '').trim(), source: 'cloud' }
  } catch (e) {
    console.error('[asr] 识别失败:', e.message)
    return { text: '', source: 'cloud-mock', error: e.message }
  }
}

// 语音输入（按住说话 → whisper 转文字）
// RecorderManager 是全局单例，用模块级 current 委托给当前页面，避免多页重复监听
const api = require('./api.js')

const rec = wx.getRecorderManager()
let current = null // { page, onText, startTs, cancelled }

rec.onStop(async (res) => {
  const c = current
  if (!c) return
  if (c.cancelled) {
    c.page.setData({ recing: false, recHint: '' })
    wx.showToast({ title: '按住说话，松开结束', icon: 'none' })
    return
  }
  c.page.setData({ recing: false, recHint: '✍️ 正在识别…' })
  try {
    const r = await api.transcribe(res.tempFilePath)
    c.page.setData({ recHint: '' })
    if (r.text) c.onText(r.text)
    else wx.showToast({ title: '没听清，请再试一次（需网络）', icon: 'none' })
  } catch (e) {
    c.page.setData({ recHint: '' })
    wx.showToast({ title: '识别失败，请重试', icon: 'none' })
  }
})

rec.onError(() => {
  if (current) current.page.setData({ recing: false, recHint: '' })
  wx.showToast({ title: '录音失败，请检查麦克风权限', icon: 'none' })
})

// 在页面里创建语音输入控制器；onText(text) 收到识别结果
function setup(page, onText) {
  return {
    start() {
      current = { page, onText, startTs: Date.now(), cancelled: false }
      page.setData({ recing: true, recHint: '🎙️ 正在聆听，松开结束' })
      rec.start({ format: 'mp3', sampleRate: 16000, numberOfChannels: 1, encodeBitRate: 48000, duration: 60000 })
    },
    stop() {
      if (!current) return
      if (Date.now() - current.startTs < 600) current.cancelled = true // 误触：太短当取消
      rec.stop()
    }
  }
}

module.exports = { setup }

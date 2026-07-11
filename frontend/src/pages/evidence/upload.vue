<template>
  <view class="upload-page">
    <app-page-header title="上传证据" />
    <scroll-view class="upload-scroll" scroll-y :show-scrollbar="false">
      <view class="intro">
        <text class="intro-title">保存原始记录</text>
        <text class="intro-note">尽量保留未经编辑的文件，并补充时间和地点</text>
      </view>

      <view class="tabs">
        <view class="tab" :class="{ on: type === 'photo' }" @tap="type = 'photo'">照片</view>
        <view class="tab" :class="{ on: type === 'voice' }" @tap="type = 'voice'">语音</view>
        <view class="tab" :class="{ on: type === 'text' }" @tap="type = 'text'">文字</view>
      </view>

      <view class="capture-panel" v-if="type === 'photo'" @tap="pickImage">
        <image v-if="imgPath" :src="imgPath" mode="aspectFit" class="preview" />
        <template v-else>
          <text class="capture-plus">＋</text>
          <text class="capture-title">拍照或从相册选择</text>
          <text class="capture-note">保留原图可以帮助确认时间与文件信息</text>
        </template>
      </view>

      <view v-if="type === 'photo' && analyzing" class="analysis-loading">
        <view class="loading-dot"><text></text><text></text><text></text></view>
        <text>正在辅助整理画面信息</text>
      </view>

      <view v-if="type === 'photo' && analysis && !analyzing" class="analysis-panel">
        <view class="analysis-head"><text>图片辅助说明</text><text>非医学鉴定</text></view>
        <text class="analysis-desc">{{ analysis.injuryDesc }}</text>
        <view class="analysis-tip"><text>就医</text><text>{{ analysis.medicalTip }}</text></view>
        <view class="analysis-tip"><text>报警</text><text>{{ analysis.policeTip }}</text></view>
        <view class="analysis-tip"><text>归档</text><text>{{ analysis.archiveTip }}</text></view>
      </view>

      <view class="capture-panel voice-panel" v-if="type === 'voice'" @tap="toggleRecord">
        <view class="record-ring" :class="{ recording }"><view class="record-dot"></view></view>
        <text class="capture-title">{{ recording ? '录音中 ' + seconds + ' 秒' : (voiceDone ? '已录制 ' + seconds + ' 秒' : '点击开始录音') }}</text>
        <text class="capture-note">{{ recording ? '再次点击停止' : (voiceDone ? '点击可重新录制' : '请确认录音行为符合当地法律') }}</text>
      </view>

      <view class="text-panel" v-if="type === 'text'">
        <textarea class="ta" v-model="content" placeholder="发生了什么？尽量写清时间、地点和经过..." maxlength="2000" />
      </view>

      <view class="form-group">
        <view class="field">
          <text class="label">发生时间</text>
          <picker mode="date" :value="date" @change="date = $event.detail.value">
            <view class="field-value">{{ date || '选择日期' }} <text>›</text></view>
          </picker>
        </view>
        <view class="field">
          <text class="label">发生地点</text>
          <input class="field-input" v-model="place" placeholder="选填" />
        </view>
        <view class="field" v-if="type !== 'text'">
          <text class="label">补充说明</text>
          <input class="field-input" v-model="note" placeholder="描述这份证据" />
        </view>
      </view>

      <view class="storage-tip">提交后会生成存证编号，并记录上传时间。原始文件请同时保存在你能安全访问的位置。</view>
      <view class="submit-button" @tap="submit">提交并存证 <text>→</text></view>
      <view class="bottom-space"></view>
    </scroll-view>

    <app-dock active="evidence" />

    <view class="mask" v-if="receipt">
      <view class="receipt">
        <view class="receipt-mark">✓</view>
        <view class="r-title">已完成存证</view>
        <view class="r-row"><text>存证编号</text><text>{{ receipt.certNo }}</text></view>
        <view class="r-row"><text>固化时间</text><text>{{ fmt(receipt.certTime) }}</text></view>
        <view class="receipt-note">时间戳与文件信息已由平台记录，可作为后续维权材料。</view>
        <view class="done-button" @tap="done">完成</view>
      </view>
    </view>
  </view>
</template>

<script>
import { addEvidence, fmt } from '../../common/store.js'
import { VISION_MOCK } from '../../common/safety-data.js'
import { vision } from '../../services/api.js'
import appPageHeader from '../../components/app-page-header/app-page-header.vue'
import appDock from '../../components/app-dock/app-dock.vue'

export default {
  components: { appPageHeader, appDock },
  data() {
    return {
      type: 'photo', imgPath: '', recording: false, voiceDone: false, seconds: 0,
      content: '', date: '', place: '', note: '', receipt: null, timer: null,
      analyzing: false, analysis: null
    }
  },
  methods: {
    fmt,
    pickImage() {
      uni.chooseImage({
        count: 1,
        success: async res => {
          this.imgPath = res.tempFilePaths[0]
          this.analysis = null
          this.analyzing = true
          try {
            const r = await vision(this.imgPath, this.note)
            this.analysis = {
              injuryDesc: r.injury_desc,
              medicalTip: r.medical_tip,
              policeTip: r.suggest_police,
              archiveTip: r.timeline
            }
          } catch (e) {
            console.warn('[upload] 图片分析失败，使用本地说明:', e)
            this.analysis = { ...VISION_MOCK }
          }
          this.analyzing = false
        }
      })
    },
    toggleRecord() {
      if (this.recording) {
        clearInterval(this.timer)
        this.recording = false
        this.voiceDone = true
      } else {
        this.seconds = 0
        this.voiceDone = false
        this.recording = true
        this.timer = setInterval(() => this.seconds++, 1000)
      }
    },
    submit() {
      if (this.type === 'photo' && !this.imgPath) return uni.showToast({ title: '请选择照片', icon: 'none' })
      if (this.type === 'voice' && !this.voiceDone) return uni.showToast({ title: '请先录音', icon: 'none' })
      if (this.type === 'text' && !this.content.trim()) return uni.showToast({ title: '请输入内容', icon: 'none' })
      this.receipt = addEvidence({
        type: this.type,
        content: this.type === 'text' ? this.content : this.imgPath,
        duration: this.type === 'voice' ? this.seconds : undefined,
        happenDate: this.date,
        place: this.place,
        note: this.note,
        analysis: this.analysis
      })
    },
    done() { uni.redirectTo({ url: '/pages/evidence/list' }) }
  }
}
</script>

<style scoped>
.upload-page { height: 100vh; overflow: hidden; background: #FBFCFC; }
.upload-scroll { height: calc(100vh - var(--status-bar-height) - 104rpx); box-sizing: border-box; padding: 0 36rpx; }
.intro { padding: 44rpx 4rpx 28rpx; }
.intro-title, .intro-note { display: block; }
.intro-title { font-family: "Songti SC", "STSong", serif; font-size: var(--font-intro); font-weight: 700; }
.intro-note { margin-top: 10rpx; color: #96929b; font-size: var(--font-meta); }
.tabs { display: flex; padding: 7rpx; border-radius: 42rpx; background: #f1f0f2; }
.tab { display: flex; height: 66rpx; flex: 1; align-items: center; justify-content: center; border-radius: 34rpx; color: #77727c; font-size: var(--font-body); }
.tab.on { background: #fff; color: #1d1a20; box-shadow: 0 8rpx 24rpx rgba(31,28,37,.08); font-weight: 700; }
.capture-panel, .text-panel { display: flex; min-height: 330rpx; margin-top: 24rpx; flex-direction: column; align-items: center; justify-content: center; padding: 28rpx; box-sizing: border-box; border: 2rpx dashed #dedbe1; border-radius: 30rpx; }
.capture-plus { display: flex; width: 72rpx; height: 72rpx; align-items: center; justify-content: center; border-radius: 50%; background: #f1eff3; color: #77727c; font-size: 42rpx; }
.capture-title { margin-top: 20rpx; font-size: var(--font-body); font-weight: 700; }
.capture-note { margin-top: 10rpx; color: #96929b; font-size: var(--font-meta); text-align: center; }
.preview { width: 100%; height: 360rpx; border-radius: 20rpx; }
.analysis-loading { display: flex; height: 88rpx; align-items: center; justify-content: center; gap: 16rpx; margin-top: 18rpx; border-radius: 24rpx; background: #f2f1f3; color: #77727c; font-size: var(--font-meta); }
.loading-dot { display: flex; gap: 6rpx; }
.loading-dot text { width: 7rpx; height: 7rpx; border-radius: 50%; background: #8b7bc5; animation: loading 1s infinite ease-in-out; }
.loading-dot text:nth-child(2) { animation-delay: .15s; }
.loading-dot text:nth-child(3) { animation-delay: .3s; }
@keyframes loading { 0%, 60%, 100% { opacity: .3; } 30% { opacity: 1; } }
.analysis-panel { margin-top: 18rpx; padding: 26rpx; border-radius: 26rpx; background: #f1efff; }
.analysis-head { display: flex; align-items: center; justify-content: space-between; font-size: var(--font-body); font-weight: 700; }
.analysis-head text:last-child { padding: 6rpx 12rpx; border-radius: 16rpx; background: rgba(255,255,255,.75); color: #77727c; font-size: var(--font-caption); font-weight: 400; }
.analysis-desc { display: block; margin-top: 18rpx; color: #5f5a66; font-size: var(--font-meta); line-height: 1.6; }
.analysis-tip { display: flex; align-items: flex-start; gap: 14rpx; margin-top: 16rpx; color: #6d6872; font-size: var(--font-meta); line-height: 1.5; }
.analysis-tip text:first-child { flex: 0 0 auto; padding: 4rpx 10rpx; border-radius: 14rpx; background: #fff; color: #745fc1; font-size: var(--font-caption); font-weight: 700; }
.record-ring { display: flex; width: 100rpx; height: 100rpx; align-items: center; justify-content: center; border: 8rpx solid #e9e1ff; border-radius: 50%; }
.record-ring.recording { border-color: #e8a8a5; }
.record-dot { width: 48rpx; height: 48rpx; border-radius: 50%; background: #9b7cff; }
.recording .record-dot { border-radius: 12rpx; background: #c94b47; }
.text-panel { align-items: stretch; justify-content: flex-start; }
.ta { width: 100%; min-height: 280rpx; font-size: var(--font-body); line-height: 1.65; }
.form-group { margin-top: 28rpx; border: 1rpx solid #e8e6ea; border-radius: 28rpx; overflow: hidden; }
.field { display: flex; min-height: 96rpx; align-items: center; padding: 0 24rpx; border-bottom: 1rpx solid #e8e6ea; }
.field:last-child { border-bottom: 0; }
.label { width: 160rpx; font-size: var(--font-body); font-weight: 700; }
.field-value { color: #77727c; font-size: var(--font-body); }
.field-value text { margin-left: 8rpx; font-family: Georgia, serif; font-size: 32rpx; }
.field-input { min-width: 0; flex: 1; text-align: right; font-size: var(--font-body); }
.storage-tip { margin-top: 24rpx; padding: 22rpx 24rpx; border-radius: 22rpx; background: #f1edff; color: #625c6b; font-size: var(--font-meta); line-height: 1.55; }
.submit-button { display: flex; height: 88rpx; align-items: center; justify-content: center; gap: 20rpx; margin-top: 28rpx; border-radius: 46rpx; background: #1d1a20; color: #fff; font-size: var(--font-body); font-weight: 700; }
.bottom-space { height: 190rpx; }
.mask { position: fixed; z-index: 100; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(22,21,24,.34); }
.receipt { width: 78%; padding: 38rpx; border-radius: 32rpx; background: #fff; box-shadow: 0 24rpx 80rpx rgba(25,22,30,.16); }
.receipt-mark { display: flex; width: 72rpx; height: 72rpx; align-items: center; justify-content: center; margin: 0 auto; border-radius: 50%; background: #e4f2e9; color: #4b765c; font-size: 36rpx; }
.r-title { margin: 20rpx 0 28rpx; text-align: center; font-family: "Songti SC", "STSong", serif; font-size: var(--font-feature); font-weight: 700; }
.r-row { display: flex; justify-content: space-between; padding: 13rpx 0; border-bottom: 1rpx solid #efedf1; color: #77727c; font-size: var(--font-meta); }
.r-row text:last-child { color: #1d1a20; font-weight: 700; }
.receipt-note { margin: 22rpx 0; color: #96929b; font-size: var(--font-meta); line-height: 1.5; }
.done-button { padding: 20rpx 0; border-radius: 38rpx; background: #1d1a20; color: #fff; text-align: center; font-weight: 700; }
</style>

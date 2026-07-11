<template>
  <view class="detail-page" v-if="ev">
    <app-page-header title="证据详情" />
    <scroll-view class="detail-scroll" scroll-y :show-scrollbar="false">
      <view class="status-panel">
        <view class="status-mark">✓</view>
        <view>
          <text class="status-title">{{ typeName }}</text>
          <text class="status-note">已完成存证 · {{ ev.certNo }}</text>
        </view>
      </view>

      <image v-if="ev.type === 'photo'" :src="ev.content" mode="widthFix" class="evidence-image" />
      <view v-else-if="ev.type === 'voice'" class="voice-panel">
        <view class="play-button">▶</view>
        <view><text class="voice-title">语音记录</text><text class="voice-note">{{ ev.duration || '--' }} 秒</text></view>
      </view>
      <view v-else class="text-panel">{{ ev.content }}</view>

      <text class="section-title-local">存证信息</text>
      <view class="info-group">
        <view class="info-row"><text>上传时间</text><text>{{ fmt(ev.time) }}</text></view>
        <view class="info-row"><text>固化时间</text><text>{{ fmt(ev.certTime) }}</text></view>
        <view class="info-row" v-if="ev.sourceLabel"><text>内容来源</text><text>{{ ev.sourceLabel }}</text></view>
        <view class="info-row" v-if="ev.sourceTime"><text>会话时间</text><text>{{ fmt(ev.sourceTime) }}</text></view>
        <view class="info-row" v-if="ev.happenDate"><text>发生时间</text><text>{{ ev.happenDate }}</text></view>
        <view class="info-row" v-if="ev.place"><text>发生地点</text><text>{{ ev.place }}</text></view>
      </view>

      <template v-if="ev.analysis">
        <text class="section-title-local">图片辅助说明</text>
        <view class="analysis-box">
          <view class="analysis-label">非医学鉴定，仅用于帮助整理记录</view>
          <text class="analysis-desc">{{ ev.analysis.injuryDesc }}</text>
          <view class="analysis-row"><text>就医建议</text><text>{{ ev.analysis.medicalTip }}</text></view>
          <view class="analysis-row"><text>报警建议</text><text>{{ ev.analysis.policeTip }}</text></view>
          <view class="analysis-row"><text>归档建议</text><text>{{ ev.analysis.archiveTip }}</text></view>
        </view>
      </template>

      <text class="section-title-local">补充备注</text>
      <view class="note-box">
        <textarea class="ta" v-model="note" placeholder="可随时补充这份证据的说明" @blur="saveNote" />
      </view>

      <view class="delete-button" @tap="del">删除该证据</view>
      <view class="bottom-space"></view>
    </scroll-view>
    <app-dock active="evidence" />
  </view>
</template>

<script>
import { getEvidences, updateEvidence, removeEvidence, fmt } from '../../common/store.js'
import appPageHeader from '../../components/app-page-header/app-page-header.vue'
import appDock from '../../components/app-dock/app-dock.vue'

export default {
  components: { appPageHeader, appDock },
  data() { return { ev: null, note: '' } },
  computed: {
    typeName() { return { photo: '照片证据', voice: '语音证据', text: '文字记录' }[this.ev?.type] || '' }
  },
  onLoad(q) {
    this.ev = getEvidences().find(x => x.id === q.id) || null
    this.note = this.ev?.note || ''
  },
  methods: {
    fmt,
    saveNote() { updateEvidence(this.ev.id, { note: this.note }) },
    del() {
      uni.showModal({
        title: '删除证据',
        content: '本地记录将删除。确定继续？',
        confirmColor: '#5B3AA4',
        success: r => {
          if (r.confirm) {
            removeEvidence(this.ev.id)
            uni.navigateBack()
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.detail-page { height: 100vh; overflow: hidden; background: #FBFCFC; }
.detail-scroll { height: calc(100vh - var(--status-bar-height) - 104rpx); box-sizing: border-box; padding: 18rpx 36rpx 0; }
.status-panel { display: flex; min-height: 122rpx; align-items: center; gap: 22rpx; padding: 22rpx 26rpx; box-sizing: border-box; border-radius: 28rpx; background: #e9f4ed; }
.status-mark { display: flex; width: 64rpx; height: 64rpx; flex: 0 0 64rpx; align-items: center; justify-content: center; border-radius: 50%; background: #fff; color: #4c745c; font-size: 30rpx; }
.status-title, .status-note { display: block; }
.status-title { font-size: var(--font-body); font-weight: 700; }
.status-note { margin-top: 7rpx; color: #617568; font-size: var(--font-meta); }
.evidence-image { width: 100%; margin-top: 24rpx; border-radius: 26rpx; }
.voice-panel { display: flex; min-height: 150rpx; align-items: center; gap: 24rpx; margin-top: 24rpx; padding: 28rpx; box-sizing: border-box; border-radius: 28rpx; background: #eeeaff; }
.play-button { display: flex; width: 72rpx; height: 72rpx; align-items: center; justify-content: center; border-radius: 50%; background: #fff; }
.voice-title, .voice-note { display: block; }
.voice-title { font-size: var(--font-body); font-weight: 700; }
.voice-note { margin-top: 7rpx; color: #77727c; font-size: var(--font-meta); }
.text-panel { margin-top: 24rpx; padding: 30rpx; border-radius: 28rpx; background: #f1efff; font-family: "Songti SC", "STSong", serif; font-size: var(--font-body); line-height: 1.65; }
.section-title-local { display: block; margin: 40rpx 4rpx 16rpx; font-size: var(--font-section); font-weight: 700; }
.info-group { border: 1rpx solid #e8e6ea; border-radius: 28rpx; overflow: hidden; }
.info-row { display: flex; min-height: 88rpx; align-items: center; justify-content: space-between; padding: 0 24rpx; border-bottom: 1rpx solid #e8e6ea; font-size: var(--font-meta); }
.info-row:last-child { border-bottom: 0; }
.info-row text:first-child { color: #77727c; }
.info-row text:last-child { max-width: 64%; text-align: right; font-weight: 600; }
.analysis-box { padding: 26rpx; border-radius: 26rpx; background: #f1efff; }
.analysis-label { display: inline-flex; padding: 7rpx 13rpx; border-radius: 16rpx; background: #fff; color: #77727c; font-size: var(--font-caption); }
.analysis-desc { display: block; margin-top: 18rpx; font-size: var(--font-meta); line-height: 1.6; }
.analysis-row { display: flex; align-items: flex-start; gap: 16rpx; margin-top: 18rpx; color: #625e68; font-size: var(--font-meta); line-height: 1.55; }
.analysis-row text:first-child { width: 92rpx; flex: 0 0 92rpx; color: #745fc1; font-weight: 700; }
.note-box { padding: 24rpx; border: 2rpx dashed #dedbe1; border-radius: 24rpx; }
.ta { width: 100%; min-height: 150rpx; font-size: var(--font-body); line-height: 1.6; }
.delete-button { margin-top: 32rpx; padding: 22rpx 0; border: 1rpx solid #e8b6b3; border-radius: 42rpx; color: #5B3AA4; text-align: center; font-size: var(--font-body); font-weight: 700; }
.bottom-space { height: 190rpx; }
</style>

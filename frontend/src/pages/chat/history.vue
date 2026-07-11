<template>
  <view class="history-page">
    <agent-topbar @menu="goBack" />
    <scroll-view class="history-scroll" scroll-y :show-scrollbar="false">
      <view class="intro">
        <text class="intro-title">聊天记录</text>
        <text class="intro-note">继续之前的话题，或删除不再需要的本地记录</text>
      </view>

      <view class="empty" v-if="!sessions.length">暂无历史会话</view>
      <view class="session-list">
        <view class="session-row" v-for="s in sessions" :key="s.id" @tap="view(s)">
          <view class="session-mark">◷</view>
          <view class="session-copy">
            <text class="summary">{{ s.summary }}</text>
            <text class="meta">{{ fmt(s.time) }} · {{ s.msgs.length }} 条消息</text>
          </view>
          <view class="session-actions">
            <view class="resume" @tap.stop="resume(s)">继续</view>
            <view class="delete" @tap.stop="del(s)">×</view>
          </view>
        </view>
      </view>
      <view class="bottom-space"></view>
    </scroll-view>

    <app-dock active="chat" />

    <view class="viewer" v-if="viewing" @tap="viewing = null">
      <view class="viewer-body" @tap.stop>
        <view class="viewer-head"><text>会话回看</text><text class="close" @tap="viewing = null">×</text></view>
        <scroll-view scroll-y class="viewer-scroll">
          <view v-for="m in viewing.msgs" :key="m.id" class="v-msg" :class="m.role">
            <text class="v-role">{{ m.role === 'user' ? '我' : '暖芽' }}</text>
            <text>{{ m.type === 'text' ? m.content : '[' + (m.type === 'image' ? '图片' : '语音') + ']' }}</text>
          </view>
        </scroll-view>
        <view class="continue-button" @tap="resume(viewing)">继续这个话题</view>
      </view>
    </view>
  </view>
</template>

<script>
import { getSessions, removeSession, set, KEYS, fmt } from '../../common/store.js'
import appDock from '../../components/app-dock/app-dock.vue'
import agentTopbar from '../../components/agent-topbar/agent-topbar.vue'

export default {
  components: { appDock, agentTopbar },
  data() { return { sessions: [], viewing: null } },
  onShow() { this.sessions = getSessions() },
  methods: {
    fmt,
    goBack() { uni.navigateBack({ delta: 1 }) },
    view(s) { this.viewing = s },
    resume(s) {
      set(KEYS.CUR_SESSION, s.id)
      this.viewing = null
      uni.navigateTo({ url: '/pages/chat/chat' })
    },
    del(s) {
      uni.showModal({
        title: '删除会话',
        content: '删除后无法恢复，确定删除？',
        confirmColor: '#5B3AA4',
        success: r => {
          if (r.confirm) {
            removeSession(s.id)
            this.sessions = getSessions()
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.history-page { height: 100vh; overflow: hidden; background: #FBFCFC; }
.history-scroll { height: calc(100vh - var(--status-bar-height) - 116rpx); box-sizing: border-box; padding: 0 34rpx; }
.intro { padding: 46rpx 4rpx 28rpx; }
.intro-title, .intro-note { display: block; }
.intro-title { font-family: "Songti SC", "STSong", serif; font-size: var(--font-intro); font-weight: 700; }
.intro-note { margin-top: 10rpx; color: #96929b; font-size: var(--font-meta); }
.empty { padding: 120rpx 0; text-align: center; color: #96929b; }
.session-list { border-top: 1rpx solid #ebe9ed; }
.session-row { display: flex; min-height: 116rpx; align-items: center; gap: 16rpx; padding: 18rpx 4rpx; border-bottom: 1rpx solid #ebe9ed; }
.session-mark { display: flex; width: 58rpx; height: 58rpx; flex: 0 0 58rpx; align-items: center; justify-content: center; border-radius: 20rpx; background: #eeeaff; color: #685b89; font-size: 25rpx; }
.session-copy { min-width: 0; flex: 1; }
.summary, .meta { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.summary { font-size: var(--font-body); font-weight: 700; }
.meta { margin-top: 7rpx; color: #aaa6ae; font-size: var(--font-caption); }
.session-actions { display: flex; align-items: center; gap: 10rpx; }
.resume { padding: 11rpx 17rpx; border-radius: 22rpx; background: #f1eff3; color: #625e67; font-size: var(--font-meta); }
.delete { display: flex; width: 42rpx; height: 42rpx; align-items: center; justify-content: center; color: #aaa6ae; font-size: 30rpx; }
.bottom-space { height: 190rpx; }
.viewer { position: fixed; z-index: 100; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(22,21,24,.34); }
.viewer-body { display: flex; width: 82%; max-height: 76vh; padding: 30rpx; flex-direction: column; border-radius: 32rpx; background: #fff; }
.viewer-head { display: flex; align-items: center; justify-content: space-between; font-family: "Songti SC", "STSong", serif; font-size: var(--font-nav); font-weight: 700; }
.close { font-family: sans-serif; font-size: 38rpx; font-weight: 300; }
.viewer-scroll { max-height: 52vh; margin: 24rpx 0; }
.v-msg { display: flex; margin: 16rpx 0; flex-direction: column; gap: 6rpx; padding: 18rpx 20rpx; border-radius: 20rpx; background: #f3f2f4; font-size: var(--font-body); line-height: 1.5; }
.v-msg.user { background: #eeeaff; }
.v-role { color: #77727c; font-size: var(--font-caption); font-weight: 700; }
.continue-button { padding: 20rpx 0; border-radius: 38rpx; background: #1d1a20; color: #fff; text-align: center; font-weight: 700; }
</style>

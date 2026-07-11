<template>
  <view class="home-page">
    <view class="topbar">
      <view class="menu-button" aria-label="打开聊天历史" @tap="openHistory">
        <view class="menu-line"></view>
        <view class="menu-line short"></view>
      </view>

      <view class="brand-pill">
        <text>暖芽</text>
        <text class="sparkle">✦</text>
      </view>

      <view class="top-spacer"></view>
    </view>

    <view class="hero">
      <image class="mascot" src="/static/icons/mascot.png" mode="aspectFit" />
      <text class="hero-title">需要帮助时，\n我会陪你想办法。</text>
    </view>

    <view class="bottom-area">
      <view v-show="!historyOpen" class="prompt-bar">
        <input
          v-model="prompt"
          class="prompt-input"
          confirm-type="send"
          placeholder="告诉暖芽，你现在需要什么"
          placeholder-class="prompt-placeholder"
          @confirm="startChat"
        />
        <view class="speak-button" @tap="startVoiceChat">
          <view class="voice-bars" aria-hidden="true">
            <view></view><view></view><view></view><view></view><view></view>
          </view>
          <text>说话</text>
        </view>
      </view>

      <view class="dock-row">
        <view class="nav-dock">
          <view
            v-for="item in navItems"
            :key="item.url"
            class="nav-button"
            :aria-label="item.label"
            @tap="nav(item.url)"
          >
            <view class="icon-window">
              <image class="nav-icon" :src="item.icon" mode="aspectFit" />
            </view>
          </view>
        </view>

        <view class="agent-button" aria-label="新建暖芽聊天" @tap="openNewChat">
          <image class="agent-avatar" src="/static/icons/avatar.png" mode="aspectFill" />
        </view>
      </view>
    </view>

    <view v-if="historyOpen" class="history-overlay" @tap="historyOpen = false">
      <view class="history-drawer" @tap.stop>
        <view class="drawer-topbar">
          <view class="menu-button" aria-label="关闭聊天历史" @tap="historyOpen = false">
            <view class="menu-line"></view>
            <view class="menu-line short"></view>
          </view>

          <view class="brand-pill drawer-brand">
            <text>暖芽</text>
            <text class="sparkle">✦</text>
          </view>
        </view>

        <view class="history-heading">
          <text class="history-title">聊天历史</text>
          <view class="new-chat-button" aria-label="新建聊天" @tap="newChat">
            <view class="new-chat-box"></view>
            <view class="new-chat-pen"></view>
          </view>
        </view>

        <scroll-view class="history-list" scroll-y :show-scrollbar="false">
          <view v-if="!sessions.length" class="empty-history">
            <text>还没有历史对话</text>
            <text class="empty-note">开始聊天后，会话会安全保存在这里</text>
          </view>

          <view
            v-for="session in sessions"
            :key="session.id"
            class="history-item"
            @tap="continueSession(session)"
          >
            <text class="history-summary">{{ session.summary }}</text>
            <text class="history-meta">{{ formatTime(session.time) }} · {{ session.msgs.length }} 条消息</text>
          </view>
        </scroll-view>
      </view>
    </view>
    <escape-btn />
  </view>
</template>

<script>
import { getSessions, set, KEYS, fmt } from '../../common/store.js'
import escapeBtn from '../../components/escape-btn/escape-btn.vue'

export default {
  components: { escapeBtn },
  data() {
    return {
      historyOpen: false,
      sessions: [],
      prompt: '',
      navItems: [
        { label: '一键求助', url: '/pages/sos/sos', icon: '/static/icons/icon-sos.png' },
        { label: '社群广场', url: '/pages/community/community', icon: '/static/icons/icon-community.png' },
        { label: '证据处理', url: '/pages/evidence/list', icon: '/static/icons/icon-evidence.png' },
        { label: '设置', url: '/pages/mine/mine', icon: '/static/icons/icon-settings.png' }
      ]
    }
  },
  onShow() {
    this.sessions = getSessions()
  },
  methods: {
    nav(url) {
      this.historyOpen = false
      uni.navigateTo({ url })
    },
    openHistory() {
      this.sessions = getSessions()
      this.historyOpen = true
    },
    newChat() {
      set(KEYS.CUR_SESSION, '')
      this.historyOpen = false
      uni.navigateTo({ url: '/pages/chat/chat?new=1' })
    },
    continueSession(session) {
      set(KEYS.CUR_SESSION, session.id)
      this.historyOpen = false
      uni.navigateTo({ url: '/pages/chat/chat' })
    },
    formatTime: fmt,
    startChat() {
      const text = this.prompt.trim()
      const query = text ? `?prompt=${encodeURIComponent(text)}` : ''
      this.prompt = ''
      uni.navigateTo({ url: `/pages/chat/chat${query}` })
    },
    startVoiceChat() {
      uni.navigateTo({ url: '/pages/chat/chat?voice=1' })
    },
    openNewChat() {
      set(KEYS.CUR_SESSION, '')
      uni.navigateTo({ url: `/pages/chat/chat?new=1&t=${Date.now()}` })
    }
  }
}
</script>

<style scoped>
.home-page {
  --ink: #171619;
  --soft-ink: #817e86;
  --lavender: #9b7cff;
  position: relative;
  box-sizing: border-box;
  min-height: 100vh;
  overflow: hidden;
  background: #FBFCFC;
  color: var(--ink);
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(var(--status-bar-height) + 28rpx) 36rpx 0;
}

.menu-button,
.top-spacer {
  width: 88rpx;
  height: 88rpx;
}

.menu-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  box-sizing: border-box;
  border: 1rpx solid #FFFFFF;
  border-radius: 50%;
  background: #FDFDFD;
  box-shadow: 0 18rpx 50rpx rgba(32, 29, 39, 0.08);
}

.menu-line {
  width: 30rpx;
  height: 4rpx;
  border-radius: 4rpx;
  background: var(--ink);
}

.menu-line.short {
  width: 20rpx;
  margin-right: 10rpx;
}

.brand-pill {
  display: flex;
  align-items: center;
  gap: 10rpx;
  min-width: 196rpx;
  height: 78rpx;
  padding: 0 32rpx;
  box-sizing: border-box;
  border: 1rpx solid #FFFFFF;
  border-radius: 44rpx;
  background: #FDFDFD;
  box-shadow: 0 18rpx 50rpx rgba(32, 29, 39, 0.07);
  font-family: "Avenir Next", "PingFang SC", sans-serif;
  font-size: var(--font-body);
  font-weight: 700;
  justify-content: center;
}

.sparkle {
  color: var(--lavender);
  font-size: 28rpx;
}

.hero {
  position: absolute;
  top: 62%;
  left: 50%;
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  transform: translate(-50%, -50%);
}

.mascot {
  width: 320rpx;
  height: 260rpx;
  margin-bottom: 8rpx;
}

.hero-title {
  max-width: 620rpx;
  text-align: center;
  font-family: "Songti SC", "STSong", serif;
  font-size: calc(var(--font-intro) - 6rpx);
  font-weight: 700;
  line-height: 1.38;
}

.bottom-area {
  position: absolute;
  z-index: 30;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 0 32rpx calc(env(safe-area-inset-bottom) + 28rpx);
}

.prompt-bar {
  display: flex;
  height: 104rpx;
  align-items: center;
  gap: 20rpx;
  padding: 10rpx 12rpx 10rpx 34rpx;
  box-sizing: border-box;
  border: 1rpx solid rgba(28, 25, 33, 0.035);
  border-radius: 56rpx;
  background: #fff;
  box-shadow: 0 20rpx 62rpx rgba(35, 31, 45, 0.09);
}

.prompt-input {
  min-width: 0;
  height: 72rpx;
  flex: 1;
  font-size: 22rpx;
}

.prompt-placeholder {
  color: #9a979f;
}

.speak-button {
  display: flex;
  width: 172rpx;
  height: 76rpx;
  flex: 0 0 172rpx;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
  border-radius: 40rpx;
  background: #171519;
  color: #fff;
  font-size: 22rpx;
  font-weight: 700;
}

.voice-bars {
  display: flex;
  height: 28rpx;
  align-items: center;
  gap: 3rpx;
}

.voice-bars view {
  display: block;
  width: 3rpx;
  border-radius: 3rpx;
  background: #fff;
}

.voice-bars view:nth-child(1),
.voice-bars view:nth-child(5) { height: 10rpx; }
.voice-bars view:nth-child(2),
.voice-bars view:nth-child(4) { height: 20rpx; }
.voice-bars view:nth-child(3) { height: 28rpx; }

.dock-row {
  display: flex;
  height: 112rpx;
  align-items: stretch;
  gap: 24rpx;
  margin-top: 32rpx;
}

.nav-dock {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  justify-content: space-around;
  padding: 0 18rpx;
  border: 1rpx solid rgba(28, 25, 33, 0.035);
  border-radius: 58rpx;
  background: rgba(235, 236, 236, 0.42);
  backdrop-filter: blur(36rpx) saturate(1.8);
  -webkit-backdrop-filter: blur(36rpx) saturate(1.8);
  box-shadow: 0 18rpx 54rpx rgba(35, 31, 45, 0.08);
}

.nav-button {
  position: relative;
  display: flex;
  width: 76rpx;
  height: 76rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.nav-button:active,
.agent-button:active,
.menu-button:active,
.speak-button:active {
  transform: scale(0.95);
}

.icon-window {
  display: flex;
  width: 50rpx;
  height: 50rpx;
  align-items: center;
  justify-content: center;
}

.nav-icon {
  width: 50rpx;
  height: 50rpx;
  opacity: 0.75;
}

.agent-button {
  display: flex;
  width: 112rpx;
  height: 112rpx;
  flex: 0 0 112rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(235, 236, 236, 0.42);
  backdrop-filter: blur(36rpx) saturate(1.8);
  -webkit-backdrop-filter: blur(36rpx) saturate(1.8);
  box-shadow: 0 18rpx 54rpx rgba(35, 31, 45, 0.1);
  transition: transform 0.16s ease;
}

.agent-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
}

.history-overlay {
  position: fixed;
  z-index: 20;
  inset: 0;
  background: rgba(22, 21, 24, 0.3);
  animation: overlay-in 0.18s ease-out;
}

.history-drawer {
  display: flex;
  width: 82%;
  height: 100%;
  flex-direction: column;
  box-sizing: border-box;
  background: #FBFCFC;
  box-shadow: 24rpx 0 60rpx rgba(20, 18, 24, 0.12);
  animation: drawer-in 0.22s ease-out;
}

.drawer-topbar {
  position: relative;
  display: flex;
  min-height: calc(var(--status-bar-height) + 116rpx);
  align-items: flex-end;
  padding: 0 36rpx 0;
  box-sizing: border-box;
}

.drawer-brand {
  position: absolute;
  right: 26rpx;
  bottom: 5rpx;
}

.history-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 112rpx 38rpx 34rpx;
}

.history-title {
  font-family: "Avenir Next", "PingFang SC", sans-serif;
  font-size: calc(var(--font-section) - 8rpx);
  font-weight: 700;
  letter-spacing: 0;
}

.new-chat-button {
  position: relative;
  display: flex;
  width: 76rpx;
  height: 76rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 16rpx 44rpx rgba(32, 29, 39, 0.08);
}

.new-chat-box {
  width: 29rpx;
  height: 29rpx;
  border: 4rpx solid rgba(23, 22, 25, 0.78);
  border-radius: 3rpx;
}

.new-chat-pen {
  position: absolute;
  top: 22rpx;
  right: 19rpx;
  width: 25rpx;
  height: 4rpx;
  border: 5rpx solid #fff;
  background: rgba(23, 22, 25, 0.78);
  transform: rotate(-45deg);
}

.history-list {
  min-height: 0;
  flex: 1;
  padding: 0 30rpx 210rpx;
  box-sizing: border-box;
}

.empty-history {
  display: flex;
  padding: 110rpx 20rpx 0;
  flex-direction: column;
  align-items: center;
  color: rgba(23, 22, 25, 0.48);
  font-size: calc(var(--font-body) - 2rpx);
}

.empty-note {
  margin-top: 12rpx;
  color: rgba(23, 22, 25, 0.3);
  font-size: calc(var(--font-meta) - 2rpx);
}

.history-item {
  display: flex;
  margin-bottom: 14rpx;
  padding: 24rpx 22rpx;
  flex-direction: column;
  border-bottom: 1rpx solid rgba(23, 22, 25, 0.07);
}

.history-item:active {
  border-radius: 12rpx;
  background: rgba(23, 22, 25, 0.035);
}

.history-summary {
  overflow: hidden;
  color: rgba(23, 22, 25, 0.82);
  font-size: var(--font-caption);
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-meta {
  margin-top: 8rpx;
  color: rgba(23, 22, 25, 0.36);
  font-size: calc(var(--font-caption) - 2rpx);
}

@keyframes overlay-in {
  from { background: rgba(22, 21, 24, 0); }
}

@keyframes drawer-in {
  from { transform: translateX(-100%); }
}

@media screen and (max-height: 650px) {
  .hero { top: 49%; }
  .mascot { width: 250rpx; height: 210rpx; margin-bottom: 4rpx; }
  .hero-title { font-size: var(--font-feature); }
}
</style>

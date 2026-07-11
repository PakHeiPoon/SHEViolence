<template>
  <view>
    <escape-btn />
    <view class="dock-row">
      <view class="nav-dock" :class="{ bouncing: dockBouncing }">
        <view class="dock-surface" />
        <view class="dock-bubble" :class="{ show: activeIndex >= 0, popping: dockBouncing }" :style="bubbleStyle" />
        <view
          v-for="item in items"
          :key="item.key"
          class="dock-item"
          :class="{ active: localActive === item.key }"
          :aria-label="item.label"
          @tap="go(item)"
        >
          <image class="dock-icon" :src="item.icon" mode="aspectFit" />
        </view>
      </view>

      <view class="agent-button" :class="{ active: active === 'chat', bouncing: agentBouncing }" aria-label="打开暖芽聊天" @tap="openChat">
        <image class="agent-avatar" src="/static/icons/avatar.png" mode="aspectFill" />
      </view>
    </view>
  </view>
</template>

<script>
import escapeBtn from '../escape-btn/escape-btn.vue'

export default {
  name: 'app-dock',
  components: { escapeBtn },
  props: {
    active: { type: String, default: '' }
  },
  data() {
    return {
      localActive: this.active,
      navTimer: null,
      bounceTimer: null,
      agentTimer: null,
      agentBounceTimer: null,
      dockBouncing: false,
      agentBouncing: false,
      items: [
        { key: 'sos', label: '一键求助', url: '/pages/sos/sos', icon: '/static/icons/icon-sos.png' },
        { key: 'community', label: '社群广场', url: '/pages/community/community', icon: '/static/icons/icon-community.png' },
        { key: 'evidence', label: '证据处理', url: '/pages/evidence/list', icon: '/static/icons/icon-evidence.png' },
        { key: 'settings', label: '设置', url: '/pages/mine/mine', icon: '/static/icons/icon-settings.png' }
      ]
    }
  },
  computed: {
    activeIndex() {
      return this.items.findIndex(i => i.key === this.localActive)
    },
    bubbleStyle() {
      const idx = Math.max(this.activeIndex, 0)
      return `--dock-x: ${idx * 100}%`
    }
  },
  watch: {
    active(val) {
      this.localActive = val
    }
  },
  beforeDestroy() {
    if (this.navTimer) clearTimeout(this.navTimer)
    if (this.bounceTimer) clearTimeout(this.bounceTimer)
    if (this.agentTimer) clearTimeout(this.agentTimer)
    if (this.agentBounceTimer) clearTimeout(this.agentBounceTimer)
  },
  methods: {
    go(item) {
      this.triggerDockBounce()
      if (item.key === this.localActive) return
      this.localActive = item.key
      if (this.navTimer) clearTimeout(this.navTimer)
      this.navTimer = setTimeout(() => {
        uni.redirectTo({ url: item.url })
      }, 360)
    },
    triggerDockBounce() {
      if (this.bounceTimer) clearTimeout(this.bounceTimer)
      this.dockBouncing = false
      this.$nextTick(() => {
        this.dockBouncing = true
        this.bounceTimer = setTimeout(() => {
          this.dockBouncing = false
        }, 560)
      })
    },
    openChat() {
      this.triggerAgentBounce()
      if (this.agentTimer) clearTimeout(this.agentTimer)
      this.agentTimer = setTimeout(() => {
        uni.redirectTo({ url: `/pages/chat/chat?new=1&t=${Date.now()}` })
      }, 300)
    },
    triggerAgentBounce() {
      if (this.agentBounceTimer) clearTimeout(this.agentBounceTimer)
      this.agentBouncing = false
      this.$nextTick(() => {
        this.agentBouncing = true
        this.agentBounceTimer = setTimeout(() => {
          this.agentBouncing = false
        }, 520)
      })
    }
  }
}
</script>

<style scoped>
.dock-row {
  position: fixed;
  z-index: 90;
  right: 28rpx;
  bottom: calc(env(safe-area-inset-bottom) + 24rpx);
  left: 28rpx;
  display: flex;
  height: 112rpx;
  gap: 24rpx;
}

.nav-dock {
  position: relative;
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  padding: 0 14rpx;
  border-radius: 58rpx;
}

.dock-surface {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  border-radius: 58rpx;
  background: rgba(235, 236, 236, 0.42);
  backdrop-filter: blur(36rpx) saturate(1.8);
  -webkit-backdrop-filter: blur(36rpx) saturate(1.8);
  box-shadow:
    0 18rpx 58rpx rgba(35, 31, 45, 0.14),
    inset 0 1.5rpx 1rpx rgba(255, 255, 255, 0.95),
    inset 0 -1rpx 1rpx rgba(255, 255, 255, 0.35),
    inset 3rpx 0 6rpx -2rpx rgba(255, 120, 80, 0.22),
    inset -3rpx 0 6rpx -2rpx rgba(80, 150, 255, 0.22),
    inset 0 3rpx 8rpx -3rpx rgba(255, 220, 120, 0.18),
    inset 0 -3rpx 8rpx -3rpx rgba(140, 100, 255, 0.16);
  pointer-events: none;
  transform-origin: center;
  will-change: transform;
}

.dock-surface::after {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  height: 55%;
  border-radius: 58rpx 58rpx 40% 40%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0));
  content: "";
}

.nav-dock.bouncing .dock-surface {
  animation: dock-pop 0.56s cubic-bezier(0.16, 1, 0.3, 1);
}

.dock-bubble {
  position: absolute;
  top: 50%;
  left: 14rpx;
  width: calc((100% - 28rpx) / 4);
  height: 112rpx;
  margin-top: -56rpx;
  border-radius: 56rpx;
  background: #EBECEC;
  box-shadow:
    0 10rpx 28rpx rgba(35, 31, 45, 0.1),
    inset 0 1rpx 1rpx rgba(255, 255, 255, 0.9),
    inset 2rpx 0 5rpx -2rpx rgba(255, 120, 80, 0.2),
    inset -2rpx 0 5rpx -2rpx rgba(80, 150, 255, 0.2);
  backdrop-filter: blur(8rpx) saturate(1.6);
  -webkit-backdrop-filter: blur(8rpx) saturate(1.6);
  opacity: 0;
  transform: translateX(var(--dock-x, 0)) scale(0.82);
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
  transform-origin: center;
  will-change: transform;
}

.dock-bubble.show {
  opacity: 1;
  transform: translateX(var(--dock-x, 0)) scale(1.1);
}

.dock-bubble.popping {
  animation: bubble-pop 0.56s cubic-bezier(0.16, 1, 0.3, 1);
}

.dock-item {
  position: relative;
  z-index: 1;
  display: flex;
  height: 82rpx;
  flex: 1;
  align-items: center;
  justify-content: center;
}

.agent-button:active {
  transform: scale(1.025);
}

.dock-icon {
  width: 50rpx;
  height: 50rpx;
  opacity: 0.75;
  transition: opacity 0.25s ease;
}

.active .dock-icon {
  opacity: 1;
}

@keyframes bubble-pop {
  0% {
    transform: translateX(var(--dock-x, 0)) scale(1.04);
  }
  36% {
    transform: translateX(var(--dock-x, 0)) scale(1.18);
  }
  64% {
    transform: translateX(var(--dock-x, 0)) scale(1.085);
  }
  82% {
    transform: translateX(var(--dock-x, 0)) scale(1.12);
  }
  100% {
    transform: translateX(var(--dock-x, 0)) scale(1.1);
  }
}

@keyframes dock-pop {
  0% {
    transform: scale(1);
  }
  36% {
    transform: scale(1.022);
  }
  64% {
    transform: scale(1.006);
  }
  82% {
    transform: scale(1.012);
  }
  100% {
    transform: scale(1);
  }
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
  box-shadow:
    0 18rpx 58rpx rgba(35, 31, 45, 0.15),
    inset 0 1.5rpx 1rpx rgba(255, 255, 255, 0.95),
    inset 3rpx 0 6rpx -2rpx rgba(255, 120, 80, 0.2),
    inset -3rpx 0 6rpx -2rpx rgba(80, 150, 255, 0.2),
    inset 0 -3rpx 8rpx -3rpx rgba(140, 100, 255, 0.15);
  transition: transform 0.22s ease-out;
  transform-origin: center;
  will-change: transform;
}

.agent-button.active {
  background: rgba(235, 236, 236, 0.5);
  box-shadow:
    0 18rpx 58rpx rgba(73, 58, 112, 0.18),
    inset 0 1.5rpx 1rpx rgba(255, 255, 255, 0.95),
    inset 3rpx 0 6rpx -2rpx rgba(255, 120, 80, 0.2),
    inset -3rpx 0 6rpx -2rpx rgba(80, 150, 255, 0.2);
}

.agent-button.bouncing {
  animation: agent-pop 0.52s cubic-bezier(0.16, 1, 0.3, 1);
}

.agent-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
}

@keyframes agent-pop {
  0% {
    transform: scale(1);
  }
  36% {
    transform: scale(1.09);
  }
  64% {
    transform: scale(1.025);
  }
  82% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}
</style>

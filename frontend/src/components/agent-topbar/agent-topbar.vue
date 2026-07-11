<template>
  <view class="agent-topbar">
    <view class="menu-button" aria-label="聊天菜单" @tap="$emit('menu')">
      <view class="menu-line"></view>
      <view class="menu-line short"></view>
    </view>

    <view class="mode-anchor">
      <view class="brand-pill" :class="{ open }" @tap="open = !open">
        <text>{{ current.label }}</text>
        <text class="sparkle">✦</text>
        <view class="chevron" :class="{ up: open }"></view>
      </view>

      <view v-if="open" class="mode-panel">
        <view
          v-for="m in modes"
          :key="m.key"
          class="mode-option"
          :class="{ selected: m.key === mode }"
          @tap="pick(m)"
        >
          <view class="mode-texts">
            <text class="mode-label">{{ m.label }}</text>
            <text class="mode-desc">{{ m.desc }}</text>
          </view>
          <text v-if="m.key === mode" class="mode-check">✓</text>
        </view>
      </view>
    </view>

    <view class="top-spacer"></view>

    <view v-if="open" class="mode-mask" @tap="open = false"></view>
  </view>
</template>

<script>
export default {
  name: 'agent-topbar',
  emits: ['menu', 'select'],
  props: {
    mode: { type: String, default: 'companion' }
  },
  data() {
    return {
      open: false,
      modes: [
        { key: 'companion', label: '暖暖陪伴', desc: '情绪陪伴，慢慢倾诉' },
        { key: 'legal', label: '法律援助', desc: '法律咨询与取证指引' }
      ]
    }
  },
  computed: {
    current() {
      return this.modes.find(m => m.key === this.mode) || this.modes[0]
    }
  },
  methods: {
    pick(m) {
      this.open = false
      if (m.key !== this.mode) this.$emit('select', m.key)
    }
  }
}
</script>

<style scoped>
.agent-topbar {
  position: relative;
  z-index: 50;
  display: flex;
  flex: 0 0 auto;
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
  position: relative;
  z-index: 52;
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

.menu-button:active { transform: scale(0.95); }

.menu-line {
  width: 30rpx;
  height: 4rpx;
  border-radius: 4rpx;
  background: #171619;
}

.menu-line.short {
  width: 20rpx;
  margin-right: 10rpx;
}

.mode-anchor {
  position: relative;
  z-index: 52;
}

.brand-pill {
  display: flex;
  min-width: 196rpx;
  height: 78rpx;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  padding: 0 30rpx;
  box-sizing: border-box;
  border: 1rpx solid #FFFFFF;
  border-radius: 44rpx;
  background: #FDFDFD;
  box-shadow: 0 18rpx 50rpx rgba(32, 29, 39, 0.07);
  font-size: var(--font-body);
  font-weight: 700;
  transition: transform 0.16s ease;
}

.brand-pill:active { transform: scale(0.96); }

.sparkle { color: #9b7cff; }

.chevron {
  width: 12rpx;
  height: 12rpx;
  margin-top: -6rpx;
  border-right: 3rpx solid #8c8794;
  border-bottom: 3rpx solid #8c8794;
  transform: rotate(45deg);
  transition: transform 0.2s ease;
}

.chevron.up {
  margin-top: 6rpx;
  transform: rotate(-135deg);
}

.mode-panel {
  position: absolute;
  top: 92rpx;
  left: 50%;
  width: 380rpx;
  padding: 12rpx;
  box-sizing: border-box;
  border: 1rpx solid rgba(255, 255, 255, 0.96);
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 24rpx 70rpx rgba(32, 29, 39, 0.14);
  transform: translateX(-50%);
  animation: panel-in 0.22s cubic-bezier(0.22, 1.2, 0.36, 1);
}

@keyframes panel-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-12rpx) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0) scale(1);
  }
}

.mode-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 22rpx;
  border-radius: 20rpx;
}

.mode-option.selected {
  background: #f4f1f9;
}

.mode-option:active {
  background: #efedf3;
}

.mode-texts {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.mode-label {
  font-size: var(--font-body);
  font-weight: 700;
}

.mode-desc {
  color: #9a969f;
  font-size: var(--font-caption);
}

.mode-check {
  color: #9b7cff;
  font-size: 28rpx;
  font-weight: 700;
}

.mode-mask {
  position: fixed;
  z-index: 51;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
</style>

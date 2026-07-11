<template>
  <view class="esc" aria-label="快速离开到伪装页面" hover-class="esc-pressed" @tap.stop="go">
    <text class="esc-icon">↗</text>
    <text class="esc-label">离开</text>
  </view>
</template>

<script>
export default {
  name: 'escape-btn',
  methods: {
    go() {
      // 无论是否开启伪装模式,立即切到无害的记账页
      uni.reLaunch({ url: '/pages/disguise/disguise?from=escape' })
    }
  }
}
</script>

<style scoped>
.esc {
  position: fixed;
  z-index: 200;
  right: 34rpx;
  bottom: calc(env(safe-area-inset-bottom) + 280rpx);
  display: flex;
  width: 100rpx;
  height: 100rpx;
  box-sizing: border-box;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2rpx solid rgba(125, 71, 207, 0.2);
  border-radius: 50%;
  background: rgba(246, 240, 255, 0.94);
  box-shadow: 0 16rpx 46rpx rgba(84, 45, 150, 0.16);
  color: #7d47cf;
  text-align: center;
  transition: transform 0.16s ease-out, box-shadow 0.16s ease-out;
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
}

.esc-icon {
  font-family: Georgia, serif;
  font-size: 31rpx;
  line-height: 1;
}

.esc-label {
  margin-top: 3rpx;
  font-size: var(--font-caption);
  font-weight: 700;
  line-height: 1;
}

.esc-pressed,
.esc:active {
  box-shadow: 0 10rpx 30rpx rgba(84, 45, 150, 0.13);
  transform: scale(0.91);
}
</style>

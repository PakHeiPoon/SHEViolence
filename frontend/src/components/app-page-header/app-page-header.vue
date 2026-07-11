<template>
  <view class="page-header">
    <view class="header-button back" aria-label="返回" @tap="back">‹</view>
    <text class="header-title">{{ title }}</text>
    <view class="header-side"><slot></slot></view>
  </view>
</template>

<script>
export default {
  name: 'app-page-header',
  props: {
    title: { type: String, required: true }
  },
  methods: {
    back() {
      uni.navigateBack({ delta: 1 })
    }
  }
}
</script>

<style scoped>
.page-header {
  position: relative;
  display: flex;
  height: calc(var(--status-bar-height) + 104rpx);
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 28rpx 18rpx;
  box-sizing: border-box;
  background: #FBFCFC;
}

.header-button,
.header-side {
  display: flex;
  width: 72rpx;
  height: 72rpx;
  align-items: center;
  justify-content: center;
}

.header-button {
  padding-bottom: 8rpx;
  box-sizing: border-box;
  border: 1rpx solid #FFFFFF;
  border-radius: 50%;
  background: #FDFDFD;
  box-shadow: 0 12rpx 36rpx rgba(32, 29, 39, 0.08);
  font-family: Georgia, serif;
  font-size: 58rpx;
}

.header-title {
  position: absolute;
  bottom: 34rpx;
  left: 50%;
  transform: translateX(-50%);
  font-family: "Songti SC", "STSong", serif;
  font-size: var(--font-nav);
  font-weight: 700;
  white-space: nowrap;
}
</style>

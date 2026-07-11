<script>
import config from './services/config.js'

export default {
  onLaunch() {
    // 云开发初始化（仅微信小程序端；traceUser 关闭，贯彻匿名原则）
    // #ifdef MP-WEIXIN
    if (config.cloudEnv && wx.cloud) {
      wx.cloud.init({ env: config.cloudEnv, traceUser: false })
    }
    // 截图监听：无法阻止截图，只能事后温和提醒（平台限制）
    if (wx.onUserCaptureScreen) {
      wx.onUserCaptureScreen(() => {
        uni.showToast({ title: '提醒：截图会留在相册中，注意及时清理', icon: 'none', duration: 2500 })
      })
    }
    // #endif
  }
}
</script>

<style>
page {
  /* 字号分级：小字端（micro~body）保持紧凑，标题端逐级拉开，保证大小字对比明显 */
  --font-micro: 20rpx;
  --font-caption: 22rpx;
  --font-meta: 24rpx;
  --font-body: 28rpx;
  --font-section: 34rpx;
  --font-nav: 38rpx;
  --font-feature: 46rpx;
  --font-intro: 56rpx;
  --font-display: 66rpx;
  --font-display-lg: 76rpx;
  --font-date: 84rpx;
  --font-emergency: 104rpx;
  background: #FBFCFC;
  font-size: var(--font-body);
  color: #19171c;
  font-family: "Avenir Next", "PingFang SC", sans-serif;
}
.page {
  min-height: 100vh;
  box-sizing: border-box;
}
.card {
  background: #fff;
  border: 1rpx solid rgba(25, 23, 28, 0.06);
  border-radius: 24rpx;
  padding: 26rpx;
  margin: 20rpx;
  box-shadow: 0 12rpx 36rpx rgba(35, 31, 45, 0.045);
}
.btn {
  background: #1c191f;
  color: #fff;
  border-radius: 44rpx;
  text-align: center;
  padding: 22rpx 0;
  font-size: var(--font-body);
  font-weight: 700;
}
.btn-warn {
  background: #D64541;
}
.btn-plain {
  background: #fff;
  color: #1c191f;
  border: 1rpx solid rgba(28, 25, 31, 0.16);
}
.muted {
  color: #96929b;
  font-size: var(--font-meta);
}
.section-title {
  font-size: var(--font-section);
  font-weight: 700;
  margin: 30rpx 20rpx 10rpx;
  display: block;
}
</style>

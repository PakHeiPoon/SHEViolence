<template>
  <view class="sos-page">
    <scroll-view class="page-scroll" scroll-y :show-scrollbar="false">
      <view class="top-controls">
        <view class="soft-pill">安全求助</view>
      </view>

      <view class="title-block">
        <text class="page-title">一键求助</text>
        <text class="page-subtitle">如果危险正在发生，先报警，再处理其他事情</text>
      </view>

      <view class="emergency-card" @tap="call('110')">
        <view class="emergency-top">
          <view class="phone-icon-window">
            <text class="emoji-icon emergency-emoji">🚨</text>
          </view>
          <view class="danger-status"><text class="status-emoji">🔴</text><text>人身安全受到威胁</text></view>
        </view>
        <text class="emergency-label">立即报警</text>
        <text class="emergency-number">110</text>
        <view class="emergency-action">
          <text>拨打 110</text>
          <text>→</text>
        </view>
        <text class="silent-tip">无法说话时，接通后尽量保持通话，并通过敲击或环境声音传递危险信号</text>
      </view>

      <text class="section-title-local">其他立即行动</text>
      <view class="quick-grid">
        <view class="quick-action medical" @tap="call('120')">
          <view class="quick-icon emoji-icon">🚑</view>
          <view><text class="quick-title">医疗急救</text></view>
          <text class="quick-value">120</text>
        </view>
        <view class="quick-action rights" @tap="call('12338')">
          <view class="quick-icon emoji-icon">🛡️</view>
          <view><text class="quick-title">妇女维权</text></view>
          <text class="quick-value">12338</text>
        </view>
        <view class="quick-action location" @tap="getLocation">
          <view class="quick-icon emoji-icon">📍</view>
          <view><text class="quick-title">最近辅助中心</text></view>
          <text class="quick-value arrow">↗</text>
        </view>
      </view>

      <view class="report-guide">
        <view class="guide-head">
          <view class="guide-icon emoji-icon">🗣️</view>
          <text>报警时先说这三件事</text>
        </view>
        <view class="guide-line"><text>1</text><text>我在什么位置</text></view>
        <view class="guide-line"><text>2</text><text>谁正在对我实施暴力</text></view>
        <view class="guide-line"><text>3</text><text>是否受伤、被限制自由或对方持有器具</text></view>
        <view class="quote">“我在（地址），正在遭受家庭暴力，请立即出警。”</view>
      </view>

      <text class="section-title-local">更多支持</text>
      <view class="more-group">
        <view class="more-row" @tap="nav('/pages/risk/risk')">
          <view class="more-icon emoji-icon">🔍</view>
          <view class="more-copy"><text>安全自查</text></view>
          <text class="more-link-arrow">›</text>
        </view>
        <view class="more-row" @tap="nav('/pages/knowledge/knowledge')">
          <view class="more-icon emoji-icon">📖</view>
          <view class="more-copy"><text>安全知识</text></view>
          <text class="more-link-arrow">›</text>
        </view>
        <view class="more-row" @tap="call('12320')">
          <view class="more-icon emoji-icon">💬</view>
          <view class="more-copy"><text>12320 心理援助</text></view>
          <text class="more-action">拨打</text>
        </view>
        <view class="more-row" @tap="showOrgs = !showOrgs">
          <view class="more-icon emoji-icon">🏛️</view>
          <view class="more-copy"><text>附近支持机构</text></view>
          <text class="more-arrow" :class="{ open: showOrgs }">›</text>
        </view>
      </view>

      <view v-if="showOrgs" class="org-list">
        <view class="org-row" v-for="org in orgs" :key="org.name">
          <view class="org-copy"><text>{{ org.name }}</text><text>{{ org.addr }}</text></view>
          <view class="org-actions">
            <view class="emoji-icon" @tap="call(org.tel)">📞</view>
            <view class="emoji-icon" @tap="openMap(org)">🧭</view>
          </view>
        </view>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>
    <app-dock active="sos" />
  </view>
</template>

<script>
import appDock from '../../components/app-dock/app-dock.vue'

const MOCK_ORGS = [
  { name: '市妇联权益部', addr: '市政府大院3号楼201', tel: '0571-12345678', lat: 30.25, lng: 120.15 },
  { name: '区人民法院立案庭', addr: '区法院一楼立案大厅', tel: '0571-87654321', lat: 30.26, lng: 120.16 },
  { name: '区救助管理站', addr: '幸福路120号', tel: '0571-11223344', lat: 30.24, lng: 120.14 }
]

export default {
  components: { appDock },
  data() {
    return { orgs: MOCK_ORGS, showOrgs: false }
  },
  methods: {
    nav(url) { uni.navigateTo({ url }) },
    call(tel) { uni.makePhoneCall({ phoneNumber: tel }) },
    getLocation() {
      uni.getLocation({
        type: 'gcj02',
        success: pos => uni.openLocation({ latitude: pos.latitude, longitude: pos.longitude, name: '我的当前位置' }),
        fail: () => uni.showToast({ title: '请允许获取位置', icon: 'none' })
      })
    },
    openMap(org) {
      uni.openLocation({ latitude: org.lat, longitude: org.lng, name: org.name, address: org.addr })
    }
  }
}
</script>

<style scoped>
.sos-page { height: 100vh; overflow: hidden; background: #FBFCFC; color: #19171c; }
.emoji-icon, .status-emoji { font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif; font-weight: 400; }
.page-scroll { height: 100%; }
.top-controls { display: flex; justify-content: space-between; padding: calc(var(--status-bar-height) + 28rpx) 36rpx 0; }
.soft-pill { display: flex; height: 72rpx; align-items: center; padding: 0 28rpx; box-sizing: border-box; border: 1rpx solid #FFFFFF; border-radius: 40rpx; background: #FDFDFD; box-shadow: 0 16rpx 46rpx rgba(31,28,37,.08); font-size: var(--font-body); font-weight: 700; }
.title-block { padding: 62rpx 40rpx 38rpx; }
.page-title, .page-subtitle { display: block; }
.page-title { font-family: "Songti SC", "STSong", serif; font-size: var(--font-display); font-weight: 700; line-height: 1.05; }
.page-subtitle { margin-top: 10rpx; color: #96929b; font-size: var(--font-meta); }
.emergency-card { margin: 0 36rpx; padding: 30rpx; border-radius: 30rpx; background: #f9e6e5; box-shadow: 0 12rpx 40rpx rgba(31, 28, 37, 0.07); }
.emergency-top { display: flex; align-items: center; justify-content: space-between; }
.phone-icon-window { display: flex; width: 72rpx; height: 72rpx; align-items: center; justify-content: center; border-radius: 50%; background: rgba(255,255,255,.78); }
.emergency-emoji { font-size: 35rpx; line-height: 1; }
.danger-status { display: flex; align-items: center; gap: 9rpx; padding: 9rpx 14rpx; border-radius: 22rpx; background: rgba(255,255,255,.64); color: #5B3AA4; font-size: var(--font-caption); }
.status-emoji { font-size: 13rpx; line-height: 1; }
.emergency-label { display: block; margin-top: 28rpx; font-size: var(--font-body); font-weight: 700; }
.emergency-number { display: block; margin-top: 2rpx; font-family: "Avenir Next", sans-serif; font-size: var(--font-emergency); font-weight: 700; line-height: 1.15; }
.emergency-action { display: flex; height: 84rpx; align-items: center; justify-content: space-between; margin-top: 20rpx; padding: 0 28rpx; border-radius: 44rpx; background: #1d1a20; color: #fff; font-size: var(--font-body); font-weight: 700; }
.emergency-action text:last-child { font-size: 34rpx; }
.silent-tip { display: block; margin-top: 18rpx; color: #5B3AA4; font-size: var(--font-meta); line-height: 1.55; }
.section-title-local { display: block; margin: 58rpx 40rpx 18rpx; font-size: calc(var(--font-section) - 8rpx); font-weight: 700; }
.quick-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14rpx; padding: 0 36rpx; }
.quick-action { display: flex; flex-direction: column; align-items: center; gap: 12rpx; padding: 24rpx 12rpx 20rpx; box-sizing: border-box; border-radius: 26rpx; box-shadow: 0 12rpx 40rpx rgba(31, 28, 37, 0.07); text-align: center; }
.quick-action.medical { background: #eef4f0; }
.quick-action.rights { background: #fff0e3; }
.quick-action.location { background: #eeebff; }
.quick-icon { display: flex; width: 54rpx; height: 54rpx; align-items: center; justify-content: center; border-radius: 50%; background: rgba(255,255,255,.76); font-size: 27rpx; }
.quick-title { display: block; }
.quick-title { font-size: var(--font-caption); font-weight: 700; }
.quick-value { font-size: var(--font-caption); font-weight: 700; }
.quick-value.arrow { font-size: 26rpx; line-height: 1; }
.report-guide { margin: 48rpx 36rpx 0; padding: 28rpx; border-radius: 28rpx; background: #f3f1ff; box-shadow: 0 12rpx 40rpx rgba(31, 28, 37, 0.07); }
.guide-head { display: flex; align-items: center; gap: 14rpx; font-size: calc(var(--font-section) - 6rpx); font-weight: 700; }
.guide-icon { display: flex; width: 44rpx; height: 44rpx; align-items: center; justify-content: center; border-radius: 50%; background: #d7ccff; font-size: 22rpx; }
.guide-line { display: flex; align-items: center; gap: 14rpx; margin-top: 17rpx; color: #625d6b; font-size: calc(var(--font-body) - 6rpx); }
.guide-line text:first-child { display: flex; width: 34rpx; height: 34rpx; flex: 0 0 34rpx; align-items: center; justify-content: center; border-radius: 50%; background: #fff; color: #745fc1; font-size: var(--font-micro); }
.quote { margin-top: 22rpx; padding-top: 20rpx; border-top: 1rpx solid rgba(93,80,135,.13); font-family: "Songti SC", "STSong", serif; font-size: calc(var(--font-body) - 6rpx); font-weight: 700; line-height: 1.55; }
.more-group { margin: 0 36rpx; border: 1rpx solid #e8e6ea; border-radius: 26rpx; overflow: hidden; box-shadow: 0 12rpx 40rpx rgba(31, 28, 37, 0.07); }
.more-row { display: flex; min-height: 96rpx; align-items: center; gap: 16rpx; padding: 16rpx 22rpx; box-sizing: border-box; border-bottom: 1rpx solid #e8e6ea; }
.more-row:last-child { border-bottom: 0; }
.more-icon { display: flex; width: 48rpx; height: 48rpx; flex: 0 0 48rpx; align-items: center; justify-content: center; border-radius: 50%; background: #f1eff3; font-size: 22rpx; }
.more-copy { min-width: 0; flex: 1; }
.more-copy text { display: block; }
.more-copy text:first-child { font-size: var(--font-caption); font-weight: 700; }
.more-action { color: #745fc1; font-size: var(--font-meta); font-weight: 700; }
.more-link-arrow { color: #77727c; font-family: Georgia, serif; font-size: 38rpx; }
.more-arrow { font-family: Georgia, serif; font-size: 38rpx; transform: rotate(90deg); transition: transform .2s ease; }
.more-arrow.open { transform: rotate(-90deg); }
.org-list { margin: 16rpx 36rpx 0; border: 1rpx solid #e8e6ea; border-radius: 24rpx; overflow: hidden; box-shadow: 0 12rpx 40rpx rgba(31, 28, 37, 0.07); }
.org-row { display: flex; min-height: 92rpx; align-items: center; gap: 14rpx; padding: 16rpx 20rpx; border-bottom: 1rpx solid #e8e6ea; }
.org-row:last-child { border-bottom: 0; }
.org-copy { min-width: 0; flex: 1; }
.org-copy text { display: block; }
.org-copy text:first-child { font-size: var(--font-body); font-weight: 700; }
.org-copy text:last-child { margin-top: 4rpx; color: #96929b; font-size: var(--font-meta); }
.org-actions { display: flex; gap: 8rpx; }
.org-actions view { display: flex; width: 48rpx; height: 48rpx; align-items: center; justify-content: center; border-radius: 50%; background: #f1eff3; color: rgba(25,23,28,.72); font-size: 19rpx; }
.bottom-space { height: 190rpx; }
</style>

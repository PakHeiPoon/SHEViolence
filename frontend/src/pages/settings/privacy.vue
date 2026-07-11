<template>
  <view class="privacy-page">
    <app-page-header title="隐私设置" />
    <scroll-view class="privacy-scroll" scroll-y :show-scrollbar="false">
      <view class="intro">
        <text class="intro-title">让入口更隐蔽</text>
        <text class="intro-note">伪装模式会在启动时先显示普通记账页面</text>
      </view>

      <view class="setting-group">
        <view class="setting-row">
          <view class="setting-copy"><text class="setting-title">伪装模式</text><text class="setting-note">打开小程序时先显示记账本</text></view>
          <switch :checked="on" @change="toggle" color="#9B7CFF" />
        </view>
      </view>

      <view class="password-panel" v-if="on">
        <text class="panel-title">解锁密码</text>
        <text class="panel-note">在记账页金额栏输入 4–8 位数字，即可进入真实界面</text>
        <view class="password-row">
          <input class="password-input" type="digit" v-model="pwd" placeholder="输入新密码" />
          <view class="save-button" @tap="savePwd">保存</view>
        </view>
        <text class="current-password">当前密码：{{ curPwd }}</text>
      </view>

      <text class="section-title-local">使用须知</text>
      <view class="notice-group">
        <view class="notice-row"><text class="notice-index">1</text><text>小程序仍可能出现在微信“最近使用”列表中，必要时请手动删除记录。</text></view>
        <view class="notice-row"><text class="notice-index">2</text><text>快速离开会立即切换到记账页面，不显示任何提醒。</text></view>
        <view class="notice-row"><text class="notice-index">3</text><text>请只在自己能安全使用的设备上保存会话和证据。</text></view>
      </view>

      <view class="preview-button" v-if="on" @tap="preview">预览伪装页面 <text>→</text></view>
      <view class="bottom-space"></view>
    </scroll-view>
    <app-dock active="settings" />
  </view>
</template>

<script>
import { get, set, KEYS, getPwd } from '../../common/store.js'
import appPageHeader from '../../components/app-page-header/app-page-header.vue'
import appDock from '../../components/app-dock/app-dock.vue'

export default {
  components: { appPageHeader, appDock },
  data() { return { on: false, pwd: '', curPwd: '' } },
  onShow() {
    this.on = get(KEYS.DISGUISE_ON, false)
    this.curPwd = getPwd()
  },
  methods: {
    toggle(e) {
      this.on = e.detail.value
      set(KEYS.DISGUISE_ON, this.on)
      if (this.on) {
        uni.showModal({
          title: '伪装模式已开启',
          content: `下次打开将显示记账本。在金额栏输入「${getPwd()}」即可进入真实界面。`,
          showCancel: false
        })
      }
    },
    savePwd() {
      const p = this.pwd.trim()
      if (!/^\d{4,8}$/.test(p)) return uni.showToast({ title: '请输入4-8位数字', icon: 'none' })
      set(KEYS.DISGUISE_PWD, p)
      this.curPwd = p
      this.pwd = ''
      uni.showToast({ title: '已保存', icon: 'success' })
    },
    preview() { uni.reLaunch({ url: '/pages/disguise/disguise' }) }
  }
}
</script>

<style scoped>
.privacy-page { height: 100vh; overflow: hidden; background: #FBFCFC; }
.privacy-scroll { height: calc(100vh - var(--status-bar-height) - 104rpx); box-sizing: border-box; padding: 0 36rpx; }
.intro { padding: 46rpx 4rpx 30rpx; }
.intro-title, .intro-note { display: block; }
.intro-title { font-family: "Songti SC", "STSong", serif; font-size: var(--font-intro); font-weight: 700; }
.intro-note { margin-top: 10rpx; color: #96929b; font-size: var(--font-meta); }
.setting-group, .notice-group { border: 1rpx solid #e8e6ea; border-radius: 28rpx; overflow: hidden; }
.setting-row { display: flex; min-height: 112rpx; align-items: center; justify-content: space-between; padding: 0 24rpx; }
.setting-title, .setting-note { display: block; }
.setting-title { font-size: var(--font-body); font-weight: 700; }
.setting-note { margin-top: 7rpx; color: #96929b; font-size: var(--font-meta); }
.password-panel { margin-top: 24rpx; padding: 28rpx; border-radius: 28rpx; background: #eeeaff; }
.panel-title, .panel-note, .current-password { display: block; }
.panel-title { font-size: var(--font-section); font-weight: 700; }
.panel-note { margin-top: 8rpx; color: #716c77; font-size: var(--font-meta); line-height: 1.5; }
.password-row { display: flex; gap: 12rpx; margin-top: 24rpx; }
.password-input { min-width: 0; height: 76rpx; flex: 1; padding: 0 22rpx; border-radius: 40rpx; background: #fff; font-size: var(--font-body); }
.save-button { display: flex; height: 76rpx; align-items: center; padding: 0 26rpx; border-radius: 40rpx; background: #1d1a20; color: #fff; font-size: var(--font-body); font-weight: 700; }
.current-password { margin-top: 16rpx; color: #77727c; font-size: var(--font-meta); }
.section-title-local { display: block; margin: 40rpx 4rpx 16rpx; font-size: var(--font-section); font-weight: 700; }
.notice-row { display: flex; gap: 18rpx; padding: 24rpx; border-bottom: 1rpx solid #e8e6ea; color: #625e67; font-size: var(--font-body); line-height: 1.55; }
.notice-row:last-child { border-bottom: 0; }
.notice-index { display: flex; width: 42rpx; height: 42rpx; flex: 0 0 42rpx; align-items: center; justify-content: center; border-radius: 50%; background: #f1eff3; color: #77727c; font-size: var(--font-caption); }
.preview-button { display: flex; height: 86rpx; align-items: center; justify-content: center; gap: 18rpx; margin-top: 28rpx; border-radius: 44rpx; background: #1d1a20; color: #fff; font-size: var(--font-body); font-weight: 700; }
.bottom-space { height: 190rpx; }
</style>

<template>
  <view class="settings-page">
    <scroll-view class="page-scroll" scroll-y :show-scrollbar="false">
      <view class="profile-hero">
        <view class="hero-avatar-ring" @tap="reroll">
          <image class="hero-avatar" src="/static/icons/profile-avatar.png" mode="aspectFill" />
        </view>
        <view class="hero-copy">
          <text class="hero-nick">{{ nick }}</text>
          <view class="hero-edit" @tap="reroll">
            <text class="hero-edit-icon">✎</text>
            <text>更换匿名身份</text>
          </view>
        </view>
      </view>

      <view class="section-head">
        <text>可信联系人</text>
        <text>{{ contacts.length }}/3</text>
      </view>
      <view class="contact-section">
        <template v-if="contacts.length">
          <view class="contact-row" v-for="contact in contacts" :key="contact.id">
            <view class="contact-avatar">{{ contact.name.slice(0, 1) }}</view>
            <view class="contact-copy"><text>{{ contact.name }}</text><text>{{ contact.tel }}</text></view>
            <text class="contact-remove" @tap="remove(contact)">删除</text>
          </view>
        </template>
        <view v-else class="contact-empty">尚未添加，联系人会显示在一键求助页</view>
        <view v-if="contacts.length < 3" class="contact-form">
          <input v-model="contactName" class="contact-input" placeholder="姓名或称呼" />
          <input v-model="contactTel" class="contact-input" type="number" placeholder="电话号码" />
          <view class="contact-add" @tap="saveContact">添加联系人</view>
        </view>
        <view v-else class="contact-limit">已添加 3 位联系人，可删除后重新设置</view>
      </view>

      <text class="section-title-local">隐私与数据</text>
      <view class="menu-group">
        <view class="menu-row" @tap="nav('/pages/settings/privacy')">
          <text class="row-icon tint-blue">🛡️</text>
          <view class="row-copy"><text class="row-label">隐私与伪装</text></view>
          <text class="row-arrow">›</text>
        </view>
        <view class="menu-row" @tap="clearLocal">
          <text class="row-icon tint-red">🗑️</text>
          <view class="row-copy"><text class="row-label">清除本地数据</text></view>
          <text class="row-arrow">›</text>
        </view>
      </view>

      <text class="section-title-local">帮助与支持</text>
      <view class="menu-group help-group">
        <view class="menu-row" @tap="showSafetyGuide">
          <text class="row-icon line">◎</text>
          <view class="row-copy"><text class="row-label">安全使用指南</text></view>
          <text class="row-arrow">›</text>
        </view>
        <view class="menu-row" @tap="showFaq">
          <text class="row-icon line">?</text>
          <view class="row-copy"><text class="row-label">常见问题</text></view>
          <text class="row-arrow">›</text>
        </view>
        <view class="menu-row" @tap="saveFeedback">
          <text class="row-icon line">✎</text>
          <view class="row-copy"><text class="row-label">反馈建议</text></view>
          <text class="row-arrow">›</text>
        </view>
        <view class="menu-row" @tap="showAbout">
          <text class="row-icon line">i</text>
          <view class="row-copy"><text class="row-label">关于暖芽</text></view>
          <text class="row-arrow">›</text>
        </view>
      </view>

      <view class="app-footer">
        <text class="footer-title">每个人都值得安全地生活</text>
        <text class="footer-note">暖芽提供本地安全工具与基础信息支持</text>
        <view class="footer-tags">
          <text>匿名使用</text>
          <text>本地保存</text>
          <text>不替代专业服务</text>
        </view>
        <text class="footer-emergency">紧急危险请立即拨打 110</text>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>

    <app-dock active="settings" />
  </view>
</template>

<script>
import { getNick, resetNick, getContacts, addContact, removeContact } from '../../common/store.js'
import appDock from '../../components/app-dock/app-dock.vue'

export default {
  components: { appDock },
  data() {
    return { nick: '', contacts: [], contactName: '', contactTel: '' }
  },
  onShow() {
    this.nick = getNick()
    this.contacts = getContacts()
  },
  methods: {
    nav(url) { uni.navigateTo({ url }) },
    reroll() { this.nick = resetNick() },
    saveContact() {
      const name = this.contactName.trim()
      const tel = this.contactTel.trim()
      if (!name || !tel) return uni.showToast({ title: '请填写姓名和电话', icon: 'none' })
      if (!/^\d{3,20}$/.test(tel)) return uni.showToast({ title: '请输入有效电话号码', icon: 'none' })
      if (!addContact({ name, tel })) return uni.showToast({ title: '最多添加 3 位', icon: 'none' })
      this.contacts = getContacts()
      this.contactName = ''
      this.contactTel = ''
      uni.showToast({ title: '已添加', icon: 'success' })
    },
    remove(contact) {
      uni.showModal({
        title: '删除联系人',
        content: `确认删除“${contact.name}”？`,
        confirmColor: '#5B3AA4',
        success: res => {
          if (!res.confirm) return
          removeContact(contact.id)
          this.contacts = getContacts()
        }
      })
    },
    showSafetyGuide() {
      uni.showModal({
        title: '安全使用指南',
        content: '危险正在发生时，优先拨打 110。\n\n只在安全设备上保存会话和证据。必要时开启伪装模式，并及时清理最近使用记录。',
        showCancel: false
      })
    },
    showFaq() {
      uni.showModal({
        title: '常见问题',
        content: '数据保存在哪里？\n默认保存在当前设备。\n\n暖芽能代替报警、律师或医生吗？\n不能，暖芽只提供基础信息与本地工具。\n\n快速离开会做什么？\n立即切换到伪装页面。',
        showCancel: false
      })
    },
    saveFeedback() {
      uni.showModal({
        title: '反馈建议',
        content: '请勿填写真实姓名、电话或详细地址。内容仅保存在本机。',
        editable: true,
        placeholderText: '写下你的建议',
        confirmText: '保存',
        success: res => {
          if (!res.confirm) return
          const content = (res.content || '').trim()
          if (!content) return uni.showToast({ title: '请填写反馈内容', icon: 'none' })
          const saved = uni.getStorageSync('local_feedback')
          const feedback = Array.isArray(saved) ? saved : []
          uni.setStorageSync('local_feedback', [{ content, time: Date.now() }, ...feedback].slice(0, 10))
          uni.showToast({ title: '已保存在本机', icon: 'success' })
        }
      })
    },
    showAbout() {
      uni.showModal({
        title: '关于暖芽',
        content: '暖芽提供安全信息整理与本地演示支持，不替代公安、法院、医疗、律师或心理专业服务。紧急危险请立即拨打 110。',
        showCancel: false
      })
    },
    clearLocal() {
      uni.showModal({
        title: '清除本地数据',
        content: '将清除本机保存的会话、证据、联系人和自查记录。伪装设置将保留。确定清除？',
        confirmColor: '#5B3AA4',
        success: r => {
          if (r.confirm) {
            const on = uni.getStorageSync('disguise_on')
            const pwd = uni.getStorageSync('disguise_pwd')
            uni.clearStorageSync()
            if (on !== '') uni.setStorageSync('disguise_on', on)
            if (pwd !== '') uni.setStorageSync('disguise_pwd', pwd)
            uni.showToast({ title: '已清除', icon: 'success' })
            this.nick = getNick()
            this.contacts = []
            setTimeout(() => uni.reLaunch({ url: '/pages/disguise/disguise?from=escape' }), 500)
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.settings-page { height: 100vh; overflow: hidden; background: #FBFCFC; }
.page-scroll { height: 100%; }
.profile-hero { display: flex; align-items: center; gap: 30rpx; padding: calc(var(--status-bar-height) + 148rpx) 40rpx 18rpx; }
.hero-avatar-ring { position: relative; display: flex; width: 216rpx; height: 216rpx; align-items: center; justify-content: center; border-radius: 50%; background: conic-gradient(#7c5cf0 0 68%, #ece9f2 68% 100%); }
.hero-avatar { width: 188rpx; height: 188rpx; border: 8rpx solid #fdfdfd; border-radius: 50%; box-sizing: border-box; background: #cabcf5; }
.hero-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; align-items: flex-start; }
.hero-nick { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: var(--font-feature); font-weight: 700; }
.hero-edit { display: flex; align-items: center; gap: 8rpx; margin-top: 16rpx; padding: 13rpx 26rpx; border-radius: 32rpx; background: #f1eff3; color: #444049; font-size: calc(var(--font-meta) - 2rpx); font-weight: 700; }
.hero-edit:active { transform: scale(0.96); }
.hero-edit-icon { font-size: 20rpx; }
.section-title-local { display: block; margin: 44rpx 40rpx 14rpx; font-size: calc(var(--font-section) - 8rpx); font-weight: 700; }
.section-head { display: flex; align-items: center; justify-content: space-between; margin: 44rpx 40rpx 14rpx; font-size: calc(var(--font-section) - 8rpx); font-weight: 700; }
.section-head text:last-child { color: #96929b; font-size: var(--font-caption); font-weight: 400; }
.menu-group { margin: 0 36rpx 44rpx; border-radius: 32rpx; overflow: hidden; background: #fff; box-shadow: 0 12rpx 40rpx rgba(31, 28, 37, 0.07); }
.menu-row { display: flex; min-height: 88rpx; align-items: center; padding: 12rpx 26rpx; box-sizing: border-box; border-bottom: 1rpx solid #f2f0f3; }
.menu-row:last-child { border-bottom: 0; }
.row-icon { display: flex; width: 64rpx; height: 64rpx; flex: 0 0 64rpx; align-items: center; justify-content: center; margin-right: 18rpx; border-radius: 20rpx; font-size: 32rpx; }
.tint-purple { background: #efe9ff; }
.tint-blue { background: #e3f0fd; }
.tint-red { background: #fdeae8; }
.tint-amber { background: #fdf3df; }
.tint-green { background: #e2f4e8; }
.row-icon.line { background: none; color: #19171c; font-family: "PingFang SC", "Heiti SC", sans-serif; font-size: 34rpx; font-weight: 400; }
.help-group { border: 1rpx solid #e3e1e5; background: none; box-shadow: none; }
.help-group .menu-row { border-bottom-color: #e9e7eb; }
.help-group .row-label { font-family: "PingFang SC", "Heiti SC", "Microsoft YaHei", sans-serif; }
.row-copy { min-width: 0; flex: 1; }
.row-label { display: block; color: #19171c; font-size: var(--font-caption); font-weight: 700; }
.row-action { color: #745fc1; font-size: var(--font-meta); font-weight: 700; }
.row-arrow { color: rgba(25,23,28,.7); font-family: Georgia, serif; font-size: 42rpx; }
.contact-section { margin: 0 36rpx 44rpx; border-radius: 32rpx; overflow: hidden; background: #fff; box-shadow: 0 12rpx 40rpx rgba(31, 28, 37, 0.07); }
.contact-row { display: flex; min-height: 80rpx; align-items: center; gap: 14rpx; padding: 10rpx 26rpx; }
.contact-row + .contact-row { border-top: 1rpx solid #f2f0f3; }
.contact-avatar { display: flex; width: 50rpx; height: 50rpx; flex: 0 0 50rpx; align-items: center; justify-content: center; border-radius: 50%; background: #e2f4e8; color: #3f7d55; font-size: var(--font-caption); font-weight: 700; }
.contact-copy { min-width: 0; flex: 1; }
.contact-copy text { display: block; }
.contact-copy text:first-child { font-size: calc(var(--font-body) - 7rpx); font-weight: 700; }
.contact-copy text:last-child { margin-top: 4rpx; color: #96929b; font-size: calc(var(--font-meta) - 7rpx); }
.contact-remove { color: #5B3AA4; font-size: calc(var(--font-meta) - 7rpx); font-weight: 700; }
.contact-empty { padding: 24rpx 24rpx 12rpx; color: #96929b; text-align: center; font-size: calc(var(--font-meta) - 7rpx); }
.contact-form { display: grid; gap: 12rpx; padding: 18rpx 22rpx 22rpx; border-top: 1rpx solid #f2f0f3; }
.contact-input { height: 72rpx; padding: 0 22rpx; box-sizing: border-box; border-radius: 38rpx; background: #f4f3f5; font-size: calc(var(--font-body) - 7rpx); }
.contact-add { display: flex; height: 74rpx; align-items: center; justify-content: center; border-radius: 38rpx; background: #1d1a20; color: #fff; font-size: calc(var(--font-body) - 7rpx); font-weight: 700; }
.contact-limit { padding: 20rpx 24rpx; border-top: 1rpx solid #f2f0f3; color: #96929b; text-align: center; font-size: calc(var(--font-caption) - 7rpx); }
.app-footer { display: flex; margin: 58rpx 44rpx 0; flex-direction: column; align-items: center; text-align: center; }
.footer-title { font-family: "Songti SC", "STSong", serif; font-size: var(--font-nav); font-weight: 700; }
.footer-note { margin-top: 14rpx; color: #77727c; font-size: var(--font-meta); line-height: 1.5; }
.footer-tags { display: flex; flex-wrap: wrap; justify-content: center; gap: 10rpx; margin-top: 24rpx; }
.footer-tags text { padding: 9rpx 15rpx; border-radius: 24rpx; background: #f2f1f3; color: #77727c; font-size: var(--font-caption); }
.footer-emergency { margin-top: 24rpx; color: #5B3AA4; font-size: var(--font-meta); font-weight: 700; }
.bottom-space { height: 190rpx; }
</style>

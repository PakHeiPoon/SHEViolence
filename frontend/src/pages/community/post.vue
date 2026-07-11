<template>
  <view class="editor-page">
    <app-page-header title="发布求助" />
    <scroll-view class="editor-scroll" scroll-y :show-scrollbar="false">
      <view class="intro">
        <text class="intro-title">你想获得什么帮助？</text>
        <text class="intro-note">请避免填写真实姓名、住址或工作单位</text>
      </view>

      <view class="privacy-tip">帖子将以匿名昵称展示，发布前可以随时修改内容。</view>

      <view class="editor-box">
        <textarea class="ta" v-model="content" placeholder="描述发生了什么，以及你希望得到怎样的帮助..." maxlength="1000" />
        <text class="counter">{{ content.length }}/1000</text>
      </view>

      <text class="field-title">选择求助类型</text>
      <view class="tags">
        <view class="chip" :class="{ on: tag === t }" v-for="t in tags" :key="t" @tap="tag = t">{{ t }}</view>
      </view>

      <view class="identity-row">
        <text>发布身份</text>
        <text class="identity">{{ nick }}</text>
      </view>

      <view class="publish-button" @tap="submit">确认发布 <text>↑</text></view>
      <view class="bottom-space"></view>
    </scroll-view>
    <app-dock active="community" />
  </view>
</template>

<script>
import { addPost, getNick, get, set, KEYS } from '../../common/store.js'
import appPageHeader from '../../components/app-page-header/app-page-header.vue'
import appDock from '../../components/app-dock/app-dock.vue'

export default {
  components: { appPageHeader, appDock },
  data() {
    return {
      content: '',
      tag: '法律咨询',
      tags: ['法律咨询', '心理支持', '庇护安置', '取证指导', '互助倾诉'],
      nick: ''
    }
  },
  onLoad() {
    this.nick = getNick()
    const prefill = get(KEYS.POST_PREFILL, '')
    if (prefill) {
      this.content = '（来自AI咨询）' + prefill
      set(KEYS.POST_PREFILL, '')
    }
  },
  methods: {
    submit() {
      if (!this.content.trim()) return uni.showToast({ title: '请输入内容', icon: 'none' })
      addPost({ content: this.content, tag: this.tag, nick: this.nick })
      uni.showToast({ title: '已发布', icon: 'success' })
      setTimeout(() => uni.navigateBack(), 600)
    }
  }
}
</script>

<style scoped>
.editor-page { height: 100vh; overflow: hidden; background: #FBFCFC; }
.editor-scroll { height: calc(100vh - var(--status-bar-height) - 104rpx); box-sizing: border-box; padding: 0 36rpx; }
.intro { padding: 46rpx 4rpx 28rpx; }
.intro-title, .intro-note { display: block; }
.intro-title { font-family: "Songti SC", "STSong", serif; font-size: var(--font-intro); font-weight: 700; }
.intro-note { margin-top: 10rpx; color: #96929b; font-size: var(--font-meta); }
.privacy-tip { padding: 22rpx 24rpx; border-radius: 22rpx; background: #f1edff; color: #625c6b; font-size: var(--font-meta); line-height: 1.5; }
.editor-box { position: relative; margin-top: 24rpx; padding: 26rpx; border: 2rpx dashed #e1dee4; border-radius: 26rpx; }
.ta { width: 100%; min-height: 300rpx; font-size: var(--font-body); line-height: 1.6; }
.counter { display: block; text-align: right; color: #aaa6ae; font-size: var(--font-caption); }
.field-title { display: block; margin: 36rpx 4rpx 18rpx; font-size: var(--font-section); font-weight: 700; }
.tags { display: flex; flex-wrap: wrap; gap: 12rpx; }
.chip { padding: 14rpx 24rpx; border-radius: 30rpx; background: #f2f1f3; color: #77727c; font-size: var(--font-meta); }
.chip.on { background: #1d1a20; color: #fff; }
.identity-row { display: flex; align-items: center; justify-content: space-between; margin-top: 34rpx; padding: 24rpx 4rpx; border-top: 1rpx solid #efedf1; border-bottom: 1rpx solid #efedf1; font-size: var(--font-meta); }
.identity { color: #77727c; }
.publish-button { display: flex; height: 88rpx; align-items: center; justify-content: center; gap: 18rpx; margin-top: 30rpx; border-radius: 46rpx; background: #1d1a20; color: #fff; font-size: var(--font-body); font-weight: 700; }
.publish-button text { font-size: 33rpx; }
.bottom-space { height: 190rpx; }
</style>

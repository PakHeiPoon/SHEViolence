<template>
  <view class="community-page">
    <scroll-view class="page-scroll" scroll-y :show-scrollbar="false">
      <view class="top-controls">
        <view class="identity-pill">匿名社区</view>
        <view class="publish-pill" @tap="post"><text>发布求助</text><text class="plus">＋</text></view>
      </view>

      <view class="title-row">
        <view>
          <text class="page-title">社群广场</text>
          <text class="page-subtitle">在这里，不需要独自面对</text>
        </view>
        <text class="post-count">{{ shown.length }} 条</text>
      </view>

      <scroll-view class="filter-scroll" scroll-x :show-scrollbar="false">
        <view class="filter-inner">
          <view class="chip" :class="{ on: tag === '' }" @tap="tag = ''">全部</view>
          <view class="chip" :class="{ on: tag === t }" v-for="t in tags" :key="t" @tap="tag = t">{{ t }}</view>
        </view>
      </scroll-view>

      <view class="feed">
        <view
          class="post-card"
          :class="'tone-' + (i % 3)"
          v-for="(p, i) in shown"
          :key="p.id"
          @tap="detail(p)"
        >
          <view class="post-top">
            <text class="tag">{{ p.tag }}</text>
            <text class="arrow">↗</text>
          </view>
          <view class="post-content">{{ p.content }}</view>
          <view class="post-foot">
            <text>{{ p.nick }}</text>
            <text>{{ p.likes || 0 }} 赞 · {{ p.replies.length }} 回复</text>
          </view>
          <view v-if="hasStaff(p)" class="staff-mark">工作人员已回复</view>
        </view>
      </view>

      <view v-if="!shown.length" class="empty-state">
        <text>暂时没有相关帖子</text>
        <text class="empty-note">你可以成为第一个发起求助的人</text>
      </view>
      <view class="bottom-space"></view>
    </scroll-view>

    <app-dock active="community" />
  </view>
</template>

<script>
import { getPosts } from '../../common/store.js'
import appDock from '../../components/app-dock/app-dock.vue'

export default {
  components: { appDock },
  data() {
    return {
      posts: [],
      tag: '',
      tags: ['法律咨询', '心理支持', '庇护安置', '取证指导', '互助倾诉']
    }
  },
  computed: {
    shown() {
      return this.tag ? this.posts.filter(p => p.tag === this.tag) : this.posts
    }
  },
  onShow() {
    this.posts = getPosts()
  },
  methods: {
    hasStaff(p) { return p.replies.some(r => r.staff) },
    detail(p) { uni.navigateTo({ url: '/pages/community/detail?id=' + p.id }) },
    post() { uni.navigateTo({ url: '/pages/community/post' }) }
  }
}
</script>

<style scoped>
.community-page { height: 100vh; overflow: hidden; background: #FBFCFC; }
.page-scroll { height: 100%; }
.top-controls { display: flex; justify-content: space-between; padding: calc(var(--status-bar-height) + 28rpx) 36rpx 0; }
.identity-pill, .publish-pill { display: flex; height: 76rpx; align-items: center; padding: 0 28rpx; box-sizing: border-box; border: 1rpx solid #FFFFFF; border-radius: 42rpx; background: #FDFDFD; box-shadow: 0 16rpx 46rpx rgba(31,28,37,.08); font-size: var(--font-body); font-weight: 700; }
.publish-pill { gap: 18rpx; }
.plus { font-size: 38rpx; font-weight: 300; }
.title-row { display: flex; align-items: flex-end; justify-content: space-between; padding: 72rpx 40rpx 28rpx; }
.page-title, .page-subtitle { display: block; }
.page-title { font-family: "Songti SC", "STSong", serif; font-size: var(--font-display-lg); font-weight: 700; }
.page-subtitle { margin-top: 10rpx; color: #96929b; font-size: var(--font-meta); }
.post-count { padding-bottom: 6rpx; color: #77727c; font-size: var(--font-meta); font-weight: 700; }
.filter-scroll { white-space: nowrap; }
.filter-inner { display: inline-flex; gap: 12rpx; padding: 12rpx 36rpx 26rpx; }
.chip { padding: 15rpx 25rpx; border-radius: 32rpx; background: #f3f2f4; color: #7b7680; font-size: var(--font-meta); }
.chip.on { background: #1d1a20; color: #fff; }
.feed { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18rpx; padding: 0 36rpx; }
.post-card { position: relative; min-height: 272rpx; padding: 26rpx; box-sizing: border-box; border-radius: 28rpx; overflow: hidden; }
.tone-0 { background: #eef0ff; }
.tone-1 { background: #eee8ff; }
.tone-2 { background: #f2f49b; }
.post-top { display: flex; align-items: center; justify-content: space-between; }
.tag { font-size: var(--font-caption); font-weight: 700; letter-spacing: 0; }
.arrow { font-size: 30rpx; }
.post-content { display: -webkit-box; margin-top: 26rpx; overflow: hidden; font-family: "Songti SC", "STSong", serif; font-size: var(--font-body); font-weight: 700; line-height: 1.5; -webkit-box-orient: vertical; -webkit-line-clamp: 4; }
.post-foot { display: flex; justify-content: space-between; margin-top: 24rpx; color: rgba(25,23,28,.48); font-size: var(--font-caption); }
.staff-mark { display: inline-flex; margin-top: 13rpx; padding: 7rpx 12rpx; border-radius: 20rpx; background: rgba(255,255,255,.62); color: #4c6858; font-size: var(--font-caption); }
.empty-state { display: flex; padding: 150rpx 40rpx; flex-direction: column; align-items: center; color: #77727c; }
.empty-note { margin-top: 10rpx; color: #aaa6ae; font-size: var(--font-meta); }
.bottom-space { height: 190rpx; }
@media screen and (max-width: 360px) { .feed { grid-template-columns: 1fr; } }
</style>

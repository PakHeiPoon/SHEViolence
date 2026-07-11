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
        <text class="post-count">{{ posts.length }} 条</text>
      </view>

      <scroll-view class="board-scroll" scroll-x :show-scrollbar="false">
        <view class="board">
          <view class="column" v-for="(t, ti) in columns" :key="t.name">
            <view class="col-head" :class="'col-' + (ti % 5)">
              <text>{{ t.name }}</text>
              <text class="col-count">{{ t.posts.length }}</text>
            </view>
            <view
              class="post-card"
              :class="'tone-' + ((ti * 2 + i) % 5)"
              v-for="(p, i) in t.posts"
              :key="p.id"
              @tap="detail(p)"
            >
              <view class="post-top">
                <text class="post-title">{{ p.tag }}</text>
                <text class="dots">⋮</text>
              </view>
              <text class="post-desc">{{ p.content }}</text>
              <view class="meta-row">
                <text class="meta-label">互助热度</text>
                <text class="meta-value">{{ p.likes || 0 }} 赞</text>
              </view>
              <view class="bar"><view class="bar-fill" :style="{ width: barWidth(p) }"></view></view>
              <view class="post-foot">
                <view class="avatars">
                  <view class="ava" :class="'ava-' + (j % 3)" v-for="(a, j) in avatars(p)" :key="j">{{ a }}</view>
                </view>
                <view class="time-pill" :class="{ staff: hasStaff(p) }">
                  <text v-if="hasStaff(p)">✓ 已回复</text>
                  <text v-else>🕔 {{ timeAgo(p.time) }}</text>
                </view>
              </view>
            </view>
            <view v-if="!t.posts.length" class="col-empty">暂无帖子</view>
          </view>
        </view>
      </scroll-view>

      <view v-if="!posts.length" class="empty-state">
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
      tags: ['法律咨询', '心理支持', '庇护安置', '取证指导', '互助倾诉']
    }
  },
  computed: {
    columns() {
      return this.tags.map(name => ({
        name,
        posts: this.posts.filter(p => p.tag === name)
      }))
    }
  },
  onShow() {
    this.posts = getPosts()
  },
  methods: {
    hasStaff(p) { return p.replies.some(r => r.staff) },
    detail(p) { uni.navigateTo({ url: '/pages/community/detail?id=' + p.id }) },
    post() { uni.navigateTo({ url: '/pages/community/post' }) },
    barWidth(p) {
      return Math.min(20 + (p.likes || 0), 95) + '%'
    },
    avatars(p) {
      const names = [p.nick, ...p.replies.map(r => r.name)]
      return names.slice(0, 3).map(n => (n || '匿').replace(/^(匿名用户|认证律师|认证社工|心理咨询师)-?/, '').slice(0, 1) || '匿')
    },
    timeAgo(t) {
      const d = Math.floor((Date.now() - t) / 86400000)
      if (d <= 0) return '今天'
      if (d === 1) return '昨天'
      return d + ' 天前'
    }
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
.title-row { display: flex; align-items: flex-end; justify-content: space-between; padding: 58rpx 40rpx 28rpx; }
.page-title, .page-subtitle { display: block; }
.page-title { font-family: "Songti SC", "STSong", serif; font-size: var(--font-display); font-weight: 700; line-height: 1.05; }
.page-subtitle { margin-top: 10rpx; color: #96929b; font-size: var(--font-meta); }
.post-count { padding-bottom: 6rpx; color: #77727c; font-size: var(--font-meta); font-weight: 700; }
.board-scroll { white-space: nowrap; }
.board { display: inline-flex; align-items: flex-start; gap: 20rpx; padding: 0 36rpx; }
.column { display: flex; width: 330rpx; flex-direction: column; gap: 18rpx; white-space: normal; }
.col-head { display: flex; align-items: center; justify-content: space-between; padding: 14rpx 22rpx; border-radius: 22rpx; font-size: var(--font-meta); font-weight: 700; }
.col-count { color: rgba(25,23,28,.5); font-weight: 600; }
.col-0 { background: #d9dcfa; }
.col-1 { background: #f9e0ea; }
.col-2 { background: #d8f0e0; }
.col-3 { background: #fdeccb; }
.col-4 { background: #e5dcfa; }
.col-empty { padding: 30rpx 0; color: #aaa6ae; text-align: center; font-size: var(--font-caption); }
.post-card { position: relative; padding: 24rpx; box-sizing: border-box; border-radius: 28rpx; overflow: hidden; }
.tone-0 { background: #eef0ff; }
.tone-1 { background: #fdeef4; }
.tone-2 { background: #e9f7ee; }
.tone-3 { background: #fdf5e3; }
.tone-4 { background: #f0eaff; }
.post-top { display: flex; align-items: flex-start; justify-content: space-between; }
.post-title { font-size: calc(var(--font-body) + 2rpx); font-weight: 700; letter-spacing: 0; }
.dots { color: #77727c; font-size: var(--font-body); font-weight: 700; line-height: 1; }
.post-desc { display: -webkit-box; margin-top: 10rpx; overflow: hidden; color: #77727c; font-size: var(--font-caption); line-height: 1.5; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.meta-row { display: flex; align-items: center; justify-content: space-between; margin-top: 20rpx; font-size: var(--font-caption); font-weight: 700; }
.meta-value { color: #55515a; }
.bar { height: 8rpx; margin-top: 10rpx; border-radius: 8rpx; background: #f1eff3; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 8rpx; background: linear-gradient(90deg, #b9f0d2, #8ad9ae); }
.post-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 20rpx; }
.avatars { display: flex; }
.ava { display: flex; width: 44rpx; height: 44rpx; align-items: center; justify-content: center; border: 3rpx solid #fff; border-radius: 50%; box-sizing: border-box; color: #fff; font-size: var(--font-micro); font-weight: 700; }
.ava + .ava { margin-left: -12rpx; }
.ava-0 { background: #9b7cff; }
.ava-1 { background: #6cae8b; }
.ava-2 { background: #e0a04e; }
.time-pill { display: flex; align-items: center; padding: 8rpx 16rpx; border-radius: 24rpx; background: #f4f3f5; color: #55515a; font-size: calc(var(--font-micro) - 2rpx); font-weight: 600; }
.time-pill.staff { background: #e4f2e9; color: #4c6858; }
.empty-state { display: flex; padding: 150rpx 40rpx; flex-direction: column; align-items: center; color: #77727c; }
.empty-note { margin-top: 10rpx; color: #aaa6ae; font-size: var(--font-meta); }
.bottom-space { height: 190rpx; }
</style>

<template>
  <view class="detail-page" v-if="post">
    <app-page-header title="帖子详情" />
    <scroll-view class="detail-scroll" scroll-y :show-scrollbar="false">
      <view class="post-panel">
        <view class="post-head"><text>{{ post.nick }}</text><text class="tag">{{ post.tag }}</text></view>
        <view class="post-content">{{ post.content }}</view>
        <view class="post-meta">
          <text class="time">{{ fmt(post.time) }}</text>
          <view class="post-actions"><text :class="{ liked: post.liked }" @tap="like">{{ post.liked ? '已赞' : '点赞' }} {{ post.likes || 0 }}</text><text @tap="report">举报</text></view>
        </view>
      </view>

      <view class="reply-heading"><text>回复</text><text>{{ sorted.length }}</text></view>
      <view class="reply-list">
        <view class="reply-row" v-for="(r, i) in sorted" :key="i" :class="{ staff: r.staff }">
          <view class="avatar">{{ r.staff ? '专' : '匿' }}</view>
          <view class="reply-copy">
            <view class="reply-head">
              <text class="reply-name">{{ r.name }}</text>
              <text v-if="r.staff" class="badge">认证工作人员</text>
            </view>
            <view class="reply-content">{{ r.content }}</view>
            <text class="time">{{ fmt(r.time) }}</text>
          </view>
        </view>
      </view>
      <view class="empty" v-if="!sorted.length">暂无回复，工作人员看到后会尽快答复</view>
      <view class="bottom-space"></view>
    </scroll-view>

    <view class="composer">
      <input class="reply-input" v-model="draft" placeholder="写下你的回复或鼓励..." confirm-type="send" @confirm="reply" />
      <view class="send" @tap="reply">↑</view>
    </view>
    <app-dock active="community" />
  </view>
</template>

<script>
import { getPosts, addReply, getNick, fmt, togglePostLike, reportPost } from '../../common/store.js'
import appPageHeader from '../../components/app-page-header/app-page-header.vue'
import appDock from '../../components/app-dock/app-dock.vue'

export default {
  components: { appPageHeader, appDock },
  data() {
    return { post: null, draft: '', postId: '' }
  },
  computed: {
    sorted() {
      if (!this.post) return []
      return [...this.post.replies].sort((a, b) => (b.staff ? 1 : 0) - (a.staff ? 1 : 0))
    }
  },
  onLoad(q) {
    this.postId = q.id
    this.refresh()
  },
  methods: {
    fmt,
    refresh() { this.post = getPosts().find(x => x.id === this.postId) || null },
    reply() {
      if (!this.draft.trim()) return
      addReply(this.postId, { staff: false, name: getNick(), content: this.draft })
      this.draft = ''
      this.refresh()
    },
    like() {
      togglePostLike(this.postId)
      this.refresh()
    },
    report() {
      uni.showModal({
        title: '举报帖子',
        content: '确认提交举报？平台将对内容进行审核。',
        confirmText: '提交',
        success: res => {
          if (!res.confirm) return
          reportPost(this.postId)
          this.refresh()
          uni.showToast({ title: '已提交审核', icon: 'success' })
        }
      })
    }
  }
}
</script>

<style scoped>
.detail-page { height: 100vh; overflow: hidden; background: #FBFCFC; }
.detail-scroll { height: calc(100vh - var(--status-bar-height) - 104rpx); box-sizing: border-box; padding: 20rpx 32rpx 0; }
.post-panel { padding: 30rpx; border-radius: 28rpx; background: #eeeaff; }
.post-head { display: flex; align-items: center; justify-content: space-between; color: #716c77; font-size: var(--font-meta); }
.tag { padding: 7rpx 13rpx; border-radius: 18rpx; background: rgba(255,255,255,.7); color: #5e5572; font-size: var(--font-caption); }
.post-content { margin: 28rpx 0 20rpx; font-family: "Songti SC", "STSong", serif; font-size: var(--font-section); font-weight: 700; line-height: 1.6; }
.time { color: #aaa6ae; font-size: var(--font-caption); }
.post-meta { display: flex; align-items: center; justify-content: space-between; }
.post-actions { display: flex; gap: 22rpx; color: #77727c; font-size: var(--font-meta); }
.post-actions .liked { color: #745fc1; font-weight: 700; }
.reply-heading { display: flex; justify-content: space-between; padding: 44rpx 8rpx 18rpx; font-size: var(--font-section); font-weight: 700; }
.reply-list { border-top: 1rpx solid #ebe9ed; }
.reply-row { display: flex; gap: 18rpx; padding: 26rpx 4rpx; border-bottom: 1rpx solid #ebe9ed; }
.avatar { display: flex; width: 58rpx; height: 58rpx; flex: 0 0 58rpx; align-items: center; justify-content: center; border-radius: 50%; background: #f1eff3; color: #77727c; font-size: 20rpx; }
.reply-row.staff .avatar { background: #dcefe4; color: #477158; }
.reply-copy { min-width: 0; flex: 1; }
.reply-head { display: flex; align-items: center; gap: 12rpx; }
.reply-name { font-size: var(--font-meta); font-weight: 700; }
.badge { padding: 5rpx 10rpx; border-radius: 15rpx; background: #e5f2ea; color: #477158; font-size: var(--font-caption); }
.reply-content { margin: 12rpx 0 10rpx; font-size: var(--font-body); line-height: 1.6; }
.empty { padding: 80rpx 0; text-align: center; color: #96929b; font-size: var(--font-meta); }
.bottom-space { height: 300rpx; }
.composer { position: fixed; z-index: 80; right: 24rpx; bottom: calc(env(safe-area-inset-bottom) + 150rpx); left: 24rpx; display: flex; min-height: 88rpx; align-items: center; gap: 12rpx; padding: 8rpx 10rpx 8rpx 28rpx; box-sizing: border-box; border: 1rpx solid #ebe9ed; border-radius: 48rpx; background: #fff; box-shadow: 0 16rpx 50rpx rgba(35,31,45,.09); }
.reply-input { min-width: 0; flex: 1; font-size: var(--font-body); }
.send { display: flex; width: 68rpx; height: 68rpx; align-items: center; justify-content: center; border-radius: 50%; background: #1d1a20; color: #fff; font-size: 34rpx; }
</style>

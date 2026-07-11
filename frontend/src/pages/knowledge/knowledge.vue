<template>
  <view class="knowledge-page">
    <app-page-header title="安全知识" />
    <scroll-view class="knowledge-scroll" scroll-y :show-scrollbar="false">
      <view class="intro">
        <text class="intro-title">先知道，再决定</text>
        <text class="intro-note">用简短清晰的步骤了解识别、取证、保护令与安全离开</text>
      </view>

      <view class="topics">
        <view class="topic" v-for="(item, index) in items" :key="item.title" @tap="toggle(index)">
          <view class="topic-head">
            <view class="topic-index">{{ index + 1 }}</view>
            <view class="topic-copy"><text class="topic-title">{{ item.title }}</text><text class="topic-subtitle">{{ item.subtitle }}</text></view>
            <text class="topic-arrow" :class="{ open: opened === index }">›</text>
          </view>
          <view v-if="opened === index" class="points">
            <view class="point" v-for="point in item.points" :key="point"><text></text><text>{{ point }}</text></view>
          </view>
        </view>
      </view>

      <view class="notice">内容仅用于基础安全教育，不能替代公安、法院、医生、律师或心理专业人员的个案意见。</view>
      <view class="bottom-space"></view>
    </scroll-view>
    <app-dock active="sos" />
  </view>
</template>

<script>
import { KNOWLEDGE } from '../../common/safety-data.js'
import appPageHeader from '../../components/app-page-header/app-page-header.vue'
import appDock from '../../components/app-dock/app-dock.vue'

export default {
  components: { appPageHeader, appDock },
  data() { return { items: KNOWLEDGE, opened: 0 } },
  methods: { toggle(index) { this.opened = this.opened === index ? -1 : index } }
}
</script>

<style scoped>
.knowledge-page { height: 100vh; overflow: hidden; background: #FBFCFC; }
.knowledge-scroll { height: calc(100vh - var(--status-bar-height) - 104rpx); box-sizing: border-box; padding: 0 36rpx; }
.intro { padding: 44rpx 4rpx 30rpx; }
.intro-title, .intro-note { display: block; }
.intro-title { font-family: "Songti SC", "STSong", serif; font-size: var(--font-intro); font-weight: 700; }
.intro-note { margin-top: 10rpx; color: #96929b; font-size: var(--font-meta); line-height: 1.55; }
.topics { border: 1rpx solid #e8e6ea; border-radius: 28rpx; overflow: hidden; }
.topic { border-bottom: 1rpx solid #e8e6ea; }
.topic:last-child { border-bottom: 0; }
.topic-head { display: flex; min-height: 118rpx; align-items: center; gap: 18rpx; padding: 20rpx 24rpx; box-sizing: border-box; }
.topic-index { display: flex; width: 52rpx; height: 52rpx; flex: 0 0 52rpx; align-items: center; justify-content: center; border-radius: 50%; background: #eeebff; color: #725ac6; font-size: 20rpx; font-weight: 700; }
.topic-copy { min-width: 0; flex: 1; }
.topic-title, .topic-subtitle { display: block; }
.topic-title { font-size: var(--font-body); font-weight: 700; }
.topic-subtitle { margin-top: 6rpx; color: #96929b; font-size: var(--font-meta); }
.topic-arrow { color: #77727c; font-family: Georgia, serif; font-size: 40rpx; transform: rotate(90deg); transition: transform .2s ease; }
.topic-arrow.open { transform: rotate(-90deg); }
.points { padding: 0 24rpx 24rpx 94rpx; }
.point { display: flex; align-items: flex-start; gap: 14rpx; margin-top: 16rpx; color: #625e68; font-size: var(--font-body); line-height: 1.6; }
.point text:first-child { width: 9rpx; height: 9rpx; flex: 0 0 9rpx; margin-top: 13rpx; border-radius: 50%; background: #9b7cff; }
.notice { margin-top: 26rpx; padding: 24rpx; border-radius: 22rpx; background: #f2f1f3; color: #77727c; font-size: var(--font-meta); line-height: 1.6; }
.bottom-space { height: 200rpx; }
</style>

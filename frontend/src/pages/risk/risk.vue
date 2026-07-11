<template>
  <view class="risk-page">
    <app-page-header title="安全自查" />
    <scroll-view class="risk-scroll" scroll-y :show-scrollbar="false">
      <template v-if="!result">
        <view class="intro">
          <text class="intro-title">了解此刻的风险</text>
          <text class="intro-note">共 10 题，结果仅用于安全提醒，不是医学或司法诊断</text>
        </view>

        <view class="progress"><view class="progress-fill" :style="{ width: progress + '%' }" /></view>
        <text class="progress-copy">{{ answered }}/{{ questions.length }}</text>

        <view class="question" v-for="(q, index) in questions" :key="q.id">
          <view class="question-head"><text>{{ index + 1 }}</text><text>{{ q.text }}</text></view>
          <view class="options">
            <view
              class="option"
              :class="{ on: answers[q.id] === option.score }"
              v-for="option in q.options"
              :key="option.label"
              @tap="choose(q.id, option.score)"
            >{{ option.label }}</view>
          </view>
        </view>

        <view class="submit" :class="{ disabled: answered < questions.length }" @tap="finish">查看结果</view>
      </template>

      <template v-else>
        <view class="result-card" :class="result.level">
          <text class="result-label">本次自查结果</text>
          <text class="result-title">{{ levelData.text }}</text>
          <text class="result-score">{{ result.score }} / 21 分</text>
          <text class="result-note">{{ levelData.note }}</text>
        </view>

        <text class="section-title-local">现在可以做什么</text>
        <view class="suggestions">
          <view class="suggestion" v-for="(item, index) in levelData.suggestions" :key="item">
            <text>{{ index + 1 }}</text><text>{{ item }}</text>
          </view>
        </view>

        <view v-if="result.level === 'high' || result.level === 'critical'" class="urgent" @tap="goSos">
          <view><text class="urgent-title">优先确认人身安全</text><text class="urgent-note">危险正在发生时，请立即拨打 110</text></view>
          <text class="urgent-arrow">→</text>
        </view>

        <view class="result-actions">
          <view class="action primary" @tap="goSos">查看求助资源</view>
          <view class="action" @tap="restart">重新自查</view>
        </view>
      </template>
      <view class="bottom-space"></view>
    </scroll-view>
    <app-dock active="sos" />
  </view>
</template>

<script>
import { RISK_QUESTIONS, RISK_LEVELS, riskLevelOf } from '../../common/safety-data.js'
import { getRiskResult, saveRiskResult } from '../../common/store.js'
import { risk as aiRisk } from '../../services/api.js'
import appPageHeader from '../../components/app-page-header/app-page-header.vue'
import appDock from '../../components/app-dock/app-dock.vue'

export default {
  components: { appPageHeader, appDock },
  data() {
    return { questions: RISK_QUESTIONS, answers: {}, result: null, evaluating: false }
  },
  computed: {
    answered() { return Object.keys(this.answers).length },
    progress() { return Math.round(this.answered / this.questions.length * 100) },
    levelData() {
      if (!this.result) return null
      const base = RISK_LEVELS[this.result.level]
      // AI 建议优先，本地量表建议兜底
      return {
        ...base,
        note: this.result.aiAnalysis || base.note,
        suggestions: (this.result.suggestions && this.result.suggestions.length) ? this.result.suggestions : base.suggestions
      }
    }
  },
  onLoad() {
    this.result = getRiskResult()
  },
  methods: {
    choose(id, score) { this.answers = { ...this.answers, [id]: score } },
    async finish() {
      if (this.answered < this.questions.length) return uni.showToast({ title: '请完成全部问题', icon: 'none' })
      if (this.evaluating) return
      this.evaluating = true
      uni.showLoading({ title: 'AI 评估中', mask: true })
      const maxScore = this.questions.reduce((s, q) => s + Math.max(...q.options.map(o => o.score)), 0)
      const answerList = this.questions.map(q => {
        const score = this.answers[q.id]
        const opt = q.options.find(o => o.score === score)
        return { question: q.text, answer: opt ? opt.label : '', score }
      })
      try {
        const r = await aiRisk(answerList, maxScore)
        this.result = { score: r.score, level: r.level, aiAnalysis: r.aiAnalysis, suggestions: r.suggestions }
      } catch (e) {
        const score = Object.values(this.answers).reduce((sum, val) => sum + val, 0)
        this.result = { score, level: riskLevelOf(score) }
      }
      uni.hideLoading()
      this.evaluating = false
      saveRiskResult(this.result)
    },
    restart() { this.answers = {}; this.result = null },
    goSos() { uni.navigateTo({ url: '/pages/sos/sos' }) }
  }
}
</script>

<style scoped>
.risk-page { height: 100vh; overflow: hidden; background: #FBFCFC; }
.risk-scroll { height: calc(100vh - var(--status-bar-height) - 104rpx); box-sizing: border-box; padding: 0 36rpx; }
.intro { padding: 44rpx 4rpx 28rpx; }
.intro-title, .intro-note { display: block; }
.intro-title { font-family: "Songti SC", "STSong", serif; font-size: var(--font-intro); font-weight: 700; }
.intro-note { margin-top: 10rpx; color: #96929b; font-size: var(--font-meta); line-height: 1.55; }
.progress { height: 10rpx; border-radius: 6rpx; overflow: hidden; background: #efedf1; }
.progress-fill { height: 100%; border-radius: 6rpx; background: #9b7cff; transition: width .2s ease; }
.progress-copy { display: block; margin-top: 10rpx; text-align: right; color: #96929b; font-size: var(--font-caption); }
.question { padding: 30rpx 0; border-bottom: 1rpx solid #ebe9ed; }
.question-head { display: flex; align-items: flex-start; gap: 16rpx; font-size: var(--font-body); font-weight: 700; line-height: 1.55; }
.question-head text:first-child { display: flex; width: 42rpx; height: 42rpx; flex: 0 0 42rpx; align-items: center; justify-content: center; border-radius: 50%; background: #f0edff; color: #735bc7; font-size: var(--font-caption); }
.options { display: flex; gap: 14rpx; margin-top: 22rpx; padding-left: 58rpx; }
.option { min-width: 120rpx; padding: 16rpx 24rpx; border-radius: 32rpx; background: #f2f1f3; color: #77727c; text-align: center; font-size: var(--font-body); }
.option.on { background: #1d1a20; color: #fff; }
.submit { margin-top: 32rpx; padding: 23rpx 0; border-radius: 44rpx; background: #1d1a20; color: #fff; text-align: center; font-size: var(--font-body); font-weight: 700; }
.submit.disabled { opacity: .35; }
.result-card { margin-top: 32rpx; padding: 38rpx 34rpx; border-radius: 30rpx; background: #eef0ff; }
.result-card.high, .result-card.critical { background: #fde9e9; }
.result-card.medium { background: #fff1e3; }
.result-label, .result-title, .result-score, .result-note { display: block; }
.result-label { color: rgba(25,23,28,.52); font-size: var(--font-meta); }
.result-title { margin-top: 14rpx; font-family: "Songti SC", "STSong", serif; font-size: var(--font-intro); font-weight: 700; }
.result-score { margin-top: 8rpx; font-size: var(--font-meta); font-weight: 700; }
.result-note { margin-top: 22rpx; color: #625e68; font-size: var(--font-body); line-height: 1.65; }
.section-title-local { display: block; margin: 42rpx 4rpx 18rpx; font-size: var(--font-section); font-weight: 700; }
.suggestions { border: 1rpx solid #e8e6ea; border-radius: 28rpx; overflow: hidden; }
.suggestion { display: flex; min-height: 92rpx; align-items: center; gap: 18rpx; padding: 18rpx 24rpx; box-sizing: border-box; border-bottom: 1rpx solid #e8e6ea; font-size: var(--font-body); line-height: 1.5; }
.suggestion:last-child { border-bottom: 0; }
.suggestion text:first-child { display: flex; width: 42rpx; height: 42rpx; flex: 0 0 42rpx; align-items: center; justify-content: center; border-radius: 50%; background: #f1eff3; color: #77727c; font-size: var(--font-caption); }
.urgent { display: flex; align-items: center; justify-content: space-between; margin-top: 24rpx; padding: 28rpx; border-radius: 26rpx; background: #1d1a20; color: #fff; }
.urgent-title, .urgent-note { display: block; }
.urgent-title { font-size: var(--font-body); font-weight: 700; }
.urgent-note { margin-top: 7rpx; color: rgba(255,255,255,.62); font-size: var(--font-meta); }
.urgent-arrow { font-size: 36rpx; }
.result-actions { display: flex; gap: 14rpx; margin-top: 28rpx; }
.action { display: flex; height: 82rpx; flex: 1; align-items: center; justify-content: center; border: 1rpx solid #dedbe1; border-radius: 42rpx; font-size: var(--font-body); font-weight: 700; }
.action.primary { border-color: #1d1a20; background: #1d1a20; color: #fff; }
.bottom-space { height: 200rpx; }
</style>

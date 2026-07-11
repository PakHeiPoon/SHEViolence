<template>
  <view class="page">
    <!-- 伪装外观:简易记账本。输入预设金额并点记一笔即可解锁 -->
    <view class="card" @tap="tapTotal">
      <view class="title">本月支出</view>
      <view class="total">¥ {{ total }}</view>
      <view class="muted">共 {{ ledger.length }} 笔</view>
    </view>

    <view class="card">
      <view class="row">
        <input class="ipt" type="digit" v-model="amount" placeholder="金额" />
        <input class="ipt" v-model="note" placeholder="备注(选填)" />
      </view>
      <scroll-view class="category-scroll" scroll-x :show-scrollbar="false">
        <view class="categories">
          <view class="category" :class="{ on: category === item }" v-for="item in categories" :key="item" @tap="category = item">{{ item }}</view>
        </view>
      </scroll-view>
      <view class="btn" @tap="record">记一笔</view>
    </view>

    <view class="card">
      <view class="title">最近记录</view>
      <view v-if="!ledger.length" class="muted">暂无记录</view>
      <view class="item" v-for="(it, i) in ledger" :key="i">
        <view><text class="item-title">{{ it.note || it.category || '日常' }}</text><text class="item-meta">{{ it.category || '其他' }} · {{ it.date || '今天' }}</text></view>
        <text class="item-amount">- ¥ {{ it.amount }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import { get, set, KEYS, getPwd, disguiseOn } from '../../common/store.js'

export default {
  data() {
    return {
      amount: '', note: '', ledger: [], category: '餐饮',
      categories: ['餐饮', '交通', '购物', '居家', '医疗', '其他'],
      tapCount: 0, tapTimer: null
    }
  },
  computed: {
    total() {
      return this.ledger.reduce((s, it) => s + Number(it.amount || 0), 0).toFixed(2)
    }
  },
  onLoad(q) {
    // 伪装页是启动首页:未开启伪装且非"快速离开"跳入时,直接进真实首页
    if (!disguiseOn() && q.from !== 'escape') {
      uni.reLaunch({ url: '/pages/home/home' })
    }
  },
  onShow() {
    this.ledger = get(KEYS.LEDGER, [])
    if (!this.ledger.length) {
      this.ledger = [
        { amount: '28.00', note: '午餐', category: '餐饮', date: '今天' },
        { amount: '12.00', note: '地铁', category: '交通', date: '昨天' },
        { amount: '86.50', note: '日用品', category: '购物', date: '07-08' }
      ]
      set(KEYS.LEDGER, this.ledger)
    }
  },
  beforeDestroy() { if (this.tapTimer) clearTimeout(this.tapTimer) },
  methods: {
    unlock() {
      this.amount = ''
      this.note = ''
      uni.reLaunch({ url: '/pages/home/home' })
    },
    tapTotal() {
      this.tapCount++
      if (this.tapTimer) clearTimeout(this.tapTimer)
      if (this.tapCount >= 3) {
        this.tapCount = 0
        this.unlock()
        return
      }
      this.tapTimer = setTimeout(() => { this.tapCount = 0 }, 800)
    },
    record() {
      if (!this.amount) return
      // 输入解锁密码 -> 进入真实首页;否则当普通记账处理
      if (this.amount === getPwd()) {
        this.unlock()
        return
      }
      this.ledger.unshift({ amount: Number(this.amount).toFixed(2), note: this.note, category: this.category, date: '今天' })
      this.ledger = this.ledger.slice(0, 20)
      set(KEYS.LEDGER, this.ledger)
      this.amount = ''
      this.note = ''
    }
  }
}
</script>

<style scoped>
.title { font-weight: bold; margin-bottom: 16rpx; }
.total { font-size: var(--font-display); font-weight: bold; margin-bottom: 8rpx; }
.row { display: flex; gap: 16rpx; margin-bottom: 20rpx; }
.ipt { flex: 1; border: 1rpx solid #ddd; border-radius: 8rpx; padding: 16rpx; }
.category-scroll { margin: 4rpx 0 24rpx; white-space: nowrap; }
.categories { display: inline-flex; gap: 12rpx; }
.category { padding: 12rpx 20rpx; border-radius: 26rpx; background: #f3f3f3; color: #777; font-size: var(--font-meta); }
.category.on { background: #222; color: #fff; }
.item { display: flex; align-items: center; justify-content: space-between; padding: 18rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.item:last-child { border-bottom: 0; }
.item-title, .item-meta { display: block; }
.item-title { font-size: var(--font-body); font-weight: 600; }
.item-meta { margin-top: 5rpx; color: #999; font-size: var(--font-caption); }
.item-amount { font-size: var(--font-body); font-weight: 600; }
</style>

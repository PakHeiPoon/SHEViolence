<template>
  <view class="evidence-page">
    <scroll-view class="page-scroll" scroll-y :show-scrollbar="false">
      <view class="top-controls">
        <view class="soft-pill">本地加密</view>
        <view class="upload-pill" @tap="upload">上传证据 <text>＋</text></view>
      </view>

      <view class="date-head">
        <text class="day-title">{{ headTitle }}</text>
        <view class="month-trigger" @tap="toggleCalendar">
          <text class="month-label">{{ monthLabel }}</text>
          <view class="month-chevron" :class="{ open: calendarOpen }"></view>
        </view>
      </view>

      <view class="week-strip">
        <view
          v-for="d in weekDays"
          :key="d.ts"
          class="week-cell"
          :class="{ on: selDay === d.ts }"
          @tap="pickDay(d.ts)"
        >
          <text class="week-letter">{{ d.letter }}</text>
          <text class="week-num">{{ d.num }}</text>
          <view v-if="selDay === d.ts" class="week-bar"></view>
          <view v-else class="week-dot" :class="{ show: d.count > 0 }"></view>
        </view>
      </view>

      <scroll-view v-if="tips.length" class="tips-scroll" scroll-x :show-scrollbar="false">
        <view class="tips-inner">
          <view class="tip-card" :class="t.tone" v-for="t in tips" :key="t.id">
            <view class="tip-close" @tap.stop="dismissTip(t.id)">×</view>
            <text class="tip-icon">{{ t.icon }}</text>
            <text class="tip-text">{{ t.text }}</text>
          </view>
        </view>
      </scroll-view>

      <view class="section all-section">
        <view class="sec-pill all" :class="{ on: selDay === null }" @tap="toggleAll">
          <text class="sec-icon">🗂️</text>
          <text class="sec-label">全部证据（{{ list.length }}）</text>
        </view>
      </view>

      <view class="section" v-for="sec in sections" :key="sec.v">
        <view class="sec-pill" :class="sec.v" @tap="toggleFold(sec.v)">
          <text class="sec-icon">{{ sec.icon }}</text>
          <text class="sec-label">{{ sec.n }}（{{ sec.items.length }}）</text>
          <text class="sec-chevron" :class="{ folded: folds[sec.v] }">⌄</text>
        </view>

        <template v-if="!folds[sec.v]">
          <view v-if="sec.items.length" class="sec-card">
            <view class="record-row" v-for="e in sec.items" :key="e.id" @tap="detail(e)">
              <view class="record-copy">
                <view class="record-head"><text>{{ preview(e) }}</text><text v-if="e.source === 'chat'" class="source-badge">会话补充</text><text class="cert">已存证</text></view>
                <text class="record-meta">{{ fmt(e.time) }} · {{ e.certNo }}</text>
              </view>
              <text class="record-arrow">›</text>
            </view>
          </view>
          <view v-else class="sec-empty" @tap="upload">
            <text>{{ sec.empty }}</text>
            <view class="empty-plus">＋</view>
          </view>
        </template>
      </view>

      <view class="bottom-space"></view>
    </scroll-view>

    <view v-if="calendarOpen" class="calendar-layer">
      <view class="calendar-scrim" @tap="calendarOpen = false"></view>
      <view class="calendar-popover" @tap.stop>
        <view class="calendar-pointer"></view>
        <view class="calendar-head">
          <text class="calendar-title">{{ calendarMonthLabel }}</text>
          <view class="calendar-actions">
            <view class="calendar-arrow" @tap="changeCalendarMonth(-1)">‹</view>
            <view class="calendar-arrow" @tap="changeCalendarMonth(1)">›</view>
          </view>
        </view>
        <view class="calendar-weekdays">
          <text v-for="letter in LETTERS" :key="letter">{{ letter }}</text>
        </view>
        <view class="calendar-grid">
          <view
            v-for="day in calendarDays"
            :key="day.key"
            class="calendar-cell"
            :class="{ blank: !day.ts, selected: day.ts === selDay, today: day.ts === today }"
            @tap="day.ts && pickCalendarDay(day.ts)"
          >
            <text v-if="day.ts">{{ day.num }}</text>
            <view v-if="day.count" class="calendar-dot"></view>
          </view>
        </view>
      </view>
    </view>

    <app-dock active="evidence" />
  </view>
</template>

<script>
import { getEvidences, fmt } from '../../common/store.js'
import appDock from '../../components/app-dock/app-dock.vue'

const DAY = 86400000
const LETTERS = ['日', '一', '二', '三', '四', '五', '六']

function dayStart(ts) {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

const TIP_POOL = [
  { id: 'original', icon: '📁', text: '保留原始文件，不要裁剪或修图', tone: 'lavender' },
  { id: 'backup', icon: '🔑', text: '重要证据可另存到可信设备备份', tone: 'blue' },
  { id: 'time', icon: '⏰', text: '尽量当天记录，时间越近越可信', tone: 'lime' }
]

export default {
  components: { appDock },
  data() {
    const today = dayStart(Date.now())
    const dismissed = uni.getStorageSync('evidence_tips_dismissed') || []
    return {
      list: [],
      selDay: today,
      weekStart: today - new Date(today).getDay() * DAY,
      today,
      calendarOpen: false,
      calendarCursor: new Date(new Date(today).getFullYear(), new Date(today).getMonth(), 1).getTime(),
      LETTERS,
      folds: { photo: false, voice: false, text: false },
      tips: TIP_POOL.filter(t => !dismissed.includes(t.id)),
      types: [
        { v: 'photo', n: '照片证据', icon: '📷', empty: '这一天还没有照片证据' },
        { v: 'voice', n: '语音记录', icon: '🎙️', empty: '这一天还没有语音记录' },
        { v: 'text', n: '文字记录', icon: '✏️', empty: '这一天还没有文字记录' }
      ]
    }
  },
  computed: {
    weekDays() {
      return LETTERS.map((letter, i) => {
        const ts = this.weekStart + i * DAY
        return {
          ts,
          letter,
          num: new Date(ts).getDate(),
          count: this.list.filter(e => dayStart(e.time) === ts).length
        }
      })
    },
    monthLabel() {
      const d = new Date(this.selDay === null ? this.weekStart + 3 * DAY : this.selDay)
      return `${d.getFullYear()}年${d.getMonth() + 1}月`
    },
    calendarMonthLabel() {
      const d = new Date(this.calendarCursor)
      return `${d.getFullYear()}年${d.getMonth() + 1}月`
    },
    calendarDays() {
      const cursor = new Date(this.calendarCursor)
      const year = cursor.getFullYear()
      const month = cursor.getMonth()
      const firstWeekday = new Date(year, month, 1).getDay()
      const total = new Date(year, month + 1, 0).getDate()
      const cells = []
      for (let i = 0; i < firstWeekday; i++) cells.push({ key: `blank-start-${i}`, ts: null, num: '' })
      for (let num = 1; num <= total; num++) {
        const ts = dayStart(new Date(year, month, num).getTime())
        cells.push({
          key: `day-${ts}`,
          ts,
          num,
          count: this.list.filter(e => dayStart(e.time) === ts).length
        })
      }
      while (cells.length % 7) cells.push({ key: `blank-end-${cells.length}`, ts: null, num: '' })
      return cells
    },
    headTitle() {
      if (this.selDay === null) return '全部证据'
      if (this.selDay === dayStart(Date.now())) return '今天'
      return '周' + LETTERS[new Date(this.selDay).getDay()]
    },
    filtered() {
      if (this.selDay === null) return this.list
      return this.list.filter(e => dayStart(e.time) === this.selDay)
    },
    sections() {
      return this.types.map(t => ({
        ...t,
        empty: this.selDay === null ? t.empty.replace('这一天', '目前') : t.empty,
        items: this.filtered.filter(e => e.type === t.v)
      }))
    }
  },
  onShow() {
    this.list = getEvidences()
  },
  methods: {
    fmt,
    toggleCalendar() {
      if (!this.calendarOpen) {
        const base = new Date(this.selDay === null ? Date.now() : this.selDay)
        this.calendarCursor = new Date(base.getFullYear(), base.getMonth(), 1).getTime()
      }
      this.calendarOpen = !this.calendarOpen
    },
    changeCalendarMonth(dir) {
      const d = new Date(this.calendarCursor)
      this.calendarCursor = new Date(d.getFullYear(), d.getMonth() + dir, 1).getTime()
    },
    pickCalendarDay(ts) {
      this.selDay = ts
      this.weekStart = ts - new Date(ts).getDay() * DAY
      this.calendarOpen = false
    },
    pickDay(ts) {
      this.selDay = ts
    },
    dismissTip(id) {
      this.tips = this.tips.filter(t => t.id !== id)
      const dismissed = uni.getStorageSync('evidence_tips_dismissed') || []
      uni.setStorageSync('evidence_tips_dismissed', [...dismissed, id])
    },
    toggleAll() {
      this.selDay = this.selDay === null ? dayStart(Date.now()) : null
    },
    toggleFold(v) {
      this.folds[v] = !this.folds[v]
    },
    preview(e) {
      if (e.type === 'photo') return e.note || '现场或伤情照片'
      if (e.type === 'voice') return `${e.duration || '--'} 秒录音 · ${e.note || '暂无说明'}`
      return e.content
    },
    detail(e) { uni.navigateTo({ url: '/pages/evidence/detail?id=' + e.id }) },
    upload() { uni.navigateTo({ url: '/pages/evidence/upload' }) }
  }
}
</script>

<style scoped>
.evidence-page { height: 100vh; overflow: hidden; background: #FBFCFC; }
.page-scroll { height: 100%; }
.top-controls { display: flex; justify-content: space-between; padding: calc(var(--status-bar-height) + 28rpx) 36rpx 0; }
.soft-pill, .upload-pill { display: flex; height: 76rpx; align-items: center; gap: 14rpx; padding: 0 28rpx; box-sizing: border-box; border: 1rpx solid #FFFFFF; border-radius: 42rpx; background: #FDFDFD; box-shadow: 0 16rpx 46rpx rgba(31,28,37,.08); font-size: var(--font-body); font-weight: 700; }

.date-head { display: flex; align-items: center; justify-content: space-between; padding: 58rpx 40rpx 30rpx; }
.day-title { font-family: "Songti SC", "STSong", serif; font-size: var(--font-display); font-weight: 700; line-height: 1.05; }
.month-trigger { display: flex; min-height: 56rpx; align-items: center; gap: 14rpx; padding: 0 8rpx 0 18rpx; border-radius: 30rpx; }
.month-label { color: #33303a; font-size: var(--font-body); font-weight: 600; letter-spacing: 0; }
.month-chevron { width: 14rpx; height: 14rpx; margin-top: -7rpx; border-right: 4rpx solid #33303a; border-bottom: 4rpx solid #33303a; transform: rotate(45deg); transition: transform .2s ease; }
.month-chevron.open { margin-top: 7rpx; transform: rotate(-135deg); }

.calendar-layer { position: fixed; z-index: 80; inset: 0; pointer-events: none; }
.calendar-scrim { position: absolute; inset: 0; background: rgba(55,55,58,.20); pointer-events: auto; }
.calendar-popover { position: absolute; top: calc(var(--status-bar-height) + 232rpx); right: 36rpx; left: 36rpx; padding: 30rpx 26rpx 28rpx; box-sizing: border-box; border: 1rpx solid rgba(255,255,255,.96); border-radius: 34rpx; background: rgba(250,250,251,.96); box-shadow: 0 22rpx 64rpx rgba(31,28,37,.12); pointer-events: auto; }
.calendar-pointer { position: absolute; top: -18rpx; right: 54rpx; width: 34rpx; height: 34rpx; border-top: 1rpx solid rgba(255,255,255,.96); border-left: 1rpx solid rgba(255,255,255,.96); background: rgba(250,250,251,.96); transform: rotate(45deg); }
.calendar-head { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; }
.calendar-title { font-size: var(--font-body); font-weight: 700; }
.calendar-actions { display: flex; align-items: center; gap: 20rpx; }
.calendar-arrow { display: flex; width: 58rpx; height: 58rpx; align-items: center; justify-content: center; font-family: Georgia, serif; font-size: 54rpx; line-height: 1; }
.calendar-weekdays, .calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); }
.calendar-weekdays { margin-top: 28rpx; }
.calendar-weekdays text { text-align: center; color: #85818a; font-size: var(--font-caption); font-weight: 700; }
.calendar-grid { margin-top: 12rpx; row-gap: 8rpx; }
.calendar-cell { position: relative; display: flex; width: 66rpx; height: 66rpx; align-items: center; justify-content: center; justify-self: center; border-radius: 50%; color: #1d1a20; font-size: var(--font-body); }
.calendar-cell.blank { pointer-events: none; }
.calendar-cell.today { color: #8c6cf0; font-weight: 700; }
.calendar-cell.selected { background: #ece7ff; color: #8c6cf0; font-weight: 700; }
.calendar-dot { position: absolute; bottom: 7rpx; width: 7rpx; height: 7rpx; border-radius: 50%; background: #8c6cf0; }

.week-strip { display: flex; gap: 8rpx; padding: 0 28rpx; }
.week-cell { position: relative; display: flex; flex: 1; flex-direction: column; align-items: center; gap: 12rpx; padding: 22rpx 0 20rpx; border-radius: 24rpx; }
.week-cell.on { background: #fafafa; box-shadow: 0 10rpx 30rpx rgba(31, 28, 37, 0.06); }
.week-letter { color: #a5a1a9; font-size: var(--font-caption); font-weight: 600; letter-spacing: 0; }
.week-num { font-family: "Songti SC", "STSong", serif; font-size: var(--font-feature); line-height: 1.1; color: #8e8a92; }
.week-cell.on .week-num { color: #1c191f; }
.week-bar { width: 44rpx; height: 6rpx; border-radius: 6rpx; background: #55515a; }
.week-dot { width: 8rpx; height: 8rpx; border-radius: 50%; background: #b4a5e8; opacity: 0; }
.week-dot.show { opacity: 1; }

.tips-scroll { margin-top: 30rpx; white-space: nowrap; }
.tips-inner { display: inline-flex; gap: 20rpx; padding: 0 36rpx; }
.tip-card { position: relative; display: flex; width: 240rpx; height: 240rpx; flex-direction: column; justify-content: center; gap: 20rpx; padding: 26rpx; box-sizing: border-box; border-radius: 30rpx; white-space: normal; }
.tip-card.lavender { background: #e9e4f8; }
.tip-card.blue { background: #e7ecf8; }
.tip-card.lime { background: #e2e88f; }
.tip-close { position: absolute; top: 18rpx; right: 20rpx; display: flex; width: 40rpx; height: 40rpx; align-items: center; justify-content: center; color: #33303a; font-size: 30rpx; line-height: 1; }
.tip-icon { font-size: 44rpx; line-height: 1; }
.tip-text { color: #1c191f; font-size: var(--font-meta); font-weight: 600; line-height: 1.45; }

.section { padding: 0 36rpx; margin-top: 24rpx; }
.all-section { margin-top: 40rpx; }
.sec-pill { display: inline-flex; align-items: center; gap: 10rpx; padding: 12rpx 22rpx; border-radius: 30rpx; color: #1c191f; font-size: var(--font-caption); font-weight: 700; letter-spacing: 0; }
.sec-pill.all { background: #eceaee; }
.sec-pill.all.on { background: #1d1a20; color: #fff; }
.sec-pill.photo { background: #fbe3da; }
.sec-pill.voice { background: #e2e7f8; }
.sec-pill.text { background: #e5dcf7; }
.sec-icon { font-size: 20rpx; line-height: 1; }
.sec-chevron { margin-left: 2rpx; font-size: 20rpx; line-height: 1; transition: transform 0.2s ease; }
.sec-chevron.folded { transform: rotate(-90deg); }

.sec-card { margin-top: 14rpx; border-radius: 22rpx; overflow: hidden; background: #fff; box-shadow: 0 12rpx 40rpx rgba(31, 28, 37, 0.05); }
.record-row { display: flex; min-height: 92rpx; align-items: center; gap: 16rpx; padding: 16rpx 26rpx; box-sizing: border-box; border-bottom: 1rpx solid #f2f0f3; }
.record-row:last-child { border-bottom: 0; }
.record-copy { min-width: 0; flex: 1; }
.record-head { display: flex; align-items: center; gap: 12rpx; font-size: var(--font-body); font-weight: 700; }
.record-head text:first-child { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.source-badge { flex: 0 0 auto; padding: 3rpx 8rpx; border-radius: 12rpx; background: #eeeaff; color: #6d59aa; font-size: var(--font-caption); font-weight: 400; }
.cert { flex: 0 0 auto; padding: 3rpx 8rpx; border-radius: 12rpx; background: #e8f4ed; color: #4c745c; font-size: var(--font-caption); font-weight: 400; }
.record-meta { display: block; overflow: hidden; margin-top: 6rpx; color: #aaa6ae; text-overflow: ellipsis; white-space: nowrap; font-size: var(--font-meta); }
.record-arrow { color: #77727c; font-family: Georgia, serif; font-size: 36rpx; }

.sec-empty { display: flex; margin-top: 14rpx; min-height: 84rpx; align-items: center; justify-content: space-between; padding: 0 14rpx 0 28rpx; border: 2rpx dashed #dcd9de; border-radius: 22rpx; color: #a8a5ac; font-size: var(--font-meta); }
.empty-plus { display: flex; width: 46rpx; height: 46rpx; align-items: center; justify-content: center; margin-right: 10rpx; border-radius: 50%; background: #e9e7eb; color: #8e8a92; font-size: 26rpx; }

.bottom-space { height: 190rpx; }
</style>

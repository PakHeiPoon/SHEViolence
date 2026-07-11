<template>
  <view class="chat-page">
    <agent-topbar :mode="mode" @menu="goHistory" @select="switchMode" />

    <view v-if="!hasStarted" class="welcome-view">
      <view class="welcome-hero">
        <image class="welcome-mascot" src="/static/icons/mascot.png" mode="aspectFit" />
        <text class="welcome-title">把想说的都告诉我。\n我会陪你整理清楚。</text>
      </view>

      <view class="welcome-composer">
        <input
          v-model="draft"
          class="welcome-input"
          confirm-type="send"
          placeholder="告诉暖芽，你现在需要什么"
          placeholder-class="welcome-placeholder"
          @confirm="send()"
        />
        <view class="welcome-speak" @tap="sendVoice">
          <view class="welcome-bars"><view></view><view></view><view></view><view></view><view></view></view>
          <text>说话</text>
        </view>
      </view>
    </view>

    <view v-else class="conversation-view">
      <scroll-view class="msgs" scroll-y :scroll-into-view="scrollTo" scroll-with-animation>
        <view v-for="m in msgs" :key="m.id" :id="'m' + m.id" class="msg-row" :class="m.role">
          <view class="bubble" :class="m.role">
            <text v-if="m.type === 'text'">{{ m.content }}</text>
            <image v-else-if="m.type === 'image'" :src="m.content" mode="widthFix" class="msg-img" />
            <view v-else-if="m.type === 'voice'" class="voice-message">
              <view class="voice-bars dark"><view></view><view></view><view></view><view></view><view></view></view>
              <text>{{ m.duration }}"</text>
            </view>

            <view v-if="m.actions" class="actions">
              <view v-if="canSaveAsEvidence(m)" class="act" :class="{ saved: m.evidenceId }" @tap="saveAsEvidence(m)">{{ m.evidenceId ? '查看证据' : '补充到证据页' }}</view>
              <view class="act" @tap="postToCommunity(m)">发到社群</view>
              <view class="act warn" @tap="goSos">一键求助</view>
            </view>

            <view v-if="m.crisis" class="crisis-card" @tap="goSos">
              <view><text class="crisis-title">优先确认你现在的安全</text><text class="crisis-note">危险正在发生时，立即拨打 110</text></view>
              <text class="crisis-arrow">→</text>
            </view>

            <view v-if="m.actionCard" class="action-card">
              <view class="action-card-head"><text>可以先做这几步</text><text @tap.stop="saveActionCard(m)">保存</text></view>
              <view class="action-step" v-for="(step, index) in m.actionCard" :key="step"><text>{{ index + 1 }}</text><text>{{ step }}</text></view>
            </view>

            <view v-if="m.sources" class="sources">
              <text class="sources-title">资料来源</text>
              <view class="source" v-for="source in m.sources" :key="source.ref">
                <text>[{{ source.ref }}] {{ source.title }}</text>
                <text>{{ source.excerpt }}</text>
              </view>
            </view>
          </view>
        </view>
        <view v-if="typing" class="msg-row agent typing-row">
          <view class="typing-bubble"><text></text><text></text><text></text></view>
        </view>
        <view class="message-tail"></view>
      </scroll-view>

      <scroll-view v-if="msgs.length <= 1" class="quick" scroll-x :show-scrollbar="false">
        <view class="quick-inner">
          <view class="chip" v-for="(q, i) in quickQs" :key="i" @tap="send(q)">{{ q }}</view>
        </view>
      </scroll-view>

      <view class="composer-wrap">
        <view class="composer">
          <view class="composer-tool" aria-label="发送图片" @tap="sendImage">＋</view>
          <input
            v-model="draft"
            class="chat-input"
            confirm-type="send"
            placeholder="慢慢说，我在听"
            placeholder-class="chat-placeholder"
            @confirm="send()"
          />
          <view v-if="!draft" class="mic-button" aria-label="发送语音" @tap="sendVoice">
            <view class="mic-shape"></view>
          </view>
          <view v-else class="send-button" aria-label="发送" @tap="send()">↑</view>
        </view>
        <text class="disclaimer">紧急危险请立即拨打 110，AI 建议不替代专业法律意见</text>
      </view>
    </view>

    <app-dock active="chat" />

    <view class="drawer-mask" :class="{ show: drawerOpen }" @tap="drawerOpen = false"></view>
    <view class="drawer" :class="{ open: drawerOpen }">
      <view class="drawer-topbar">
        <view class="drawer-menu-button" aria-label="关闭聊天历史" @tap="drawerOpen = false">
          <view class="drawer-menu-line"></view>
          <view class="drawer-menu-line short"></view>
        </view>

        <view class="drawer-brand-pill">
          <text>暖芽</text>
          <text class="sparkle">✦</text>
        </view>
      </view>

      <view class="drawer-head">
        <text class="drawer-title">聊天历史</text>
        <view class="drawer-new" aria-label="新对话" @tap="newChatFromDrawer">
          <view class="drawer-new-box"></view>
          <view class="drawer-new-pen"></view>
        </view>
      </view>
      <scroll-view class="drawer-scroll" scroll-y :show-scrollbar="false">
        <view class="drawer-empty" v-if="!sessions.length">
          <text>还没有历史对话</text>
          <text class="drawer-empty-note">开始聊天后，会话会安全保存在这里</text>
        </view>
        <view
          v-for="s in sessions"
          :key="s.id"
          class="drawer-session"
          @tap="pickSession(s)"
        >
          <view class="drawer-session-copy">
            <text class="drawer-session-summary">{{ s.summary }}</text>
            <text class="drawer-session-time">{{ fmt(s.time) }} · {{ s.msgs.length }} 条消息</text>
          </view>
        </view>
        <view class="drawer-tail"></view>
      </scroll-view>
    </view>
  </view>
</template>

<script>
import { get, set, KEYS, genId, getSessions, saveSession, removeSession, getEvidences, addEvidence, fmt } from '../../common/store.js'
import { CRISIS_WORDS } from '../../common/safety-data.js'
import { chat as aiChat, legalQa, detectCrisis } from '../../services/api.js'
import appDock from '../../components/app-dock/app-dock.vue'
import agentTopbar from '../../components/agent-topbar/agent-topbar.vue'

const OPENINGS = {
  companion: '你好，这里是安全的。我是暖暖，你可以慢慢说，想到哪说到哪，我会一直陪着你。',
  legal: '你好，这里是安全的。我可以为你解答家暴相关的法律问题，比如取证、报警、申请人身安全保护令。你想先了解什么？'
}

function mockReply(text, mode) {
  const hit = (ws) => ws.some(w => text.includes(w))
  const crisis = CRISIS_WORDS.reduce((found, item) => text.includes(item.word) && (!found || item.level > found.level) ? item : found, null)
  if (crisis) {
    return {
      content: crisis.level === 3
        ? '我很担心你现在的安全。如果危险正在发生，请立刻拨打 110，或尽快移动到有人、靠近出口的位置，避开厨房和浴室。你可以只回答我：现在安全吗？'
        : '你提到的情况是需要认真对待的高风险信号。请先确认此刻是否安全，尽量让可信任的人知道你的位置，并保留相关记录。',
      actions: true,
      crisis: true,
      actionCard: ['移动到有出口、有人可以看见的位置', '联系可信任的人并告知所在位置', '保存现场记录，危险升级时立即拨打 110']
    }
  }
  if (mode === 'companion') {
    if (hit(['打', '踢', '扇', '掐', '伤'])) {
      return {
        content: '听到你经历了这些，我很心疼。你没有做错什么，被伤害不是你的错。你现在安全吗？如果愿意，可以慢慢告诉我当时的情况，我一直在。',
        actions: true
      }
    }
    if (hit(['骂', '侮辱', '恐吓', '威胁', '贬低'])) {
      return {
        content: '长期被这样对待，心里一定很难受。你的感受是真实且重要的，这不是"小题大做"。想先说说你现在的心情吗？',
        actions: true
      }
    }
    if (hit(['怕', '害怕', '难受', '崩溃', '哭'])) {
      return {
        content: '我在这里陪着你。先深呼吸一下，你现在是安全的。不用急着把所有事情说清楚，我们一点一点来。',
        actions: false
      }
    }
    return {
      content: '谢谢你愿意告诉我。无论发生了什么，你的感受都值得被认真对待。可以再多说一些吗？我会一直听着。',
      actions: false
    }
  }
  if (hit(['保护令', '离婚', '法院', '法律', '保证书', '告诫书'])) {
    return {
      content: '遭受家庭暴力或面临现实危险时，可以向人民法院申请人身安全保护令，无需先起诉离婚。法院一般应在受理后 72 小时内作出裁定，情况紧急的应在 24 小时内作出。建议同时保留报警记录、病历、照片、保证书和完整聊天记录。',
      actions: true,
      actionCard: ['整理报警、病历、照片和聊天记录', '联系当地法院、妇联或法律援助机构咨询材料', '仍有现实危险时同步报警并说明保护需求'],
      sources: [
        { ref: 1, title: '中华人民共和国反家庭暴力法', excerpt: '遭受家庭暴力或者面临现实危险时，可以申请人身安全保护令。' },
        { ref: 2, title: '人身安全保护令相关规定', excerpt: '一般在受理后 72 小时内作出裁定，情况紧急的在 24 小时内作出。' }
      ]
    }
  }
  if (hit(['打', '踢', '扇', '掐', '伤'])) {
    return {
      content: '你描述的情况属于身体暴力，这是《反家庭暴力法》明确禁止的行为。建议你：1）如有伤情尽快拍照并去医院验伤；2）保留现场证据；3）情况紧急请立即报警。你现在人身安全吗？',
      actions: true,
      actionCard: ['保存未经编辑的伤情和现场照片', '尽快就医并请医生客观记录伤情', '保存报警、出警和后续处理记录']
    }
  }
  if (hit(['骂', '侮辱', '恐吓', '威胁', '贬低'])) {
    return {
      content: '经常性谩骂、恐吓属于精神暴力，同样是家庭暴力。建议对辱骂恐吓进行录音，并保存相关聊天记录。你可以多告诉我一些细节吗？',
      actions: true
    }
  }
  if (hit(['钱', '生活费', '经济'])) {
    return {
      content: '严格限制你的经济来源、控制正常开支，可能构成经济控制型家暴。建议保留转账和聊天记录。需要我帮你梳理取证思路吗？',
      actions: true
    }
  }
  if (hit(['不让', '锁', '出门', '关'])) {
    return {
      content: '限制人身自由是较严重的家庭暴力。如果此刻你被限制自由，请立即使用一键求助报警。如果是过去发生的，建议记录时间与经过。',
      actions: true
    }
  }
  return {
    content: '我理解你的处境。可以再具体说说吗？比如发生了什么、多久一次、有没有受伤或感到害怕。',
    actions: false
  }
}

export default {
  components: { appDock, agentTopbar },
  computed: {
    hasStarted() {
      return this.msgs.some(m => m.role === 'user')
    },
    quickQs() {
      return this.mode === 'legal'
        ? ['他这样算家暴吗？', '我该怎么收集证据？', '怎么申请保护令？', '起诉离婚需要准备什么？']
        : ['我现在很害怕', '我想找人说说话', '我不知道该不该离开', '我想离开但没地方去']
    }
  },
  data() {
    return {
      sessionId: '',
      mode: 'companion',
      msgs: [],
      draft: '',
      scrollTo: '',
      pendingPrompt: '',
      pendingVoice: false,
      typing: false,
      drawerOpen: false,
      sessions: []
    }
  },
  onLoad(options) {
    if (options.new === '1') {
      set(KEYS.CUR_SESSION, '')
      this.sessionId = ''
      this.msgs = []
    }
    this.pendingPrompt = options.prompt ? decodeURIComponent(options.prompt) : ''
    this.pendingVoice = options.voice === '1'
  },
  onShow() {
    const cur = get(KEYS.CUR_SESSION, '')
    const s = getSessions().find(x => x.id === cur)
    if (s) {
      this.sessionId = s.id
      this.msgs = s.msgs
      this.mode = s.mode || 'companion'
    } else if (!this.sessionId) {
      this.newSession()
    }
    this.scrollBottom()

    if (this.pendingPrompt) {
      const prompt = this.pendingPrompt
      this.pendingPrompt = ''
      this.$nextTick(() => this.send(prompt))
    } else if (this.pendingVoice) {
      this.pendingVoice = false
      this.$nextTick(() => this.sendVoice())
    }
  },
  methods: {
    fmt,
    newSession() {
      this.sessionId = genId()
      this.msgs = [{ id: genId(), role: 'agent', type: 'text', content: OPENINGS[this.mode] }]
      set(KEYS.CUR_SESSION, this.sessionId)
      this.persist()
    },
    switchMode(mode) {
      this.mode = mode
      if (this.hasStarted) {
        const label = mode === 'legal' ? '法律援助' : '暖暖陪伴'
        this.push({ role: 'agent', type: 'text', content: `已切换到「${label}」模式。${OPENINGS[mode]}` })
      } else {
        this.msgs = [{ id: genId(), role: 'agent', type: 'text', content: OPENINGS[mode] }]
        this.persist()
      }
    },
    persist() {
      const firstUser = this.msgs.find(m => m.role === 'user')
      saveSession({
        id: this.sessionId,
        time: Date.now(),
        mode: this.mode,
        summary: firstUser ? firstUser.content.slice(0, 30) : '(未开始)',
        msgs: this.msgs
      })
      set(KEYS.CUR_SESSION, this.sessionId)
    },
    push(m) {
      const item = { id: genId(), time: Date.now(), ...m }
      this.msgs.push(item)
      this.persist()
      this.scrollBottom()
      return item
    },
    scrollBottom() {
      this.$nextTick(() => {
        const last = this.msgs[this.msgs.length - 1]
        if (last) this.scrollTo = 'm' + last.id
      })
    },
    send(text) {
      const content = (text || this.draft).trim()
      if (!content) return
      this.draft = ''
      const sourceMessage = this.push({ role: 'user', type: 'text', content })
      this.typing = true
      this.scrollBottom()
      this.reply(content, sourceMessage)
    },
    // 真实 AI 回复：本地规则先出危机卡片/行动清单等 UI 挂件，AI 负责回复正文；失败自动回退本地规则文本
    async reply(content, sourceMessage) {
      const local = mockReply(content, this.mode)
      const crisis = detectCrisis(content)
      let replyText = ''
      let sources = local.sources
      try {
        if (this.mode === 'legal') {
          const r = await legalQa(content)
          replyText = r.answer
          if (r.sources && r.sources.length) {
            sources = r.sources.map((s, i) => ({ ref: s.ref || i + 1, title: s.title || s.source, excerpt: s.excerpt }))
          }
        } else {
          const history = this.msgs
            .filter(m => m.type === 'text' && (m.role === 'user' || m.role === 'agent'))
            .map(m => ({ role: m.role === 'agent' ? 'assistant' : 'user', content: m.content }))
          const r = await aiChat(history)
          replyText = r.reply
        }
      } catch (e) {
        console.warn('[chat] AI 调用失败，使用本地回复:', e)
      }
      this.typing = false
      this.push({
        role: 'agent',
        type: 'text',
        content: replyText || local.content,
        actions: local.actions || crisis.level >= 2,
        crisis: local.crisis || crisis.level >= 2,
        actionCard: local.actionCard,
        sources,
        sourceMessageId: sourceMessage.id
      })
    },
    sendImage() {
      uni.chooseImage({
        count: 1,
        success: res => {
          const sourceMessage = this.push({ role: 'user', type: 'image', content: res.tempFilePaths[0] })
          setTimeout(() => {
            this.push({
              role: 'agent', type: 'text', actions: true, sourceMessageId: sourceMessage.id,
              content: '我收到了图片。如果这是伤情或现场照片，建议立即存入证据库并保留原始文件。'
            })
          }, 600)
        }
      })
    },
    sendVoice() {
      const sourceMessage = this.push({ role: 'user', type: 'voice', content: '', duration: 8 })
      setTimeout(() => {
        this.push({
          role: 'agent', type: 'text', actions: true, sourceMessageId: sourceMessage.id,
          content: '我听到了你的语音。如果是争执现场录音，建议保留原文件并存入证据库。'
        })
      }, 600)
    },
    sourceMessageFor(m) {
      if (m.sourceMessageId) {
        const linked = this.msgs.find(item => item.id === m.sourceMessageId)
        if (linked) return linked
      }
      const index = this.msgs.findIndex(item => item.id === m.id)
      for (let i = index - 1; i >= 0; i--) {
        if (this.msgs[i].role === 'user') return this.msgs[i]
      }
      return null
    },
    canSaveAsEvidence(m) {
      const source = this.sourceMessageFor(m)
      if (!source) return false
      if (source.type === 'image' || source.type === 'voice') return true
      const words = ['打', '踢', '扇', '掐', '伤', '流血', '骂', '侮辱', '恐吓', '威胁', '贬低', '跟踪', '监视', '砸东西', '拿刀', '反锁', '关起来', '不让我出门', '控制钱', '生活费']
      return words.some(word => source.content.includes(word))
    },
    saveAsEvidence(m) {
      if (m.evidenceId) {
        const evidence = getEvidences().find(item => item.id === m.evidenceId)
        if (evidence) return uni.navigateTo({ url: '/pages/evidence/detail?id=' + m.evidenceId })
        m.evidenceId = ''
      }
      const source = this.sourceMessageFor(m)
      if (!source) return uni.showToast({ title: '没有找到可保存的内容', icon: 'none' })
      const existing = getEvidences().find(item => item.sourceSessionId === this.sessionId && item.sourceMessageId === source.id)
      if (existing) {
        source.evidenceId = existing.id
        m.evidenceId = existing.id
        this.persist()
        return uni.showToast({ title: '已在证据页中', icon: 'none' })
      }
      const type = source.type === 'image' ? 'photo' : source.type === 'voice' ? 'voice' : 'text'
      const note = type === 'photo' ? '来自暖芽会话的图片' : type === 'voice' ? '来自暖芽会话的语音' : '来自暖芽会话的文字记录'
      const evidence = addEvidence({
        type,
        content: source.content,
        duration: source.duration,
        note,
        source: 'chat',
        sourceLabel: '暖芽会话',
        sourceSessionId: this.sessionId,
        sourceMessageId: source.id,
        sourceTime: source.time
      })
      source.evidenceId = evidence.id
      m.evidenceId = evidence.id
      this.persist()
      uni.showToast({ title: '已存入证据库', icon: 'success' })
    },
    saveActionCard(m) {
      addEvidence({ type: 'text', content: '[行动清单] ' + m.actionCard.join('；'), note: '从暖芽会话保存' })
      uni.showToast({ title: '行动清单已保存', icon: 'success' })
    },
    postToCommunity(m) {
      set(KEYS.POST_PREFILL, m.content)
      uni.navigateTo({ url: '/pages/community/post' })
    },
    goSos() { uni.navigateTo({ url: '/pages/sos/sos' }) },
    goHistory() {
      this.sessions = getSessions()
      this.drawerOpen = true
    },
    pickSession(s) {
      this.drawerOpen = false
      if (s.id === this.sessionId) return
      set(KEYS.CUR_SESSION, s.id)
      this.sessionId = s.id
      this.msgs = s.msgs
      this.mode = s.mode || 'companion'
      this.scrollBottom()
    },
    newChatFromDrawer() {
      this.drawerOpen = false
      set(KEYS.CUR_SESSION, '')
      this.sessionId = ''
      this.mode = 'companion'
      this.newSession()
    },
    delSession(s) {
      uni.showModal({
        title: '删除会话',
        content: '删除后无法恢复，确定删除？',
        confirmColor: '#5B3AA4',
        success: r => {
          if (r.confirm) {
            removeSession(s.id)
            this.sessions = getSessions()
            if (s.id === this.sessionId) {
              this.sessionId = ''
              this.newSession()
            }
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.chat-page {
  display: flex;
  height: 100vh;
  flex-direction: column;
  overflow: hidden;
  background: #FBFCFC;
  color: #19171c;
}

.welcome-view {
  position: relative;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.welcome-hero {
  position: absolute;
  top: 48%;
  left: 50%;
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  transform: translate(-50%, -50%);
}

.welcome-mascot {
  width: 320rpx;
  height: 270rpx;
  margin-bottom: 26rpx;
  transform: translateY(12rpx);
}

.welcome-title {
  max-width: 650rpx;
  text-align: center;
  font-family: "Songti SC", "STSong", serif;
  font-size: calc(var(--font-intro) - 4rpx);
  font-weight: 700;
  line-height: 1.42;
}

.welcome-composer {
  position: absolute;
  right: 28rpx;
  bottom: calc(env(safe-area-inset-bottom) + 158rpx);
  left: 28rpx;
  display: flex;
  height: 104rpx;
  align-items: center;
  gap: 14rpx;
  padding: 10rpx 12rpx 10rpx 32rpx;
  box-sizing: border-box;
  border: 1rpx solid rgba(28, 25, 33, 0.04);
  border-radius: 56rpx;
  background: #fff;
  box-shadow: 0 20rpx 62rpx rgba(35, 31, 45, 0.1);
}

.welcome-input {
  min-width: 0;
  height: 72rpx;
  flex: 1;
  font-size: var(--font-body);
}

.welcome-placeholder { color: #9a979f; }

.welcome-speak {
  display: flex;
  width: 166rpx;
  height: 76rpx;
  flex: 0 0 166rpx;
  align-items: center;
  justify-content: center;
  gap: 13rpx;
  border-radius: 40rpx;
  background: #171519;
  color: #fff;
  font-size: var(--font-body);
  font-weight: 700;
}

.welcome-bars {
  display: flex;
  height: 28rpx;
  align-items: center;
  gap: 3rpx;
}

.welcome-bars view {
  width: 3rpx;
  border-radius: 3rpx;
  background: #fff;
}

.welcome-bars view:nth-child(1), .welcome-bars view:nth-child(5) { height: 10rpx; }
.welcome-bars view:nth-child(2), .welcome-bars view:nth-child(4) { height: 20rpx; }
.welcome-bars view:nth-child(3) { height: 28rpx; }

.conversation-view {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}


.msgs {
  min-height: 0;
  flex: 1;
  padding: 20rpx 28rpx 0;
  box-sizing: border-box;
}

.msg-row {
  display: flex;
  align-items: flex-end;
  gap: 12rpx;
  margin: 24rpx 0;
}

.msg-row.user {
  justify-content: flex-end;
}

.bubble {
  max-width: 74%;
  padding: 22rpx 24rpx;
  border: 1rpx solid #e7ddff;
  border-radius: 26rpx 26rpx 26rpx 8rpx;
  background: #f3efff;
  box-shadow: 0 10rpx 34rpx rgba(35, 31, 45, 0.055);
  font-size: var(--font-body);
  line-height: 1.5;
}

.bubble.user {
  border: 1rpx solid #efedf1;
  border-radius: 26rpx 26rpx 8rpx 26rpx;
  background: #fff;
  color: #19171c;
}

.msg-img {
  width: 320rpx;
  border-radius: 14rpx;
}

.voice-message {
  display: flex;
  min-width: 150rpx;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
}

.voice-bars {
  display: flex;
  height: 24rpx;
  align-items: center;
  gap: 3rpx;
}

.voice-bars view {
  display: block;
  width: 3rpx;
  border-radius: 3rpx;
  background: currentColor;
}

.voice-bars view:nth-child(1),
.voice-bars view:nth-child(5) { height: 8rpx; }
.voice-bars view:nth-child(2),
.voice-bars view:nth-child(4) { height: 16rpx; }
.voice-bars view:nth-child(3) { height: 24rpx; }

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 18rpx;
}

.act {
  padding: 9rpx 16rpx;
  border: 1rpx solid #c9c4d1;
  border-radius: 22rpx;
  color: #5d5864;
  font-size: var(--font-meta);
  line-height: 1.2;
}

.act.warn {
  border-color: #e5a7a4;
  color: #5B3AA4;
}

.act.saved {
  border-color: #c5decf;
  background: #e8f4ed;
  color: #4c745c;
}

.crisis-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-top: 18rpx;
  padding: 20rpx;
  border-radius: 20rpx;
  background: #fde9e9;
  color: #5B3AA4;
}

.crisis-title,
.crisis-note {
  display: block;
}

.crisis-title {
  font-size: var(--font-body);
  font-weight: 700;
}

.crisis-note {
  margin-top: 5rpx;
  color: #5B3AA4;
  font-size: var(--font-meta);
}

.crisis-arrow {
  font-size: 30rpx;
}

.action-card {
  margin-top: 18rpx;
  padding: 20rpx;
  border-radius: 20rpx;
  background: #f2f0ff;
}

.action-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--font-meta);
  font-weight: 700;
}

.action-card-head text:last-child {
  color: #745fc1;
  font-size: var(--font-caption);
}

.action-step {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  margin-top: 14rpx;
  color: #625d6b;
  font-size: var(--font-meta);
  line-height: 1.5;
}

.action-step text:first-child {
  display: flex;
  width: 32rpx;
  height: 32rpx;
  flex: 0 0 32rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #fff;
  color: #745fc1;
  font-size: var(--font-micro);
}

.sources {
  margin-top: 18rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #e8e5eb;
}

.sources-title {
  display: block;
  color: #77727c;
  font-size: var(--font-caption);
  font-weight: 700;
}

.source {
  margin-top: 12rpx;
}

.source text {
  display: block;
  font-size: var(--font-caption);
  line-height: 1.5;
}

.source text:first-child {
  font-weight: 700;
}

.source text:last-child {
  margin-top: 4rpx;
  color: #96929b;
}

.typing-bubble {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 22rpx 26rpx;
  border: 1rpx solid #e7ddff;
  border-radius: 26rpx 26rpx 26rpx 8rpx;
  background: #f3efff;
}

.typing-bubble text {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: #aaa6ae;
  animation: typing 1s infinite ease-in-out;
}

.typing-bubble text:nth-child(2) { animation-delay: .15s; }
.typing-bubble text:nth-child(3) { animation-delay: .3s; }

@keyframes typing {
  0%, 60%, 100% { opacity: .35; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-5rpx); }
}

.message-tail {
  height: 24rpx;
}

.quick {
  flex: 0 0 auto;
  white-space: nowrap;
}

.quick-inner {
  display: inline-flex;
  gap: 12rpx;
  padding: 8rpx 28rpx 14rpx;
}

.chip {
  padding: 14rpx 22rpx;
  border: 1rpx solid #ebe8ee;
  border-radius: 32rpx;
  background: #fff;
  color: #68636d;
  font-size: var(--font-meta);
}

.composer-wrap {
  flex: 0 0 auto;
  padding: 10rpx 24rpx calc(env(safe-area-inset-bottom) + 150rpx);
  background: #FBFCFC;
}

.composer {
  display: flex;
  min-height: 92rpx;
  align-items: center;
  gap: 14rpx;
  padding: 8rpx 10rpx 8rpx 14rpx;
  box-sizing: border-box;
  border: 1rpx solid #ece9ef;
  border-radius: 48rpx;
  background: #fff;
  box-shadow: 0 16rpx 50rpx rgba(35, 31, 45, 0.08);
}

.composer-tool,
.mic-button,
.send-button {
  display: flex;
  width: 68rpx;
  height: 68rpx;
  flex: 0 0 68rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.composer-tool {
  color: #55515a;
  font-size: 46rpx;
  font-weight: 300;
}

.chat-input {
  min-width: 0;
  flex: 1;
  font-size: var(--font-body);
}

.chat-placeholder {
  color: #aaa6ae;
}

.mic-button {
  background: #1d1a20;
}

.mic-shape {
  position: relative;
  width: 18rpx;
  height: 28rpx;
  border: 3rpx solid #fff;
  border-radius: 12rpx;
}

.mic-shape::before {
  position: absolute;
  right: -10rpx;
  bottom: -9rpx;
  left: -10rpx;
  height: 16rpx;
  border: 3rpx solid #fff;
  border-top: 0;
  border-radius: 0 0 18rpx 18rpx;
  content: "";
}

.mic-shape::after {
  position: absolute;
  bottom: -14rpx;
  left: 7rpx;
  width: 3rpx;
  height: 8rpx;
  background: #fff;
  content: "";
}

.send-button {
  background: #9b7cff;
  color: #fff;
  font-size: 36rpx;
  font-weight: 700;
}

.disclaimer {
  display: block;
  margin-top: 12rpx;
  text-align: center;
  color: #aaa6ae;
  font-size: var(--font-meta);
  line-height: 1.4;
}

.drawer-mask {
  position: fixed;
  z-index: 120;
  inset: 0;
  background: rgba(22, 21, 24, 0.3);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.28s ease;
}

.drawer-mask.show {
  opacity: 1;
  pointer-events: auto;
}

.drawer {
  position: fixed;
  z-index: 121;
  top: 0;
  bottom: 0;
  left: 0;
  display: flex;
  width: 82%;
  flex-direction: column;
  box-sizing: border-box;
  background: #FBFCFC;
  box-shadow: 24rpx 0 60rpx rgba(20, 18, 24, 0.12);
  transform: translateX(-105%);
  transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1);
}

.drawer.open {
  transform: translateX(0);
}

.drawer-topbar {
  position: relative;
  display: flex;
  min-height: calc(var(--status-bar-height) + 116rpx);
  flex: 0 0 auto;
  align-items: flex-end;
  padding: 0 36rpx;
  box-sizing: border-box;
}

.drawer-menu-button {
  display: flex;
  width: 88rpx;
  height: 88rpx;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  box-sizing: border-box;
  border: 1rpx solid #FFFFFF;
  border-radius: 50%;
  background: #FDFDFD;
  box-shadow: 0 18rpx 50rpx rgba(32, 29, 39, 0.08);
}

.drawer-menu-line {
  width: 30rpx;
  height: 4rpx;
  border-radius: 4rpx;
  background: #171619;
}

.drawer-menu-line.short {
  width: 20rpx;
  margin-right: 10rpx;
}

.drawer-brand-pill {
  position: absolute;
  right: 26rpx;
  bottom: 5rpx;
  display: flex;
  min-width: 196rpx;
  height: 78rpx;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  padding: 0 32rpx;
  box-sizing: border-box;
  border: 1rpx solid #FFFFFF;
  border-radius: 44rpx;
  background: #FDFDFD;
  box-shadow: 0 18rpx 50rpx rgba(32, 29, 39, 0.07);
  font-size: var(--font-body);
  font-weight: 700;
}

.sparkle {
  color: #9b7cff;
}

.drawer-head {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  padding: 112rpx 38rpx 34rpx;
}

.drawer-title {
  font-family: "Avenir Next", "PingFang SC", sans-serif;
  font-size: calc(var(--font-feature) - 2rpx);
  font-weight: 700;
  letter-spacing: 0;
}

.drawer-new {
  position: relative;
  display: flex;
  width: 76rpx;
  height: 76rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 16rpx 44rpx rgba(32, 29, 39, 0.08);
}

.drawer-new:active {
  transform: scale(0.94);
}

.drawer-new-box {
  width: 29rpx;
  height: 29rpx;
  border: 4rpx solid rgba(23, 22, 25, 0.78);
  border-radius: 3rpx;
}

.drawer-new-pen {
  position: absolute;
  top: 22rpx;
  right: 19rpx;
  width: 25rpx;
  height: 4rpx;
  border: 5rpx solid #fff;
  background: rgba(23, 22, 25, 0.78);
  transform: rotate(-45deg);
}

.drawer-scroll {
  min-height: 0;
  flex: 1;
  padding: 0 30rpx 210rpx;
  box-sizing: border-box;
}

.drawer-empty {
  display: flex;
  padding: 110rpx 20rpx 0;
  flex-direction: column;
  align-items: center;
  color: rgba(23, 22, 25, 0.48);
  font-size: calc(var(--font-body) - 2rpx);
}

.drawer-empty-note {
  margin-top: 12rpx;
  color: rgba(23, 22, 25, 0.3);
  font-size: calc(var(--font-meta) - 2rpx);
}

.drawer-session {
  display: flex;
  align-items: center;
  margin-bottom: 14rpx;
  padding: 24rpx 22rpx;
  border-bottom: 1rpx solid rgba(23, 22, 25, 0.07);
}

.drawer-session:active {
  border-radius: 12rpx;
  background: rgba(23, 22, 25, 0.035);
}

.drawer-session-copy {
  min-width: 0;
  flex: 1;
}

.drawer-session-time,
.drawer-session-summary {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drawer-session-time {
  margin-top: 8rpx;
  color: rgba(23, 22, 25, 0.36);
  font-size: calc(var(--font-caption) - 2rpx);
  letter-spacing: 0;
}

.drawer-session-summary {
  color: rgba(23, 22, 25, 0.82);
  font-size: calc(var(--font-body) - 2rpx);
  font-weight: 700;
  line-height: 1.4;
}

.drawer-tail {
  height: calc(env(safe-area-inset-bottom) + 40rpx);
}
</style>

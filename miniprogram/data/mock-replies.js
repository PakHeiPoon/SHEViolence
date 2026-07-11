// Mock 兜底数据：断网/接口超时/未配 Key 时使用，保证演示永不翻车
const chatReplies = [
  '我听到了，谢谢你愿意说出来——这真的需要很大的勇气。你现在人是安全的吗？如果正面临危险，请记得可以随时拨打 110。我们慢慢来，我一直在。',
  '这不是你的错，任何理由都不能成为他伤害你的借口。如果你愿意，我可以陪你一起想想：怎么保存证据、怎么申请人身安全保护令。',
  '你的感受非常重要。需要的话，我可以帮你了解报警取证、联系 12338 妇女维权热线；或者只是听你说说，也完全可以。'
]

const crisisReply = '我很担心你现在的安全。如果你正处于危险中，请立即拨打 110，或联系 12338 妇女维权热线。如果暂时安全，请尽量待在有人、离出口近的房间，避开厨房和浴室。你不是一个人，我们一起想办法。'

const visionChatReply = '我看到你发来的照片了，谢谢你愿意信任我。如果照片里是身上的伤，请一定尽快就医并保留病历；用手机原图保存这些照片，它们是重要的证据。如果现在有危险，随时可以拨打 110。你愿意和我说说当时发生了什么吗？'

function pickChatReply(msgCount, isCrisis) {
  if (isCrisis) return crisisReply
  return chatReplies[Math.floor(msgCount / 2) % chatReplies.length]
}

function legalMock(question) {
  return {
    answer: '根据资料[1]，遭受家庭暴力或面临现实危险时，可以直接向法院申请人身安全保护令，无需先起诉离婚，法院不收费；一般72小时内作出裁定，紧急情况24小时内。建议同时保留报警记录、病历、照片等证据（资料[2]），必要时拨打12338获得属地化协助。（当前为离线演示回答）',
    sources: [
      { ref: 1, source: '人身安全保护令指南.md', excerpt: '人身安全保护令由法院作出，一般72小时内裁定，紧急情况24小时内……' },
      { ref: 2, source: '家暴证据收集指南.md', excerpt: '报警回执、告诫书、伤情鉴定意见、病历是效力最高的证据类型……' }
    ]
  }
}

function riskAnalysisMock(level) {
  const m = {
    low: '目前风险信号较少，但请保持警惕并养成记录习惯。任何升级迹象（威胁、控制加剧）都值得重视。',
    medium: '存在明确的风险信号，暴力模式可能正在形成。建议从现在开始系统性取证，并提前准备安全计划。',
    high: '多项高危因素同时存在（如凶器、威胁、暴力升级），请认真对待自己的处境，尽快启动报警取证与保护令申请。',
    critical: '你的回答中出现了与严重伤害高度相关的危险信号。请把人身安全放在第一位，优先考虑离开并立即寻求外部保护。'
  }
  return m[level] || m.medium
}

const visionMock = {
  injury_desc: '左前臂外侧可见约 3×5cm 青紫色瘀斑，边缘泛黄，中心颜色较深，符合钝性外力（抓握或击打）所致皮下出血表现，推测受伤时间为 2-4 天前。',
  medical_tip: '建议 48 小时内就医并请医生在病历中注明伤情与致伤原因描述。',
  suggest_police: '伤情明显且可见新旧交替痕迹，建议报警并申请伤情鉴定、要求出具告诫书。',
  timeline: '建议与当日聊天记录、就诊票据一起按日期归档，形成完整证据链。'
}

const evidencePreset = [
  {
    id: 'ev0',
    type: 'text',
    date: '07-08',
    title: '文字记录 · 争吵与威胁',
    desc: '晚上十点左右，他因为我回复消息晚了开始摔东西，说"下次让你好看"。孩子在隔壁房间。',
    tag: '文字'
  }
]

function statementMock(list) {
  const items = (list || []).map((e, i) => `  ${i + 1}. ${e.date || '日期不详'}　${e.title || '记录'}：${e.desc || ''}`).join('\n')
  return `家庭暴力情况书面陈述（示例）

一、基本情况
我与对方系家庭成员关系。现就遭受家庭暴力的情况陈述如下。

二、事实经过
${items || '（暂无记录）'}

三、证据清单
上述记录及相应照片、病历等材料共 ${(list || []).length} 项，可供查验。

四、诉求
请求依法出具告诫书，支持我申请人身安全保护令，并依法追究施暴者责任。

陈述人：＿＿＿＿
日期：＿＿＿＿

（离线示例，接入 AI 后将根据你的证据自动生成规范陈述）`
}

module.exports = { chatReplies, crisisReply, visionChatReply, pickChatReply, legalMock, riskAnalysisMock, visionMock, evidencePreset, statementMock }

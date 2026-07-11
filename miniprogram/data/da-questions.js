// 危险评估量表（改编自 Campbell Danger Assessment，用于科普性自查，非临床诊断）
const questions = [
  { id: 'q1', text: '过去一年里，暴力发生的频率或严重程度是否在增加？', options: [{ label: '是', score: 2 }, { label: '否', score: 0 }] },
  { id: 'q2', text: '他是否使用过，或威胁要使用刀、棍棒等凶器？', options: [{ label: '是', score: 3 }, { label: '否', score: 0 }] },
  { id: 'q3', text: '他是否曾掐住你的脖子（卡喉、勒颈）？', options: [{ label: '是', score: 3 }, { label: '否', score: 0 }] },
  { id: 'q4', text: '他是否威胁过要杀了你或你的家人、孩子？', options: [{ label: '是', score: 3 }, { label: '否', score: 0 }] },
  { id: 'q5', text: '他是否控制你的日常行动、金钱或与外界的联系？', options: [{ label: '是', score: 1 }, { label: '否', score: 0 }] },
  { id: 'q6', text: '暴力发生时，孩子是否在场，或孩子也受到过伤害？', options: [{ label: '是', score: 2 }, { label: '否 / 没有孩子', score: 0 }] },
  { id: 'q7', text: '你是否觉得，他有可能真的会重伤甚至杀死你？', options: [{ label: '是', score: 3 }, { label: '否', score: 0 }] },
  { id: 'q8', text: '当你提出分开或离婚后，他的暴力或威胁是否升级？', options: [{ label: '是', score: 2 }, { label: '否 / 未提出过', score: 0 }] },
  { id: 'q9', text: '他是否有酗酒、吸毒，或家中存有武器？', options: [{ label: '是', score: 1 }, { label: '否', score: 0 }] },
  { id: 'q10', text: '你目前是否有安全的落脚点和可以求助的人？', options: [{ label: '有', score: 0 }, { label: '没有', score: 1 }] }
]

const maxScore = questions.reduce((s, q) => s + Math.max(...q.options.map(o => o.score)), 0)

function levelOf(score) {
  if (score <= 3) return { level: 'low', text: '较低风险' }
  if (score <= 8) return { level: 'medium', text: '中度风险' }
  if (score <= 14) return { level: 'high', text: '高度风险' }
  return { level: 'critical', text: '极高风险' }
}

function levelTextOf(level) {
  return { low: '较低风险', medium: '中度风险', high: '高度风险', critical: '极高风险' }[level] || '未知'
}

const suggestions = {
  low: [
    '养成记录习惯：每次冲突记下时间、地点、经过',
    '把 12338 和本页热线存在安全的地方',
    '告诉一位你信任的人目前的情况',
    '了解证据收集方法，有备无患'
  ],
  medium: [
    '开始系统收集证据：照片、录音、病历、报警记录',
    '在「我的」里设置 1-3 位紧急联系人',
    '制定安全离开计划：证件、现金、药品放在能快速拿到的地方',
    '拨打 12338 咨询你所在地的具体支持资源'
  ],
  high: [
    '尽快报警，并要求公安出具《告诫书》',
    '向法院申请人身安全保护令（72小时内裁定，紧急24小时）',
    '把孩子和重要证件转移到安全的地方',
    '确保家人朋友知情，约定求救暗号',
    '了解就近庇护所位置（可拨打 12338 询问）'
  ],
  critical: [
    '你的处境很危险，请优先考虑立即离开，前往亲友家或庇护所',
    '遇到暴力立刻拨打 110，不要犹豫',
    '随身携带手机、证件、少量现金',
    '避免单独与他见面，见面选公共场所并有人陪同',
    '立即申请紧急人身安全保护令（法院24小时内裁定）'
  ]
}

module.exports = { questions, maxScore, levelOf, levelTextOf, suggestions }

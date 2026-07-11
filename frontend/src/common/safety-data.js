export const CRISIS_WORDS = [
  { word: '杀我', level: 3 }, { word: '杀了我', level: 3 }, { word: '弄死', level: 3 },
  { word: '打死', level: 3 }, { word: '拿刀', level: 3 }, { word: '持刀', level: 3 },
  { word: '刀架', level: 3 }, { word: '掐我', level: 3 }, { word: '掐住', level: 3 },
  { word: '勒脖', level: 3 }, { word: '掐脖', level: 3 }, { word: '不想活', level: 3 },
  { word: '活不下去', level: 3 }, { word: '想死', level: 3 }, { word: '自杀', level: 3 },
  { word: '救命', level: 3 }, { word: '威胁', level: 2 }, { word: '恐吓', level: 2 },
  { word: '监视', level: 2 }, { word: '跟踪', level: 2 }, { word: '反锁', level: 2 },
  { word: '关起来', level: 2 }, { word: '打孩子', level: 2 }, { word: '打了我', level: 2 },
  { word: '逃不掉', level: 2 }, { word: '浑身是伤', level: 2 }, { word: '流血', level: 2 },
  { word: '砸东西', level: 2 }
]

export const RISK_QUESTIONS = [
  { id: 'q1', text: '过去一年里，暴力发生的频率或严重程度是否在增加？', options: [{ label: '是', score: 2 }, { label: '否', score: 0 }] },
  { id: 'q2', text: '对方是否使用过，或威胁要使用刀、棍棒等器具？', options: [{ label: '是', score: 3 }, { label: '否', score: 0 }] },
  { id: 'q3', text: '对方是否曾掐住你的脖子，或有卡喉、勒颈行为？', options: [{ label: '是', score: 3 }, { label: '否', score: 0 }] },
  { id: 'q4', text: '对方是否威胁过要杀害你或你的家人、孩子？', options: [{ label: '是', score: 3 }, { label: '否', score: 0 }] },
  { id: 'q5', text: '对方是否控制你的日常行动、金钱或与外界的联系？', options: [{ label: '是', score: 1 }, { label: '否', score: 0 }] },
  { id: 'q6', text: '暴力发生时，孩子是否在场，或孩子也受到过伤害？', options: [{ label: '是', score: 2 }, { label: '否 / 没有孩子', score: 0 }] },
  { id: 'q7', text: '你是否觉得，对方可能真的会重伤甚至杀害你？', options: [{ label: '是', score: 3 }, { label: '否', score: 0 }] },
  { id: 'q8', text: '当你提出分开或离婚后，对方的暴力或威胁是否升级？', options: [{ label: '是', score: 2 }, { label: '否 / 未提出过', score: 0 }] },
  { id: 'q9', text: '对方是否有酗酒、吸毒，或家中存有武器？', options: [{ label: '是', score: 1 }, { label: '否', score: 0 }] },
  { id: 'q10', text: '你目前是否有安全的落脚点和可以求助的人？', options: [{ label: '有', score: 0 }, { label: '没有', score: 1 }] }
]

export const RISK_LEVELS = {
  low: {
    text: '较低风险', note: '目前风险信号较少，但仍建议保留记录，并留意威胁或控制是否升级。',
    suggestions: ['记录每次冲突的时间、地点与经过', '保存 110 与 12338 等求助电话', '告诉一位可信任的人目前的情况', '提前了解证据收集方法']
  },
  medium: {
    text: '中度风险', note: '已出现明确风险信号，建议开始系统取证，并准备可以随时执行的安全计划。',
    suggestions: ['保存照片、录音、病历和报警记录', '设置 1 至 3 位紧急联系人', '把证件、现金和常用药放在易取位置', '拨打 12338 获取属地支持']
  },
  high: {
    text: '高度风险', note: '多项高危因素同时存在，请认真对待当前处境，尽快启动外部保护。',
    suggestions: ['尽快报警并要求出具相关记录', '咨询并申请人身安全保护令', '将孩子和重要证件转移至安全处', '与亲友约定求救暗号', '提前确认附近庇护资源']
  },
  critical: {
    text: '极高风险', note: '回答中出现与严重伤害高度相关的信号，请将人身安全放在第一位。',
    suggestions: ['优先离开现场，前往亲友家或庇护点', '暴力正在发生时立即拨打 110', '随身携带手机、证件与少量现金', '避免单独见面，选择公共场所并有人陪同', '尽快咨询紧急人身安全保护令']
  }
}

export function riskLevelOf(score) {
  if (score <= 3) return 'low'
  if (score <= 8) return 'medium'
  if (score <= 14) return 'high'
  return 'critical'
}

export const HOTLINES = [
  { name: '紧急报警', tel: '110', desc: '暴力正在发生或人身安全受到威胁' },
  { name: '妇女维权热线', tel: '12338', desc: '法律咨询、庇护与维权协调' },
  { name: '医疗急救', tel: '120', desc: '受伤需要紧急救治' },
  { name: '心理援助', tel: '12320', desc: '情绪危机与心理支持' }
]

export const VISION_MOCK = {
  injuryDesc: '画面中可见局部青紫色瘀斑，颜色深浅不一。仅凭图片无法确认成因和受伤时间，应由医生检查并记录。',
  medicalTip: '建议尽快就医，并请医生在病历中客观记录伤情位置、大小、颜色及你陈述的致伤经过。',
  policeTip: '如伤情由暴力造成或仍存在危险，建议报警并保留接警、出警和伤情鉴定材料。',
  archiveTip: '保留未经裁剪的原图，与聊天记录、病历和票据按日期归档，形成连续证据链。'
}

export const KNOWLEDGE = [
  {
    title: '什么属于家庭暴力', subtitle: '识别身体、精神、性与经济控制',
    points: ['殴打、捆绑、限制人身自由属于身体暴力', '经常性谩骂、恐吓、跟踪和骚扰属于精神暴力', '控制收入、证件、通信和正常社交也可能构成控制型暴力', '家庭暴力不是普通争吵，责任始终在施暴者']
  },
  {
    title: '如何保存证据', subtitle: '让每一次记录形成完整时间线',
    points: ['优先保留报警记录、告诫书、病历和伤情鉴定', '照片与录音尽量保留原文件，不裁剪、不转码', '聊天记录应包含双方身份、时间与完整上下文', '按日期记录地点、经过、目击者和后续处理']
  },
  {
    title: '人身安全保护令', subtitle: '面临现实危险时可向法院申请',
    points: ['无需先起诉离婚即可申请', '一般在受理后 72 小时内作出裁定，紧急情况可更快处理', '可以申请禁止接触、骚扰、跟踪或责令迁出住所', '材料不足时也可先咨询法院、妇联或法律援助机构']
  },
  {
    title: '安全离开计划', subtitle: '在平静时准备，在危险时执行',
    points: ['准备证件、现金、药品、钥匙和孩子必需品', '将备份材料交给可信任的人或存放在安全账户', '约定求救暗号，并提前确认出口和落脚点', '危险发生时避开厨房、浴室和没有出口的房间']
  },
  {
    title: '分开阶段的风险', subtitle: '提出分手或离婚后更要重视升级信号',
    points: ['跟踪、堵门、威胁自伤或伤害家人都属于升级信号', '避免单独见面，必要沟通尽量留痕', '让亲友、学校或单位知情并协助保护', '出现持械、勒颈或死亡威胁时立即报警']
  }
]

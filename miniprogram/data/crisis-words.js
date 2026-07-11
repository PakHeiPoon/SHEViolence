// 危机关键词库（第一层检测：本地毫秒级命中，词表依据队友整理的《家暴高危词识别与人工介入触发》skill）
// level 3 = L4/L3 生命危急或致命性升级 → 中断 AI，切人工介入接管卡
// level 2 = 高风险信号 → 顶部危机 Banner
// 原则：宁可误触发人工介入，也不可漏判（漏判的代价是生命）
module.exports = [
  // ── L4-A 自杀意念（直接/隐晦/交代后事型）──
  { w: '想死', level: 3 },
  { w: '不想活', level: 3 },
  { w: '自杀', level: 3 },
  { w: '活不下去', level: 3 },
  { w: '跳楼', level: 3 },
  { w: '上吊', level: 3 },
  { w: '割腕', level: 3 },
  { w: '烧炭', level: 3 },
  { w: '看不到明天', level: 3 },
  { w: '没有出路', level: 3 },
  { w: '如果我出事', level: 3 },
  { w: '如果我不在', level: 3 },
  { w: '万一我怎么', level: 3 },
  { w: '照顾好孩子', level: 3 },
  { w: '遗嘱', level: 3 },
  { w: '留了信', level: 3 },
  { w: '留了话', level: 3 },

  // ── L4-B 施暴正在发生 / 即将发生 ──
  { w: '他在门口', level: 3 },
  { w: '他在敲门', level: 3 },
  { w: '他找到我', level: 3 },
  { w: '把门锁了', level: 3 },
  { w: '不让我出去', level: 3 },
  { w: '抢我手机', level: 3 },
  { w: '救命', level: 3 },

  // ── L4-C 同归于尽（对方说的）──
  { w: '同归于尽', level: 3 },
  { w: '一起死', level: 3 },
  { w: '都别活', level: 3 },
  { w: '别想活', level: 3 },
  { w: '垫背', level: 3 },

  // ── L4-D 用户自己判断"他会杀我" ──
  { w: '杀我', level: 3 },
  { w: '杀了我', level: 3 },
  { w: '会杀', level: 3 },
  { w: '活不到', level: 3 },
  { w: '不敢闭眼', level: 3 },

  // ── L4-E 未成年人 / 宠物即时危险 ──
  { w: '打孩子', level: 3 },
  { w: '孩子被打', level: 3 },
  { w: '孩子在他手里', level: 3 },
  { w: '孩子抱走', level: 3 },
  { w: '孩子躲', level: 3 },

  // ── L3-A 致命性肢体动作（掐脖=致死最强单一预测因子）──
  { w: '掐脖', level: 3 },
  { w: '卡脖', level: 3 },
  { w: '勒脖', level: 3 },
  { w: '掐我', level: 3 },
  { w: '勒我', level: 3 },
  { w: '捂嘴', level: 3 },
  { w: '捂鼻', level: 3 },
  { w: '喘不上气', level: 3 },
  { w: '眼前发黑', level: 3 },
  { w: '以为我要死', level: 3 },
  { w: '拿刀', level: 3 },
  { w: '持刀', level: 3 },
  { w: '刀架', level: 3 },
  { w: '拿剪刀', level: 3 },
  { w: '皮带抽', level: 3 },
  { w: '泼开水', level: 3 },
  { w: '烫我', level: 3 },
  { w: '汽油', level: 3 },
  { w: '推下楼', level: 3 },
  { w: '楼梯推', level: 3 },
  { w: '用车撞', level: 3 },
  { w: '灌药', level: 3 },

  // ── L3-B 死亡威胁词 ──
  { w: '弄死', level: 3 },
  { w: '打死', level: 3 },
  { w: '杀了你', level: 3 },
  { w: '活埋', level: 3 },
  { w: '让你消失', level: 3 },

  // ── L3-C 性暴力 / 性胁迫 ──
  { w: '强奸', level: 3 },
  { w: '裸照', level: 3 },
  { w: '逼我打胎', level: 3 },
  { w: '下体流血', level: 3 },

  // ── 疑似施暴者在旁（在场信号 → 接管卡里有"隐藏此对话"）──
  { w: '他在旁边', level: 3 },
  { w: '他快回来', level: 3 },

  // ── level 2：高风险信号 → 顶部 Banner ──
  { w: '威胁', level: 2 },
  { w: '恐吓', level: 2 },
  { w: '监视', level: 2 },
  { w: '跟踪', level: 2 },
  { w: '装监控', level: 2 },
  { w: '定位我', level: 2 },
  { w: '反锁', level: 2 },
  { w: '关起来', level: 2 },
  { w: '不让出门', level: 2 },
  { w: '藏我身份证', level: 2 },
  { w: '身份证', level: 2 },
  { w: '扣工资卡', level: 2 },
  { w: '打了我', level: 2 },
  { w: '他打我', level: 2 },
  { w: '我爸打我', level: 2 },
  { w: '逃不掉', level: 2 },
  { w: '浑身是伤', level: 2 },
  { w: '流血', level: 2 },
  { w: '砸东西', level: 2 },
  { w: '他喝多', level: 2 },
  { w: '手里拿着', level: 2 },
  { w: '强迫我', level: 2 },
  { w: '撕破', level: 2 },
  { w: '煤气', level: 2 },
  { w: '你等着', level: 2 },
  { w: '删聊天记录', level: 2 },
  { w: '解脱', level: 2 }
]

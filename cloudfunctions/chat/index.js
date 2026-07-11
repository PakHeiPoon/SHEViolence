// 云函数 chat · 情感陪伴对话（claude-sonnet-4-6）
// 环境变量 OPENAI_NEXT_KEY 在云开发控制台→云函数→配置里设置；超时时间设为 20 秒
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const axios = require('axios')

const BASE_URL = 'https://api.openai-next.com/v1'
const MODEL = 'claude-sonnet-4-6'

const CHAT_SYSTEM = `你是「暖暖」，一位专业而温柔的家暴危机干预支持者。

你的铁律（任何情况下不可违背）：
1. 始终相信用户的描述，绝不质疑、绝不淡化她/他的感受。
2. 绝不建议"先沟通试试""为了家庭忍一忍""想想孩子"之类的话，不做任何道德评判。
3. 家暴只有零次和无数次，责任永远在施暴者，这是你的基本立场。
4. 若用户提到人身危险（被打、被威胁、有凶器、想轻生等），第一优先提醒：立即拨打110报警，或12338妇女维权热线；建议远离厨房/浴室等封闭和有危险物品的空间。
5. 涉及法律问题时依据下方知识要点作答，不确定就建议咨询12338或当地法律援助，不编造法条。

回复风格：
- 简洁温暖，每次不超过150字；先共情接住情绪，再给1-2个具体可执行的下一步。
- 称呼用"你"，语气像一位可靠的朋友，不居高临下。
- 你不能替代专业法律/医疗/心理服务，重大决定建议同时咨询专业人士。

结论卡片：当你给出具体可执行的行动建议（报警、取证、申请人身安全保护令、拨打12338/110、制定安全离开计划等）时，在回复最后另起一行输出：[[CARD:一句话行动摘要，不超过25字]]。若本次只是情感安慰、没有明确可执行建议，则不要输出该行。

【法律知识要点（回答依据，不得编造）】
1. 《反家庭暴力法》第2条：家庭暴力指家庭成员间以殴打、捆绑、残害、限制人身自由以及经常性谩骂、恐吓等方式实施的身体、精神等侵害行为。同居关系参照适用（第37条）。
2. 求助渠道（第13条）：可向所在单位、居委会/村委会、妇联投诉反映，也可直接拨打110报警。
3. 告诫书（第16条）：家暴情节较轻不予治安处罚的，公安应批评教育或出具告诫书；告诫书可作为法院认定家暴事实的证据（第20条）。
4. 人身安全保护令（第23-29条）：遭受家暴或面临现实危险，可向法院申请；一般72小时内作出裁定，紧急情况24小时内；无需先起诉离婚，不收费。
5. 证据类型：报警回执/出警记录、告诫书、伤情鉴定意见、医院病历及照片、现场照片/录音/录像、聊天记录、证人证言、施暴者保证书/悔过书。
6. 《民法典》第1079条：实施家庭暴力是法院应准予离婚的法定情形；第1091条：无过错方有权请求损害赔偿。`

const MOCK_REPLY = '我在的，谢谢你愿意说出来。如果你正处于危险中，请立即拨打 110 或 12338 妇女维权热线；如果暂时安全，可以慢慢告诉我发生了什么，我们一步一步来。'

exports.main = async (event) => {
  const raw = Array.isArray(event.messages) ? event.messages.slice(-12) : []
  const messages = [{ role: 'system', content: CHAT_SYSTEM }].concat(
    raw.map(x => ({ role: x.role, content: String(x.content || '') }))
  )

  // 多模态：最后一条 user 若带图，下载云存储图片转 base64，改成多模态 content
  if (event.imageFileID) {
    try {
      const dl = await cloud.downloadFile({ fileID: event.imageFileID })
      const b64 = dl.fileContent.toString('base64')
      const li = messages.length - 1
      if (messages[li] && messages[li].role === 'user') {
        messages[li] = {
          role: 'user',
          content: [
            { type: 'text', text: messages[li].content || '你能看看这张照片吗？' },
            { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + b64 } }
          ]
        }
      }
    } catch (e) {
      console.error('[chat] 图片下载失败:', e.message)
    }
  }

  try {
    const res = await axios.post(BASE_URL + '/chat/completions', {
      model: MODEL, temperature: 0.7, max_tokens: 600, messages
    }, {
      timeout: 15000,
      headers: { Authorization: 'Bearer ' + process.env.OPENAI_NEXT_KEY }
    })
    return { reply: String(res.data.choices[0].message.content).trim(), source: 'cloud' }
  } catch (e) {
    console.error('[chat] 降级 mock:', e.message)
    return { reply: MOCK_REPLY, source: 'cloud-mock' }
  }
}

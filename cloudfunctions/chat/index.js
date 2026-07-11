// 云函数 chat · 情感陪伴对话（claude-sonnet-4-6）
// 环境变量 OPENAI_NEXT_KEY 在云开发控制台→云函数→配置里设置；超时时间设为 20 秒
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const axios = require('axios')

const BASE_URL = 'https://api.openai-next.com/v1'
// 主用 opus（质量最高，实测看图3s/150字7s）；通道饱和自动降级 sonnet-5
const MODELS = ['claude-opus-4-8', 'claude-sonnet-5']

const CHAT_SYSTEM = `你是「暖芽」，一位专业而温柔的家暴危机干预支持者。

你的铁律（任何情况下不可违背）：
1. 始终相信用户的描述，绝不质疑、绝不淡化她/他的感受。
2. 绝不建议"先沟通试试""为了家庭忍一忍""想想孩子"之类的话，不做任何道德评判。
3. 家暴只有零次和无数次，责任永远在施暴者，这是你的基本立场。
4. 若用户提到人身危险（被打、被威胁、有凶器、想轻生等），第一优先提醒：立即拨打110报警，或12338妇女维权热线；建议远离厨房/浴室等封闭和有危险物品的空间。
5. 涉及法律问题时依据下方知识要点作答，不确定就建议咨询12338或当地法律援助，不编造法条。

回复风格：
- 简洁温暖，每次不超过150字；先共情接住情绪，再给1-2个具体可执行的下一步。
- 称呼用"你"，语气像一位可靠的朋友，不居高临下。
- 纯文本输出：绝不使用任何 markdown 符号（**加粗**、#标题、-列表等）；需要分点就用 1. 2. 3.。
- 始终使用简体中文回复。
- 你不能替代专业法律/医疗/心理服务，重大决定建议同时咨询专业人士。

看图规则：当用户发来图片时，先用一句话如实说明你从图中具体看到了什么（若是身上的伤，客观描述部位、颜色与程度；若是聊天记录、物品或其他场景，就照实描述），再据此温暖回应并给下一步建议。不要默认图片一定是伤情，也不要答非所图。

结论卡片：当你给出具体可执行的行动建议（报警、取证、申请人身安全保护令、拨打12338/110、制定安全离开计划等）时，在回复最后另起一行输出：[[CARD:一句话行动摘要，不超过25字]]。若本次只是情感安慰、没有明确可执行建议，则不要输出该行。

联网查询工具：当用户的问题需要实时或本地信息（如某地庇护所/法援机构的位置电话、最新政策规定）时，你的整条回复必须只有一行 [[SEARCH:三五个事实关键词]]，严禁输出任何其他文字。
错误示范（绝对禁止）："我来搜索一下深圳家暴庇护所的相关信息。"——这样系统不会执行查询，用户只会干等。
正确示范：[[SEARCH:深圳 家暴庇护所 联系方式]]
拿到我提供的搜索结果后你再正式作答（引用处标注如（W1））。搜索词只含事实关键词，绝不能包含用户的姓名、住址等任何个人信息。
必须搜索的情形：只要问题涉及具体地区（某省/市/区）的机构联系方式、热线号码、庇护所地址、法援机构、最新政策，即使你认为自己知道答案，也必须先 [[SEARCH:]] 核实——这类属地信息容易过时，背书本会误导处于危险中的用户。
不要搜索的情形：日常倾诉、情绪共情、上面知识要点已覆盖的一般法律常识。

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

  try {
    // ── 第二阶段（前端带 searchQuery 回调）：执行搜索 → 带证据生成最终回答 ──
    if (event.searchQuery) {
      const webs = await tavily(String(event.searchQuery).slice(0, 60))
      if (!webs.length) {
        return { reply: '我刚帮你查了，暂时没查到确切信息。可以拨打 12338，接线员能告诉你属地的具体资源。', sources: [], source: 'cloud' }
      }
      const sources = webs.map((w, i) => ({ ref: 'W' + (i + 1), type: 'web', source: w.title, url: w.url }))
      const materials = webs.map((w, i) => `[W${i + 1}]（${w.title} ${w.url}）${w.content}`).join('\n')
      if (event.draft) messages.push({ role: 'assistant', content: String(event.draft) })
      messages.push({ role: 'user', content: '【搜索结果】\n' + materials + '\n\n请基于以上结果用简体中文直接给出最终回复（引用处标注如（W1）），不要说"我查了"之类的过程话，不要再输出SEARCH标记。' })
      const reply = await llm(messages, 12000)
      return { reply, sources, source: 'cloud' }
    }

    // ── 第一阶段：正常回复；多模态看图；若需联网则把查询词交回前端展示进度 ──
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

    // 图片场景收紧单次超时（9s×2次尝试+下载 ≤ 云函数20s上限），避免整体被掐退 mock
    const reply = await llm(messages, event.imageFileID ? 9000 : 12000)

    // 触发搜索：模型按协议发 [[SEARCH]]，或嘴上说要查/搜（协议违规兜底，绝不留死胡同）
    const sm = reply.match(/\[\[SEARCH[:：]([^\]]+)\]\]/)
    const saidWillSearch = /(搜索|搜一下|查一下|查询|帮你查|我去查|帮你找|我来查|稍等)/.test(reply) && reply.length < 120
    if (sm || saidWillSearch) {
      const lastUser = raw.length ? String(raw[raw.length - 1].content || '') : ''
      const query = (sm ? sm[1] : '家暴求助 ' + lastUser).trim().slice(0, 60)
      const cleaned = reply.replace(/\[\[SEARCH[^\]]*\]\]/g, '').trim()

      if (!process.env.TAVILY_KEY) {
        // 未配搜索 Key：诚实告知 + 替代渠道，不留"稍等"死胡同
        return { reply: (cleaned ? cleaned + '\n' : '') + '（联网查询暂未开通，你可以拨打 12338 妇女维权热线，接线员能提供当地庇护所和法援机构的具体信息。）', sources: [], source: 'cloud' }
      }
      // 把查询词交回前端：展示"正在搜索：xxx"，随后前端二次调用执行搜索
      return { needSearch: true, query, draft: reply, source: 'cloud' }
    }

    return { reply, sources: [], source: 'cloud' }
  } catch (e) {
    console.error('[chat] 全部模型失败，降级 mock:', e.message)
    return { reply: MOCK_REPLY, sources: [], source: 'cloud-mock' }
  }
}

// 模型调用：opus 主用，饱和自动降级 sonnet-5
async function llm(messages, timeout) {
  let lastErr
  for (const model of MODELS) {
    try {
      const res = await axios.post(BASE_URL + '/chat/completions', {
        model, temperature: 0.7, max_tokens: 600, messages
      }, {
        timeout,
        headers: { Authorization: 'Bearer ' + process.env.OPENAI_NEXT_KEY }
      })
      const reply = String(res.data.choices[0].message.content).trim()
      if (reply) return reply
      lastErr = new Error(model + ' 空回复')
    } catch (e) {
      lastErr = e
      console.warn('[chat] ' + model + ' 失败:', e.message)
    }
  }
  throw lastErr
}

// Tavily 网络搜索工具；未配 TAVILY_KEY 或失败时返回空，绝不阻塞
async function tavily(query) {
  try {
    const res = await axios.post('https://api.tavily.com/search', {
      query, max_results: 3, search_depth: 'basic'
    }, {
      headers: { Authorization: 'Bearer ' + process.env.TAVILY_KEY },
      timeout: 6000
    })
    return (res.data.results || []).map(r => ({
      title: String(r.title || '').slice(0, 60),
      url: r.url,
      content: String(r.content || '').slice(0, 300)
    }))
  } catch (e) {
    console.warn('[chat] tavily 失败(跳过):', e.message)
    return []
  }
}

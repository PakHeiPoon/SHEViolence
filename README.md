# 暖芽 🌱 · 伪装成记账本的反家暴援助小程序

对外它是一个「简易记账」；在金额框输入解锁密码后，它是一套完整的反家暴援助工具——**AI 陪伴与证据整理教练 + 法律 RAG 问答 + 高危人工介入 + 32 家真人救助机构导航**。30 小时黑客松作品。

🎬 **演示视频**：[docs/demo.mp4](docs/demo.mp4)（解锁口令 `1234`，在伪装页「金额」框输入后确认）

## 产品定位

AI 不冒充律师和救助者。它做三件事：**情感上接住她 → 当好证据整理教练（教报警话术、告诫书四要素、"人+伤+时间"取证口诀）→ 把她导航到对的真人**（110/12338、源众、白丝带等公开机构）。真实法律意见与危机处置始终指向真人与专业机构。

## 功能全景

| 模块 | 说明 |
|---|---|
| 🎭 伪装记账本 | 入口页是可用的记账本；金额框输密码解锁（默认 1234，可改）；全局「快速离开」一键回伪装 |
| 💬 统一聊天页 | 暖芽陪伴 / 法律援助 顶部一键切换；多会话 + 上下文记忆 + 打字机流式 + Agent 状态可视化 |
| 🚨 高危人工介入 | 本地毫秒级命中 L4/L3 高危词（自杀意念/正在施暴/掐脖等 70+ 词，词表见 `miniprogram/data/crisis-words.js`）→ **立即中断 AI**，只输出标准接管话术：一键 110 / 接通真人热线 / 隐藏此对话（秒回记账本）；24h 内求助入口保持可见 |
| ⚖️ 法律问答（真 RAG） | 569 篇语料（家暴裁判文书 + 法规）→ 1939 块 · 256 维向量检索 + Tavily 联网双证据，回答逐点标注（K1）（W2）来源 |
| 👀 多模态 | 对话发图识别、伤情照片辅助描述（明确标注"非正式鉴定"）、按住说话语音输入 |
| 📋 安全自查 | Danger Assessment 改编量表 + deepseek-r1 分级建议 |
| 📁 证据时间线 | 照片/文字按时间线归档（仅存本机）+ 一键生成书面陈述草稿（提示律师审阅） |
| 📒 求助资源名录 | 5 条国家热线 + 14 家全国 + 18 家区域机构点击拨号；人身安全保护令申请书 / 离婚起诉状模板一键复制 |
| 🆘 SOS 大字页 | 110 巨字直拨（话术：先说"我被打了"+地址）、12110 短信话术复制、真人热线、紧急联系人 |
| 🔒 隐私 | 无账号体系、不建用户档案；聊天/证据/联系人只存本机，一键清除；AI 处理不关联身份 |

## 技术架构

```
微信原生小程序（零 npm 依赖）
   └─ utils/api.js  三模式自动降级：cloud（云函数）→ direct（直连）→ mock（断网演示不翻车）
微信云开发（6 个云函数，环境 cloudbase-*）
   chat 陪伴对话+看图+[[SEARCH]]联网工具 · rag 法律问答 · vision 伤情描述
   statement 书面陈述 · risk 风险评估 · asr 语音转文字
   └─ openai-next 中转（OpenAI 兼容协议）+ Tavily Search API
```

**模型矩阵（全部实测选型）**：chat/vision/statement = `claude-sonnet-5`（主）+ `claude-opus-4-8`（兜底）；rag 生成 = `deepseek-v3` + sonnet 兜底；risk = `deepseek-r1`；asr = `whisper-1` → `gpt-4o-transcribe`；embedding = `text-embedding-3-small`（256 维）。

## 运行说明

**前置**：微信开发者工具（Stable）；Node 18+（仅重建 RAG 索引时需要，运行不需要）。

1. 克隆本仓库，微信开发者工具「导入项目」选择根目录（AppID 用自己的测试号或正式号均可）
2. 复制密钥模板并填入自己的 Key：
   ```bash
   cp miniprogram/config/config.example.js miniprogram/config/config.js
   cp rag/config.example.js rag/config.local.js   # 仅重建索引需要
   ```
3. 工具内开通「云开发」，记下环境 ID 填入 `config.js` 的 `cloudEnv`
4. 部署云函数：右键 `cloudfunctions/` 下 6 个函数 →「上传并部署：云端安装依赖」；每个函数在云开发控制台配置：
   - 环境变量 `OPENAI_NEXT_KEY`（全部函数）、`TAVILY_KEY`（chat 函数，可选）
   - **执行超时改为 60 秒**（默认 3s 会导致 AI 调用/图片处理超时降级）
5. 编译运行；伪装页金额框输 `1234` 解锁
6. 无 Key 时所有 AI 能力自动降级为预置 mock 回答，全流程仍可完整走通

**RAG 语料重建（可选）**：语料放入 `rag/corpus/` 后执行 `node rag/import-corpus.js && node rag/build-index.js`，索引会同步写入 `cloudfunctions/rag/`，重新部署 rag 函数即生效（当前仓库已附带构建好的 1939 块索引，开箱即用）。

## 依赖清单

| 层 | 依赖 |
|---|---|
| 小程序前端 | 无 npm 依赖（微信原生 WXML/WXSS/JS） |
| 云函数 | `wx-server-sdk ~2.6.3`（chat/vision/asr）、`axios ^1.6.0`（全部）、`form-data ^4.0.0`（asr） |
| 外部服务 | openai-next API 中转（Claude/DeepSeek/Whisper/Embedding）、Tavily Search、微信云开发（云函数/云存储） |
| 构建工具 | Node 18+（仅 `rag/build-index.js` 重建向量索引） |

## 原创声明

本项目全部代码为本团队在黑客松期间原创编写，**不基于任何现有开源项目二次开发**。引用的外部内容仅包括：公开渠道的司法裁判文书与法规文本（RAG 语料）、公益救助机构公开发布的联系方式名录、上表所列 AI 服务 API 与 npm 依赖包。高危词识别规则与救助机构名录由本队成员调研整理。

## 安全红线

- `miniprogram/config/config.js`、`rag/config.local.js` 已 gitignore，密钥不入库、不截图、不外发
- 赛后轮换 openai-next Key；AppSecret 任何场景不需要（云开发免鉴权），不要生成

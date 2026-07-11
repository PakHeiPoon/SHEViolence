# 云函数四件套（chat / risk / vision / rag）

✅ 正式 AppID `wxa1d2dab09fbf6a15` 已配置进 `project.config.json`，四个云函数代码已就绪。
按下面步骤部署后，队友真机（体验版）即可完整使用全部 AI 功能，**前端页面代码零改动**。

## 部署步骤（管理员操作，约 15 分钟）

1. **成员管理**（mp.weixin.qq.com → 成员管理）：把所有队友微信加为「开发者」；要真机试用的加为「体验成员」
2. **开发者工具**：用有权限的微信号登录 → 打开本项目 → 工具栏点「**云开发**」→ 开通（按量付费有免费额度）→ 记下**环境 ID**
3. **填环境 ID**：`miniprogram/config/config.js` → `cloudEnv: '你的环境ID'`，`mode` 改为 `'cloud'`
4. **部署函数**：在 `cloudfunctions/` 下对 chat、risk、vision、rag 四个目录逐个右键 →「**上传并部署：云端安装依赖**」
5. **云开发控制台 → 云函数 → 每个函数的「配置」**：
   - 环境变量：`OPENAI_NEXT_KEY` = openai-next 的 Key（向负责人要）
   - **超时时间：改成 20 秒**（默认 3 秒必超时！四个都要改）
6. **验证**：工具里跑一遍演示动线；然后「上传」代码 → 后台设为体验版 → 队友扫码真机试用

## rag 函数的索引文件

`rag/index.json` 由根目录 `node rag/build-index.js` 生成，脚本会**自动同步**一份到
`cloudfunctions/rag/index.json`。**队友语料更新后**：重跑 build-index → 重新部署 rag 函数。

## 三模式说明（utils/api.js 已抽象）

| mode | 场景 | 说明 |
|------|------|------|
| `auto`(现状) | 开发者工具 | 有 Key 走前端直连 + 本机 RAG 服务 |
| `cloud` | 部署后/真机 | 全部走云函数，Key 只在云端环境变量 |
| `mock` | 断网兜底 | 预置回答，任何模式失败都自动降级到它 |

## 安全

- AppSecret **不需要生成、不需要使用**（云开发原生免鉴权），别点后台的「生成」
- Key 只放云函数环境变量与本地 gitignore 文件，赛后轮换

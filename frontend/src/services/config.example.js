// 配置模板：复制本文件为 config.js 并填入真实值。
// ⚠️ config.js 已在 .gitignore 中，绝不提交到代码库！
export default {
  // openai-next.com 的 API Key（向项目负责人索取）
  apiKey: '',
  baseUrl: 'https://api.openai-next.com/v1',

  // 法律 RAG 服务地址：本机开发用 127.0.0.1，部署到云服务器后改成服务器 IP
  ragBaseUrl: 'http://127.0.0.1:3900',

  // 请求模式：
  //   auto   → 有 apiKey 用 direct（前端直连，仅开发者工具/H5 可用），无则 mock
  //   mock   → 全部走本地预置回答（断网演示兜底）
  //   direct → 前端直连 openai-next（需勾选「不校验合法域名」）
  //   cloud  → 微信云开发云函数（仅微信小程序端可用）
  mode: 'cloud',

  models: {
    chat: 'claude-sonnet-4-6',        // 情感陪伴主对话
    vision: 'qwen3-vl-max',           // 伤情图片多模态
    reason: 'deepseek-r1',            // 风险评估推理
    rag: 'deepseek-v3',               // 法律 RAG 生成
    embedding: 'text-embedding-3-small'
  },

  requestTimeoutMs: 15000,
  cloudEnv: 'cloudbase-d4gbvygz364c4b53c' // 云开发环境 ID（团队共享，非敏感）
}

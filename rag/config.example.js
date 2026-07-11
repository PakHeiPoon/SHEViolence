// RAG 服务配置模板：复制为 config.local.js 并填入真实 Key（该文件已被 .gitignore 忽略）
module.exports = {
  apiKey: process.env.OPENAI_NEXT_KEY || '',
  baseUrl: 'https://api.openai-next.com/v1',
  embeddingModel: 'text-embedding-3-small',
  genModel: 'deepseek-v3',
  port: 3900,
  topK: 4,          // 检索返回的资料条数
  minScore: 0.25    // 相似度阈值，低于此分不作为依据
}

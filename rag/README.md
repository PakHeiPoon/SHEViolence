# 法律知识 RAG 服务

真·RAG 管线：语料 → 切块 → embedding（text-embedding-3-small）→ 向量余弦检索 Top-K → deepseek-v3 生成 → **回答带来源引用**。

## 快速开始（Node 18+，零 npm 依赖）

```bash
# 1. 配置 Key（本仓库已放好 config.local.js，队友如缺失则复制 example 填 Key）
# 2. 构建索引（语料变更后重跑）
node rag/build-index.js

# 3. 启动服务（默认端口 3900）
node rag/server.js

# 4. 验证
curl -X POST http://127.0.0.1:3900/api/legal-qa \
  -H "content-type: application/json" \
  -d '{"question":"人身安全保护令怎么申请？"}'
```

小程序端已对接：开发者工具里打开「倾诉 → ⚖️ 法律问答」即可（`config.ragBaseUrl` 默认指向本机 3900）。

## 队友的语料文档放这里 👇

把 `.md` / `.txt` 文件直接丢进 `rag/corpus/`，重新跑 `node rag/build-index.js` 即可生效。
- PDF/Word 请先转成 md/txt（可以让 Claude 转）
- 当前内置 4 份种子语料（反家暴法要点/保护令指南/取证指南/常见问答），可与队友文档共存

## 部署到云服务器（可选）

整个 `rag/` 目录拷上去 `node server.js` 即可（记得放行 3900 端口）；
前端把 `miniprogram/config/config.js` 的 `ragBaseUrl` 改成 `http://服务器IP:3900`。

## 检索存储说明

当前为内存向量检索（余弦相似度），语料在千块以内性能无差异；
`lib.js` 的 retrieve 已抽象，后续可无缝替换为 Qdrant（云服务器 Docker 部署）。

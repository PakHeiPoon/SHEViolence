# 港湾 · 反家暴援助小程序（黑客松 30h）

伪装成「简易记账」的反家暴援助工具：密码解锁 → AI 陪伴 + 危机检测 + 法律 RAG + 风险评估 + 证据整理。

📋 团队作战文档（实时更新）：Notion + Artifact 链接见群置顶。

## 🚀 五分钟跑起来

> ⚠️ 前端已迁移为 uni-app（Vue3 + Vite，「暖芽」新 UI），源码在 `frontend/src`，`miniprogram/` 是编译产物（已 gitignore，勿手改）。

1. **首次构建产物**：
   ```bash
   cd frontend
   npm install               # 仓库机器上已装好可跳过
   npm run build:mp-weixin   # 产物输出到 ../miniprogram
   ```
2. **微信开发者工具** → 导入项目 → 选择本目录（已配置正式 AppID `wxa1d2dab09fbf6a15`；登录的微信号需是该小程序的开发者，见 cloudfunctions/README.md 成员管理）
3. **确认密钥文件存在**：`frontend/src/services/config.js` 与 `rag/config.local.js`（新队友复制同目录 example 文件，从群里拿 Key 填入；`mode: 'cloud'` 走云函数则前端无需 Key）
4. **改 UI 实时调试**：
   ```bash
   npm run dev:h5          # 浏览器预览 http://localhost:5173（AI 走 direct/mock）
   npm run dev:mp-weixin   # watch 编译到 ../miniprogram，开发者工具自动热重载
   ```
5. **法律问答（真 RAG）** 需要本机再跑两条命令（Node 18+，零依赖）：
   ```bash
   node rag/build-index.js   # 首次/语料变更后构建索引
   node rag/server.js        # 启动检索服务 :3900
   ```
6. **演示口令**：伪装页「金额」框输入 `1314` 回车 → 解锁进入真实首页（备用：连点「本月支出」汇总卡 3 次）

## 🧭 演示动线（评委版 3 分钟）

记账本记两笔 → 金额框输 1314 解锁【哇点】→ AI 倾诉说"他昨天拿刀威胁我"→ 回复带危机卡片 + 行动清单【哇点】→ 切「法律援助」模式问保护令 → 回答带来源引用【技术点】→ 安全自查出"高危"+行动清单 → 上传伤情照片出专业描述【多模态】→ 点「离开」按钮秒回记账本【首尾呼应】

## 📁 目录结构

```
frontend/             uni-app 前端源码（Vue3 + Vite，「暖芽」UI）
  src/pages/disguise  伪装记账本 + 密码解锁（入口页）
  src/pages/home      真实首页：对话入口 + Dock 导航
  src/pages/chat      AI 对话：暖暖陪伴 + 法律RAG 双模式 + 危机检测
  src/pages/sos       一键求助：110/120/12338 + 附近机构
  src/pages/risk      安全自查（DA 量表 + deepseek-r1 分级）
  src/pages/evidence  证据时间线（qwen3-vl 伤情描述）
  src/pages/community 互助社群
  src/pages/mine      匿名身份/紧急联系人/解锁密码/一键清除
  src/services/api.js AI 统一入口：mock / direct / cloud 三模式自动降级
  src/services/config.js  密钥（gitignore，勿提交）
miniprogram/          微信小程序编译产物（gitignore，由 frontend 构建生成）
rag/                  真·RAG：语料→embedding索引→余弦检索→deepseek-v3生成
  corpus/             📚 语料放这里（队友文档 md/txt 直接丢入后重建索引）
cloudfunctions/       云函数（chat/rag/risk/vision，见其 README）
```

## ⚠️ 当前状态与待办

- ✅ 正式 AppID 已到位；**下一步：管理员开通云开发 → 部署云函数四件套**（步骤见 [cloudfunctions/README.md](cloudfunctions/README.md)，约 15 分钟）
- 云函数部署完成前：开发者工具用直连模式即可完整演示；真机需开「开发调试」
- 所有 AI 调用失败自动降级 mock 预置回答——**断网演示不翻车**

## 🔐 安全红线

- 两个密钥文件已 gitignore，**不截图、不外发、不提交**
- 比赛结束后**轮换** openai-next Key
- 正式号的 AppSecret 任何场景都用不到（云开发原生免鉴权），不要贴给任何人

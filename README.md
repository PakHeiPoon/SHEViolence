# 暖芽 · 反家暴援助小程序（黑客松 30h）

伪装成「简易记账」的反家暴援助工具：密码解锁 → AI 陪伴 + 危机检测 + 法律 RAG + 风险评估 + 证据整理。

📋 团队作战文档（实时更新）：Notion + Artifact 链接见群置顶。

## 🚀 五分钟跑起来

1. **微信开发者工具** → 导入项目 → 选择本目录（已配置正式 AppID `wxa1d2dab09fbf6a15`；登录的微信号需是该小程序的开发者，见 cloudfunctions/README.md 成员管理）
2. **确认密钥文件存在**：`miniprogram/config/config.js` 与 `rag/config.local.js`（仓库机器上已配好；新队友从群里拿 Key，复制同目录 example 文件填入）
3. 工具里直接编译即可——对话/风险评估/伤情分析走 **AI 直连**（`urlCheck` 已关）
4. **法律问答（真 RAG）** 需要本机再跑两条命令（Node 18+，零依赖）：
   ```bash
   node rag/build-index.js   # 首次/语料变更后构建索引
   node rag/server.js        # 启动检索服务 :3900
   ```
5. **演示口令**：伪装页「金额」框输入 `1234` 回车 → 解锁进入真实首页（备用：连点蓝色汇总卡 3 次）

## 🧭 演示动线（评委版 3 分钟）

记账本记两笔 → 金额框输 1234 解锁【哇点】→ AI 倾诉说"他昨天拿刀威胁我"→ 顶部红色危机 Banner【哇点】→ 切「⚖️ 法律问答」问保护令 → 回答带来源引用【技术点】→ 安全自查出"高危"+行动清单 → 上传伤情照片出专业描述【多模态】→ 点绿色「快速离开」秒回记账本【首尾呼应】

## 📁 目录结构

```
miniprogram/          小程序前端（微信原生）
  pages/disguise      伪装记账本 + 密码解锁（入口页）
  pages/home          真实首页：一键求助/功能入口/科普流
  pages/chat          AI 对话：暖芽陪伴 + 法律RAG 双模式 + 危机检测
  pages/risk          安全自查（DA 量表 + deepseek-r1 分级）
  pages/evidence      证据时间线（qwen3-vl 伤情描述）
  pages/community     互助社群（静态演示数据）
  pages/mine          匿名身份/紧急联系人/解锁密码/一键清除
  utils/api.js        AI 统一入口：mock / direct / cloud 三模式自动降级
  config/config.js    密钥（gitignore，勿提交）
rag/                  真·RAG：语料→embedding索引→余弦检索→deepseek-v3生成
  corpus/             📚 语料放这里（队友文档 md/txt 直接丢入后重建索引）
cloudfunctions/       云函数（等正式 AppID，见其 README）
```

## ⚠️ 当前状态与待办

- ✅ 正式 AppID 已到位；**下一步：管理员开通云开发 → 部署云函数四件套**（步骤见 [cloudfunctions/README.md](cloudfunctions/README.md)，约 15 分钟）
- 云函数部署完成前：开发者工具用直连模式即可完整演示；真机需开「开发调试」
- 所有 AI 调用失败自动降级 mock 预置回答——**断网演示不翻车**

## 🔐 安全红线

- 两个密钥文件已 gitignore，**不截图、不外发、不提交**
- 比赛结束后**轮换** openai-next Key
- 正式号的 AppSecret 任何场景都用不到（云开发原生免鉴权），不要贴给任何人

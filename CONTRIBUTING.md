# 团队协作指南

小程序多人协作 = **Git（代码同步）+ 微信项目成员（权限）+ 云开发（后端自动共享）**。
不是同屏实时编辑，而是各自开发、Git 推拉合并，靠分工避免冲突。

## 新成员接入（5 步，约 10 分钟）

1. **让管理员（donghao）把你加为项目成员**
   mp.weixin.qq.com → 管理 → 成员管理 → 项目成员 → 添加你的微信号，权限勾「开发者」
2. **装工具**：微信开发者工具 + Node.js 18+
3. **拉代码**：`git clone <仓库地址>`
4. **建本地配置**（不含密钥，放心）：
   ```bash
   cp miniprogram/config/config.example.js miniprogram/config/config.js
   ```
   模板里 `mode: 'cloud'`、`cloudEnv` 已填好，**复制即用，无需 AI Key**（AI 走云函数）。
5. **导入项目**：微信开发者工具 → 导入 → 选这个目录（用你自己的微信登录）→ 编译
   - 解锁演示：记账本「金额」框输 `1234` → 点「记一笔」

## 日常协作流程

```bash
git pull          # 开工前先拉最新
# ...改代码...
git add -A
git commit -m "feat: 你做的改动"
git push          # 推给大家
```

## 分工建议（避免改同一文件冲突）

- 按**页面**分工：`miniprogram/pages/` 下每人认领不同页面目录
- 云函数：`cloudfunctions/` 下谁改哪个函数，改完自己右键「上传并部署」
- RAG 语料：往 `rag/corpus/` 加文档后，跑 `node rag/build-index.js` 重建索引，再重新部署 `rag` 云函数

## 🔴 红线

- **密钥文件绝不提交**：`config.js`、`rag/config.local.js` 已在 `.gitignore`，别硬塞进去
- 改了云函数记得**重新部署**，否则线上还是旧的
- 需要 openai-next 的 Key（只有改 RAG 语料/本机调试才用到）找 donghao 单独要，别贴群里

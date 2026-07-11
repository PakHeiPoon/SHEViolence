# 反家暴求助平台 - 微信小程序(低保真原型)

uni-app (Vue 3) 项目。当前为纯前端原型:数据全部走本地 storage mock(`common/store.js`),后续将该文件内函数逐个替换为后端 API 调用即可,页面层不需要大改。

## 运行方式

用 HBuilderX 打开本目录,运行到微信开发者工具;或用 CLI 工程方式:

```bash
npx degit dcloudio/uni-preset-vue#vite my-app   # 生成 uni-app vite 工程
# 将本目录的 pages/ components/ common/ pages.json manifest.json App.vue main.js 覆盖到 src/
npm install
npm run dev:mp-weixin                            # 输出 dist/dev/mp-weixin,微信开发者工具导入
```

## 页面结构

| 页面 | 路径 | 说明 |
|---|---|---|
| 伪装页(启动页) | pages/disguise | 记账本外观;金额栏输入解锁密码进入真实界面;未开启伪装时自动跳首页 |
| 首页 | pages/home | 一键求助置顶、四个功能入口、反家暴科普、快速离开悬浮按钮 |
| AI 咨询 | pages/chat/chat | 文字/图片/语音(mock),关键词规则 mock 回复,结论卡片带行动按钮 |
| 历史会话 | pages/chat/history | 会话列表、只读回看、继续话题、删除 |
| 社群 | pages/community | 帖子列表、标签筛选、工作人员回复标识 |
| 发帖 / 帖子详情 | pages/community/post, detail | 匿名发布、隐私提示、工作人员回复置顶 |
| 证据库 | pages/evidence/list | 时间线、类型筛选、存证状态 |
| 上传证据 | pages/evidence/upload | 照片/语音/文字,提交后展示存证回执(mock) |
| 证据详情 | pages/evidence/detail | 存证信息、补充备注、删除(二次确认) |
| 一键求助 | pages/sos | 110/12338 拨号、附近机构(mock)、报警话术 |
| 我的 | pages/mine | 匿名身份、历史记录入口、隐私设置、清缓存 |
| 隐私设置 | pages/settings/privacy | 伪装模式开关、解锁密码设置、安全须知 |

## Mock 边界(接后端时替换)

- `common/store.js` 全部函数 -> REST API
- AI 回复:`pages/chat/chat.vue` 中 `mockReply()` -> agent 接口
- 语音:目前只 mock 消息,正式版接 `uni.getRecorderManager()`
- 存证回执:`addEvidence` 内 mock 的 certNo/certTime -> 服务端固化返回
- 附近机构:`pages/sos/sos.vue` 中 `MOCK_ORGS` -> 定位 + 后端查询
- 政府平台跳转:占位 toast -> web-view 或 `navigateToMiniProgram`

## 默认解锁密码

伪装模式默认密码 `1314`,可在"我的-隐私设置"修改。

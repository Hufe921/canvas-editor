# Canvas Editor 多人协同编辑示例

这是一个可直接运行的文本、图片和基础表格协同示例，不是整篇文档的定时覆盖同步。底层使用 **Yjs CRDT + WebSocket + Node.js**，浏览器继续使用本仓库的 Canvas Editor。

## 启动

在仓库根目录执行（Node.js 版本要求与仓库一致）：

```bash
npm install
npm run collab:dev
```

打开 <http://localhost:7100/>。点击“复制邀请链接”，在第二个浏览器窗口或隐身窗口打开，即可体验：

- 多人同时输入，同位置并发插入也不会整篇互相覆盖
- 粗体、斜体、下划线、字号、文字颜色和段落对齐同步
- 图片作为原子节点同步，尺寸修改保留同一个 CRDT 元素
- 固定表格结构同步，不同单元格的正文可以并发编辑并自动合并
- 在线成员、正文远端光标与远端选区，本地表格光标在远端更新后恢复
- 基于 CRDT 操作记录的本地撤销/重做（`Ctrl/⌘+Z`、`Ctrl/⌘+Shift+Z`）
- 当前页面断线后继续编辑，网络恢复后自动同步合并
- 服务端按房间持久化，重启后恢复文档
- `?room=团队名` 无法使用时可改用字母、数字、`-`、`_` 房间名，例如 `?room=team-a`

开发模式由同一个 Node.js 进程提供 Vite 页面、WebSocket 协同和健康检查：

```bash
curl http://localhost:7100/healthz
```

## 生产模式

```bash
npm run collab:build
npm run collab:start
```

生产模式由 Node.js 托管 `examples/collaboration/dist`。可通过 `PORT` 和 `HOST` 环境变量调整监听地址。

## 测试

```bash
npm run collab:test
npm run test:unit -- tests/collaboration/document.test.ts
npm run collab:test:browser
npm run collab:test:browser:insecure
```

服务端测试使用真实 WebSocket 客户端，覆盖并发插入、格式同步、在线状态、重启持久化与离线修改重连合并。文档适配器测试覆盖字符身份、样式更新、图片原子节点、表格结构、跨单元格并发合并和相对选区。

浏览器测试会构建示例、启动临时协同服务，并通过 Chrome DevTools Protocol 操作两个真实 Chrome 页面，验证原生文本输入、连续逐键输入、中文输入法提交、并发输入不重复且两端收敛、格式同步、在线成员、远端光标、协同撤销、图片同步和不同表格单元格的并发编辑；还会验证收到远端更新后，不重置选区也能继续在原单元格输入。测试结束后自动关闭浏览器和服务。`collab:test:browser:insecure` 会使用 `http://0.0.0.0` 覆盖非安全上下文，此时字符 ID 通过 `crypto.getRandomValues` 生成，不依赖仅安全上下文可用的 `crypto.randomUUID`。需要本机安装 Chrome，也可通过 `CHROME_BIN` 指定浏览器可执行文件。

构建后可另外验证开发模式：

```bash
COLLAB_BROWSER_DEV=1 node examples/collaboration/e2e/browser.mjs
```

## 实现结构

```text
examples/collaboration/
├── client/
│   ├── CanvasEditorCollaboration.ts  # 编辑器事件、CRDT 事务、协同撤销
│   ├── WebSocketProvider.ts          # 同步协议、在线状态、自动重连
│   ├── PresenceOverlay.ts            # 正文远端选区和光标
│   ├── document.ts                   # IElement[] 与递归 Y.Array<Y.Map> 适配
│   └── main.ts                       # 示例页面和工具栏
├── server/
│   ├── CollaborationServer.js        # 房间、协议、持久化、静态页面
│   ├── CollaborationServer.test.js   # 多客户端集成测试
│   └── index.js                      # 服务入口
└── shared/seed.json                  # 新房间初始文档
```

正文中的每个字符对应 `Y.Array` 中的一个 `Y.Map`。真实键盘输入在 `input` 事件完成后立即同步，中文输入法合成期间的临时文字不会提前写入；格式等修改由 `contentChange` 补充捕获。适配器把前后快照转换为字符插入、删除和属性更新，远端事务到达后再通过 `executeSetValue` 渲染合并结果。已有字符使用稳定 `id` 保留 CRDT 身份，新字符生成独立身份。

图片保留为单个原子 `Y.Map`，不会把图片地址拆成字符。表格的 `colgroup`、`trList` 和 `tdList` 递归映射为 Yjs 数组，每个单元格的 `value` 都是独立正文数组；表格、行和单元格使用稳定 `id`，因此两个客户端修改不同单元格时可以同时保留双方内容。

光标不发送普通数组下标，而是发送 **Yjs RelativePosition**。因此其他人在前方插入或删除文字后，本地选区与远端光标仍能锚定原来的字符。单元格选区额外携带表格、行和单元格身份，并以该单元格的正文数组为锚点；适配层同时保存编辑器的表格位置上下文，换算内部零宽占位符的下标，在远端渲染后恢复本地选区。编辑器新增的只读命令 `command.getRangeRects(range)` 用于查询正文选区坐标，表格内远端光标暂不绘制。

文档以 Yjs 二进制更新保存到 `examples/collaboration/.data/<room>.ydoc`，写入采用临时文件原子替换，该目录已加入 `.gitignore`。

## 示例边界

当前支持图片和固定表格结构中的正文协同，但不保证并发增删行列、合并或拆分单元格等结构操作正确合并，也未实现控件、页眉页脚等复杂结构的 CRDT 映射。表格内远端光标不会绘制到正文上。

示例工具栏把图片转为不超过 5 MB 的 data URL 直接放入文档，便于演示；生产环境应改用资源存储并只同步图片地址。它不是完整的生产协同后端：未包含登录鉴权、房间权限、限流、多实例广播、数据库和浏览器 IndexedDB 离线缓存。断线编辑保留在当前页面的内存文档中，离线状态刷新页面不能恢复未同步修改。

生产化时可在现有协议上增加鉴权与持久化数据库；多实例部署需要共享文档存储和跨实例更新广播。

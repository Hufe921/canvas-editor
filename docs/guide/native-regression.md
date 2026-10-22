# T22 原生文字管线功能验收

本阶段将旧同步测试迁移到 `ready` 生命周期，执行全量功能回归，
并把字体、编辑、打印及缺字恢复纳入真实浏览器矩阵。T23 性能和资源验收、
T24 最终删除审计继续独立执行。

> 2026-10-22 补充：Node24 与最终发行/资源/删除验收见
> [T23/T24 报告](./native-release-acceptance.md)。下文保留 T22 当时的环境和结果。

## 测试基础

- `tests/factories/editor.ts` 使用 `Editor.create`；`tests/factories/draw.ts`
  等待 `Draw.ready`。两者固定加载本地真实字体，关闭自动下载。
- `tests/factories/fonts.ts` 提供 Latin/CJK/Arabic/Devanagari/Thai 的固定字体字节。
  故意缺字、初始化失败、下载行为测试仍自行配置字体。
- `tests/setup.ts` 默认拒绝 fetch，HTTP 行为只能使用明确的模拟响应；
  并让 Canvas `measureText/fillText/strokeText` 调用立即失败。
- Cypress 的普通功能与迁移套件均安装相同的浏览器文字 API 守卫。
  普通功能测试拦截公网字体服务；Bunny 真实网络烟测单独显式运行。
- 删除旧 `measureText` 假度量和已移除的 paint-filter 私有方法依赖；
  表格断言使用原生可见窗口、真实字体高度和有效的续页文字位置。
  同一表格行跨页时可以同时出现在两个窗口，连续性按可见高度验证。
- T01 快照及 T10 几何 JSON 保持原始哈希，未重录历史基线。

## 功能矩阵

| 范围                            | 自动化覆盖                                                           |
| ------------------------------- | -------------------------------------------------------------------- |
| 中文/Latin/阿拉伯文/印地文/泰文 | HarfBuzz 真字体整形单测、统一整形浏览器用例、多语野餐报名表          |
| emoji、组合符、ZWJ 家庭序列     | 缺字方框与诊断、整簇选择/删除、撤销/重做、打印                       |
| 段落                            | 段前后间距、行高、对齐、RTL、列表、装饰、空段、分页符                |
| 控件                            | 六种控件、占位符、隐藏、minWidth、嵌套、级联、计算、选择与输入       |
| 表格与对象                      | 合并、嵌套、跨页窗口、重复表头、maxPageNo、浮图、公式、Block、缩放   |
| 编辑交互                        | 点击命中、拖选、Shift 扩展、逻辑/视觉导航、IME、beforeinput、历史    |
| 辅助文字                        | 页眉页脚、页码行号、水印、标尺、列表标记、图片题注、占位提示         |
| 下载默认开启/关闭               | 缺字触发默认下载、false 零 Bunny 请求、运行时开关、并发订阅          |
| 下载成功/失败                   | 字体注册与恢复、有限失败、手动重试、不支持脚本停止自动请求           |
| 缓存与多片段                    | CSS/二进制去重、IndexedDB 重载、中文基本片段选择、资源身份和缓存失效 |
| 缺字 UI                         | 首屏提示、日志去重、语言切换、打印隐藏、手动补字体恢复、实例销毁     |
| 发行入口                        | tarball 原生 ESM、独立 bundler、公开字体示例的浏览器用例             |

## 回归修复

1. 复选框/单选框文字的左半区按操作目标命中，避免最近 caret 指向前面的框，
   导致点击标签显示编辑光标。
2. 控件预留空白与 postfix 共用源索引时只生成一个视觉停靠点，
   避免 RTL 视觉导航回跳或循环。
3. 表格列表元数据在拆分之前传递，续页不重复标记。
4. `executeSetValue` 建立历史基线，使未先聚焦折叠光标时的首次选区删除也可撤销。
5. 缺字提示位于宿主工具栏下层；1366px 视口压缩工具栏间距，保留首尾按钮。
6. 搜索弹层先重置逻辑 inset，再设置物理坐标，避免 `insetInlineStart`
   覆盖刚设置的 `left` 而把弹层推出视口。
7. 补齐历史跳过的嵌套控件输入替换用例，使用外层控件内的有效选区，
   动态验证内层控件随选区被替换。
8. 旧 Cypress 等待 ready，页面模式测试使用真实枚举并往返切换，
   避免无效的 `PAGING` 大写字符串。

## 执行结果

2026-10-18，macOS 26.4.1，Node 22.22.1 / pnpm 10.32.1，Cypress 15.21.1。

| 检查                                           | 结果                                                                                                |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 全量 Vitest（离线及 Canvas 文字 API 守卫开启） | 152 文件、983 项全部通过                                                                            |
| 原有功能 Cypress / Chrome 155                  | 31 组、148 项通过、1 项历史跳过；补齐后嵌套控件组 15/15 通过，覆盖原跳过项；原有 149 项均已动态验证 |
| 迁移 Cypress / Chrome 155                      | 17 组、63 项通过；6 项按运行范围保留为 pending，已由下面两组独立运行覆盖                            |
| Bunny 真实网络独立烟测                         | 2/2：五类基本字体资源与编辑器自动恢复                                                               |
| ESM tarball 浏览器消费                         | 16/16：原生 ESM 6、独立 bundler 6、公开字体示例 4                                                   |
| Firefox 151 / Playwright                       | 14/14 场景通过，含混排、worker、打印、缺字恢复、emoji 编辑                                          |
| WebKit 26.5 / Playwright                       | 14/14 相同场景通过                                                                                  |
| TypeScript、ESLint、diff 空白检查              | 通过                                                                                                |
| 库构建与包检查                                 | 库构建成功；tarball / 严格消费类型 / 相对 ESM chunk / 公开字体示例检查通过                          |

6 个 migration pending 项为公网烟测 2 项、仅对发行示例运行的 4 项，
不存在把失败的功能用例临时跳过的情况。最终单测没有 skip；旧嵌套用例已取消 skip。

本轮曾在多浏览器与全量单测高度并行时发生测试超时；收敛并发后完整重跑成功。
离线守卫也发现拼写插件的字体无关词典 mock 放在 beforeAll、会被全局 beforeEach 覆盖，
现已将固定本地词典响应改为逐用例安装。

已查看 WebKit 段落截图及 Chromium 多语表单截图，检查文字、表格、控件与缺字方框的位置。
Firefox/WebKit 的 6 个 native fixture 项验证初始化与原生布局产出；
完整鼠标拖选、IME、对象缩放等交互断言由 Chromium Cypress 承担，
两个浏览器另执行多语编辑/整簇撤销重做、字体恢复及打印闭环。

浏览器矩阵记录位于 `cypress/results/{firefox,webkit}/report.json`，
对应六个基线的页面截图保存在同目录；这些是忽略的运行产物，复跑生成。
Cypress 多语样本截图为 `native-multilingual-weekend.png`。
浏览器验证包含打印 PNG 和缺字恢复；不等同于人工印刷校样或像素金图比对。

## 复跑

```sh
pnpm exec vitest run --maxWorkers=2
pnpm run type:check
pnpm exec eslint src tests cypress scripts --no-warn-ignored
pnpm exec vite --host 127.0.0.1 --port 3000 --strictPort
pnpm exec cypress run --browser chrome
pnpm exec cypress run --config-file cypress.migration.config.ts --browser chrome --config baseUrl=http://127.0.0.1:3000
pnpm exec cypress run --config-file cypress.migration.config.ts --spec cypress/migration/bunny-font-provider.cy.ts --browser chrome --env BUNNY_LIVE=1 --config baseUrl=http://127.0.0.1:3000
```

Firefox/WebKit 使用可选 Playwright QA 运行时（不加入编辑器运行依赖）：

```sh
# PLAYWRIGHT_MODULE 指向已安装 playwright 的 index.mjs；安装在项目内时可省略。
# BROWSER_EXECUTABLE 仅在需要指定现有浏览器时设置。
BROWSER=firefox node scripts/test-native-browsers.mjs
BROWSER=webkit node scripts/test-native-browsers.mjs
```

包消费浏览器检查先构建库，再运行 `pnpm run test:package -- --serve`，
然后使用 migration 配置、`baseline.cy.ts,public-api.cy.ts`、
`--env package=1`、`--config baseUrl=http://127.0.0.1:4179`。

当前机器只有 Node 22.22.1，而包声明要求 Node >=24.13.1；
本轮本机结果不替代目标 Node 24 环境的 CI 验收。
系统 Firefox 135 不被 Cypress 15 支持；使用本机 Firefox 151 时 Cypress BiDi
仍出现连接超时，因此 Firefox 最终矩阵改走 Playwright 原生协议。
WebKit 使用与 QA 运行时匹配的 26.5，未将其报告为 Safari 应用本体验证。

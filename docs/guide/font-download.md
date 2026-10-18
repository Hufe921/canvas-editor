# T06B：自动补字体、共享请求与缓存

## 配置与公共接口

```typescript
const editor = await Editor.create(container, data, {
  autoDownloadFonts: true // 默认值；只处理当前仍未覆盖的文本
})

editor.command.executeUpdateOptions({ autoDownloadFonts: false })
editor.command.executeUpdateOptions({ autoDownloadFonts: true })

const report = editor.getFontCoverageReport()
editor.eventBus.on('fontCoverageChange', report => {})
// 用户主动重试当前仍缺失的字体，不需要重新创建编辑器。
editor.retryFontDownloads()
```

开关仅接受 boolean。更新其他选项或传入 undefined 不会将 false 重新置为 true。
运行时更新保留未指定的现有配置，避免只切开关就重置其他配置或字体配置。

所有文字统一使用 HarfBuzz，覆盖报告驱动下载，不需要选择引擎。
当前 ready 等待 WASM、显式配置字体与初次布局，**不等待后台自动下载**。
缺字、离线和自动解码失败不会使已就绪编辑器失效，原文与占位仍可编辑。
关闭开关不发送 Bunny CSS/字体请求或预连接，也不自动注册共享缓存中的字体。
显式 `fonts.url`、`editor.register.fonts()` 仍可使用；已注册字体不会被移除。

## 调度、取消与恢复

FontDownloadManager 按当前缺失的实际字素/整形上下文调度，包含样式缺失的完整上下文，
不把 report.samples 的 16 个示例当成全部内容。80 ms 防抖合并连续输入。
字体家族/样式和文种由 T06A 的固定映射选择；不使用 UI 语言推断 Han 的地区字形。
当前文档模型没有通用文本语言提示字段，未声明地区的 Han 使用 SC 基本候选。
已配置字体优先检测，当前覆盖完整时不产生请求。

同一页面中相同 CSS 和版本化字体资源共享一次 HTTP 请求，传输并发最多 3 个。
每个订阅独立取消；关闭开关、删除对应文本、替换内容或 destroy 会撤销本实例订阅。
其他实例仍需要的请求继续，最后一个订阅取消时中止请求；尚未发出的排队请求直接移除。
当前仍需相同上下文时允许复用有效在途结果，不把旧来源位置写回文档。

下载后的提交还检查当前订阅状态，FontManager 在异步 FontFace.load 完成后再次检查取消。
旧响应不能在删除对应文字或销毁后增加字体版本、挂载 FontFace 或更新页面。
注册批次完成后清理覆盖/排版缓存并重排，保留内容、选区与历史；自动字体不改写原文 font。
绘制保留实际选中的备用字体，显式声明但缺字的原家族不会覆盖解析结果。

下载成功必须重新检测真实 cmap/HB/轮廓。仍缺字或缺样式时终止本轮并保留失败诊断，
不会无限下载同一基本字体。支持基本字形后才可能出现的真实 bold/italic 缺口会单独处理。
首选家族缺少所需样式时，解析器会继续查找能覆盖内容的真实匹配样式备用字体；
只有全部候选都不满足样式时才返回 missingStyle，不停在首选 regular。
未知文种、emoji、没有对应样式或元数据的类别明确进入 unsupported。

## 状态与通知

报告包含 autoDownloadFonts，各 issue 的 downloadStatus 为 disabled / idle / loading /
failed / unsupported；attemptedDownloads 记录 Bunny 家族、字重、样式、资源 ID 及结果。
downloadFailure 与 failureStage 区分 fetch、decode、parse、register 失败。
下载已成功的尝试可标记 resolved；实际覆盖成功的 issue 从当前快照删除，事件携带最新集合。
resolved 不会作为历史缺字项永久保留。

相同重绘不重复通知；状态变化和当前集合变化才发布新的快照。
retryFontDownloads 取消本实例旧任务，清除相关资源的缓存/失败标记后重新处理当前集合。
关闭状态下调用重试不会发请求；该接口在 ready 后使用，销毁后报错。
默认内建 `.ce-font-diagnostics` 非阻塞状态区域，无需宿主订阅事件。
加载中、已解决、失败、无适用字体和手动补字体均有状态提示；展开后显示文种、
不同字符/序列数量、所需字重/样式、最多 16 个 grapheme 样例及 32 个码点。
未知文种使用脚本标识；汉字/CJK 不代表某种语言。不支持的字形格式有独立说明。
完整字符、来源位置和失败信息仍通过 `getFontCoverageReport()` 查询。

提示采用 `role="status"`、polite live region 和原生 details/summary，支持键盘展开、
中英文、宿主语言包与运行期语言/RTL 切换。提示绝对定位于实例外壳，
不改变画布原点，不进入文档、历史、分页、画布导出；打印模式及打印 CSS 均隐藏。
补字体或删除缺字后撤销详情，显示已解决状态；从未出现缺字的实例保持隐藏。
实例销毁时移除 DOM、快照与告警集合，不新增全局事件订阅。

自动下载关闭、失败、无适用候选或下载后仍缺字时输出 `console.warn`。
按当前缺失集合、文种、字重/样式、原因及下载状态去重，忽略重复次数、
来源位置和布局 revision；重绘、重复输入同一缺字和切换语言不会刷屏。
恢复/删除后清除相应告警键，将来重新出现可再次告警；重试失败也是新的状态周期。
日志只包含有限样例/码点及诊断摘要，不输出完整来源片段或位置；
加载中不输出缺字告警。多个编辑器分别维护提示和告警集合。

## 缓存与请求边界

FontResourceStore 是共享的传输层：

- 内存正缓存最多 64 项、32 MiB，按最近使用淘汰。
- 同源 IndexedDB `canvas-editor-bunny-fonts-v1` 保存原始 CSS/字体二进制及响应元数据，
  同样最多 64 项、32 MiB；存储不可用、权限失败、配额不足或操作超时会退到内存。
- CSS 最长缓存 1 小时；字体最长 24 小时，响应 max-age 更短时从其值。
  no-store / no-cache 不写缓存。过期后通过 cache: no-cache 请求重新验证，不能永久按家族复用。
- 字体缓存键包含官方 URL 和 CSS 内容版本；URL 本身包含家族、样式、片段。
  注册身份进一步包含实际字体内容版本；CSS 或资源更新会产生不同的有效身份。
- 404、MIME/体积错误不重试；网络、超时、5xx 最多尝试 2 次。
  单次传输超时 6.5 秒，提供方请求整体仍受 15 秒预算约束；排队等待也可取消。
- HTTP 失败有 30 秒负缓存，不写持久层；当前缺失集合一轮失败后等待内容变化、开关切换或手动重试。
  格式/解析失败会失效对应坏资源，避免手动重试重复命中损坏内容。

缓存只保存公开字体/CSS 与版本元数据，不保存文档文字、缺字样例、来源位置或编辑器状态。
所有网络 URL 仅含固定家族与样式，文档上下文只在本地用于选择片段。
活动 FontManager 中已注册的字体不受资源缓存淘汰影响。
同页面实例共享在途请求；跨刷新/标签页可共享持久缓存，但并发跨标签冷启动不实施分布式网络锁。

## 验证（2026-10-17）

- 11 个相关单测文件、105 项通过，覆盖默认开关、关闭零请求、显式字体 URL、切换、
  多实例取消、旧响应、FontFace 延迟提交、重试、无效/未覆盖资源、缓存版本/TTL/LRU 与存储失败。
- 两项真实浏览器生命周期检查通过，HTTP 使用固定字体测试桩，检查真实 FontFace 注册与 IndexedDB 跨刷新复用。
- 两项真实 Bunny 联网检查通过，包括五类实际 WOFF/WOFF2 字体，以及编辑器默认自动补齐阿语、首选 regular 缺少 bold 时补齐真实 700 字重的闭环。
- TypeScript、相关 ESLint、ESM 构建和发行包静态消费检查通过，保留既有分块/Node 兼容分支构建提示。
- 全量单测、多浏览器、IME、打印等仍按之前安排留待全部改造完成；不重录 T01 快照。

```bash
pnpm exec vitest run tests/editor/font-download.test.ts tests/core/text-engine/font-resource-store.test.ts
pnpm exec vite --host 127.0.0.1 --port 4318 --strictPort
pnpm exec cypress run --config-file cypress.migration.config.ts --spec cypress/migration/font-download.cy.ts --config baseUrl=http://127.0.0.1:4318
# 显式联网验证
pnpm exec cypress run --config-file cypress.migration.config.ts --spec cypress/migration/bunny-font-provider.cy.ts --env BUNNY_LIVE=1 --config baseUrl=http://127.0.0.1:4318
```

### T07 定向验证

- 35 项字体诊断 UI、下载/覆盖及 ready 生命周期定向单测通过。
- 4 项浏览器检查覆盖默认下载与缓存、关闭零请求、提示展开不改变画布坐标、
  语言/RTL 切换、打印隐藏、多实例销毁及失败告警去重。
- 全量回归仍按计划延后至后续任务全部完成。

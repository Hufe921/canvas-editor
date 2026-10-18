# HarfBuzz、字体与 ESM 迁移

> `@herberthe/canvas-editor@0.1.0`：默认且仅 Canvas 页面绘制；SVG 实现与导出暂缓，无 renderer 切换配置。参见[项目关系与差异](./fork-and-differences.md)。

当前文字排版统一使用 HarfBuzz。无需选择引擎，正文和辅助文字都不使用浏览器
`fillText` / `measureText` 回退。图片、公式、表格和 Block 保留专用对象布局。

## 迁移已有代码

| 原用法                                                     | 当前用法                                                                |
| ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| `textEngine`、`renderMode`、`TextEngineMode`、`RenderMode` | 删除配置及对应导入；没有替代的模式开关                                  |
| 构造后立即执行修改/几何命令                                | `await Editor.create(...)` 或 `new Editor(...)` 后 `await editor.ready` |
| UMD script、`require()`、内部深路径导入                    | 从 `@herberthe/canvas-editor` 包根使用 ESM import                       |
| 仅指定字体家族/系统安装字体/CSS @font-face                 | 自动下载基本字体，或提供 `fonts` 二进制/URL、调用 `register.fonts`      |
| 修改 options.fonts 数组以为已加载字体                      | 初始字体放进构造选项；运行期使用 `await editor.register.fonts(...)`     |

JavaScript 构造选项或 `executeUpdateOptions` 只要含 `textEngine` / `renderMode`，
即使值为 undefined，也会抛出 TypeError 并提示移除。已持久化 options 应由宿主显式
去掉这两个键再创建实例，文档正文无需因引擎迁移改写。不要把删除选项理解成可恢复旧引擎。

```typescript
import Editor, { RowFlex } from '@herberthe/canvas-editor'

const editor = await Editor.create(container, {
  header: [{ value: 'Header', rowFlex: RowFlex.CENTER }],
  main: [{ value: 'Hello 世界 مرحبا' }],
  footer: [{ value: 'Footer' }]
})
editor.command.executeSetRange(0, 1)
```

`ready` 等待 WASM、显式字体和首次布局，不等待后台补字体。缺字不使初始化失败；
未覆盖内容保留原文、占位和编辑能力。WASM 或首次布局失败时 ready 拒绝，
`initializationError` 保留 cause；`Editor.create` 自动销毁失败实例。
状态为 initializing / ready / failed / destroyed。
初始化期间只允许 getValue、getValueAsync、getLocale、getContainer 只读查询，
以及显式等待的 `executeComputeElementListHeightAsync`；其他修改和几何命令不排队。
同步测高 `executeComputeElementListHeight` 在 ready 后继续同步返回 number。

## 自动下载与覆盖边界

`autoDownloadFonts` 默认 true，按当前实际缺字从 Bunny Fonts 下载基本字体。
下载接口与缓存不上传文档原文；固定家族/字重/样式出现在网络 URL 中，
全文上下文仅在本地选择片段。网络策略需允许 `https://fonts.bunny.net` 的 CSS 和字体资源。
字体与 WASM/解码器资源也受宿主 CSP、浏览器能力及部署路径影响。

当前候选包括 Noto Sans（Latin/Greek/Cyrillic）、Noto Sans SC/JP/KR、
Noto Naskh Arabic、Noto Sans Devanagari 和 Noto Sans Thai。
自动调度没有通用内容语言提示，未注明地区的 Han 使用 SC 候选；
不能用 UI 语言推断地区。TC 等地区字形可通过显式字体注册提供。
基本子集并非完整 Unicode 字库，罕见汉字、emoji/ZWJ、未验证文种和特殊样式可能
仍需额外字体。普通缺字先尝试 400 normal；实际样式缺失只请求映射支持的真实样式，
不承诺所有家族或脚本都有 bold/italic，不通过浏览器合成覆盖。

```typescript
editor.command.executeUpdateOptions({ autoDownloadFonts: false })
editor.command.executeUpdateOptions({ autoDownloadFonts: true })
editor.retryFontDownloads() // ready 后使用；关闭状态下不会发起自动请求
```

关闭时不自动请求 Bunny 资源或从共享缓存注册字体，仍可使用显式 URL 和手动注册；
已有字体保留。失败、离线、关闭或无适用字体时，内建页面状态区域及去重的控制台
告警提示缺失类别。自动下载实现与验证记录见[字体下载](./font-download.md)及
[Bunny 适配](./bunny-font-provider.md)。

## 手动补齐字体

安装在操作系统中不等于已向 HarfBuzz 提供字节。离线部署应关闭自动下载，
将所需字体随应用同源部署，提供真实家族/字重/样式与二进制数据。

```typescript
import Editor from '@herberthe/canvas-editor'

const editor = await Editor.create(container, [{ value: 'مرحبا' }], {
  autoDownloadFonts: false,
  defaultFont: 'My Arabic',
  fonts: [{ family: 'My Arabic', url: '/fonts/Arabic-Regular.ttf' }]
})

// 也可从 <input type="file"> 获取 File；此时没有字体网络请求。
const results = await editor.register.fonts([
  {
    family: 'My Arabic',
    data: await file.arrayBuffer(),
    weight: 400,
    style: 'normal'
  }
])
for (const result of results) {
  if (result.status === 'failed') {
    console.warn(result.failure.stage, result.failure.message)
  }
}
const report = editor.getFontCoverageReport() // 注册成功后仍需验证实际覆盖
```

`fonts` 支持 TTF/OTF/WOFF/WOFF2；远程 URL 需要正确的 CORS 响应。
`register.fonts` 返回逐项 registered / duplicate / failed，失败不会等同于初始化失败。
`register.getFontFaces()` 返回已注册字体元数据快照，`getFontRevision()` 返回字体版本。
重复或失败注册不会增加字体版本。仅有字体 CSS 或 FontFace 注册不能替代字节注册。

## 诊断订阅

```typescript
import type { FontCoverageReport } from '@herberthe/canvas-editor'

const onCoverage = (report: FontCoverageReport) => {
  for (const issue of report.issues) {
    console.log(issue.script, issue.reason, issue.downloadStatus)
  }
}
editor.eventBus.on('fontCoverageChange', onCoverage)
onCoverage(editor.getFontCoverageReport()) // 获取当前快照，不依赖首次事件时序
// 宿主卸载时：editor.eventBus.off('fontCoverageChange', onCoverage)
// 或使用单个回调槽：editor.listener.fontCoverageChange = onCoverage
```

报告含 revision、autoDownloadFonts、完整当前 issues（已解决项移除）、来源位置、
缺失字符/序列、有限样例、所需样式、尝试的资源及失败阶段。
issue 状态包括 disabled / idle / loading / failed / unsupported；资源尝试可为 resolved。
完整诊断可能包含文档字符和位置，是否持久化或发送由宿主决定。
内建状态区域无需订阅即可使用，不进入文档、历史或打印。

## ESM 部署和独立示例

包根导出所有公开运行时与类型，唯一额外公开子路径为 `package.json`。
保留生成的所有相对 chunk 和资源，使用支持 Worker、WebAssembly 和顶层 await 的浏览器。
Vite 构建设置 `build.target: 'esnext'`；不能只复制入口 JS 或使用 `file://` 打开页面。

独立示例位于仓库 `examples/esm-fonts`，运行说明见该目录 README；
示例仅使用包根公开 API，包含默认下载、`?auto=false` 离线启动、失败状态、重试和文件注册。
字体已覆盖后关闭下载不会移除字体，要观察关闭初始状态请重新打开离线地址。
包消费检查会从本分支 tarball 独立类型检查并构建这个示例。

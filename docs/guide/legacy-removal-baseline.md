# T01 / T02 迁移基线与执行记录

> 历史方案/基线记录，保留当时结论供审计。旧引擎、模式选择与浏览器文字回退
> 已由 T20 删除；当前 API、字体能力与示例以[迁移指南](./font-and-esm-migration.md)为准。


基线代码：`fd11752e`（迁移前），分支：`refactor/canvas-render-engine`。
本记录只验收 T01/T02；不代表 legacy 已删除、默认引擎已切换或 Bunny 下载已实现。

## 固定环境和样本

共享数据：`tests/fixtures/migration/documents.ts`，每次创建独立模型，避免布局回写污染。
视口 1366×720，DPR=1，页面 480×640，边距四边 32，字号 16，缩放 1，关闭增量。
字体：仓库内 `public/fonts/NotoNaskhArabic-Regular.ttf`，400 normal。
SHA-256：`67b5a525a661b607971fbd3f96a81b89d3a768e74534fca84f18ac97e6fab72f`。
单测使用真实字体二进制和真实 HarfBuzz WASM，但 Canvas 是 mock；其宽度不能当作浏览器像素结果。
浏览器使用同一二进制并注册 FontFace，不依赖系统 Arabic 字体或外网下载；数据 URI 图片无需外网。
字体未承诺覆盖所有脚本，中文/emoji/缺字能力由后续字体任务独立验收。

| 样本 ID | 固定覆盖 | 后续回归任务 |
| --- | --- | --- |
| paragraphs | RTL/LTR 混排、长段折行、段前后距、空段、上标 | T08/T09/T11/T17/T18 |
| emr-controls | 姓名/年龄/诊断、文本/数字控件、空值占位、minWidth、边框、required | T06/T07/T14/T17 |
| nested-table | 二列父表、单元格文字、内嵌二列表 | T10/T12/T15/T17 |
| surround-columns | 本地图片环绕、两栏、连续长文 | T10/T13/T15 |
| mixed-paper | 竖→横→竖，显式分页，三页 | T15/T16/打印 |
| print | 页眉页脚、表格、长段、显式分页、PRINT 模式 PNG 导出 | T13/T15/T16/T22 |

两种现有模式分别冻结，不要求 legacy 与 HB 几何相等。单测保留可读的行宽/高/基线、
分页方向和尺寸；全部位置坐标取三位小数后用 SHA-256 固定，缺失位置索引单独显示。
不包含随机 ID、时间和内部字形缓存。测试正常运行不得使用 `--update`。
确认行为变更时先检查具体差异并增加针对性断言，再人工审核更新；禁止批量重录掩盖失败。

真实浏览器测试同时检查真实 Worker 的字数和异步保存、HarfBuzz WASM 实例化、
字体 HTTP 成功、PRINT 导出每页有可见墨迹，并截图供人工比较。
截图是审查产物，未引入跨机器像素阈值；打印对话框与物理打印尚属 T22 的人工验收。

## 当前接口、元素与容器清单

包根保留默认 Editor、具名枚举/工具/类型；实例入口为 command、listener、eventBus、
override、register、macro、use、destroy、version。ready 和字体诊断注册尚未实现。

Editor 配置/数据相关接口：`ILabOption`、`IEditorData`、`IEditorOption`、`IEditorResult`、`IEditorHTML`、`IEditorText`、`IUpdateOption`、`ISetValueOption`、`IFocusOption`、`IPrintModeRule`、`IReadonlyModeRule`、`IFormModeRule`、`IModeRule`。
完整具体字段以 `src/editor/interface/Editor.ts` 为准，T03/T21 修改时逐项对照。
命令接口冻结清单共 165 项（含执行、查询及注册包装成员）：

`executeMode`、`executeCut`、`executeCopy`、`executePaste`、`executeSelectAll`、`executeBackspace`、`executeSetRange`、`executeReplaceRange`、`executeSetPositionContext`、`executeForceUpdate`、`executeBlur`、`executeHideCursor`、`executeUndo`、`executeRedo`、`executePainter`、`executeApplyPainterStyle`、`executeFormat`、`executeFont`、`executeSize`、`executeSizeAdd`、`executeSizeMinus`、`executeBold`、`executeItalic`、`executeUnderline`、`executeStrikeout`、`executeSuperscript`、`executeSubscript`、`executeColor`、`executeHighlight`、`executeTitle`、`executeList`、`executeRowFlex`、`executeDirection`、`executeRowMargin`、`executeSpacingBefore`、`executeSpacingAfter`、`executeInsertTable`、`executeInsertTableTopRow`、`executeInsertTableBottomRow`、`executeInsertTableLeftCol`、`executeInsertTableRightCol`、`executeDeleteTableRow`、`executeDeleteTableCol`、`executeDeleteTable`、`executeMergeTableCell`、`executeCancelMergeTableCell`、`executeSplitVerticalTableCell`、`executeSplitHorizontalTableCell`、`executeTableTdVerticalAlign`、`executeTableBorderType`、`executeTableBorderColor`、`executeTableTdBorderType`、`executeTableTdBorderColor`、`executeTableTdBorderWidth`、`executeTableTdSlashType`、`executeTableTdBackgroundColor`、`executeTableAutoFitToContent`、`executeTableAutoFitToPage`、`executeTableSelectAll`、`executeImage`、`executeHyperlink`、`executeDeleteHyperlink`、`executeCancelHyperlink`、`executeEditHyperlink`、`executeSeparator`、`executePageBreak`、`executeAddWatermark`、`executeDeleteWatermark`、`executeSearch`、`executeSetSpellcheckRangeList`、`executeSearchNavigatePre`、`executeSearchNavigateNext`、`executeReplace`、`executePrint`、`executeReplaceImageElement`、`executeSaveAsImageElement`、`executeSetImageCrop`、`executeSetImageCaption`、`executeChangeImageDisplay`、`executePageMode`、`executeSetColumns`、`executePageScale`、`executePageScaleRecovery`、`executePageScaleMinus`、`executePageScaleAdd`、`executePaperSize`、`executePaperDirection`、`executePageDirection`、`executeSetPaperMargin`、`executeSetMainBadge`、`executeSetAreaBadge`、`executeInsertElementList`、`executeInsertArea`、`executeSetAreaValue`、`executeSetAreaProperties`、`executeDeleteArea`、`executeLocationArea`、`executeClearGraffiti`、`executeToggleTrace`、`executeCompare`、`executeToggleRuler`、`executeAppendElementList`、`executeUpdateElementById`、`executeDeleteElementById`、`executeSetValue`、`executeRemoveControl`、`executeTranslate`、`executeSetLocale`、`executeLocationCatalog`、`executeWordTool`、`executeSetHTML`、`executeSetGroup`、`executeDeleteGroup`、`executeLocationGroup`、`executeSetZone`、`executeSetControlValue`、`executeSetControlValueList`、`executeSetControlExtension`、`executeSetControlExtensionList`、`executeSetControlProperties`、`executeSetControlPropertiesList`、`executeSetControlHighlight`、`executeValidate`、`executeClearValidate`、`executeLocationControl`、`executeInsertControl`、`executeJumpControl`、`executeUpdateOptions`、`executeUiDirection`、`executeInsertTitle`、`executeFocus`、`executeComputeElementListHeight`、`getCatalog`、`getImage`、`getOptions`、`getValue`、`getValueAsync`、`getAreaValue`、`getHTML`、`getText`、`getSpellcheckWordList`、`getWordCount`、`getCursorPosition`、`getRemainingContentHeight`、`getRange`、`getRangeText`、`getRangeContext`、`getRangeRow`、`getRangeParagraph`、`getRangeParagraphDirection`、`getSurroundElementList`、`getKeywordRangeList`、`getKeywordContext`、`getPaperMargin`、`getColumns`、`getSearchNavigateInfo`、`getLocale`、`getGroupIds`、`getGroupRectList`、`getControlValue`、`getControlList`、`getContainer`、`getTitleValue`、`getPositionContextByEvent`、`getElementById`

元素共 19 类：text、image、table、hyperlink、superscript、subscript、separator、
pageBreak、control、area、checkbox、radio、latex、tab、date、block、title、list、label。
控件类型：text、select、checkbox、radio、date、number。
容器/流：main、header、footer、递归 td、Area 区域、Block iframe/video、行内对象、
浮动/环绕对象、分页、分栏；编辑模式、缩放、纸张方向和打印均影响消费侧。

本轮六个组合样本不替代完整功能矩阵。其余对应现有测试：

| 能力 | 当前证据 / 后续门槛 |
| --- | --- |
| 选择、命中、逻辑/视觉移动、BiDi | `tests/core/text-engine`、`tests/core/position`；T17 真实交互 |
| 增量、撤销重做、段距选区 | `incremental-paragraph.test.ts`；T18 全量差分 |
| 控件赋值、校验、级联、各控件类型 | `tests/core/control`；T14/T22 交互复核 |
| 表格、合并、Area、边框、嵌套 | `tests/core/draw`、`tests/core/table`；T12/T15 全迁移 |
| 图片、公式、Block、列表、装饰 | 现有单测；T13/T14/T16 逐项迁移，六样本不证明完整覆盖 |
| 剪贴板/HTML/保存/历史/插件 | 现有 utils/editor/plugin 测试；T19/T21 序列化契约 |
| 中文/Latin/复杂脚本/emoji、字体缺失 | 当前不保证全部 HB；T05–T09、T22 独立覆盖 |
| 多浏览器、IME、移动输入、实际打印 | 本轮未宣称通过；T22 验收 |

## 已知问题与边界（不是本轮新增回归）

- `paragraphs` 的 HarfBuzz 布局在元素索引 116 缺少位置，legacy 无此缺口。
  快照显式记录为 missing=[116]，不得把空洞过滤掉后宣称几何完整。T17 修复后增加命中断言。
- 当前 HarfBuzz 模式仍有 BrowserTextShaper、浏览器文字绘制和对象/表格 legacy 回退。
  样本通过不等于纯 HB 通过；`engine` 标记可供后续核对，但不是删除审计证据。
- 当前纯文本增量有适用条件，复杂结构仍全量重排；默认配置仍保留旧模式。
- 迁移前库 ESM 输出可生成，但 UMD 因 harfbuzzjs 顶层 await 失败；T02 删除 UMD 目标。
- 消费端原有声明泄漏 `@/editor/interface/Print`、未发布 CSS 和缺失字体类型依赖；
  T02 修复了相对引用、类型侧 CSS import、发布依赖及 Emscripten 引用。
- 构建仍有 harfbuzzjs 的 Node `module` 浏览器外部化分支、无效动态分块和大 chunk 提示；
  通过真实浏览器消费验证其可运行，不把警告当成 UMD 失败。

## T02 发行契约

- `build.lib.formats=['es']`，构建前清理 dist，保留 sourcemap 和声明。
- 删除 UMD main；保留 module，使用标准 types；exports 根入口只有 types/import，
  不提供 require/default 条件。唯一附加公开子路径是 `package.json`。
- README 与中英文入门文档审计未发现已声明的内部子路径 API；具名导出保留根入口。
  `dist/*`、`src/*` 深路径不再允许。此项和删除 require 均为破坏性发行变更。
- 发布预处理不再要求 UMD，也不删除声明所需依赖；发现旧 UMD/CJS 文件时拒绝发布。
- `test:package` 先 npm pack，再解包到独立临时工程，严格类型检查（skipLibCheck 未开启）、
  验证 CommonJS 解析被拒绝、运行发布预处理及残留文件拒绝检查、构建独立 Vite 消费端，
  检查相对 chunk；仅从锁文件已安装的声明依赖离线链接，未执行公共 npm 安装。
- `--serve` 提供 `/native/`（原生 import map、无消费端打包）和 `/bundled/`（Vite）两种
  非根路径页面。Worker 与 WASM 由发行 JS 内联携带，字体由消费工程相对路径提供，
  不假设必须存在独立 `.wasm` 文件，也不承诺本轮实现默认字体包。

## 重复执行

```bash
pnpm exec vitest run tests/core/migration/baseline.test.ts
pnpm exec vite --host 127.0.0.1
# 另一终端，检查源代码样本
pnpm run test:migration:browser --browser electron

# 构建发行包并生成独立消费页面
pnpm run lib
pnpm run test:package -- --serve
# 另一终端，检查 tarball 的两种消费模式
pnpm run test:migration:browser --browser electron \
  --config baseUrl=http://127.0.0.1:4179 --env package=true
```

源代码人工入口：`http://127.0.0.1:3000/canvas-editor/tests/fixtures/migration/index.html`。
参数：`sample=...&engine=legacy|harfbuzz`，默认 paragraphs/harfbuzz。
截图输出 `cypress/screenshots`，保持环境一致再做视觉比较。
测试专用 Cypress 配置不纳入既有应用部署 E2E（发行 app 不包含测试页面）。

## 本轮验证结果

- 已执行全量单测：123 个文件、741 项通过（T03 之前的 T01/T02 工作状态）。
- 库/应用构建、独立 tarball 静态消费、严格类型检查已通过。
- 浏览器样本页面可以完成 Worker/字体/PRINT 导出；Cypress 的 WASM 观测断言
  仍失败（migrationWasmCount 未产生），因此不能标记 T01/T02 浏览器验收通过。
- 按当前要求暂停浏览器回归，待代码改造完成后统一修复观测并重新执行。
- 已确认异步保存未返回 graffiti；当前比较正文/页眉/页脚，未宣称涂鸦往返已验收。

## T10 几何提取验证补充（2026-10-17）

T10 复用上述六组样本，以 T09 完成时的当前几何为拆分前参照，新增 12 项只读对比。
原 T01 快照没有更新；该验证证明本次提取的行为保持，不表示迁移前/后全部文本排版相同。
独立表格/对象测试和 8 项浏览器样本也已覆盖，详见 [布局职责提取](./layout-geometry.md)。
浏览器同时揭示并修复了 legacy 分页符依赖零宽字符测宽的边界，混合纸张现可导出三页。
原 T01 的完整浏览器/截图回归仍保留在后续统一验收范围。

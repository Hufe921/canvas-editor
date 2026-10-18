# T03：原生布局与字体诊断协议

T03 仅定义协议、类型导出和通用几何/版本规则。现有排版、绘制、命中仍使用当前路径；
后续任务接入原生节点后才移除旧行投影。本项不实现 ready、字体下载、缺字检测或默认引擎切换。

## 唯一坐标和版本约定

- 几何使用所属 scope 内、未乘缩放或 DPR 的 CSS 像素。进入页面/画布时统一做变换，
  不能把物理像素再混入布局。`LayoutScope.rect` 描述其在父 scope/页面中的放置。
- `LayoutNode.rect` 是内容盒，不包含段前/段后间距；隐藏节点保留来源身份，但不占空间、
  不绘制。`getLayoutFlowHeight` 给出外部流推进高度，选区消费内容盒和 caret 高度。
- `TextLine.contentHeight = rect.height`，baseline 是距内容盒顶部的偏移。
  段前距只记在段落首行，段后距只记在末行。空段仍有行盒和插入 caret。
- glyph 的 x/y 相对行原点/基线；offsetX/offsetY 是整形偏移，Y 均向下为正。
  字形携带真实 face/片段 ID、字重、样式和 fontRevision，不把 CSS family 当作字体身份。
- 文档和字体 revision 都是非负、单调递增整数；只有两个 revision 都等于当前值时才接受结果。
  `isCurrentLayoutRevision` 同时用于异步布局结果和字体诊断快照，旧结果不能复活已解决问题。
- scope 是稳定、不解析其内部格式的标识，可使用 main/header/footer/td:{id}。
  `getLayoutSourceKey` 组合 scope、稳定节点 ID 和逻辑范围，避免不同单元格索引串用。

## 索引、cluster 和 caret

`LayoutSource.start/end` 是所属 scope 的宿主元素逻辑半开区间 `[start,end)`，
绝不能使用视觉序。`LayoutCluster.textStart/textEnd` 是段落文本 UTF-16 半开区间，
边界不能拆开 Unicode 标量；`logicalIndices` 显式保存连字/多元素 cluster 的来源。
`glyphStart/glyphEnd` 引用当前行视觉序字形数组，glyph 反向通过 clusterIndex 找到 cluster。

一个宿主元素可以保存多个 UTF-16 单元，因此 caret 不再只使用一个元素下标：
`position.elementIndex + position.offset` 表示原元素内插入点。只提供合法字素/cluster 停靠点，
不允许停在代理对中间；BiDi 交界处使用 upstream/downstream affinity 区分同一逻辑点的两个视觉位置。
所有 caret、cluster 的 rect 都在所属 scope 坐标系。不得通过逐字符累加 advance 再造第二份命中几何。

## 显式节点分类

| kind | 内容 | 约束 |
| --- | --- | --- |
| textLine | 字形、cluster、caret、段落 ID、方向、内容高度、段距 | 空段也明确生成行；内联盒放入 inlines |
| inlineObject | 图片、公式、勾选框、radio、tab、控件补白 | 提供 advance/ascent/descent/anchor，不冒充文本字形 |
| block | iframe、video、Area、浮动对象、分隔线 | 明确对象类型和子节点 |
| tableFragment | 页面上的逻辑表格片段及单元格布局 | 保留原 tableId，不在模型中复制表格 |
| break | 页/栏/段断点 | paperDirection 作用于断点之后，保留逻辑 caret |
| missingGlyph | 原文字串、诊断 ID、占位几何和 caret | 占位宽度不是实际字宽，不替换文档值 |

单元格子布局使用自己的 scope，cell.rect/contentRect 描述其在表格所属 scope 内的位置。
TextLine.inlines 的盒已包含在行内容中，父流只能推进一次行高，不能再加内联盒高度。
原生调度只检查 `kind`，不以 `engineLine` 是否存在决定回退。
`IRow` 暂为旧宿主 DTO，T17/T19 才迁移其消费者；本项不向它塞入一份重复原生状态。

跨页表格片段的 `[startRow,endRow)` 是逻辑行半开区间。startRowOffset 表示首行已消耗的高度；
endRowOffset 表示末行的独占截断高度，null 表示末行完整。repeatedRows 单独存放回显表头，
不改变片段逻辑行区间，也不生成新的持久化节点。scope placements 支持同一页眉/页脚跨页复用。

## 字体诊断契约

`FontCoverageReport` 是可查询、可比较的当前完整快照，携带两个 revision 和下载开关状态。
EventBusMap 已声明 `fontCoverageChange` 的载荷类型；实际检测、发送和查询入口在 T06 实现。
T03 的类型声明不代表事件已会触发。

每项 issue 保存原因、script、i18n 类别 key、请求字体、已检查 face、去重字符/完整序列、
Unicode 标量码点、不超过 16 个字素的示例、独立的唯一数与出现数、带 scope/node/range 的位置。
字符映射和 HB 输出应共同决定覆盖，不能把空白、隔离符无轮廓当作缺字；此行为由 T05/T06 实现。
Han 只表示文字类别，不直接推断中文、繁体或日文。

原因独立区分 missingFace、missingGlyph、missingSequence、missingStyle、loadFailed、
unsupportedGlyphFormat。只有 loadFailed 必须携带 failure，并区分 fetch/decode/parse/register 阶段。
不能把解析/绘制格式失败误报成缺字。默认不可见字符、变体序列和代理对的实际检测不是类型本身的保证。

下载状态包括 disabled/idle/loading/resolved/failed/unsupported。每次尝试带提供方、家族、
字重、样式、资源片段/版本身份和失败原因；resourceId 不包含原文。后续成功补字体或删文字后，
新快照应删除已解决 issue，不采用只追加的历史列表。

## 实现落点与验证

- `src/editor/interface/Layout.ts`：原生布局协议；不引用 IElement/IRow/core 实现。
- `src/editor/interface/FontCoverage.ts`：诊断、下载和失败阶段协议。
- `src/editor/core/text-engine/types.ts` 与包根入口：重导出协议类型。
- `src/editor/core/text-engine/layout/layoutProtocol.ts`：流高度、基线、版本和来源身份规则。
- `interface/Draw.ts`：现有 scope 字段引用统一的 LayoutScopeId。
- `tests/core/text-engine/layout-protocol.test.ts`：协议几何、版本、scope 隔离及类型消费示例。

按 T03 范围完成改动后执行针对性单测、TypeScript 和 ESLint。
全部后续改造完成后再统一执行全量回归，遵循当前执行要求。

### 本次执行结果（2026-10-16）

- `pnpm exec tsc --noEmit`：通过。
- T03 修改文件的 ESLint：通过。
- `pnpm exec vitest run tests/core/text-engine/layout-protocol.test.ts --maxWorkers=2`：
  12 项通过，包含包根类型消费及 EventBus on/emit/off 的载荷兼容。
- 没有运行全量单测或浏览器回归；T01/T02 尚未完成的浏览器观测问题继续保留。
- 刚开始的 T04 生命周期及 WOFF2 依赖改动已撤回，本次不新增 ready 或运行时开关。

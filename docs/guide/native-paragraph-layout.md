# T11：原生段落入口与基础测量

`LayoutHostAdapter.layoutParagraph` 将宿主元素转换为纯数据输入，然后调用
`TextLayoutService.layoutParagraph`。结果包含原生 `TextLine[]` 及临时的 shaped
数据。服务不引用 Draw、IRow、IElement、Canvas 或旧行投影器。

`layoutParagraphToRows` 仅在宿主边界调用 `projectNativeRows`：从原生 cluster、
caret、inline box 投影旧消费者需要的行和元素几何，附带 shaped 行用于现有绘制与命中。
生产入口不经过 `mapToLegacyRow`；该旧模块暂留给尚未迁移的独立测试，后续删除。

## 坐标、来源和测量

- 原生输入输出使用未缩放的 CSS 像素。宿主将扫描阶段的字号、字距、对象尺寸、
  显式宽度和行边距还原一次，行投影时再统一乘 scale。DPR 不参与排版。
- 行 rect 位于 scope 坐标系，包含物理对齐偏移。cluster rect、caret 和 inline rect
  同样处于 scope 坐标系；glyph x 相对行原点，glyph y 相对基线。
  原生 offsetY 从 HarfBuzz 向上的偏移转换为向下为正。
- glyph 保存真实 face 引用和 fontSize。来源包含 scope、稳定宿主节点 ID、
  逻辑区间，以及宿主元素内 UTF-16 offset；BiDi 视觉顺序不改变来源。
- `getTextLayoutService().measureText(input)` 使用相同 HarfBuzz 整形，返回不换行的
  width、height、ascent、descent，不调用浏览器 measureText。
  表格内在宽度策略和辅助文字入口继续在 T12/T16 接入。
- 宿主缓存包含完整输入、源映射、样式、几何、scope 及 revision，最多保留 256 段；
  字体变化/销毁会清空缓存。这里的 documentRevision 仍使用现有宿主失效版本，
  全文档版本与原生增量快照按 T18 统一。

## 段落规则

真实字体的 HB ascender、descender、lineGap 构成行盒，同时扩展字形墨迹、上下标和
行内对象的竖向范围，再加入 rowMargin。显式 0 行边距生效，不通过 `|| 1` 恢复默认值。
因此 T11 的行高和分页可能与此前按字号乘 1.5 的结果不同。

段前距只属于首行，段后距只属于末行，内容高度不包含段距。Draw 不再补算段距或
手工生成空段。空段由服务生成实际行盒和插入 caret；全隐藏段保留来源并折叠高度和段距。
空结果不会触发旧文字循环。

tab 是独立 inlineObject，宽度使用 defaultTabWidth。显式 width 是一个原子元素槽位，
即使槽位中的文字有多个 glyph，也不会把宽度重复应用于每个 glyph 或拆成多个槽位。
图片、公式、勾选框和 radio 保持 typed inline；缺字使用 missingGlyph，不伪造普通字体。

先按词/字素建立断行候选，再以最终行边界重新整形；若宽度增加则继续细分源区间，
直到可放入或仅剩一个不可分 cluster。保留换行空白的源位置。kashida 仅修改布局副本，
插入顺序和 span 边界去重后将结果映射回原始文本，避免修改文档或漂移 caret。
对齐不会在同一组合 cluster 的 base/mark 之间插入间距；隔离符不生成相邻字符的幽灵位置。

## 验证与历史基线

`native-paragraph.test.ts` 使用真实本地字体，覆盖字体度量与行边距、字距/上下标、
长段与窄行、阿拉伯最终行字形、BiDi/kashida、标点、字素 caret、空段/段距、缺字、
隐藏折叠、显式宽度、tab、缩放、缓存，以及跨行源映射无重复。

`incremental-paragraph.test.ts` 继续比较完整计算与增量复用的行、分页和命中数据。
段距装饰测试使用足够高的页面隔离分页影响，并按数值精度比较矩形。

T01 原快照与 T09/T10 的 `t10-geometry.json` 均保留。迁移样本中 legacy 仍做严格历史
几何比较；HarfBuzz 的旧字号估计行盒已经被有意替换，改验完整源位置、合法行盒和
嵌套单元格原生入口，具体数值由真实字体单测约束，不重录历史期望。

8 项真实浏览器检查覆盖两种引擎下的嵌套表格、环绕分栏、混合纸张方向和 print，
验证真实 Worker 序列化、离线字体、页面方向与 PNG 墨迹。构建与独立 ESM 包消费也单独检查。
完整回归按既定要求留到后续任务全部完成后执行。

## 后续边界

T12/T13 继续迁出表格、块及浮动对象外壳；T14 迁出控件/label 后处理；
T15–T19 迁移分页、绘制、辅助测量、交互、原生增量与模型投影；T20 删除双引擎入口。
本项保留宿主边界的 IRow 转换，不将它作为原生段落服务的内部模型。

## 本次执行结果（2026-10-17）

- 14 个相关单测文件，119 项通过，其中 8 项为新增原生段落测试。
- Cypress `layout-extraction.cy.ts`：8 项通过。
- TypeScript、修改文件的 ESLint 和 `git diff --check`：通过。
- ESM library build 与 `test:package`：通过，包括独立严格类型消费者和相对 ESM chunks。
- 未运行全量回归；未修改 T01 或 T09/T10 的历史快照。

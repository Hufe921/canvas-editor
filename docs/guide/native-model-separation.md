# T19 文档模型与原生布局分离

## 原生路径

删除 `mapToLegacyRow.ts` 和 `projectNativeRows.ts`。
原生文本不再转换为带 `metrics/visualLeft/engineLine` 的旧行元素。
`createTextRows` 仅建立容器流记录：持有 `TextLine`、来源元素引用和显式
`sourceIndices`，不改写来源模型，也不复制 HarfBuzz glyph 数据。
表格、对象同样携带各自原生节点；缩放后的行宽、高只供宿主推进容器流。

正文、页眉页脚、表格、命中、搜索和编辑入口使用原生 `LayoutRow`。
内部访问器为 `getLayoutRows/getLayoutRowList/getRawLayoutRows/getLayoutPages`。
旧 `IRow/IRowElement` 仅保留给兼容输出、Particle 绘制边界以及 T20 待删旧代码。
它们不再是新布局的数据源。

位置 DTO 的 metrics 由原生 cluster、caret、inline 和 label 几何按需生成。
零墨迹、隐藏和空值来源仍保留 source 映射。字号上、下标计算不再回写 `actualSize`；
超链接/标签默认样式由排版和绘制解析，不再隐式改写文档元素。
`GlyphRenderer.drawNativeLine` 直接使用 `TextLine` 的真实 font/glyph 与偏移，
文字颜色和隐藏状态可在 paint 时读取当前模型，不需要旧 `engineLine`。
对象及装饰 Particle 所需的兼容字段只在调用时临时生成。

## 表格和页眉

单元格运行时宽高、行/位置列表、合并单元格坐标等位于 WeakMap。
非枚举访问器兼容现有表格工具，JSON/保存/复制/历史不再遍历这些布局树。
单元格的 `value`、ID、跨行跨列、样式和自定义数据保留在文档模型中。
表格分组需要的运行时几何显式读取 sidecar，不依赖深拷贝文档时夹带布局状态。

页眉页脚的纸张方向变体拥有各自的表格容器状态。
激活某一变体只更新容器布局兼容视图，不向文字元素写 metrics 或视觉索引。
块对象保留真实语义来源，交互尺寸单独存放，拖动修改仍作用于原始文档对象。

## 输出和历史

`getRowList/getOriginalRowList/getRawRowList/getPageRowList` 以及
`LayoutHostAdapter.layoutParagraphToRows` 保留为兼容输出边界。
每次返回独立快照，旧字段由原生节点生成；修改快照不影响模型或缓存。
运行时使用 `layoutParagraphRows` 等原生入口，不调用这些快照方法。
按页导出按来源索引去重并恢复文档顺序，跨栏/跨页片段不会重复保存同一个表格。

历史克隆会剔除旧排版瞬态字段和容器缓存，保留 ID、组、控件和样式等语义。
`extension` 中同名的用户字段不会被清理；共享扩展对象的引用关系在快照和
恢复时保留，避免撤销后原来可以合并的相邻文本被拆成不同的保存结构。

## 验证范围

- 冻结原始文字元素后完成完整/增量排版，确认无排版字段回写。
- 兼容输出快照独立，原生 source、scope、ID 和零墨迹来源映射完整。
- 保存、复制结构、HTML 文字/样式往返、表格 ID、历史和组坐标保持语义。
- 原生段落、对象、表格、页眉、测量、交互与完整/增量差分定向检查。
- 浏览器覆盖 LTR/RTL、IME、选区、分页分栏、重复表头和跨页单元格编辑。

本阶段定向验证通过：23 个 Vitest 文件共 143 项、4 个 Cypress 文件共 17 项；
TypeScript、相关文件 ESLint、ESM 库构建和 `test:package` 包消费检查通过。

T20 再删除隔离的旧循环、Particle 文字分支及模式开关；全量回归仍留到 T22。

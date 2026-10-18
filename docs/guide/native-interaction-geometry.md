# T17：原生交互几何

## 同一份文字几何

`core/layout/InteractionGeometry.ts` 只消费不可变的 `TextLine`、cluster、caret 和页面变换，
不依赖 Draw、Canvas 或文档元素。提供页面坐标转换、最近合法 caret、grapheme 片段、
范围矩形、裁剪及宿主索引映射。空格保留有 advance 的原生 cluster，允许没有可绘制 glyph。

Position 在定位阶段为正文、页眉/页脚方向变体和单元格记录 `PlacedTextLine`。
变换包含页面、列、缩放、原点和单元格可见窗口；嵌套窗口取交集。
垂直对齐只移动内容，保留单元格裁剪框。临时测量和 Placeholder 的位置数组拥有独立记录。

原生行的文字位置不再累加元素宽度或依赖 `visualLeft` 推导命中。
`IElementPosition` 继续输出给对象工具和公共 API，文字交互直接消费原生节点。
`IRow.nativeLine` 暂时携带节点引用，作为 T19 移除宿主行桥接前的边界。
对象、浮层、表格边界和区域切换继续使用各自的专用交互契约。

## 命中、光标和移动

点击采用最近的合法 caret，保留同一逻辑索引在 BiDi 边界或软换行两侧的亲和位置。
光标和 IME 代理使用原生 caret 的位置、高度和实际页偏移，避免字号经验估算。
软换行跨页时允许光标与前一个宿主元素的 DTO 分属不同页。

左右移动、上下行移动及 Shift 活动端使用原生停靠点，固定端继续保留原有锚点。
控件内部约束、表单跳转、表格跨单元格与跨行列选择保留。

- `caretMovement: 'visual'` 表示屏幕左右方向，包括 RTL 和混排。
- `caretMovement: 'logical'` 表示逻辑索引前进/后退；需要 RTL 右键逻辑前进时使用它。
  移除了此前 visual 模式下 RTL 强制逻辑步进的特例。
- 原生逻辑/视觉删除按完整 grapheme 范围执行，不会只删除跨元素组合字符的一部分。
  代理对和 ZWJ 序列也保留完整边界。键盘和 beforeinput 复用同一删除入口与去重规则。
- 显示光标前将落在多元素 grapheme 内部的索引吸附到合法边界。

## 选区、搜索、拼写与批注

文字选区、选区内部命中、普通/控件搜索高亮、拼写波浪线和批注使用相同原生区间。
段前/段后间距不进入内容矩形；BiDi 不连续区间分别绘制，不填满中间无关文字。
移除了 Draw 中重新均分字形框的选区修正算法。
`getRangeContext().rangeRects` 与 `getGroupRectList` 也从原生几何生成，
坐标为缩放后的 CSS 像素，包含实际页面在书写区中的偏移，避免横竖混排时混用原始页距。

搜索使用 UTF-16 → 原始元素的映射，避免 emoji/组合字符之后的索引错位。
匹配结果按完整来源单元去重，替换文本用 grapheme 拆分；支持嵌套单元格的 tablePath。
普通与控件搜索在正确单元格 scope 获取原生矩形；替换从后向前执行，保持后续路径稳定。
搜索、拼写和控件高亮还按当前页的可见片段绘制，避免跨页来源被最后一个 DTO 覆盖。

## 验证与阶段边界

`tests/core/draw/native-interaction.test.ts` 使用实际 Latin/Arabic 字体，覆盖：

- LTR/RTL 与多档缩放的 caret 命中往返、grapheme 边界和节点不可变性。
- 原生光标/IME、跨页软换行亲和、段后间距排除。
- 选区、搜索、波浪线和批注的几何一致性。
- 视觉/逻辑移动、Shift 固定锚点、跨元素组合字符与缺字 ZWJ 删除。
- 单元格垂直对齐、跨页裁剪、嵌套搜索替换、横竖版页眉 scope。

`cypress/migration/native-interaction.cy.ts` 增加 8 项真实浏览器用例：
LTR/RTL 点击、拖选、Shift 伸缩、IME composition、移动端 beforeinput 去重、
跨单元格选区和续页表格命中。运行期间禁用 Canvas 文字测绘回退。

既有 T14/T15/T16 浏览器场景同时检查。定向验证通过 23 个 Vitest 文件、164 项测试，
4 个 Cypress 文件、32 项测试（T17 新增 14 项单测与 8 项浏览器用例）。
TypeScript、改动文件 ESLint、ESM 构建及发行包检查通过。
全量回归仍按计划留到 T22。旧 HitTestAdapter 的字形框算法仅保留在隔离对照分支，
原生交互不调用；与旧引擎一起由 T20 删除。原生增量缓存和模型桥接移除分别属于 T18/T19。

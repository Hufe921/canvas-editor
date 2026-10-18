# T18 原生段落增量布局

`lab.incrementalCompute` 开启时，完整排版与增量排版共同使用
`TextLayoutService.layoutParagraph`，不再执行旧行快照续算算法。
关闭时直接进行完整 HarfBuzz 排版，可用于差分检查。

## 脏区间

`DirtyRangeTracker` 按元素数组身份追踪主文档、单元格和页眉页脚，
多个 splice 的区间会随插入、删除映射到当前索引。消费后清除该 scope 的区间。
原地字段修改、历史恢复和字体更新保留 full-dirty 语义，清除原生段落缓存；
full-dirty 优先于随后记录的局部区间。字体管理器的 invalidate 同时清除旧字体结果。

模型修改和 input 入口直接调用新 tracker，不再依赖 `IncrementalRowComputer`。
旧类暂留到 T20 删除，Draw 不再创建它、记录快照、尝试旧行续算或观察旧布局签名。

## 缓存边界

`IncrementalParagraphComputer` 缓存纯 `NativeParagraphLayout`，不保存
`IElement`、`IRow` 或页码位置。缓存采用段内相对索引：前面插入、删除内容时，
未改变段落的 HarfBuzz 结果仍可复用。返回时重建 source 区间、glyph/cluster
逻辑索引、caret、缺字/对象锚点和 label 来源。UTF-16 段内偏移保持不变。
缓存和调用方结果互不共享可修改对象，避免布局投影或分页污染缓存。

缓存键包括 scope、稳定来源身份、文字与样式、文档和字体 revision、空段样式、
段落间距、可用宽度，以及 flow 提供的逐行宽度和偏移。缓存最多保留 256 个结果，
采用 LRU 淘汰；临时测量 scope 可单独释放，字体补充后旧结果全部失效。

## 分页和交互

每轮仍扫描文档并执行容器流、行投影、表格分页和位置计算。
分页/分栏/环绕重新生成实际约束；与缓存键相同的原生段落直接复用，
不同则重新执行完整 HarfBuzz 段落排版。表格的每个单元格独立复用，
列表序号在缓存之外按当前文档重新生成。不存在退回 legacy 文字测量的路径。

原生光标和选区依赖完整的 `PlacedTextLine` 映射，因此每次重建位置，
不复用旧算法的部分页面 `IElementPosition` 切片。长段落发生编辑时，
整个段落仍会重新 shape/断行；本阶段不承诺只更新一两行，也不跳过全篇流计算。
性能和缓存资源上限的进一步评估在 T23。

## 定向验证

- 固定种子随机编辑、组合字符/emoji、BiDi、段落拆合和批量修改：
  完整/增量的行、分页、原生行及位置映射一致。
- 键盘输入、Enter/Backspace/Delete、撤销重做后继续增量一致。
- 缺字体到注册字体后的原生节点更新，随后局部编辑恢复缓存复用。
- scope 隔离、full-dirty 优先级、完整 source 重映射和可修改对象隔离。
- 浏览器在缩放、跨页和混合纸张方向下，对比完整/增量结果并点击原生 caret；
  另检查跨页表格单元格编辑。
- 对未编辑段落验证实际 HarfBuzz/service 调用减少，旧快照入口调用为零。

本阶段定向验证：10 个 Vitest 文件共 91 项、3 个 Cypress 文件共 11 项通过；
TypeScript、修改文件 ESLint、ESM 库构建和 `test:package` 包消费检查通过。
全量回归继续保留到 T22，本阶段只执行相关定向检查。

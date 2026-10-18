# T06：当前缺字快照与恢复

## 接口

```typescript
const editor = await Editor.create(container, data, {
  fonts: []
})

// 晚订阅也可查询；返回独立副本。
const report = editor.getFontCoverageReport()
editor.listener.fontCoverageChange = report => {
  // 根据 report.issues 更新宿主状态。
}
// 或使用事件总线；两种订阅各自接收独立副本。
editor.eventBus.on('fontCoverageChange', report => {})

await editor.register.fonts([{ family: 'My Font', data: fontArrayBuffer }])
// 字体注册触发重新检测与重排；已解决项从当前快照删除。
```

查询允许在初始化期间读取初始/当前快照，最终结果以 ready 完成后为准；
初始化失败或销毁之后查询报错。初次通知在 ready 状态下发出。
注册失败只增加资源诊断，不使 ready 失败；失败重试成功后清除对应资源失败。

## 聚合与来源

FontCoverageTracker 按请求家族、字重、样式、Script 和原因聚合。
区分 missingFace、missingGlyph、missingSequence、unsupportedGlyphFormat、missingStyle
和独立的 loadFailed。资源失败携带 fetch/decode/parse/register 阶段。

- missingCharacters 是真实缺失的 Unicode 标量；不会拆成代理对。
- missingSequences 保留完整组合字素、ZWJ/UVS 或不能拆字体的整形上下文。
- uniqueCount 按不同缺失字素/上下文统计，occurrenceCount 统计其出现次数。
  缺少样式时不把已有字符算成缺字，uniqueCount 为 0；资源失败计数为 0。
  同一组合字素的组成码点与序列不会在 uniqueCount 中重复计数。
- samples 最多包含 16 个不同字素，即使整形上下文是很长的连写词也有上限。
- locations 包含 scope、稳定源节点身份、半开元素区间和原元素内 UTF-16 区间。
  正文 main、页眉 header、页脚 footer 与 `td:<cellId>` 单元格互相隔离。
- requestedWeight/requestedStyle 保留原样式需求；attemptedFaces 列出实际检查的 face ID。

扫描与排版共用相同的 BiDi/样式整形 run 边界，颜色变化不会拆断连写上下文。
扫描跳过行内对象、空白和不可见格式符，并遵循当前模式的隐藏规则。
禁用的页眉/页脚和连续页模式未显示的页眉/页脚不进入当前快照。
表格按逻辑单元格扫描一次，分页重复表头不会重复计数。

## 更新、通知与生命周期

每次计算型渲染同步重新收集来源；相同输入、字体版本与资源失败状态不重复解析/通知。
纯重绘不扫描。删除、替换、撤销/重做、模式变化和手动补字体通过计算型渲染更新快照。
字体失败即使不改变 fontRevision，也会刷新诊断。初始化的通知等待 ready；
回调期间再次修改内容或销毁实例后，不继续向另一订阅入口广播旧快照。

报告含 documentRevision 与 fontRevision。前者跟随覆盖扫描输入变化递增，
后者仅在成功注册新 face 时递增。扫描 generation 阻止旧扫描发布；销毁使所有 token 失效。
占位节点在行布局完成后同步当前报告 revision，缓存命中也不保留旧来源位置。
报告、回调数据与各编辑器状态相互隔离，destroy 清理文档扫描指纹和待发通知。

## 占位与编辑

未覆盖的可见内容由 HarfBuzzTextShaper 生成显式占位。
优先读取基础字体的 glyph 0 轮廓与度量；不可绘制时使用 MissingGlyphBox 方框。
占位整形、绘制和选区宽度不通过 measureText/fillText 猜测原文字宽。
行高考虑实际占位 ascent/descent，缺字段落不插入用于对齐的合成 kashida。

迁移期宿主行通过 missingGlyphs 暴露原生 MissingGlyphBox 节点，附带来源、诊断 ID、
revision、明确几何与字素边界光标。原文字串、保存/复制结果和宿主逻辑索引保持原值。
连写上下文可能共享一个占位盒，宿主仍保留其中全部元素索引；盒宽表示占位宽，
不宣称等于缺失文字最终排版宽度。补字体后重新解析并移除已解决的占位。

## 当前边界

当前所有文字都接入诊断；浏览器整形绕行已在 [T08](./harfbuzz-shaping.md) 移除，绘制路径已在 [T09](./harfbuzz-glyph-rendering.md) 迁移为单色轮廓。
[T06B](./font-download.md) 已接入默认开启的 autoDownloadFonts、调度与缓存。
报告会展示当前开关与下载状态；关闭时为 disabled。页面提示和控制台缺字去重也已由 T07 接入。
Bunny 字体元数据与 WOFF/WOFF2 解码已由 [T06A](./bunny-font-provider.md) 实现。
categoryLabel 使用 i18n key，由内建状态区域与宿主语言包翻译。

## 验证

2026-10-16：覆盖 tracker、公开接口、真实字体注册恢复、ready/销毁、布局协议、
断行与 kashida 的针对性检查：10 个测试文件、86 项通过。
TypeScript、相关 ESLint、ESM 库构建和 `git diff --check` 通过。
发行包静态消费检查通过：tarball、ESM 入口、严格类型消费和独立 Vite 打包。
全量单测与真实浏览器回归按当前要求暂缓；不重录 T01 快照。

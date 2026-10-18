# T08：统一 HarfBuzz 文字整形

HarfBuzz 文字路径内的 Latin、CJK、阿语、天城文、泰文及组合附加符均使用
实际注册字体的 glyphId、advance 和 offset。移除了简单文种 BrowserTextShaper
绕行、轮廓缺失时的浏览器整形回退，以及将 HB advance/dx 缩放至浏览器测宽的校准。
字体选择继续使用覆盖检查与实际字体引用；无法覆盖的内容进入缺字诊断和占位，
不再依靠系统字体或 Canvas 测宽补齐。

## 整形边界与索引

- 先按 BiDi 方向和影响整形的样式分段；颜色变化不切断整形。
- 合并同字体、字号、字重、斜体、字距及上下标样式，再按 grapheme 检测文种。
  不同文种分别设置 HB script，避免混合阿语/印地等共用错误的 buffer script。
  空白/通用标点沿用相邻文种，组合附加符保留在同一 grapheme 中。
- HB cluster 维持 UTF-16 源偏移和宿主逻辑索引。多字符连字可覆盖多个元素；
  不在同一 cluster 的多个字形之间断行，超宽 cluster 整体保留在一行。
- 当前跨颜色连字使用 cluster 首字符的绘制色，不拆开字体连字。
  字形绘制已在 [T09](./harfbuzz-glyph-rendering.md) 落地，采用相同的首字符颜色策略。
- `letterSpacing` 在 HB 度量之上按 cluster 加一次（包括空格），附加符不重复加距，
  默认忽略字符不加距；ElementBridge 将字距随字号、对象几何一起缩放。
- cluster 末端一次预计算并复用，避免所有 Latin/CJK 改用 HB 后逐字扫描造成平方开销。

## 行内对象与增量复用

`shapeInlineObject` 独立消费宿主提供的 objectWidth/objectHeight。
TextLayoutEngine 直接分派对象，不进行字体选择、HB 整形或浏览器测宽；
HarfBuzzTextShaper 的直接调用也支持同一对象协议。隐藏对象保持零宽。

增量复用段落时同步平移缺字占位的 source.start/end 和 caret.elementIndex，
避免前文插入/删除后占位继续指向旧位置。字符内 UTF-16 offset 不随之改变。
增量测试等待整个 Draw.ready，并用合法的空页眉/页脚模型初始化；
覆盖扫描与实际段落布局调用分别检查。

## 验证与阶段边界

- 105 项定向单测通过，覆盖真实字体的五种文种、组合附加符、跨颜色连字、
  混合文种、字距、对象、窄行、缺字、字体下载恢复、增量/完整排版差分、
  选择区与段落间距、历史、上下标和换行。
- 5 项 Electron 浏览器检查通过。真实字体整形时将 BrowserTextShaper 和
  Canvas measureText 设置为抛错，再与原生 HB buffer 的输出逐项比较；
  同时验证字体下载、关闭零请求、失败提示及多实例生命周期。
- TypeScript、相关 ESLint、ESM 构建和发行包消费检查通过。
- 本阶段收敛 HarfBuzz 路径内的整形；GlyphRenderer 的视觉片段 fillText 已在
  [T09](./harfbuzz-glyph-rendering.md) 替换，旧 Draw 循环、模式配置及 BrowserTextShaper 文件最终在 T20 删除。
  不将 T08 完成理解为旧引擎已彻底移除；全量回归继续暂缓。

真实 Latin/CJK 字体夹具及 SIL OFL 许可证保存在 `tests/fixtures/fonts`，
测试使用本地二进制，无需自动联网或预装系统字体。

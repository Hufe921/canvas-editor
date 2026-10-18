# T05：字体注册、覆盖与备用字体解析

## 公共注册入口

```typescript
const editor = await Editor.create(container, data, options)
const results = await editor.register.fonts([{
  family: 'My Arabic',
  data: fontArrayBuffer, // 或显式 url
  scripts: [TextScript.ARAB],
  weight: 400,
  style: 'normal',
  fallback: true,
  resourceId: 'self-hosted-arabic-v1'
}])
const faces = editor.register.getFontFaces()
const fontRevision = editor.register.getFontRevision()
```

fonts 返回每个资源的 registered/duplicate/failed 结果，失败包含 fetch/decode/parse/register
阶段与原因。单份字体失败不使已就绪的编辑器失效；WASM 或销毁错误仍拒绝调用。
注册可以在初始化期间发起，但会明确等待 ready。销毁之后不得注册。
getFontFaces/getFontRevision 是只读元数据查询，可在初始化期间调用，失败/销毁之后报错。
字体描述及 ArrayBuffer 会复制，之后修改调用方对象不会更改已注册字体。

相同字体描述和相同字节内容会去重；同一家族、字重、样式的不同二进制片段不会互相覆盖。
resourceId 可记录提供方片段/版本身份，但不代替实际字节比对。
内部内容指纹不是安全摘要；发生指纹冲突时仍比较完整字节，不因散列相等误复用字体。
并发相同字体只提交一次，重复注册不增加版本或触发重排。

每次新增有效 face 增加 fontRevision，清空字体实例/覆盖缓存、布局缓存与段落复用结果。
注册批次完成后重排当前文档，并保留当前正文、选区和历史；不插入或替换原文。
旧文字测量缓存也暂时清理，以保持迁移期显式 legacy 模式的补字体行为。

## 覆盖和选择规则

候选顺序为请求家族（精确字重/样式优先）、文种标签家族、其他允许备用的已加载家族。
`fallback: false` 的字体仅供显式请求该家族使用，不参与其他家族的自动补位。
覆盖与样式均满足的候选才直接采用；首选家族只有其他样式时继续检查备用字体。
只有没有任何覆盖且样式匹配的候选时才返回 missingStyle。
每个候选先检查真实 cmap，再用 HarfBuzz 在相同方向、script、language 下整形，检查 glyph 0
和实际轮廓。不能因为首选缺字而跳过已加载的备用字体，也不查询系统 CSS 字体的覆盖。

优先保留已覆盖的请求字体内容；仅需要备用的上下文换字体。
UTF-16 偏移保留给宿主映射，覆盖扫描按 Unicode 标量，不拆代理对。
Intl.Segmenter 提供完整字素边界，组合符和 ZWJ 序列不跨字体拆开。
连续的阿语/Indic/东南亚连写词使用同一候选字体与整形上下文；不能按单字强行拼成“覆盖”。

结果区分：

- missingFace：没有可选已加载字体。
- missingGlyph：所有候选都无法覆盖某些 Unicode 标量。
- missingSequence：字素/上下文不能在同一候选中正确整形，或 UVS/emoji ZWJ 序列不受支持。
- unsupportedGlyphFormat：cmap/HB 有字形，但当前轮廓后端不能读取或绘制。
- missingStyle：字符可以覆盖，但只能使用已声明的其他字重/样式；不把 regular 冒充 bold/italic。

字重/样式匹配以注册描述为准，调用方必须为真实文件声明正确的字重和样式。
本项不合成字体、不实现可变字体轴插值；后续下载器也须注册正确资源。
UVS 通过 HarfBuzz variationGlyph 验证。没有 UVS 映射的序列不会被静默当成已验证。
emoji ZWJ 的基础检查会拒绝拆成多个可见部件的结果；颜色字形在 [T09](./harfbuzz-glyph-rendering.md) 明确标记为 unsupported，首版只支持单色轮廓。
空白、换行、默认不可见字符与 BiDi 隔离符没有墨迹不算缺字。
覆盖缓存有界，注册新字体会使之前“缺字”的负结果失效。

HarfBuzz 文字整形已消费解析得到的实际字体，字形记录附带 faceId 与 fontRevision，
备用字体的 family/样式同步传递给当前绘制路径。Latin/CJK 绕行和浏览器 advance 校准已由 [T08](./harfbuzz-shaping.md) 移除；
视觉分段 fillText 已由 [T09](./harfbuzz-glyph-rendering.md) 替换；旧引擎及模式配置仍按 T20 删除。

## Unicode Script 与基础字体范围

Script 识别改为 Unicode 属性，覆盖补充平面的 Han/Arabic，以及假名、韩文、emoji。
Han 返回 hani，不推断中文/繁体/日文；旧 hans 字体标签作为兼容别名保留。
不支持的字母/文字返回 zzzz，数字/标点等公共字符返回 zyyy。

`basicFontManifest.ts` 只列仓库现有三个 400 normal 的自托管候选：
Noto Naskh Arabic、Noto Sans Devanagari、Noto Sans Thai。
它不是完整中英文字库，也不隐式发网络请求；发行包不承诺携带这些演示用 public 文件。

缺字占位度量优先读取已加载基础字体的 glyph 0 / hExtents；不能使用时返回标记为 box 的
稳定显式几何。该宽度不是缺失文字的真实宽度。占位节点与缺字集合已在
[T06](./font-coverage.md) 接入；页面提示留在 T07。

TTF/OTF/WOFF/WOFF2 已由 [T06A](./bunny-font-provider.md) 统一归一化后注册。
压缩格式不会直接交给 HB；整形表不会经过有损序列化重写。
WOFF 的原生 deflate 能力不足、输入无效或 WOFF2 解码失败时返回明确的 decode 失败。

## 验证范围

针对性检查包括真实 Arabic/Devanagari 字体、测试中生成的真实 OpenType 字体、
补充平面、组合簇、ZWJ/UVS、样式缺失、同家族多片段、去重、失败分类与公共补字体重排。
随后检查 TypeScript、ESLint、ESM 构建和独立 tarball 类型消费。
全量回归按当前要求留到后续改造完成后统一执行，不自动更新 T01 快照。

### 本次执行结果（2026-10-16）

- 6 个测试文件、52 项通过：font-resolver、script-font、font-registration，
  以及受影响的 ready、font-lifecycle、harfbuzz-runtime 针对性检查。
- TypeScript、相关 ESLint、`git diff --check`：通过。
- ESM 库构建：通过，保留已记录的分块/Node 兼容分支提示。
- tarball 静态消费：入口、严格 TypeScript、相对 chunk 与独立 Vite 打包通过。
- 全量单测和真实浏览器回归未执行，T01 快照没有重录。

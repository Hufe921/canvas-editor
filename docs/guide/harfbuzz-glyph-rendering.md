# T09：直接绘制 HarfBuzz 字形

`GlyphRenderer` 按布局中的实际 `font.faceId`、`glyphId` 和字号取轮廓，
在 `originX + left + dx`、`baselineY + baselineShift - dy` 处绘制。
不使用段落原文，不进行浏览器二次整形、宽度校准或 RTL 二次翻转。
正文路径不调用 `fillText`、`measureText`，也没有这些 API 的异常回退。
旧调用者仍可传入 paragraphText，但该参数不参与绘制。

## 轮廓后端与缓存

- 使用与 HarfBuzz 相同二进制字体的 glyphId，从 OpenType 轮廓读取 M/L/Q/C/Z 命令。
  字形在基线原点生成，像素尺寸和 Y-down 转换只应用一次，再叠加 HB 偏移。
- Canvas 原生命令重放轮廓，无需 Path2D 或系统字体再次选择字形。
  支持单色 TrueType 二次曲线及 CFF 三次曲线；不将轮廓失败退回文字绘制。
- 字体管理器缓存实际 faceId/glyphId/size 的只读轮廓、墨迹边界及兼容 pathData。
  LRU 上限为 1024 项、约 4 MiB（按命令和字符串估算）；超大单项不缓存。
  注册字体和 destroy 清理缓存；颜色变化不生成新轮廓。
- 布局行保存字体引用和字形几何，完整轮廓命令不进入每个行快照。
  绘制通过字体引用读取缓存，避免增量差分和历史检查重复复制大量命令。
  原有瞬态 pathData 作为兼容数据保留，绘制不依赖它。

## 色彩、基线及空白

- 每个 glyph 使用布局/live style 中的颜色；零 advance 的组合附加符仍绘制。
- 跨颜色连字保持同一 HB glyph，采用该 cluster 首字符颜色。
  首版不按字素切割同一个连字轮廓，也不以彩色子串重新整形或裁切浏览器文字。
- 上下标由布局给出 baselineShift；绘制仅应用一次，与 LTR/RTL 无关。
- 空格有度量而无轮廓，不绘制；行内对象交由专用 Particle 绘制。
- 缺字优先绘制实际基础字体的 .notdef，轮廓后端不可用时画显式 MissingGlyphBox。
  不使用原文或系统 fallback 伪装已覆盖的字形。
- 删除了 Draw 中基于复杂文字浏览器测宽的选区扩张补偿。
  当前过渡选区使用 HB 笔位盒，原生 cluster/caret 选择区统一仍由 T17 完成。

## 颜色字形与不支持格式

本期仅支持单色轮廓，不支持 COLR/CPAL 调色板、SVG 图像或 bitmap strikes：

- COLRv0、SVG 字体按实际 glyph 判定；同字体其它正常单色字形仍可使用。
- COLRv1 paints、sbix、CBDT 按字体保守判定不支持，可选择其它覆盖字体。
- 只有颜色/位图表、没有轮廓表的字体，在注册时返回 `unsupportedGlyphFormat`。
- 字体解析、实际轮廓读取和覆盖诊断使用同一能力判断。
  已有 cmap 但后端不可绘制时，报告 `unsupportedGlyphFormat`，不冒充缺少字符。
  页面提示使用支持的轮廓字体，不提示重复安装相同的不支持格式字体。
  颜色专用字体的注册结果和无可用后端的覆盖报告也保留该原因。

## 定向验证

- 87 项定向单测通过：真实 Latin/CJK/Arabic/Devanagari/Thai、组合附加符、
  字形偏移、颜色、上下标、空白/对象/.notdef/显式盒、CFF 三次曲线、缓存复用/淘汰、
  不支持的颜色字形、字体下载恢复，以及完整/增量排版差分。
- 6 项 Electron 浏览器检查通过：逐像素对比实际字体路径与新绘制结果，
  包含五种文种、跨色连字、窄行混排、上下标/字号路径及 unsupported 格式提示；
  同时验证统一 HB 整形和自动补字体生命周期。
- TypeScript、相关 ESLint、ESM 构建与发行包消费检查通过。
- 全量回归与 T01 基线重录仍暂缓；旧 Draw 循环、对象布局及模式配置继续按后续任务迁移。

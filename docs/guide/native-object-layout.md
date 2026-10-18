# T13：原生对象、Block、Area 与断点

HarfBuzz 文档布局不再通过 forceLegacy 插入对象。`ObjectLayout` 直接生成具有
source/revision、内容 rect、尺寸和逻辑锚点的 BlockBox 或 BreakNode；
`ObjectLayoutHost` 只在宿主边界投影当前绘制、位置与分页需要的 IRow。
原生对象不会生成伪 TextLine 或普通文字 glyph。显式 legacy 模式仍保留到 T20。

## 对象与流

- iframe/video：内容宽度限于实际父容器，高度与上下行间留白分开。
  几何使用未缩放 CSS 像素；宿主投影时统一乘 scale。
- 浮动图片/公式：保留真实尺寸、源锚点与显式 floatPosition，标记 outOfFlow，流高度为 0。
  既有浮动绘制/命中管理继续负责页面放置；精确环绕与重新断行属于 T15。
- 分隔线：生成 separator BlockBox，使用线宽作为内容高度。
- 分页符：生成明确的 page BreakNode，保留后续 paperDirection 和 caret。
- 隐藏对象保留来源身份，不消耗流高度。`getLayoutFlowHeight` 同时处理对象留白和 outOfFlow。

`Draw._createSpecialEngineRow` 及旧 blocked-element 插行分支已移除。
当前主路径没有 `forceLegacy: true` 调用，T20 再删除显式旧模式及该兼容参数。

## 行内图片、公式与题注

图片/公式作为明确的 inlineObject 参与段落宽度计算，不参与字体查找或文字轮廓绘制。
宿主在段落入口按真实容器宽度等比适配，并提交适配后的图像模型尺寸，延续既有尺寸行为；
不将画布缩放误写回模型，也不改变公式自身 SVG 内容。

图片底部与 HB 行基线对齐。原生 inline rect 覆盖实际对象与题注区域；宿主 metrics.height
只表示图像本体，命中和尺寸工具继续使用原图尺寸。修复原生图文同行时 INLINE 图片
被放到文字基线以下的问题。

题注通过 `layoutCaption` 使用 TextLayoutService 的实际字体行盒整形。对象 descent
预留 `caption.top + caption.height`，Image/LaTex 绘制使用同一结果的 ascent、字形和偏移。
段落内容高度包含题注留白，图片本体高度不包含；下一行不会挤占题注。
题注字素截断、辅助文字诊断与所有测量 API 的统一迁移继续由 T16 完成。

LaTex SVG 转换器、缓存和图像观察器保留，浮动公式通过浮动层绘制，公式也可使用题注。

## Area 与嵌套容器

Area 在归一化阶段仍展开为带 areaId/area 的元素。段落扫描在区域边界分开，
原生输出依据来源重组为 area BlockBox，并保留背景、边框和子节点。
区域子节点使用所属 scope 的坐标，区域平移会同步移动本 scope 子节点；表格格内子 scope
不被重复平移。

Area.top 作为区域的独立前置流间距，内容行保持原生段距规则。进入 Area 时只加一次；
表格格内继承自外层表的 Area 不再重复添加 top，格内独立 Area 则应用自己的 top。
归一化器也不再用外层 Area 覆盖表格中已有的独立区域身份。隐藏空区域同时折叠内容和 top。

## Block 绘制、缩放及打印

Block 内容 rect 限制到正文栏或单元格实际容器，逻辑锚点保持宿主元素索引。
缩放以实际渲染宽度作为起点，以记录的父容器宽度为上限，避免在缩放页面或嵌套表格中
误用全局正文宽度或再次乘 scale。Block 绘制不再被 rowFlex 文字分支截走。

BlockParticle 递归管理正文、表格、页眉和页脚内的 Block；隐藏/移除的实例清理 DOM，
同 ID 更换模型对象时替换旧实例。iframe/video 仍使用原模块，打印保留 snapshot 与
snapDomFunction 接口。视频依然依赖既有媒体来源与加载行为，本项未改动媒体解码。

## 验证

- 纯对象测试约束内容盒、流留白、物理对齐、显式零宽、浮动、断点、隐藏和区域平移。
- 真实字体集成测试覆盖图文同行、图像/公式限宽与缩放、题注留白、无旧循环、
  Area/嵌套身份与顶部间距、隐藏恢复、SVG 转换、前后插入及源锚点。
- 浏览器验证对象实际命中、缩放手柄、嵌套 Block 尺寸、隐藏恢复、真实公式/题注像素，
  以及 iframe 打印截图的尺寸和像素。既有表格和导出专项同时保留。
- 历史迁移快照不修改；显式 legacy 样本继续严格比较旧几何。

分页/分栏/环绕在 T15 接线，辅助测量在 T16 迁移，原生命中和 DTO 消费者在 T17/T19
迁移。本项不提前删除现有宿主绘制与交互能力。全量回归遵照既定安排，留到后续全部任务完成。

## 本次执行结果（2026-10-17）

- 16 个相关单测文件共 159 项通过，包含新增 13 项对象布局与真实字体集成测试。
- Cypress：native-object 4 项、native-table 4 项、layout-extraction 8 项，共 16 项通过。
- TypeScript、修改文件的 ESLint、git diff --check：通过。
- ESM library build 与 test:package：通过，包含严格类型消费者与相对 ESM chunks。
- 未执行全量回归，未修改历史快照。

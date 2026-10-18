# T16：辅助文字与测量 API

## 统一的排版入口

`TextLayoutService.layoutSingleLine` 为题注、页码、行号、标尺、分页标记和水印
提供单行排版。模板中的换行符按空格显示，采用真实字体行框、BiDi 和注册字体。
`LayoutHostAdapter.layoutPlainText` 通过这一入口取得绘制和测量数据，
`drawPlainText` 只调用 GlyphRenderer；缺字保留原生占位框，取消浏览器文字回退。
题注的预留高度和绘制同样使用 TextLayoutService 的字体行框。

省略文本保留原有 `...` 后缀，在 Unicode grapheme 与 HB cluster 的共同边界截断，
每个候选均重新整形验证宽度；不依赖 UTF-16 任意切片或上下文宽度单调递增的假设。
空间不足以容纳后缀时返回空串。

占位文字继续通过原生段落排版以支持换行，使用独立 `placeholder` 作用域。
区域占位使用 `placeholder:area:<id>`、实际区域/单元格宽度、页面和坐标，
不会覆盖正文、表格单元格的布局句柄。
列表标记、控件、标签和留痕继续使用 T14 已实现的原生路径。

## 页面几何与像素比例

行号按当前页面宽度和边距定位，支持横竖混排和 RTL。
标尺使用注册默认字体；先绘制刻度路径，再绘制字形，防止轮廓绘制重置刻度路径。

水印以真实行框居中旋转，平铺画布的像素尺寸为 CSS 尺寸乘 DPR，
绘制上下文放大 DPR，CanvasPattern 使用逆 DPR 变换。
文档缩放只应用一次，导出 DPR 不改变水印的逻辑大小和间距。
图片水印平铺复用同样的 DPR 修正。

## 业务测量与 ready

`computeElementListHeight` 在测量前检查 ready，使用当前页面方向的正文宽度。
仅对输入副本排版，采用独立 `measurement` 作用域；嵌套单元格继承该前缀，
测量结束（包括异常）释放临时布局句柄和缓存，不影响正文及单元格命中数据。
高度包含原生流布局绕过浮动对象产生的纵向间隔。

表格自动列宽使用 TextLayoutService 的 intrinsic measurement，
保留跨列、嵌套表格、控件最小宽度和父容器约束，删除 TextParticle 测宽分支。

公共同步测高与自动列宽在 ready 前抛出 `EDITOR_NOT_READY`；
`computeElementListHeightAsync` 等待 ready。低层单行测量/绘制在 ready 前返回 null，
省略辅助函数返回空串，标尺和辅助绘制延后；不临时改用浏览器文字。
Placeholder 通过段落入口执行相同的 ready 门控。

## 同一份缺字诊断

覆盖扫描包含完整题注（含未显示的省略部分）、分页标记，以及实际格式化后的
页码、水印、行号、标尺和空白提示。扫描按全部页面及源模型进行，不依赖懒绘制是否发生。
区域提示绑定原始区域元素，可定位；纯配置文字使用 `aux:<kind>`，
`start === end` 表示没有可选中的正文范围，因此不显示无效的定位按钮。

配置和语言变更即使只触发绘制，也重新检查诊断；删除或禁用的辅助文字从当前报告移除。
`autoDownloadFonts` 同样作用于辅助文字：开启时进入 Bunny 下载队列，关闭时提示字体包；
手动注册字体或自动下载完成后重排并清除已解决的报告。

## 定向验证

- `tests/core/draw/native-auxiliary.test.ts`：ready、真实字体度量、组合符/emoji/连字截断、
  页面辅助文字、测高与占位缓存隔离、单元格区域提示及缺字来源。
- `tests/editor/font-download.test.ts`：增加纯水印缺字的自动下载/手动补字体开关验证。
- `cypress/migration/native-auxiliary.cy.ts`：6 项真实浏览器场景，LTR/RTL、缩放、
  横竖混排、DPR=2 水印平铺、题注、标尺、自动列宽、测高、占位及打印导出。
  测试期间禁用全部 Canvas `measureText`、`fillText`、`strokeText`，确保无浏览器文字回退。
- 相关原生布局、字体生命周期与迁移对照定向验证：16 个 Vitest 文件、121 项测试通过；
  3 个 Cypress 场景文件、24 项测试通过（含 T16 新增 6 项）。
- TypeScript、改动文件 ESLint、ESM 构建和发行包验证通过。
  发行包检查覆盖 tarball、仅 import 导出、发布预处理、严格消费者类型和相对 ESM chunks。

按约定暂缓全量回归。保留在显式 legacy 对照路径中的旧列表等逻辑仍由 T20 统一删除；
这些逻辑不参与当前 HarfBuzz 正常排版和业务测量。

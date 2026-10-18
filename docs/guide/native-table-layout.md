# T12：原生表格与嵌套单元格布局

HarfBuzz 路径中的 TABLE 已从旧循环插行分支移出。`Draw` 直接调用
`layoutHostTable`，由纯数据的 `layoutTable` 计算几何，再在宿主边界填回当前绘制、
分页和交互使用的表格字段及 IRow。表内段落和空段走 T11 的 TextLayoutService，
递归遇到 TABLE 时再次调用相同入口，不使用 forceLegacy。

## 原生输入输出

`core/layout/TableLayout.ts` 不依赖 Draw、Canvas、IElement 或 IRow。
输入明确包含所属 scope/source/revision、列宽、行高下限、合并格、容器宽度、
内边距、镜像方向及样式。单元格回调接收其实际内容宽度并返回子节点与流高度。
输出为完整未分页的 TableFragment、列宽、行高和单元格内容高度。

列网格占用表负责 rowspan/colspan 定位；空行即使被跨行格完全覆盖也保留行高。
从声明的最小行高开始，先满足短跨度，再将较长跨度不足的高度加在跨度末行。
所有格子的最终 y/height 均由最终行高前缀和计算，避免早期格子保留过期高度，
也不需要旧循环的增高后再缩减过程。重复布局不会把上一次内容撑高当成新的下限。

单元格 rect/contentRect 位于表格所属 scope，children 使用独立的单元格 scope。
父节点流位置变化时只移动本 scope 的几何，不重复移动子 scope 的节点。
原生 collector 是一次布局的输出，不把原生树作为持久化字段写入 IElement/ITd。

`TableFragment.spacingAfter` 表示表格外部行间留白，内容 rect 不包含该值；
`getLayoutFlowHeight` 统一计入它。隐藏表格不递归子布局、不占流高度。
表格和单元格的边框颜色、宽度、类型、斜线及背景在原生结果和当前模型中均保留。

## 父容器与测量

- 外层表格使用实际正文栏宽；嵌套表格使用父格宽度减去左右 padding。
  不再在 HarfBuzz 表格入口读取全局正文宽度。
- 所有原生几何以未缩放 CSS 像素表达；宿主只在递归请求和 IRow 投影处转换 scale。
  超宽压缩仍遵循 overflow 和最小列宽策略：若最小列宽总和已超过容器，保留下限。
- Draw 使用 WeakMap 保存本次布局中表格的实际父容器宽度。自动适应页面、列调整和
  列宽拖动使用该容器，避免将嵌套表格扩大到整页。
- 自动列宽通过 `LayoutHostAdapter.measureParagraph` 调用 TextLayoutService，
  测量完整整形段落的内在宽度，不修改绘制/命中使用的已排版结果。
  字距、上下标、显式宽度、tab 和行内对象均参与；隐藏内容不参与。
- 单格约束先应用到列，跨列格再约束整段列宽并分摊不足；嵌套表格递归计算内在宽度。
  测量完成后再按实际容器及 overflow 策略限宽。
- 自动适应命令通过完整 tablePath 选中目标表格，避免误改嵌套表格的外层表。

## 段距、垂直对齐和分页窗口

`getHostRowFlowHeight/getHostRowsHeight` 将 row.height（已含段后距）与 offsetY
（段前距）相加一次。表格内容撑高、分页窗口前缀、拆分消耗高度和 maxPageNo
裁剪均使用该规则。段前距不会被漏算，也不会再次加到内容行高度中。

垂直偏移由同一 `getCellVerticalOffset` 计算；原生 contentRect 和当前 Position
均使用包含段距的内容高度。移动父格内容时同步移动嵌套表格的绝对位置，
使文本、表格外框与命中位置一致；跨页拆分窗口维持既有顶端续排策略。

RTL 保持逻辑 colIndex 不变，仅镜像物理 x。列边缘工具位于镜像后的逻辑列末端，
拖动方向转换成逻辑方向后调整宽度。可溢出模式下拖动 RTL 起始边不再错误移动左端。

## 验证与后续边界

- 纯布局测试覆盖合并格、跨行覆盖的空行、最小宽度、垂直对齐、镜像、样式、
  隐藏、重复布局和非法跨度。
- 真实本地字体集成测试覆盖递归父宽、无 legacy/浏览器文字度量、原生子 scope、
  段距/分页窗口、合并格高度、自动列宽、跨列约束、嵌套命令、分栏和隐藏内容。
- 浏览器专项检查 LTR/RTL 嵌套内容的位置、真实边框像素和列宽拖动；
  既有对象布局检查继续覆盖嵌套表格、环绕分栏、混合纸张方向及 PNG 导出。
- 原历史快照保持不变，legacy 迁移样本仍执行严格几何比较。

现有 TablePaging/TableParticle/Position 继续消费宿主 DTO；T15/T17/T19 再将分页、
绘制和交互直接迁到原生节点。块与浮动对象的剩余外壳由 T13 迁移，控件/label
后处理由 T14 迁移。显式 legacy 模式的旧表格分支保留到 T20 删除。
完整回归遵照既定安排，在全部后续任务完成后统一执行。

## 本次执行结果（2026-10-17）

- 12 个相关单测文件，137 项通过，包含新增 14 项纯布局/真实字体表格测试。
- Cypress：新增 native-table 4 项及既有 layout-extraction 8 项通过。
- TypeScript、修改文件的 ESLint、git diff --check：通过。
- ESM library build 与 test:package：通过，包含严格类型消费者与相对 ESM chunks。
- 未运行全量回归，未修改历史快照。

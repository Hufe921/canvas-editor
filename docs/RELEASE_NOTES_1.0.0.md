# Canvas Editor 1.0.0 正式发布 🎉

> **历时 1723 天、139 个发布版本、1460 次提交之后,Canvas Editor 正式进入 1.0 时代。**
>
> 这个版本意味着,基于原生 Canvas 的富文本编辑器在 EMR(电子病历)、合同、公文、报表等对排版精度和分页有严苛要求的场景中,迈出了扎实的一步。

<p align="center">
  <a href="https://www.npmjs.com/package/@hufe921/canvas-editor" target="_blank"><img src="https://img.shields.io/npm/v/@hufe921/canvas-editor.svg?sanitize=true" alt="Version"></a>
  <a href="https://github.com/hufe921/canvas-editor/actions" target="_blank"><img alt="Cypress Passing" src="https://github.com/hufe921/canvas-editor/workflows/cypress/badge.svg" /></a>
  <a href="https://github.com/Hufe921/canvas-editor" target="_blank"><img alt="GitHub Stars" src="https://img.shields.io/github/stars/hufe921/canvas-editor?style=social"/></a>
</p>

---

## 📌 TL;DR

- ⭐ **表格分页这个困扰社区 4 年多的核心难题([#41](https://github.com/Hufe921/canvas-editor/issues/41))得到系统性解决** —— 放弃数据层物理切割,改为渲染层切分,跨页表格的合并、光标选区、输入实现正确联动。
- ✨ 八大重点能力落地:**留痕模式、控件级联与校验(表达式)、控件嵌套、多栏布局、标尺、多级有序列表、区域子文档、宏**。
- 🛠 API 趋于稳定,后续将遵循 SemVer:1.x 期间不会有破坏性变更。

---

## 🎯 为什么是 1.0?为什么是现在?

Canvas Editor 从 2021 年 11 月 12 日第一次提交到现在,已经走过了 1723 天。在这个过程中,我一直在追问自己一个问题:

> **"基于 Canvas 的富文本编辑器,真的能替代 contenteditable 用于严肃的文档场景吗?"**

1.0.0 之前,答案是"接近可以,但还有几块硬骨头"。1.0.0 之后,我想可以比较有底气地说:**在多数严肃文档场景下,可用了**。

判断依据有四:

| 维度           | 1.0 之前              | 1.0.0                                    |
| -------------- | --------------------- | ---------------------------------------- |
| **表格**       | 单页可用,跨页体验破碎 | 渲染层分页、列宽同步、行高自适应大幅完善 |
| **控件**       | 单层、无校验          | 支持嵌套、级联表达式、表单校验           |
| **排版**       | 基础分页              | 多栏布局、图片环绕、标尺、修订留痕       |
| **API 稳定性** | 持续演进              | 冻结核心 API,进入 SemVer 严格管理        |

**表格分页是最关键的一块拼图。**它是社区呼声最高、技术难度最大的特性,也是 1.0 迟迟没有发布的主要原因。它落地之后,最难的渲染路径基本走通,后续迭代会从"修关键 bug"转向"扩展能力"。

---

## ⭐ 头号特性:表格分页 [#41](https://github.com/Hufe921/canvas-editor/issues/41)

[Issue #41](https://github.com/Hufe921/canvas-editor/issues/41) 提出于 **2022 年 4 月 28 日**,距今 1556 天,积累了 39 条讨论,是仓库里生命周期最长的 issue 之一。最初的反馈只有一句话:

> 跨页表格在修改列宽的时候,不能够同步。

这背后是整个编辑器最复杂的渲染路径之一:行要在页边界动态拆分、各页列宽必须严格一致、含图片/列表/子表格的单元格行高要自适应、光标和选区要在分页后正确响应。

### 方案演进:从"数据层拆分"到"渲染层切分"

**① 数据层拆分方案(2024.03 前后)**

最早的思路是:把超出当前页的非跨行**行**拆出来,形成一个新表格;渲染时先合并再拆分,保存数据时再合并。这个方案解决了"能分页",但天花板很明显分页后的表格一变就无法还原,合并行单元格跨页失效、单格超高不跨页、控件跨行丢内容等边界问题在 issue 里被陆续反馈出来。本质原因是:**数据被物理切成了两段,之后所有操作都要为"同步两段状态"付出代价**。

**② 社区协作与 POC 验证(2025)**

期间 [@the-lemonboy](https://github.com/the-lemonboy)、[@sLin90](https://github.com/sLin90)、[@ThunderYu](https://github.com/ThunderYu) 等社区同学贡献了思路和 PR。结合他们的实现思路,我在 `poc/table-paging` 分支做了可行性验证,并梳理出完整的待办清单:跨页中文输入、跨页删除/书写/方向键光标处理、选区跨页拖蓝、控件跨页、复合元素跨页、边界处理。

**③ 渲染层切分方案(2026.07,本次落地)**

最终完成了一次核心思路的转换:**放弃数据层面的物理切割,仅在渲染层面进行切分**。数据结构始终保持完整,只在 Canvas 绘制阶段计算分页截断位置。这个"降维"处理,让之前大量的状态同步类 bug 自然消解,性能和稳定性也随之提升。

### 本次改动(`feat: optimize table pagination #41`)

- 新增 `TablePaging` 分页计算模块(约 740 行):负责跨页截断点的测量与计算
- 重写 `TableParticle` 表格渲染逻辑(约 510 行改动):渲染期按截断点切分绘制
- `Position` 光标定位系统跨页适配(约 500 行改动):覆盖跨页中文输入、删除/书写/方向键光标、选区跨页拖蓝
- 配套 **1600+ 行单元测试**(`tests/core/draw/tablePaging.test.ts`)
- 合计 **3373 行新增代码**

同时配套落地:

- ✅ 含富内容/跨行(`rowspan`)单元格的行高自适应
- ✅ 表格宽度自适应内容与页面([#1387](https://github.com/Hufe921/canvas-editor/issues/1387) [#1453](https://github.com/Hufe921/canvas-editor/issues/1453))
- ✅ 跨页表格列宽同步

**这是一次从底层思路出发的重写,而不只是打补丁。** 分页场景千变万化,如果你在使用过程中遇到新的边界 case,欢迎继续在 [#41](https://github.com/Hufe921/canvas-editor/issues/41) 下反馈。

---

## 🎁 1.0 重点功能巡礼

### 🖋 留痕模式(Trace Mode)[#312](https://github.com/Hufe921/canvas-editor/issues/312)

类似 Word 的"修订":开启后,所有增删改都会留下痕迹——删除的内容以删除线标注,悬停可查看**作者与时间**,并可控制痕迹的可见性。病历修改留痕、合同审阅、公文批改,这类强合规场景可以少造很多轮子。

### 🔗 控件级联与校验(表达式)[#671](https://github.com/Hufe921/canvas-editor/issues/671)

Select / Radio / Checkbox / 文本控件之间可以建立**父子联动与校验规则**,并支持表达式自动计算:

- 输入身高 170cm、体重 100kg,**BMI 自动算出 34.6**,并联动显示"肥胖干预建议"
- 选择"有高血压",自动带出"高血压分级"必填项
- 提交前对必填、格式进行校验

一份电子病历模板,从此可以自带一部分"业务逻辑"。

### 🪆 控件嵌套 [#425](https://github.com/Hufe921/canvas-editor/issues/425)

控件内部可以再嵌套富文本与其他控件,复杂表单结构(如"诊断标签"里套"分期选择")可以更自然地表达。

### 📰 多栏布局 [#1237](https://github.com/Hufe921/canvas-editor/issues/1237)

像 Word 一样的分栏排版:主诉、现病史一栏,辅助检查、门诊诊断一栏,内容跨栏自动流动,缩放、改纸宽后栏位自动重排。

### 🖼 图片四周环绕 [#554](https://github.com/Hufe921/canvas-editor/issues/554)

浮动图片支持文字四周环绕——手写签名图插进段落中间,文字自动绕排,随内容增删实时调整。

### 📏 标尺 [#438](https://github.com/Hufe921/canvas-editor/issues/438)

水平 + 垂直双标尺,刻度随缩放联动,页边距、缩进一目了然,排版对齐不再靠猜。

### 🔢 多级有序列表 [#440](https://github.com/Hufe921/canvas-editor/issues/440)

子列表编号正确联动:一级"1. 高血压"下挂"1. 高血压1级 / 2. 原发性高血压",增删条目后全层级自动重排。

### 📑 区域子文档(Area)

一份文档内可划分多个**独立区域**:主病历 + 补充病历各有独立的编辑上下文、占位符、只读与隐藏规则,区域甚至可以放进表格单元格 [#1317](https://github.com/Hufe921/canvas-editor/issues/1317)。配套的 `executeInsertArea` / `executeLocationArea` / `executeSetAreaValue` / `executeDeleteArea` 系列 API 让"一份文档、多段分管"成为可能。

### ⏺ 宏录制与回放 [#478](https://github.com/Hufe921/canvas-editor/issues/478)

录制一段操作序列(插入控件、设置样式、填充数据),一键回放,适合批量生成与自动化测试。

### 🆚 文档对比 API [#1024](https://github.com/Hufe921/canvas-editor/issues/1024)

新增 compare 能力,两个版本文档的差异一目了然,配合留痕模式可以构成一个基本的审阅闭环。

---

## 📅 近三年重点需求回顾(2023.08 → 2026.07)

1.0 不是一蹴而就的。近三年 **781 次提交、256 个修复、479 个 issue 被处理**,下面是社区呼声最高的几条主线:

### 表格体系(投入最大的一条线)

- 表格分页优化 [#41](https://github.com/Hufe921/canvas-editor/issues/41) ⭐
- 表格宽度自适应内容与页面 [#1387](https://github.com/Hufe921/canvas-editor/issues/1387) [#1453](https://github.com/Hufe921/canvas-editor/issues/1453)
- 表格嵌套操作 [#650](https://github.com/Hufe921/canvas-editor/issues/650)、拆分单元格 [#826](https://github.com/Hufe921/canvas-editor/issues/826)、合并保留内容 [#932](https://github.com/Hufe921/canvas-editor/issues/932)
- 快速插入行/列工具、虚线边框 [#858](https://github.com/Hufe921/canvas-editor/issues/858)、边框颜色与宽度 [#897](https://github.com/Hufe921/canvas-editor/issues/897)
- 表格可超出正文边界 [#1232](https://github.com/Hufe921/canvas-editor/issues/1232)、自动生成 colgroup [#1404](https://github.com/Hufe921/canvas-editor/issues/1404)

### 控件体系(表单化)

- 控件级联与校验 [#671](https://github.com/Hufe921/canvas-editor/issues/671)、控件嵌套 [#425](https://github.com/Hufe921/canvas-editor/issues/425)
- 数字控件(内置计算器)[#925](https://github.com/Hufe921/canvas-editor/issues/925)、Select 多选与输入 [#518](https://github.com/Hufe921/canvas-editor/issues/518)、日期控件年月面板 [#1256](https://github.com/Hufe921/canvas-editor/issues/1256)
- 控件分组 [#1259](https://github.com/Hufe921/canvas-editor/issues/1259)、设计模式 [#795](https://github.com/Hufe921/canvas-editor/issues/795)、批量设置属性 [#1037](https://github.com/Hufe921/canvas-editor/issues/1037)

### 排版与版面

- 多栏布局 [#1237](https://github.com/Hufe921/canvas-editor/issues/1237)、图片环绕 [#554](https://github.com/Hufe921/canvas-editor/issues/554)、标尺 [#438](https://github.com/Hufe921/canvas-editor/issues/438)
- 多级有序列表 [#440](https://github.com/Hufe921/canvas-editor/issues/440)、页面边框、行号 [#734](https://github.com/Hufe921/canvas-editor/issues/734)
- 单页隐藏页眉页脚 [#778](https://github.com/Hufe921/canvas-editor/issues/778)、页眉页脚可编辑

### 区域子文档(Area)

- 区域占位符 [#1076](https://github.com/Hufe921/canvas-editor/issues/1076)、区域可删除/隐藏 [#1014](https://github.com/Hufe921/canvas-editor/issues/1014) [#1139](https://github.com/Hufe921/canvas-editor/issues/1139)
- 区域系列 API、表格单元格内区域 [#1317](https://github.com/Hufe921/canvas-editor/issues/1317)

### 效率工具

- 宏录制回放 [#478](https://github.com/Hufe921/canvas-editor/issues/478)、格式刷增强 [#446](https://github.com/Hufe921/canvas-editor/issues/446)
- 正则搜索 [#1308](https://github.com/Hufe921/canvas-editor/issues/1308)、选区内搜索 [#1336](https://github.com/Hufe921/canvas-editor/issues/1336)、忽略大小写 [#1316](https://github.com/Hufe921/canvas-editor/issues/1316)
- 图片裁剪 [#1327](https://github.com/Hufe921/canvas-editor/issues/1327)、图片标题 [#1326](https://github.com/Hufe921/canvas-editor/issues/1326)、放大镜 [#1391](https://github.com/Hufe921/canvas-editor/issues/1391)、涂鸦模式 [#992](https://github.com/Hufe921/canvas-editor/issues/992)

### 企业级能力

- 留痕模式 [#312](https://github.com/Hufe921/canvas-editor/issues/312)、文档对比 [#1024](https://github.com/Hufe921/canvas-editor/issues/1024)
- 水印:图片水印 [#1043](https://github.com/Hufe921/canvas-editor/issues/1043)、图层配置 [#1386](https://github.com/Hufe921/canvas-editor/issues/1386)、重复平铺 [#665](https://github.com/Hufe921/canvas-editor/issues/665)
- 无障碍(屏幕阅读器)[#1420](https://github.com/Hufe921/canvas-editor/issues/1420)、国际化 [#1159](https://github.com/Hufe921/canvas-editor/issues/1159)
- 打印:离屏打印、过滤空控件/隐藏元素 [#1429](https://github.com/Hufe921/canvas-editor/issues/1429) [#1385](https://github.com/Hufe921/canvas-editor/issues/1385) [#1410](https://github.com/Hufe921/canvas-editor/issues/1410)

---

## 🐛 Bug Fixes(自 0.9.137)

- 修复含跨行单元格(`rowspan`)的高内容时行高计算错误
- 修复控件级联恢复时成员状态同步与高亮错误
- 修复非激活态控件输入前未正确激活的问题 [#1443](https://github.com/Hufe921/canvas-editor/issues/1443)

完整提交列表请见 [CHANGELOG.md](https://github.com/Hufe921/canvas-editor/blob/main/CHANGELOG.md)。

---

## 📦 升级指南

如果你正在使用 0.9.x:

```bash
npm install @hufe921/canvas-editor@1.0.0
# 或
pnpm add @hufe921/canvas-editor@1.0.0
```

**1.0.0 没有引入破坏性 API 变更**,绝大多数用户可以无缝升级。建议关注以下两点:

1. **表格分页行为变化**:跨页表格的渲染结果会与 0.9.x 不同(变得更"正确")。如果你的业务对表格视觉快照有截图断言,需要更新测试基线。
2. **控件级联校验是可选启用**:不会自动影响现有控件,需要显式配置。

如果升级遇到任何问题,欢迎在 [Discussions](https://github.com/Hufe921/canvas-editor/discussions) 提问,或在 [Issues](https://github.com/Hufe921/canvas-editor/issues/new?template=bug_report.yml) 提交 bug。

---

## 🗺 路线图

1.0 之后,方向从"补关键能力"转向"扩展生态":

1. **大文本渲染性能**:面向超长文档的测量与绘制优化,大文档下保持流畅编辑
2. **渲染层独立**:渲染与内核解耦,同一份文档模型可输出到 SVG、PDF、DOM 等多种渲染目标
3. **多光标选区**:支持多处光标与选区,为协作编辑和批量操作打底
4. **协作编辑能力**:多人实时协作、光标同步与冲突合并(Yjs / CRDT 路线评估中)

如果你对某个方向感兴趣,欢迎在对应 issue 下 +1 或参与讨论——**呼声最高的特性会优先排期**。

---

## ✍️ 一些数据

Canvas Editor 是我在业余时间维护的个人项目,过去 1723 天:

- **1460 次提交**,其中近 3 年 781 次;处理了 **479 个 issue**,发布了 **139 个版本**
- 提交最多的时段是**晚上 9 点到 10 点**(224 + 150 次)——下班之后的时间
- **162 次提交发生在深夜 10 点以后**,**245 次发生在周末**

  1.0 的落地也离不开社区:[#41](https://github.com/Hufe921/canvas-editor/issues/41) 的最终方案,吸收了多位社区同学 PR 中的思路,并在 POC 分支经过了公开验证;最后的重构阶段,也借助了 AI 编程工具提升效率。这也是开源有意思的地方——一个问题挂了四年,最后是很多人一起把它推过终点线的。

如果这个项目帮到过你,一个 Star、一次转发,都是很好的支持。

---

## 💛 个人赞助

Canvas Editor 是一个由个人发起、近 5 年利用业余时间持续投入的开源项目,始终遵循 MIT 协议免费开源。1.0 是一个里程碑,但也是一个新的起点——上面列出的路线图每一项都需要相当大的投入。

如果你或你的公司在使用 Canvas Editor,并希望项目长期健康发展,欢迎赞助:

- **GitHub Sponsors**:https://hufe.club/donate.jpg

哪怕是一次性的小额赞助,也是对持续维护最直接的鼓励。当然,Star、转发、认真的 issue 和 PR,同样珍贵。

---

## 🙏 致谢

感谢过去 4 年多里每一位提交 issue、提 PR、在群里答疑、写文章推荐、默默 star 的朋友。

Canvas Editor 的下一个篇章,希望继续与你同行。

---

<p align="center">
  <strong>Canvas Editor 1.0.0</strong><br/>
  <a href="https://github.com/Hufe921/canvas-editor">⭐ GitHub</a> ·
  <a href="https://hufe.club/canvas-editor">🚀 Live Demo</a> ·
  <a href="https://hufe.club/canvas-editor-docs">📖 文档</a> ·
  <a href="https://hufe.club/donate.jpg">💛 赞助</a>
</p>

---

---

# Canvas Editor 1.0.0 Released 🎉 (English)

> **After 1,723 days, 139 releases, and 1,460 commits, Canvas Editor officially enters the 1.0 era.**
>
> This release is a solid step forward for canvas-based rich text editing in document scenarios with strict layout and pagination requirements — EMR (electronic medical records), contracts, official documents, and reports.

## 📌 TL;DR

- ⭐ **Table pagination — the #1 community pain point for over 4 years ([#41](https://github.com/Hufe921/canvas-editor/issues/41)) — has been systematically addressed** by moving from data-level splitting to render-level slicing: cross-page table merging, cursor/selection, and input now work correctly together.
- ✨ Eight headline features: **Trace Mode, control cascade & validation (expressions), control nesting, multi-column layout, rulers, multi-level ordered lists, area sub-documents, and macros**.
- 🛠 The API is stabilizing and follows SemVer: no breaking changes throughout 1.x.

## 🎯 Why 1.0? Why now?

Since the first commit on November 12, 2021 — 1,723 days ago — one question has driven this project:

> **"Can a Canvas-based rich text editor truly replace contenteditable for serious document scenarios?"**

Before 1.0.0, the answer was "almost, with a few hard nuts to crack." After 1.0.0, I can say with reasonable confidence: **for most serious document scenarios, yes, it's ready to use**.

| Dimension         | Before 1.0                              | 1.0.0                                                                    |
| ----------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| **Tables**        | Usable on one page, broken across pages | Render-level pagination, column sync, adaptive row heights much improved |
| **Controls**      | Single-level, no validation             | Nesting, cascade expressions, form validation                            |
| **Layout**        | Basic pagination                        | Multi-column, image wrapping, rulers, trace mode                         |
| **API stability** | Constantly evolving                     | Core API frozen under strict SemVer                                      |

**Table pagination is the most critical piece of the puzzle.** It is the community's most requested and technically hardest feature, and the main reason 1.0 took this long. With it landed, the hardest rendering path is essentially unblocked, and future iterations shift from "fixing critical bugs" to "expanding capabilities."

## ⭐ Headline: Table Pagination [#41](https://github.com/Hufe921/canvas-editor/issues/41)

[Issue #41](https://github.com/Hufe921/canvas-editor/issues/41) was filed on **April 28, 2022** — 1,556 days ago — and has accumulated 39 comments, making it one of the longest-lived issues in the repo. The original report was deceptively simple:

> When a table spans pages, changing column widths does not stay in sync.

Behind it lies one of the most complex rendering paths in the editor: rows must split dynamically at page boundaries, column widths must stay strictly aligned across pages, cells containing images/lists/nested tables need adaptive heights, and cursor and selection must respond correctly after pagination.

### Evolution: from data-level splitting to render-level slicing

**① Data-level splitting (around 2024.03)**

The first approach: physically split overflow non-spanning rows into a _new table_, re-merging at render time and merging again when saving. This delivered "it paginates," but the ceiling was obvious — once a paginated table changed, it could not be restored; edge cases such as merged-row cells failing to cross pages, over-tall single cells not paginating, and controls losing rows across pages kept being reported in the issue. The root cause: **once data is physically cut in two, every operation pays the cost of synchronizing two pieces of state**.

**② Community collaboration & POC (2025)**

Along the way, community members including [@the-lemonboy](https://github.com/the-lemonboy), [@sLin90](https://github.com/sLin90) and [@ThunderYu](https://github.com/ThunderYu) contributed ideas and PRs. Building on their approaches, I ran a feasibility proof on the `poc/table-paging` branch and laid out a full checklist: cross-page IME input, cross-page cursor behavior (delete/type/arrow keys), cross-page selection, controls across pages, composite elements across pages, and boundary handling.

**③ Render-level slicing (2026.07, shipped)**

The final solution is a shift in core thinking: **no physical cutting at the data layer — slice only at render time**. The document data always stays intact; pagination breakpoints are computed only during the Canvas drawing phase. This "dimensionality reduction" made most state-synchronization bugs simply disappear, with performance and stability improving alongside.

### The change itself (`feat: optimize table pagination #41`)

- New `TablePaging` module (~740 lines): measures and computes page breakpoints
- `TableParticle` rendering rewritten (~510 lines changed): draws sliced by breakpoint at render time
- `Position` cursor system adapted for cross-page behavior (~500 lines changed): IME input, delete/type/arrow-key cursor, cross-page selection
- **1,600+ lines of unit tests** (`tests/core/draw/tablePaging.test.ts`)
- **3,373 lines added** in total

Shipped alongside:

- ✅ Adaptive row heights for cells with tall/`rowspan` content
- ✅ Table width auto-fits content and page ([#1387](https://github.com/Hufe921/canvas-editor/issues/1387) [#1453](https://github.com/Hufe921/canvas-editor/issues/1453))
- ✅ Column width sync across pages

**This is a ground-up rewrite, not a patch.** Pagination scenarios vary endlessly — if you hit new edge cases, please report them under [#41](https://github.com/Hufe921/canvas-editor/issues/41).

## 🎁 Feature Tour

### 🖋 Trace Mode ([#312](https://github.com/Hufe921/canvas-editor/issues/312))

Word-style track changes: every insertion, deletion, and edit leaves a trace — deletions shown with strikethrough, author & timestamp on hover, with visibility control. Compliance-heavy scenarios like medical-record review, contract review, and official-document markup can skip a lot of wheel-reinventing.

### 🔗 Control Cascade & Validation (expressions) ([#671](https://github.com/Hufe921/canvas-editor/issues/671))

Select / Radio / Checkbox / Text controls can form **parent-child linkage and validation rules**, with expression-based auto-calculation:

- Enter height 170cm and weight 100kg — **BMI computes to 34.6 automatically**, with linked "obesity intervention advice"
- Selecting "has hypertension" automatically brings up the required "hypertension grade" field
- Required-field and format validation before submit

A medical-record template can now carry part of its own "business logic."

### 🪆 Control Nesting ([#425](https://github.com/Hufe921/canvas-editor/issues/425))

Controls can nest rich text and other controls, so complex form structures (e.g. a "staging selector" inside a "diagnosis tag") can be expressed naturally.

### 📰 Multi-column Layout ([#1237](https://github.com/Hufe921/canvas-editor/issues/1237))

Word-like column layout: chief complaint and history in one column, examinations and diagnosis in another, with content flowing automatically across columns and relayout on zoom or page-width change.

### 🖼 Text Wrapping Around Images ([#554](https://github.com/Hufe921/canvas-editor/issues/554))

Floating images support four-side text wrapping — drop a handwritten signature image into a paragraph and text flows around it, adjusting in real time as content changes.

### 📏 Rulers ([#438](https://github.com/Hufe921/canvas-editor/issues/438))

Horizontal + vertical rulers with zoom-synced scales; margins and indents at a glance — no more guessing for alignment.

### 🔢 Multi-level Ordered Lists ([#440](https://github.com/Hufe921/canvas-editor/issues/440))

Nested numbering stays consistent: "1. Hypertension" parents "1. Grade 1 hypertension / 2. Primary hypertension," and all levels renumber automatically as items are added or removed.

### 📑 Area Sub-documents

A document can be divided into multiple **independent areas**: main record + supplementary record, each with its own editing context, placeholder, readonly and visibility rules — areas can even live inside table cells ([#1317](https://github.com/Hufe921/canvas-editor/issues/1317)). The `executeInsertArea` / `executeLocationArea` / `executeSetAreaValue` / `executeDeleteArea` API family makes "one document, many governed sections" possible.

### ⏺ Macro Recording & Playback ([#478](https://github.com/Hufe921/canvas-editor/issues/478))

Record a sequence of operations (insert controls, set styles, fill data) and replay it with one click — great for batch generation and automated testing.

### 🆚 Document Compare API ([#1024](https://github.com/Hufe921/canvas-editor/issues/1024))

A new compare capability makes differences between two document versions clear at a glance; together with Trace Mode it forms a basic review loop.

## 📅 The Last Three Years (2023.08 → 2026.07)

1.0 didn't happen overnight: **781 commits, 256 fixes, and 479 issues handled** in three years. Highlights by theme:

### Tables (the most invested line)

- Table pagination ([#41](https://github.com/Hufe921/canvas-editor/issues/41)) ⭐
- Table width auto-fit to content and page ([#1387](https://github.com/Hufe921/canvas-editor/issues/1387) [#1453](https://github.com/Hufe921/canvas-editor/issues/1453))
- Table nesting ([#650](https://github.com/Hufe921/canvas-editor/issues/650)), cell splitting ([#826](https://github.com/Hufe921/canvas-editor/issues/826)), content-preserving merge ([#932](https://github.com/Hufe921/canvas-editor/issues/932))
- Quick row/column tools, dashed borders ([#858](https://github.com/Hufe921/canvas-editor/issues/858)), border color & width ([#897](https://github.com/Hufe921/canvas-editor/issues/897))
- Tables allowed beyond text boundaries ([#1232](https://github.com/Hufe921/canvas-editor/issues/1232)), auto-generated colgroup ([#1404](https://github.com/Hufe921/canvas-editor/issues/1404))

### Controls (form-ification)

- Cascade & validation ([#671](https://github.com/Hufe921/canvas-editor/issues/671)), nesting ([#425](https://github.com/Hufe921/canvas-editor/issues/425))
- Number control with built-in calculator ([#925](https://github.com/Hufe921/canvas-editor/issues/925)), multi-select & input Select ([#518](https://github.com/Hufe921/canvas-editor/issues/518)), year/month date panel ([#1256](https://github.com/Hufe921/canvas-editor/issues/1256))
- Control grouping ([#1259](https://github.com/Hufe921/canvas-editor/issues/1259)), design mode ([#795](https://github.com/Hufe921/canvas-editor/issues/795)), batch property setting ([#1037](https://github.com/Hufe921/canvas-editor/issues/1037))

### Layout

- Multi-column ([#1237](https://github.com/Hufe921/canvas-editor/issues/1237)), image wrapping ([#554](https://github.com/Hufe921/canvas-editor/issues/554)), rulers ([#438](https://github.com/Hufe921/canvas-editor/issues/438))
- Multi-level ordered lists ([#440](https://github.com/Hufe921/canvas-editor/issues/440)), page borders, line numbers ([#734](https://github.com/Hufe921/canvas-editor/issues/734))
- Per-page header/footer hiding ([#778](https://github.com/Hufe921/canvas-editor/issues/778)), editable headers/footers

### Area Sub-documents

- Area placeholder ([#1076](https://github.com/Hufe921/canvas-editor/issues/1076)), deletable/hidable areas ([#1014](https://github.com/Hufe921/canvas-editor/issues/1014) [#1139](https://github.com/Hufe921/canvas-editor/issues/1139))
- Area API family, areas inside table cells ([#1317](https://github.com/Hufe921/canvas-editor/issues/1317))

### Productivity

- Macros ([#478](https://github.com/Hufe921/canvas-editor/issues/478)), format painter improvements ([#446](https://github.com/Hufe921/canvas-editor/issues/446))
- Regex search ([#1308](https://github.com/Hufe921/canvas-editor/issues/1308)), search within selection ([#1336](https://github.com/Hufe921/canvas-editor/issues/1336)), case-insensitive search ([#1316](https://github.com/Hufe921/canvas-editor/issues/1316))
- Image cropping ([#1327](https://github.com/Hufe921/canvas-editor/issues/1327)), image captions ([#1326](https://github.com/Hufe921/canvas-editor/issues/1326)), magnifier ([#1391](https://github.com/Hufe921/canvas-editor/issues/1391)), graffiti mode ([#992](https://github.com/Hufe921/canvas-editor/issues/992))

### Enterprise

- Trace mode ([#312](https://github.com/Hufe921/canvas-editor/issues/312)), document compare ([#1024](https://github.com/Hufe921/canvas-editor/issues/1024))
- Watermarks: image watermark ([#1043](https://github.com/Hufe921/canvas-editor/issues/1043)), layer configuration ([#1386](https://github.com/Hufe921/canvas-editor/issues/1386)), tiling ([#665](https://github.com/Hufe921/canvas-editor/issues/665))
- Accessibility (screen readers) ([#1420](https://github.com/Hufe921/canvas-editor/issues/1420)), i18n ([#1159](https://github.com/Hufe921/canvas-editor/issues/1159))
- Printing: offscreen print, filtering empty controls/hidden elements ([#1429](https://github.com/Hufe921/canvas-editor/issues/1429) [#1385](https://github.com/Hufe921/canvas-editor/issues/1385) [#1410](https://github.com/Hufe921/canvas-editor/issues/1410))

## 🐛 Bug Fixes (since 0.9.137)

- Fixed incorrect row-height calculation for tall content with `rowspan` cells
- Fixed control member state sync and highlight errors on cascade restore
- Fixed controls not being re-activated before input when inactive [#1443](https://github.com/Hufe921/canvas-editor/issues/1443)

See [CHANGELOG.md](https://github.com/Hufe921/canvas-editor/blob/main/CHANGELOG.md) for the full commit list.

## 📦 Upgrading

If you're on 0.9.x:

```bash
npm install @hufe921/canvas-editor@1.0.0
# or
pnpm add @hufe921/canvas-editor@1.0.0
```

**1.0.0 introduces no breaking API changes** — most users can upgrade seamlessly. Two things to note:

1. **Table pagination behavior changed**: cross-page tables render differently (more correctly) than in 0.9.x. Update visual snapshot baselines if your tests assert on them.
2. **Control cascade validation is opt-in**: existing controls are unaffected unless explicitly configured.

Questions? [Discussions](https://github.com/Hufe921/canvas-editor/discussions) · Bugs? [Issues](https://github.com/Hufe921/canvas-editor/issues/new?template=bug_report.yml)

## 🗺 Roadmap

After 1.0, the focus shifts from "filling core gaps" to "expanding the ecosystem":

1. **Large-document rendering performance**: measurement and painting optimizations to keep editing smooth in very long documents
2. **Renderer abstraction**: decouple the rendering layer from the core, so the same document model can target SVG, PDF, DOM, and more
3. **Multi-cursor & multi-selection**: multiple carets and selections, laying the groundwork for collaboration and batch operations
4. **Collaborative editing**: real-time multi-user collaboration, cursor sync, and conflict resolution (evaluating Yjs / CRDT)

+1 the issues you care about — **the most requested features get scheduled first**.

## ✍️ By the Numbers

Canvas Editor is a personal project I maintain in my spare time. Over the past 1,723 days:

- **1,460 commits** — 781 of them in the last three years; **479 issues** handled, **139 releases** shipped
- Peak commit hours are **9–10 PM** (224 + 150) — the hours after work
- **162 commits landed after 10 PM**, **245 on weekends**

  1.0 also belongs to the community: the final approach for [#41](https://github.com/Hufe921/canvas-editor/issues/41) absorbed ideas from several community PRs and was publicly validated on a POC branch; AI coding tools helped accelerate the final refactor. That's the fun of open source — an issue open for four years, finally pushed across the finish line by many people together.

If this project has helped you, a Star or a share is great support.

## 💛 Personal Sponsorship

Canvas Editor is a personal open-source project, built in spare time over nearly five years, and it remains free under the MIT license. 1.0 is a milestone, but also a starting point — every item on the roadmap above requires significant investment.

If you or your company use Canvas Editor and want to see it thrive:

- **GitHub Sponsors**: https://hufe.club/donate.jpg

Even a small one-time sponsorship is direct encouragement. And of course, stars, shares, thoughtful issues and PRs are just as valuable.

## 🙏 Acknowledgements

Thanks to everyone who filed issues, sent PRs, answered questions, wrote about the project, or quietly starred it over the past four years.

I hope to keep walking Canvas Editor's next chapter together with you.

---

<p align="center">
  <strong>Canvas Editor 1.0.0</strong><br/>
  <a href="https://github.com/Hufe921/canvas-editor">⭐ GitHub</a> ·
  <a href="https://hufe.club/canvas-editor">🚀 Live Demo</a> ·
  <a href="https://hufe.club/canvas-editor-docs">📖 Docs</a> ·
  <a href="https://hufe.club/donate.jpg">💛 Sponsor</a>
</p>

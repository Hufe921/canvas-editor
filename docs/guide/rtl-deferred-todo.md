# RTL 延期 TODO

> 防止遗漏：凡本期（正文 RTL + 独立 text-engine + HarfBuzz）**不做**、后续必做或需评估的事项统一登记于此。  
> 本期范围见 [RTL 排版设计](./rtl-layout-design.md)。架构基线见 [架构分析](./architecture.md)。

## 维护规则

1. 新发现的「本期不做」必须新增 `DEFER-xxx`，禁止只留在聊天/PR。
2. 完成：勾选总表 + 条目 Status=`done` + 链到 PR/提交。
3. 从本期挪出：更新本文件，并在设计文档用 DEFER 编号交叉引用。
4. **以本文为准**，不在其它文件维护第二份延期列表。

## 条目模板

```markdown
### DEFER-xxx 标题
- Status: pending | in-progress | done | cancelled
- Priority: P1 | P2 | P3
- Depends: ...
- Area: table | control | history | performance | svg-ui | a11y | input | ...
- Notes: ...
```

## 本期范围摘要

正文段落双向混排、HarfBuzz 整形、独立 `text-engine` + host 适配、模拟光标双 DOM、逻辑删除、富文本装饰/列表镜像、start/end 对齐与 surround（P1–P4）。表格/页眉页脚接线、增量历史、字形 atlas 等见下方延期项。

## 延期项总表

按 Priority 排序：

### P1

- [ ] [DEFER-001](#defer-001) 表格单元格内文本走 text-engine（P5）
- [ ] [DEFER-004](#defer-004) Header/Footer zone 文本验收与接线（P5）
- [ ] [DEFER-009](#defer-009) 命令式增量 History + 合并 + 快照压缩（P7）
- [ ] [DEFER-010](#defer-010) 字形 atlas / 脏段缓存 / 大文档性能（P6）

### P2

- [ ] [DEFER-002](#defer-002) Table 列几何 / 边框 / 斜线 RTL 镜像评估（P5+）
- [ ] [DEFER-003](#defer-003) TableTool 拖拽与 `style.left`（P5+）
- [ ] [DEFER-005](#defer-005) Badge `right` / `horizontalAnchor`（P5）
- [ ] [DEFER-006](#defer-006) 复杂 Control 内部 flex / ControlIndentation
- [ ] [DEFER-007](#defer-007) ControlSearch / 嵌套控件 RTL
- [ ] [DEFER-016](#defer-016) 去掉 legacy 路径与 `mapToLegacyRow`
- [ ] [DEFER-018](#defer-018) Accessibility 与 RTL 阅读顺序
- [ ] [DEFER-019](#defer-019) HTML/剪贴板 `dir` 往返完整保真
- [ ] [DEFER-021](#defer-021) 移动端/`beforeinput` 删除主路径兼容

### P3

- [ ] [DEFER-008](#defer-008) 表内 Area 背景与命中
- [ ] [DEFER-011](#defer-011) justify 阿语 kashida 拉伸
- [ ] [DEFER-012](#defer-012) ICU ubidi WASM（若 JS bidi 不够）
- [ ] [DEFER-013](#defer-013) `feature/svg` DOM 渲染分支 RTL 评估
- [ ] [DEFER-014](#defer-014) Demo/工具栏方向性图标逻辑属性镜像
- [ ] [DEFER-015](#defer-015) LineNumber / PageNumber 默认侧随文档方向
- [ ] [DEFER-017](#defer-017) 协同 OT/CRDT（若产品需要）
- [ ] [DEFER-020](#defer-020) 打印 iframe 内嵌 Block 与 RTL 页边
- [ ] [DEFER-022](#defer-022) 视觉邻接删除模式

## 与路线图映射

| 路线图 | 主要 DEFER |
|--------|------------|
| P5 | 001, 002, 003, 004, 005, 008 |
| P6 | 010 |
| P7 | 009 |
| 专项 | 006, 007, 011–022 |

---

## 明细

### DEFER-001

- Status: pending
- Priority: P1
- Depends: P2 LayoutHostAdapter 稳定
- Area: table
- Notes: 单元格**内容**复用 text-engine Adapter；表框几何可仍 LTR。验收：td 内阿语混排与光标。

### DEFER-002

- Status: pending
- Priority: P2
- Depends: DEFER-001；产品决策「是否镜像整表」
- Area: table
- Notes: 列从左累加、边框/斜线是否随文档方向镜像。

### DEFER-003

- Status: pending
- Priority: P2
- Depends: DEFER-002
- Area: table
- Notes: TableTool `style.left`、列宽拖拽与 RTL 坐标。

### DEFER-004

- Status: pending
- Priority: P1
- Depends: P2/P3 正文引擎
- Area: zone
- Notes: Header/Footer 与正文同一引擎接线与验收。

### DEFER-005

- Status: pending
- Priority: P2
- Depends: —
- Area: frame
- Notes: Badge 目前仅 `left`；增加 `right` 或 `horizontalAnchor`，避免阿语文档签章贴左。

### DEFER-006

- Status: pending
- Priority: P2
- Depends: 正文 ControlBorder（本期）
- Area: control
- Notes: 控件内部 flex、`ControlIndentation.VALUE_START` 等强 LTR 缩进。

### DEFER-007

- Status: pending
- Priority: P2
- Depends: DEFER-006
- Area: control
- Notes: ControlSearch 高亮与嵌套控件内双向文本。

### DEFER-008

- Status: pending
- Priority: P3
- Depends: DEFER-001
- Area: table
- Notes: 表内 Area 背景与命中几何。

### DEFER-009

- Status: pending
- Priority: P1
- Depends: —
- Area: history
- Notes: `ICommand` execute/undo/merge、连续输入合并、pako 基线压缩；`historyMode: snapshot | command`。与 RTL 解耦但勿遗漏。

### DEFER-010

- Status: pending
- Priority: P1
- Depends: P2 GlyphRenderer
- Area: performance
- Notes: 常用字形 atlas、脏段 LayoutCache、大文档帧率/内存指标。

### DEFER-011

- Status: pending
- Priority: P3
- Depends: P4 Alignment
- Area: layout
- Notes: justify 时阿语 kashida；引擎预留扩展点。

### DEFER-012

- Status: pending
- Priority: P3
- Depends: 首期 bidi-js 边界不足时
- Area: bidi
- Notes: 编译 ICU ubidi WASM 替换/加强 BidiResolver。

### DEFER-013

- Status: pending
- Priority: P3
- Depends: 合入 `feature/svg` 时
- Area: svg-ui
- Notes: 当前主干无 DOM 文档 SVG；分支合入需单独评估 `dir`/坐标。

### DEFER-014

- Status: pending
- Priority: P3
- Depends: —
- Area: svg-ui
- Notes: 工具栏/菜单方向性 SVG 图标用逻辑属性或 `scaleX(-1)`，与引擎解耦。

### DEFER-015

- Status: pending
- Priority: P3
- Depends: P3 段级镜像（若未做完）
- Area: frame
- Notes: LineNumber / PageNumber 默认侧或 rowFlex 随文档方向。

### DEFER-016

- Status: pending
- Priority: P2
- Depends: harfbuzz 路径稳定、回归绿
- Area: architecture
- Notes: 删除 `textEngine: legacy` 与 `mapToLegacyRow`，降低双路径成本。

### DEFER-017

- Status: pending
- Priority: P3
- Depends: 产品需求
- Area: collab
- Notes: 协同 OT/CRDT；方案未要求，可按需改为 cancelled。

### DEFER-018

- Status: pending
- Priority: P2
- Depends: P3 视觉序稳定
- Area: a11y
- Notes: Accessibility 模块与 RTL 阅读/朗读顺序。

### DEFER-019

- Status: pending
- Priority: P2
- Depends: P1 direction 字段
- Area: clipboard
- Notes: HTML/剪贴板 `dir` 往返边界用例完整保真。

### DEFER-020

- Status: pending
- Priority: P3
- Depends: —
- Area: print
- Notes: 打印 iframe 内嵌 Block 与 RTL 页边叠加。

### DEFER-021

- Status: pending
- Priority: P2
- Depends: 移动端实测 keydown 不足时
- Area: input
- Notes: 本期以 keydown Backspace/Delete 为准；若仅 `beforeinput` 可达则补适配。

### DEFER-022

- Status: pending
- Priority: P3
- Depends: 产品要求
- Area: input
- Notes: 默认逻辑删除；若要求 Delete 跟视觉邻接，另开模式开关。

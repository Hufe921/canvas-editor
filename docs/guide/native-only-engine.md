# T20：只保留 HarfBuzz 排版

T20 删除了旧文字引擎的实现及切换入口。正文、表格单元格、控件、列表标记、
页眉页脚、页码、水印和图片说明文字统一使用 HarfBuzz；图片、公式、表格、
分隔符、分页符、复选框、单选框和 Block 继续使用各自的原生对象布局与绘制。

## 删除范围

- 删除 `BrowserTextShaper`、`TextParticle`、`IncrementalRowComputer`，以及 Draw
  中逐元素测宽、断行、对齐与续算的旧主循环。
- 删除 `forceLegacy`、resume/旧增量行状态、旧 RTL 告警、旧布局字段清理回退、
  控件 minWidth 旧行补位循环和列表浏览器测宽。
- 删除失去调用者的旧表格递归布局编排、FlowConstraints、BlockMeasure 和旧行盒策略。
  表格行列几何查询、镜像坐标等仍有对象消费方的工具保留。
- 删除旧分页回退循环。分页依赖原生 DocumentFlow 放置结果，连续页使用原生行高度。
- 删除超链接、标签、上下标的浏览器文字绘制方法；保留超链接交互、标签背景和
  上下标装饰偏移。删除留痕中对浏览器字体基准测量的依赖。
- 删除 `TextEngineMode`、`RenderMode` 枚举、导出及配置字段，不再存在运行时引擎选择。
- 位置与表格分片只读取原生节点，禁止退回文档元素上的 metrics/visualLeft 字段。

`IRow`/行快照仍是 T19 保留的独立兼容查询输出，按原生几何即时生成、深克隆；
它们不参与排版、缓存、绘制或编辑。旧增量算法的行快照和 resume 类型已经删除。
这是输出兼容边界，并非另一个渲染引擎。

## 初始化和旧配置

默认构造也必须等待字体及 WASM 初始化：

```ts
const editor = await Editor.create(container, data, {
  autoDownloadFonts: true
})
// 或 new Editor(...) 后 await editor.ready
```

JavaScript 调用方只要传入 `textEngine` 或 `renderMode`（即使值为 undefined），
就会收到 TypeError，提示移除该选项并等待 `editor.ready`。TypeScript 配置接口和
包导出已删除这两个选择器。初始化失败按现有 ready/state/error 协议报告；
缺字沿用字体下载/诊断/占位流程，不再启用浏览器文字回退。

HarfBuzz 的一个逻辑簇可能产生多个字形。兼容光标适配器将同簇字形几何合并，
避免阿拉伯字母附加字形造成重复光标停靠点；保留逻辑索引与视觉移动语义。

## 验证与迁移边界

- TypeScript、ESLint、ESM 库构建及包消费检查通过。
- 定向 Vitest：24 个文件、171 个用例，覆盖初始化、原生布局、字体整形、对象、
  控件、交互、模型隔离及增量差分。
- Electron 定向覆盖 10 个规格文件、53 个用例：环绕分栏、跨页表格、对象及 iframe
  打印、双向交互、控件、辅助文字、正文及表格增量布局，以及 Worker 序列化和打印基线。
- 新增 native-only 契约测试：默认初始化和编辑禁止 Canvas measureText/fillText/
  strokeText；扫描生产源码，防止恢复旧实现、模式开关或浏览器文字绘制。
- 原 BrowserTextShaper 测试改用真实 HarfBuzz 及固定字体，按逻辑簇而非字形数量
  验证交互；旧增量行算法及旧 RTL 提示测试随实现删除。
- T01 快照和 T10 几何 JSON 保持不变，并增加 SHA-256 校验。可执行基线迁入
  `native-baseline.test.ts`，检查原生几何和语义；历史快照不再要求旧算法运行。
- 对象和控件的浏览器断言改读 position.metrics，不再读取文档模型上的瞬态字段。
- 浏览器基线移除 legacy 变体；WASM 守卫同时观察 instantiate/instantiateStreaming，
  并在每次页面加载时固定 DPR，避免开发服务器重载丢失测试环境设置。

本项只执行定向回归；T21 的公共 API/完整示例文档迁移、T22 的全量单测与多浏览器
验收、T23 性能资源检查、T24 最终审计仍按原任务执行。本次未把全量回归标记为通过。
当前验证环境为 Node 22.22.1，低于 package.json 声明的 Node 24.13.1；
构建和包消费检查通过，但目标 Node 版本验收仍应在最终回归环境执行。

# 项目关系、独立发包与差异

## 来源与维护关系

本项目由 **Herbert He** 独立维护，基于
[Hufe921/canvas-editor](https://github.com/Hufe921/canvas-editor) fork。
感谢 Hufe 和上游贡献者提供的原始实现与文档能力。

| 项目            | 本 fork                                                               | 原项目                                                            |
| --------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------- |
| npm 包          | `@herberthe/canvas-editor`                                            | `@hufe921/canvas-editor`                                          |
| 版本线          | 从 `0.1.0` 开始独立演进                                               | 保留上游自己的版本线                                              |
| 仓库 / 问题反馈 | [HerbertHe/canvas-editor](https://github.com/HerbertHe/canvas-editor) | [Hufe921/canvas-editor](https://github.com/Hufe921/canvas-editor) |
| 维护            | Herbert He                                                            | Hufe 及上游维护者                                                 |
| 关系            | 独立 fork，不是上游官方发行，无官方背书或隶属关系                     | 原始项目                                                          |
| 许可证          | MIT；新增 fork 修改版权，并保留继承代码的原声明                       | 原 MIT 声明                                                       |

本 fork 不依赖原 npm 包，不覆盖原包，不共享发布权限或版本号。
`0.1.0` 不是原包的降级版本，也不意味着与原包无差别兼容。
仓库元数据表示待发布版本，不表示 npm 已完成发布。

## 功能差异与对比边界

对比固定为上游 **1.0.5**、
[main 提交 1d7cd1a7](https://github.com/Hufe921/canvas-editor/tree/1d7cd1a7742f3e8af1f67536a5157d03b2945de7)。
这不是对上游未来能力的判断。“无同等管线”不代表浏览器本身不能显示对应文字。

| 能力                                         | 上游基线                               | 本 fork 0.1.0                                                        |
| -------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------- |
| 文字排版 / 绘制                              | Canvas 浏览器测量和文字绘制            | HarfBuzz 唯一整形与原生布局；Canvas 字形轮廓绘制                     |
| 字体输入                                     | 浏览器字体选择与回退                   | 注册 TTF/OTF/WOFF/WOFF2；按实际字体 face 管理覆盖与轮廓              |
| 缺字检测                                     | 无同等显式覆盖报告管线                 | 覆盖报告、变化事件、缺字方框、页面和控制台提示                       |
| 基本字体自动下载                             | 无同等 Bunny 下载管线                  | 默认开启、可运行时关闭、失败重试；支持离线手动字体                   |
| RTL / 双向与复杂文字                         | 无同等 HarfBuzz cluster/caret 几何管线 | 统一字形/cluster/caret、视觉导航与逻辑删除；不是所有语言均已完整验证 |
| 初始化                                       | 同步构造                               | `Editor.create()` / `editor.ready`，包含失败状态与销毁清理           |
| 增量排版                                     | 已有行级增量能力                       | 原生段落布局复用，再重新计算分页与位置；不承诺更快                   |
| 包格式                                       | ESM + UMD                              | 仅 ESM 与类型声明；包根 exports；不支持 require/UMD                  |
| 页面绘制                                     | 主干 Canvas，另有 SVG 实验分支         | 默认且仅 Canvas；SVG 绘制与独立 SVG 导出暂缓、不可用                 |
| 表格、控件、分页、段落间距、批注、留痕、宏等 | 上游已有                               | 继承并适配，不作为本 fork 原创新功能宣传                             |
| 插件生态                                     | 上游维护的外部插件                     | 可作为参考；需逐项验证字体、异步初始化及 API 兼容性                  |

依据：[上游包配置](https://github.com/Hufe921/canvas-editor/blob/1d7cd1a7742f3e8af1f67536a5157d03b2945de7/package.json)、
[上游文字绘制](https://github.com/Hufe921/canvas-editor/blob/1d7cd1a7742f3e8af1f67536a5157d03b2945de7/src/editor/core/draw/particle/TextParticle.ts)。
本 fork 实现位于 `src/editor/core/text-engine`、`core/layout` 及
`core/text-engine-host`；接口与边界见[字体与 ESM 迁移](./font-and-esm-migration.md)。

## Canvas-only 支持范围

本版本页面绘制固定使用 Canvas，没有可切换的 renderer 配置。
**SVG 页面实现、SVG 后端选项与独立 SVG 文档导出均未提供，且暂缓实施。**
不要配置 `renderer: 'svg'`；旧 `renderMode` / `textEngine` 也不可使用。
公式、图标、插入的 SVG 图片与字形缓存中的 SVG path 数据属于资源，
不表示存在 SVG 页面引擎，不需要为了暂停页面引擎而删除这些资源。
打印采用 Canvas 图片链路，不承诺可搜索的矢量 PDF。

[SVG 评估](./harfbuzz-svg-assessment.md)仅作为未来方案保存，所有 SVG-01～12
任务尚未启动。T23/T24 已于 2026-10-22 完成验收，详见[最终验收](./native-release-acceptance.md)。
实测仍有明显性能成本，增量不一定更快；SVG 评估与性能目标不作为已实现功能宣传。

## 安装、迁移与本地示例

```sh
npm uninstall @hufe921/canvas-editor
npm install @herberthe/canvas-editor@0.1.0
```

```typescript
import Editor from '@herberthe/canvas-editor'

const editor = await Editor.create(
  document.querySelector<HTMLDivElement>('.canvas-editor')!,
  { main: [{ value: '周末计划 · Weekend plans · خطة نهاية الأسبوع' }] }
)
```

- 同步 `new Editor()` 后必须等待 `editor.ready` 再执行修改或几何命令。
- 删除旧文字引擎配置和旧枚举；更新所有根包导入，禁止内部深路径导入。
- 默认开启 Bunny 基本字体下载；离线环境设置 `autoDownloadFonts: false` 并提供字体。
- 基本字体不保证罕见字、所有语言/样式或彩色 emoji 覆盖；缺字提示仍可能出现。
- 用相同字体重新验收分页、行宽、选区、控件和插件；不保证与浏览器字体度量一致。
- Node.js 开发环境要求 `>=24.13.1`，浏览器与构建器需支持 WASM、Worker 和顶层 await。

`npm run dev` 启动本 fork 的日常生活多语种示例，`npm run docs:dev` 启动本地文档。
独立包消费示例见 `examples/esm-fonts`。上游网站、插件和历史发布文档属于原项目，
不能作为本 fork 已上线站点或兼容承诺。

## 发布与许可证

先运行 `npm run lib`、`npm run test:package`、`npm run docs:build`，
再用 `npm pack --dry-run` 检查包内容。实际发布需使用有 `@herberthe` scope
发布权限的 npm 账号，命令为 `npm publish --access public`；这是一项独立发布操作。
预发布检查、包名检查和文件清单并不替代暂缓中的 T23/T24 验收。

fork 修改版权为 **Copyright (c) 2026-present Herbert He**。
继承部分保留 **Copyright (c) 2021-present hufe** 与完整 MIT 许可正文，
详见仓库 `LICENSE`、`NOTICE`，两者随 npm 包分发。
第三方依赖和字体保持各自许可证；修改项目作者不会转移原代码的版权。

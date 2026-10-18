# 入门

> 所见即所得的富文本编辑器。

本项目是 Herbert He 独立维护的 `Hufe921/canvas-editor` fork，包名
`@herberthe/canvas-editor`，从 `0.1.0` 开始独立版本线。
文字统一使用 HarfBuzz 排版，**默认且仅支持 Canvas 页面绘制**。
SVG 页面绘制与独立 SVG 导出暂缓，当前没有 SVG 后端选项。
SVG 图片、公式和图标资源仍可使用，不代表支持 SVG 页面引擎。

::: warning
本 fork 与上游独立维护，并非上游官方版本；不保证原插件无需适配。
菜单栏与工具栏可参考本仓库 Demo（`npm run dev`），文档可用 `npm run docs:dev` 启动。
[项目关系、功能差异与迁移](./fork-and-differences.md)说明了继承能力和新增管线。
:::

## 功能点

- 富文本操作：撤销、重做、格式刷、清除格式、字体、字号、加粗、斜体、下划线、删除线、上下标、文本颜色、高亮、对齐方式、行高、段前段后间距、标题、列表、首行缩进
- 插入元素：表格、图片、超链接、分割线、分页符、LaTeX 公式、日期选择器、Tab、内容块、标签、区域（Area）
- 表格：行列增删、单元格合并与拆分、边框样式、背景色、垂直对齐、跨行跨列、跨页分页
- 打印：基于 Canvas 转图片打印；本包不提供独立 SVG 或原生 PDF 导出
- 控件：文本、数字、下拉选择、单选框组、复选框组、日期，支持占位符、前后缀、默认值、禁用与缩进对齐规则，支持控件嵌套
- 级联表达式：控件值变化时自动联动其他控件或标题的显隐、必填、可编辑、可删除，支持计算表达式
- 留痕：插入、删除修订的记录与可视化标记
- 宏（Macro）：录制宏与脚本宏，支持命令录制回放、序列化持久化与自定义逻辑
- 编辑模式：编辑、清洁、只读、表单、打印
- 页面模式：分页、连页，支持页边距、页眉、页脚、页码
- 水印：文字、图片，支持置于内容顶层或底层
- 批注：文本批注的新增、定位与删除
- 目录：基于标题自动生成，支持点击导航定位
- 右键菜单：内置菜单，支持按元素类型自定义扩展
- 快捷键：内置快捷键，支持自定义覆盖
- 拖拽：文字、元素、控件
- 搜索与替换：关键字搜索、上下导航、替换
- 国际化（i18n）：内置中、英文，支持扩展其他语言
- 插件生态：[Word / Excel 导入导出、公式、批注、拼写检查等 上游插件（需验证本 fork 兼容性）](https://github.com/Hufe921/canvas-editor-plugin)

## Step. 1: 下载 npm 包

```sh
npm i @herberthe/canvas-editor@0.1.0 --save
```

## Step. 2: 准备一个容器

```html
<div class="canvas-editor"></div>
```

## Step. 3: 实例化编辑器

- 仅包含正文内容

```javascript
import Editor from '@herberthe/canvas-editor'

const editor = await Editor.create(
  document.querySelector('.canvas-editor'),
  [
    {
      value: 'Hello World'
    }
  ],
  {}
)
```

- 包含正文、页眉、页脚内容

```javascript
import Editor, { RowFlex } from '@herberthe/canvas-editor'

const editor = await Editor.create(
  document.querySelector('.canvas-editor'),
  {
    header: [
      {
        value: 'Header',
        rowFlex: RowFlex.CENTER
      }
    ],
    main: [
      {
        value: 'Hello World'
      }
    ],
    footer: [
      {
        value: 'canvas-editor',
        size: 12
      }
    ]
  },
  {}
)
```

## Step. 4: 配置编辑器

详见下一节

## 初始化、字体与 ESM 迁移

文字统一使用 HarfBuzz，无需配置引擎。`autoDownloadFonts` 默认 true，
缺字时自动从 Bunny Fonts 下载基本字体；ready 等待 WASM、显式字体和首次布局，
不等待后台下载。罕见字、emoji 和特殊样式可能仍需额外字体。

关闭自动下载时传入 `{ autoDownloadFonts: false }`；缺字提示仍保留，
可用 `await editor.register.fonts([{ family, data }])` 手动补字体。
WASM/首排失败时 `Editor.create` 拒绝并清理实例；同步构造后须 `await editor.ready`。

仅支持 ESM 包根导入，不支持 UMD、require 或内部深路径。旧 `textEngine` /
`renderMode` 配置和对应枚举已删除，传入旧键会抛出明确迁移错误。
Vite 构建使用 `build.target: 'esnext'`，部署时保留所有生成的相对 chunk。

完整接口、覆盖边界、离线示例和迁移步骤见[字体与 ESM 迁移](./font-and-esm-migration.md)。
独立可运行示例位于仓库 `examples/esm-fonts`。

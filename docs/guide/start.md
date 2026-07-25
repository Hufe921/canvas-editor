# 入门

> 所见即所得的富文本编辑器。

得益于光标及文字排版的完全自行实现。绘制底层也可由 svg 渲染，详见代码：[feature/svg](https://github.com/Hufe921/canvas-editor/tree/feature/svg)；或借助 pdfjs 可以完成 pdf 的绘制，详见代码：[feature/pdf](https://github.com/Hufe921/canvas-editor/tree/feature/pdf)。

::: warning
官方仅提供编辑器核心层 npm 包，菜单栏或其他外部工具可自行参考文档扩展，或直接参考[官方](https://github.com/Hufe921/canvas-editor)实现，详见[demo](https://hufe.club/canvas-editor/)。
:::

## 功能点

- 富文本操作：撤销、重做、格式刷、清除格式、字体、字号、加粗、斜体、下划线、删除线、上下标、文本颜色、高亮、对齐方式、行高、段前段后间距、标题、列表、首行缩进
- 插入元素：表格、图片、超链接、分割线、分页符、LaTeX 公式、日期选择器、Tab、内容块、标签、区域（Area）
- 表格：行列增删、单元格合并与拆分、边框样式、背景色、垂直对齐、跨行跨列、跨页分页
- 打印：基于 canvas 转图片、pdf 绘制
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
- [插件](https://github.com/Hufe921/canvas-editor-plugin)

## Step. 1: 下载 npm 包

```sh
npm i @hufe921/canvas-editor --save
```

## Step. 2: 准备一个容器

```html
<div class="canvas-editor"></div>
```

## Step. 3: 实例化编辑器

- 仅包含正文内容

```javascript
import Editor from '@hufe921/canvas-editor'

new Editor(
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
import Editor from '@hufe921/canvas-editor'

new Editor(
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

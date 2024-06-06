# 入门

> 所见即所得的富文本编辑器。

得益于光标及文字排版的完全自行实现。绘制底层也可由 svg 渲染，详见代码：[feature/svg](https://github.com/Hufe921/canvas-editor/tree/feature/svg)；或借助 pdfjs 可以完成 pdf 的绘制，详见代码：[feature/pdf](https://github.com/Hufe921/canvas-editor/tree/feature/pdf)。

::: warning
官方仅提供编辑器核心层 npm 包，菜单栏或其他外部工具可自行参考文档扩展，或直接参考[官方](https://github.com/Hufe921/canvas-editor)实现，详见[demo](https://hufe.club/canvas-editor/)。
:::

## 功能点

- 富文本操作（撤销、重做、字体、字号、加粗、斜体、下划线、删除线、上下标、对齐方式、标题、列表.....）
- 插入元素（表格、图片、链接、代码块、分页符、Math 公式、日期选择器、内容块......）
- 打印（基于 canvas 转图片、pdf 绘制）
- 控件（单选、文本、日期、单选框组、复选框组）
- 右键菜单（内部、自定义）
- 快捷键（内部、自定义）
- 拖拽（文字、元素、控件）
- 页眉、页脚、页码
- 页边距
- 分页
- 水印
- 批注
- 目录
- [插件](https://github.com/Hufe921/canvas-editor-plugin)

## 待开发

- 计算性能
- 控件规则
- 表格分页
- vue、react 等框架开箱即用版

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

# 开发调试工具

Canvas Editor DevTools 是一个浏览器扩展插件，用于调试和分析 Canvas Editor 实例。

::: tip
插件仓库地址：https://github.com/Hufe921/canvas-editor-devtools
:::

## 安装方式

### 开发模式安装

1. 克隆或下载插件仓库代码
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 开启右上角的「开发者模式」
4. 点击「加载已解压的扩展程序」按钮
5. 选择插件项目文件夹

## 主要功能

### 元素树检查器

- 实时查看 Canvas Editor 文档结构
- 支持主内容区、页眉、页脚分区展示
- 点击元素查看详细的样式和属性信息
- 快速定位文档中的特定元素

### 事件监控器

实时监控以下类型的事件：

- 内容变化事件
- 选区样式变化事件
- 页面事件
- 控件事件
- 图片事件
- 鼠标事件

支持按事件类别筛选，自动滚动查看最新日志。

### 配置面板

- 查看当前编辑器配置
- 修改外观、水印、页码等设置
- 调整表格样式、控件样式
- 配置光标相关选项

## 使用方法

1. 打开使用 Canvas Editor 的网页
2. 确保页面已将编辑器实例暴露到 `window.__CANVAS_EDITOR_INSTANCE__`
3. 按 F12 或右键选择「检查」打开开发者工具
4. 找到并点击「Canvas Editor」标签页

::: tip
编辑器实例可以通过以下方式暴露：

```javascript
// 将编辑器实例挂载到 window 对象
window.__CANVAS_EDITOR_INSTANCE__ = editor
```
:::

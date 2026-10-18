# 自定义插件

> 此处链接指向上游外部插件；它们并非本 fork 维护的插件，需验证异步初始化、字体与 API 兼容性。

::: tip
上游维护的插件文档（需验证兼容性）：https://hufe.club/canvas-editor-plugin
:::

## 开发插件

```javascript
export function myPlugin(editor: Editor, options?: Option) {
  // 1. 修改方法，详见：src/plugins/copy
  editor.command.updateFunction = () => {}

  // 2. 增加方法，详见：src/plugins/markdown
  editor.command.addFunction = () => {}

  // 3. 事件监听、快捷键、右键菜单、重写方法等组合处理
}
```

## 使用插件

```javascript
instance.use(myPlugin, options?: Option)
```

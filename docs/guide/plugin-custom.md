# 自定义插件

::: tip
官方维护插件仓库：https://github.com/Hufe921/canvas-editor-plugin
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

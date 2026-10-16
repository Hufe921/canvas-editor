# Custom Plugin

::: tip
Official plugin documentation: https://hufe.club/canvas-editor-plugin
:::

## Write a Plugin

```javascript
export function myPlugin(editor: Editor, options?: Option) {
  // 1. update，see more：src/plugins/copy
  editor.command.updateFunction = () => {}

  // 2. add，see more：src/plugins/markdown
  editor.command.addFunction = () => {}

  // 3. listener, eventbus, shortcut, contextmenu, override...
}
```

## Use Plugin

```javascript
instance.use(myPlugin, options?: Option)
```

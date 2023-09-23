# Custom Plugin

::: tip
1. Currently, only methods can be added and modified to the editor instance, and more functions will be extended in the future
2. Official maintenance plugin: https://github.com/Hufe921/canvas-editor-plugin
:::

## Write a Plugin

```javascript
export function myPlugin(editor: Editor, options?: Option) {
  // 1. update，see more：src/plugins/copy
  editor.command.updateFunction = () => {}

  // 2. add，see more：src/plugins/markdown
  editor.command.addFunction = () => {}
}
```

## Use Plugin

```javascript
instance.add(myPlugin, options?: Option)
```

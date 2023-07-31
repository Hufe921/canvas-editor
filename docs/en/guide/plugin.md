# Custom Plugin

::: warning
Currently, only methods can be added and modified to the editor instance, and more functions will be extended in the future
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

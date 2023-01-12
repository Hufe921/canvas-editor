# 自定义右键菜单

## 使用方式

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)
instance.register.contextMenuList([
    {
      isDivider?: boolean;
      icon?: string;
      name?: string;
      shortCut?: string;
      when?: (payload: IContextMenuContext) => boolean;
      callback?: (command: Command, context: IContextMenuContext) => any;
      childMenus?: IRegisterContextMenu[];
    }
  ])
```
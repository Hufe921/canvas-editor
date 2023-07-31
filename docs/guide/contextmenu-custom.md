# 自定义右键菜单

## 使用方式

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)
instance.register.contextMenuList([
    {
      isDivider?: boolean;
      icon?: string;
      name?: string; // 使用%s代表选区文本。示例：搜索：%s
      shortCut?: string;
      when?: (payload: IContextMenuContext) => boolean;
      callback?: (command: Command, context: IContextMenuContext) => any;
      childMenus?: IRegisterContextMenu[];
    }
  ])
```

# 自定义右键菜单

## 使用方式

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)
instance.register.contextMenuList([
    {
      key?: string;
      isDivider?: boolean;
      icon?: string;
      name?: string; // 使用%s代表选区文本。示例：搜索：%s
      shortCut?: string;
      disable?: boolean;
      when?: (payload: IContextMenuContext) => boolean;
      callback?: (command: Command, context: IContextMenuContext) => any;
      childMenus?: IRegisterContextMenu[];
    }
  ])
```

## getContextMenuList

功能：获取注册的右键菜单列表

用法：

```javascript
const contextMenuList = await instance.register.getContextMenuList()
```

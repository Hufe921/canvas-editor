# Customize Contextmenu

## How to Use

```javascript
import Editor from "@herberthe/canvas-editor"

const instance = await Editor.create(container, data, options)
instance.register.contextMenuList([
    {
      key?: string;
      isDivider?: boolean;
      icon?: string;
      name?: string; // Use %s for selection text. Example: Search: %s
      shortCut?: string;
      disable?: boolean;
      when?: (payload: IContextMenuContext) => boolean;
      callback?: (command: Command, context: IContextMenuContext) => any;
      childMenus?: IRegisterContextMenu[];
    }
  ])
```

## getContextMenuList

Feature: Get context menu list

Usage:

```javascript
const contextMenuList = await instance.register.getContextMenuList()
```

Remark:

```javascript
// Example of modifying internal contextmenu
contextmenuList.forEach(menu => {
  // Find the menu item through the menu key and modify its properties
  if (menu.key === INTERNAL_CONTEXT_MENU_KEY.GLOBAL.PASTE) {
    menu.when = () => false
  }
})
```

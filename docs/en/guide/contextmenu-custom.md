# Customize Contextmenu

## How to Use

```javascript
import Editor from "@hufe921/canvas-editor"

const instance = new Editor(container, <IElement[]>data, options)
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

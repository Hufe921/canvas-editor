# 通用 API

## splitText

功能：拆分字符

用法：

```javascript
import { splitText } from '@hufe921/canvas-editor'

splitText(text: string): string[]
```

## createDomFromElementList

功能：根据 elementList 创建 dom 树

用法：

```javascript
import { createDomFromElementList } from '@hufe921/canvas-editor'

createDomFromElementList(elementList: IElement[], options?: IEditorOption): HTMLDivElement
```

## getElementListByHTML

功能：根据 HTML 创建 elementList

用法：

```javascript
import { getElementListByHTML } from '@hufe921/canvas-editor'

getElementListByHTML(htmlText: string, options: IGetElementListByHTMLOption): IElement[]
```

## getTextFromElementList

功能：根据 elementList 创建文本

用法：

```javascript
import { getTextFromElementList } from '@hufe921/canvas-editor'

getTextFromElementList(elementList: IElement[]): string
```

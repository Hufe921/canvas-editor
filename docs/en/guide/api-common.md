# Common API

## splitText

Feature: split text

Usage：

```javascript
import { splitText } from '@herberthe/canvas-editor'

splitText(text: string): string[]
```

## createDomFromElementList

Feature: Create a DOM tree based on the elementList

Usage：

```javascript
import { createDomFromElementList } from '@herberthe/canvas-editor'

createDomFromElementList(elementList: IElement[], options?: IEditorOption): HTMLDivElement
```

## getElementListByHTML

Feature: Create an elementList based on HTML

Usage：

```javascript
import { getElementListByHTML } from '@herberthe/canvas-editor'

getElementListByHTML(htmlText: string, options: IGetElementListByHTMLOption): IElement[]
```

## getTextFromElementList

Feature: Create text based on elementList

Usage：

```javascript
import { getTextFromElementList } from '@herberthe/canvas-editor'

getTextFromElementList(elementList: IElement[]): string
```

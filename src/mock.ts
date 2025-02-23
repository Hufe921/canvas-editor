import { ElementType, IEditorOption, IElement } from './editor'

// 模拟颜色字

// 模拟高亮字

const elementList: IElement[] = []

// elementList.push({
//   type: ElementType.TABLE,
//   value: '',
//   height: 42,
//   width: 554,
//   colgroup: [
//     { width: 138.5 },
//     { width: 138.5 },
//     { width: 138.5 },
//     { width: 138.5 }
//   ],
//   trList: [
//     {
//       height: 42,
//       minHeight: 42,
//       tdList: [
//         { colspan: 1, rowspan: 1, value: [{ value: '1' }] },
//         { colspan: 1, rowspan: 1, value: [{ value: '2' }] },
//         { colspan: 1, rowspan: 1, value: [{ value: '3' }] },
//         { colspan: 1, rowspan: 1, value: [{ value: '4' }] }
//       ]
//     }
//   ]
// })

elementList.push({
  type: ElementType.PARAGRAPH,
  value: '',
  id: 'para1',
  r: [
    // {
    //   value: 'This is the first part of the paragraph.',
    //   size: 16,
    //   id: '1'
    // },
    // { value: 'And this is the second part.', size: 16, bold: true, id: '1' },
    {
      value:
        'computePageRowPositioncomputePageRowPositioncomputePageRowPosition',
      size: 18,
      id: '1'
    }
  ]
})
elementList.push({
  type: ElementType.PARAGRAPH,
  value: '',
  id: 'para2',
  v: [],
  r: [
    // {
    //   value: 'This is the first part of the paragraph.',
    //   size: 16,
    //   id: '2'
    // },
    // { value: 'And this is the second part.', size: 20, bold: true, id: '2' }
    { value: '2', size: 20, bold: true, id: '2' }
  ]
})
export const data: IElement[] = elementList

interface IComment {
  id: string
  content: string
  userName: string
  rangeText: string
  createdDate: string
}
export const commentList: IComment[] = [
  {
    id: '1',
    content:
      '红细胞比容（HCT）是指每单位容积中红细胞所占全血容积的比值，用于反映红细胞和血浆的比例。',
    userName: 'Hufe',
    rangeText: '血细胞比容',
    createdDate: '2023-08-20 23:10:55'
  }
]

export const options: IEditorOption = {
  margins: [100, 120, 100, 120],
  watermark: {
    data: 'CANVAS-EDITOR',
    size: 120
  },
  pageNumber: {
    format: '第{pageNo}页/共{pageCount}页'
  },
  placeholder: {
    data: '请输入正文'
  },
  zone: {
    tipDisabled: false
  },
  maskMargin: [60, 0, 30, 0] // 菜单栏高度60，底部工具栏30为遮盖层
}

import { describe, expect, it } from 'vitest'
import { DisplayList } from '@/editor/core/render/model/DisplayList'

describe('DisplayList', () => {
  it('按调用顺序记录样式和绘制指令', () => {
    const displayList = new DisplayList()

    displayList.fillStyle = '#ff0000'
    displayList.fillRect(1, 2, 3, 4)

    expect(displayList.getOperations()).toEqual([
      {
        type: 'set',
        property: 'fillStyle',
        value: '#ff0000'
      },
      {
        type: 'fillRect',
        args: [1, 2, 3, 4]
      }
    ])
  })

  it('恢复状态栈供后续绘制读取', () => {
    const displayList = new DisplayList()
    displayList.lineWidth = 2
    displayList.save()
    displayList.lineWidth = 6

    displayList.restore()

    expect(displayList.lineWidth).toBe(2)
    expect(displayList.getOperations().map(operation => operation.type)).toEqual(
      ['set', 'save', 'set', 'restore']
    )
  })

  it('记录现有图元使用的样式和路径能力', () => {
    const displayList = new DisplayList()

    displayList.font = '16px sans-serif'
    displayList.strokeStyle = '#000000'
    displayList.globalAlpha = 0.5
    displayList.textAlign = 'center'
    displayList.lineCap = 'round'
    displayList.lineJoin = 'round'
    displayList.setLineDash([2, 4])
    displayList.arc(1, 2, 3, 0, Math.PI)
    displayList.quadraticCurveTo(1, 2, 3, 4)
    displayList.bezierCurveTo(1, 2, 3, 4, 5, 6)
    displayList.rect(1, 2, 3, 4)
    displayList.closePath()
    displayList.fill()
    displayList.strokeRect(1, 2, 3, 4)
    displayList.scale(2, 2)
    displayList.rotate(0.5)

    expect(displayList.getOperations().map(operation => operation.type)).toEqual(
      [
        'set',
        'set',
        'set',
        'set',
        'set',
        'set',
        'setLineDash',
        'arc',
        'quadraticCurveTo',
        'bezierCurveTo',
        'rect',
        'closePath',
        'fill',
        'strokeRect',
        'scale',
        'rotate'
      ]
    )
    expect(displayList.getLineDash()).toEqual([2, 4])
  })

  it('记录图片裁切参数', () => {
    const displayList = new DisplayList()
    const image = new Image()

    displayList.drawImage(image, 1, 2, 3, 4, 5, 6, 7, 8)

    expect(displayList.getOperations()).toEqual([
      {
        type: 'drawImage',
        args: [image, 1, 2, 3, 4, 5, 6, 7, 8]
      }
    ])
  })

  it('记录路径、裁剪和文本所需的参数', () => {
    const displayList = new DisplayList()

    displayList.beginPath()
    displayList.moveTo(1, 2)
    displayList.lineTo(3, 4)
    displayList.clip()
    displayList.fillText('text', 5, 6)

    expect(displayList.getOperations().slice(-2)).toEqual([
      { type: 'clip', args: [] },
      { type: 'fillText', args: ['text', 5, 6] }
    ])
  })
})

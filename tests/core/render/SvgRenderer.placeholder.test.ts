import { describe, expect, it } from 'vitest'
import { BackendType } from '@/editor/dataset/enum/Editor'
import { Draw } from '@/editor/core/draw/Draw'
import { EventBus } from '@/editor/core/event/eventbus/EventBus'
import { Listener } from '@/editor/core/listener/Listener'
import { Override } from '@/editor/core/override/Override'
import { mergeOption } from '@/editor/utils/option'

describe('SvgRenderer placeholder', () => {
  it('空文档正文与占位符立即渲染不会产生重复选区 key', () => {
    const container = document.createElement('div')
    document.body.append(container)
    const draw = new Draw(
      container,
      mergeOption({ backend: BackendType.SVG }),
      {
        header: [{ value: '\n' }],
        main: [{ value: '\n' }],
        footer: [{ value: '\n' }]
      },
      new Listener(),
      new EventBus(),
      new Override()
    )

    expect(() => {
      draw.render({ isLazy: false, isSubmitHistory: false })
    }).not.toThrow()
    draw.destroy()
    container.remove()
  })
})

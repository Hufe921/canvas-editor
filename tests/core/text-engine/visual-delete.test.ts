import { describe, expect, it, vi } from 'vitest'
import { getVisualDeleteTarget } from '@/editor/core/event/handlers/keydown/visualDelete'
import { DeleteMovement, TextDirection } from '@/editor/dataset/enum/TextDirection'

function createHost(
  isRtl: boolean,
  visualNeighbor: (index: number, delta: 1 | -1) => number | null
): any {
  const elements = [
    { value: '\u200b' },
    { value: 'A' },
    { value: 'B', direction: isRtl ? TextDirection.RTL : TextDirection.LTR },
    { value: 'C' }
  ]
  const draw = {
    getOptions: () => ({ deleteMovement: DeleteMovement.VISUAL }),
    getElementList: () => elements,
    getPosition: () => ({
      getCursorPosition: () => ({ index: 2, bidiLevel: isRtl ? 1 : 0 }),
      getPositionContext: () => ({ isTable: false })
    }),
    getOriginalRowList: () => [
      { direction: isRtl ? TextDirection.RTL : TextDirection.LTR, elementList: [] }
    ],
    getLayoutHostAdapter: () => ({
      isReady: () => true,
      visualNeighbor: vi.fn(visualNeighbor)
    }),
    getZone: () => ({ getZone: () => 'main' })
  }
  return { getDraw: () => draw }
}

describe('visual adjacent delete mode', () => {
  it('deletes the visual-left RTL neighbor on Backspace', () => {
    const host = createHost(true, () => 3)

    expect(getVisualDeleteTarget(host, 2, true)).toEqual({
      index: 3,
      cursorIndex: 2
    })
  })

  it('deletes the visual-right RTL neighbor on Delete', () => {
    const host = createHost(true, () => 1)

    expect(getVisualDeleteTarget(host, 2, false)).toEqual({
      index: 2,
      cursorIndex: 1
    })
  })

  it('keeps logical targets when logical deletion is configured', () => {
    const host = createHost(true, () => 3)
    host.getDraw().getOptions = () => ({
      deleteMovement: DeleteMovement.LOGICAL
    })

    expect(getVisualDeleteTarget(host, 2, true)).toBeNull()
  })
})

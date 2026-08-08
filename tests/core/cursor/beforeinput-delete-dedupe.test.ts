import { describe, expect, it, vi } from 'vitest'
import { CursorAgent } from '../../../src/editor/core/cursor/CursorAgent'

describe('DEFER-021 beforeinput delete dedupe', () => {
  it('does not synthesize a second Backspace when keydown already handled delete', () => {
    const keydown = vi.fn()
    const draw = {
      getContainer: () => document.body,
      getEventBus: () => ({
        isSubscribe: () => false,
        emit: () => undefined,
        on: () => undefined,
        off: () => undefined
      })
    } as any
    const canvasEvent = {
      isComposing: false,
      keydown,
      input: vi.fn(),
      compositionstart: vi.fn(),
      compositionend: vi.fn()
    } as any

    const agent = new CursorAgent(draw, canvasEvent)
    const dom = agent.getAgentCursorDom()

    dom.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Backspace',
        bubbles: true,
        cancelable: true
      })
    )
    expect(keydown).toHaveBeenCalledTimes(1)

    const beforeInput = new InputEvent('beforeinput', {
      inputType: 'deleteContentBackward',
      bubbles: true,
      cancelable: true
    })
    const prevented = !dom.dispatchEvent(beforeInput)
    // beforeinput 被拦截且不得再合成一次 keydown 删除
    expect(prevented || beforeInput.defaultPrevented).toBe(true)
    expect(keydown).toHaveBeenCalledTimes(1)

    dom.remove()
  })
})

import { describe, it, expect, vi } from 'vitest'
import { Accessibility } from '@/editor/core/accessibility/Accessibility'

function createMockDraw(options: { disabled: boolean }) {
  const container = document.createElement('div')
  const eventBus = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn()
  }
  const rangeManager = {
    toString: vi.fn()
  }
  const i18n = {
    t: vi.fn((key: string) => {
      if (key === 'accessibility.selected') return '选中：'
      if (key === 'accessibility.input') return '输入：'
      return key
    })
  }
  return {
    getOptions: () => ({ accessibility: { disabled: options.disabled } }),
    getContainer: () => container,
    getEventBus: () => eventBus,
    getRange: () => rangeManager,
    getI18n: () => i18n,
    _container: container,
    _eventBus: eventBus,
    _rangeManager: rangeManager
  } as any
}

describe('Accessibility', () => {
  describe('初始化', () => {
    it('disabled: true 时不创建 aria-live DOM，不注册事件', () => {
      const draw = createMockDraw({ disabled: true })
      const a11y = new Accessibility(draw)
      expect(draw._container.querySelector('[aria-live]')).toBeNull()
      expect(draw._eventBus.on).not.toHaveBeenCalled()
      a11y.destroy()
    })

    it('disabled: false 时创建 aria-live DOM，注册 rangeChange 事件', () => {
      const draw = createMockDraw({ disabled: false })
      const a11y = new Accessibility(draw)
      const liveDom = draw._container.querySelector('[aria-live="assertive"]')
      expect(liveDom).not.toBeNull()
      expect(liveDom?.getAttribute('aria-atomic')).toBe('true')
      expect(draw._eventBus.on).toHaveBeenCalledWith('rangeChange', expect.any(Function))
      a11y.destroy()
    })
  })

  describe('selection', () => {
    it('播报选区文本', () => {
      const draw = createMockDraw({ disabled: false })
      const a11y = new Accessibility(draw)
      draw._rangeManager.toString.mockReturnValue('hello world')
      a11y.selection()
      const liveDom = draw._container.querySelector('[aria-live="assertive"]') as HTMLDivElement
      expect(liveDom.textContent).toBe('选中：hello world')
      a11y.destroy()
    })

    it('选区为空时不播报', () => {
      const draw = createMockDraw({ disabled: false })
      const a11y = new Accessibility(draw)
      draw._rangeManager.toString.mockReturnValue('   ')
      a11y.selection()
      const liveDom = draw._container.querySelector('[aria-live="assertive"]') as HTMLDivElement
      expect(liveDom.textContent).toBe('')
      a11y.destroy()
    })

    it('disabled: true 时不执行', () => {
      const draw = createMockDraw({ disabled: true })
      const a11y = new Accessibility(draw)
      a11y.selection()
      expect(draw._rangeManager.toString).not.toHaveBeenCalled()
      a11y.destroy()
    })
  })

  describe('input', () => {
    it('播报输入内容', () => {
      const draw = createMockDraw({ disabled: false })
      const a11y = new Accessibility(draw)
      a11y.input('abc')
      const liveDom = draw._container.querySelector('[aria-live="assertive"]') as HTMLDivElement
      expect(liveDom.textContent).toBe('输入：abc')
      a11y.destroy()
    })

    it('过滤零宽空格和换行符', () => {
      const draw = createMockDraw({ disabled: false })
      const a11y = new Accessibility(draw)
      a11y.input('a​b\nc')
      const liveDom = draw._container.querySelector('[aria-live="assertive"]') as HTMLDivElement
      expect(liveDom.textContent).toBe('输入：abc')
      a11y.destroy()
    })

    it('纯空白内容不播报', () => {
      const draw = createMockDraw({ disabled: false })
      const a11y = new Accessibility(draw)
      a11y.input('   ')
      const liveDom = draw._container.querySelector('[aria-live="assertive"]') as HTMLDivElement
      expect(liveDom.textContent).toBe('')
      a11y.destroy()
    })

    it('disabled: true 时不执行', () => {
      const draw = createMockDraw({ disabled: true })
      const a11y = new Accessibility(draw)
      a11y.input('abc')
      expect(draw._container.querySelector('[aria-live]')).toBeNull()
      a11y.destroy()
    })
  })

  describe('assertive', () => {
    it('设置 aria-live 元素的 textContent', () => {
      const draw = createMockDraw({ disabled: false })
      const a11y = new Accessibility(draw)
      a11y.assertive('测试消息')
      const liveDom = draw._container.querySelector('[aria-live="assertive"]') as HTMLDivElement
      expect(liveDom.textContent).toBe('测试消息')
      a11y.destroy()
    })

    it('disabled: true 时不执行', () => {
      const draw = createMockDraw({ disabled: true })
      const a11y = new Accessibility(draw)
      a11y.assertive('测试消息')
      expect(draw._container.querySelector('[aria-live]')).toBeNull()
      a11y.destroy()
    })
  })

  describe('rangeChange 事件', () => {
    it('startIndex !== endIndex 时触发 selection', () => {
      const draw = createMockDraw({ disabled: false })
      const a11y = new Accessibility(draw)
      draw._rangeManager.toString.mockReturnValue('hello')
      const handler = draw._eventBus.on.mock.calls.find(
        (call: any) => call[0] === 'rangeChange'
      )[1]
      handler({ startIndex: 0, endIndex: 5 })
      const liveDom = draw._container.querySelector('[aria-live="assertive"]') as HTMLDivElement
      expect(liveDom.textContent).toBe('选中：hello')
      a11y.destroy()
    })

    it('startIndex === endIndex 时不触发 selection', () => {
      const draw = createMockDraw({ disabled: false })
      const a11y = new Accessibility(draw)
      const spy = vi.spyOn(a11y, 'selection')
      const handler = draw._eventBus.on.mock.calls.find(
        (call: any) => call[0] === 'rangeChange'
      )[1]
      handler({ startIndex: 3, endIndex: 3 })
      expect(spy).not.toHaveBeenCalled()
      a11y.destroy()
    })
  })

  describe('destroy', () => {
    it('移除 DOM 并取消事件订阅', () => {
      const draw = createMockDraw({ disabled: false })
      const a11y = new Accessibility(draw)
      expect(draw._container.querySelector('[aria-live]')).not.toBeNull()
      a11y.destroy()
      expect(draw._container.querySelector('[aria-live]')).toBeNull()
      expect(draw._eventBus.off).toHaveBeenCalledWith('rangeChange', expect.any(Function))
    })

    it('disabled: true 时安全退出', () => {
      const draw = createMockDraw({ disabled: true })
      const a11y = new Accessibility(draw)
      expect(() => a11y.destroy()).not.toThrow()
    })
  })
})

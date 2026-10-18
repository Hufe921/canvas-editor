import 'vitest-canvas-mock'
import { afterEach, beforeEach, vi } from 'vitest'

// jsdom 缺失补齐
class StubResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
class StubIntersectionObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): unknown[] {
    return []
  }
  root: Element | null = null
  rootMargin = ''
  thresholds: ReadonlyArray<number> = []
}
;(globalThis as any).ResizeObserver ??= StubResizeObserver
;(globalThis as any).IntersectionObserver ??= StubIntersectionObserver
;(Element.prototype as any).scrollIntoView ??= () => {}
;(Element.prototype as any).scroll ??= () => {}
;(window as any).matchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false
})

// 同步 Worker 替身: 仅满足 new Worker(url) 不抛错
class StubWorker {
  onmessage: ((this: Worker, ev: MessageEvent) => any) | null = null
  onerror: ((this: AbstractWorker, ev: ErrorEvent) => any) | null = null
  postMessage(): void {}
  terminate(): void {}
  addEventListener(): void {}
  removeEventListener(): void {}
  dispatchEvent(): boolean {
    return false
  }
}
;(globalThis as any).Worker ??= StubWorker

// 防止 fakeTimers 泄漏
afterEach(() => {
  vi.useRealTimers()
})

// A regression must fail if native layout silently reaches browser text APIs.
beforeEach(() => {
  // HTTP behavior belongs to explicit fetch mocks; unit tests stay offline.
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(
    new Error('Unit-test network disabled: provide a local fixture/fetch mock')
  )
  for (const method of ['measureText', 'fillText', 'strokeText'] as const)
    vi.spyOn(CanvasRenderingContext2D.prototype, method).mockImplementation(
      () => {
        throw new Error(`Browser text API reached: ${method}`)
      }
    )
})

import 'vitest-canvas-mock'
import { afterEach, vi } from 'vitest'

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
  takeRecords(): unknown[] { return [] }
  root: Element | null = null
  rootMargin = ''
  thresholds: ReadonlyArray<number> = []
}
;(globalThis as any).ResizeObserver ??= StubResizeObserver
;(globalThis as any).IntersectionObserver ??= StubIntersectionObserver

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
  dispatchEvent(): boolean { return false }
}
;(globalThis as any).Worker ??= StubWorker

// 防止 fakeTimers 泄漏
afterEach(() => {
  vi.useRealTimers()
})

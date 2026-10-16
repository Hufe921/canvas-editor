import { LayoutResult } from '../types'

export class LayoutCache {
  private cache = new Map<string, LayoutResult>()

  get(key: string): LayoutResult | undefined {
    return this.cache.get(key)
  }

  set(key: string, value: LayoutResult) {
    this.cache.set(key, value)
  }

  invalidate(prefix?: string) {
    if (!prefix) {
      this.cache.clear()
      return
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) this.cache.delete(key)
    }
  }
}

export interface MockCallEntry {
  type: string
  props: Record<string, unknown>
}

export function getCanvasCalls(canvas: HTMLCanvasElement): MockCallEntry[] {
  const ctx = canvas.getContext('2d') as any
  return (ctx?.__getEvents?.() as MockCallEntry[]) ?? []
}

export function callsOf(canvas: HTMLCanvasElement, type: string): MockCallEntry[] {
  return getCanvasCalls(canvas).filter(e => e.type === type)
}

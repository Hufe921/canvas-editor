import { describe, it, expect } from 'vitest'
import { Listener } from '../../../src/editor/core/listener/Listener'

describe('Listener', () => {
  it('初始化所有回调属性为 null', () => {
    const listener = new Listener()
    expect(listener.rangeStyleChange).toBeNull()
    expect(listener.visiblePageNoListChange).toBeNull()
    expect(listener.intersectionPageNoChange).toBeNull()
    expect(listener.pageSizeChange).toBeNull()
    expect(listener.pageScaleChange).toBeNull()
    expect(listener.saved).toBeNull()
    expect(listener.contentChange).toBeNull()
    expect(listener.controlChange).toBeNull()
    expect(listener.controlContentChange).toBeNull()
    expect(listener.pageModeChange).toBeNull()
    expect(listener.zoneChange).toBeNull()
  })
})

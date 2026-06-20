import { describe, it, expect } from 'vitest'
import { Zone } from '@/editor/core/zone/Zone'
import { EditorZone } from '@/editor/dataset/enum/Editor'
import { Header } from '@/editor/core/draw/frame/Header'
import { Footer } from '@/editor/core/draw/frame/Footer'
import { mergeOption } from '@/editor/utils/option'
import { IEditorOption } from '@/editor/interface/Editor'

function createMockDraw(optionOverrides: Partial<IEditorOption> = {}) {
  const options = mergeOption({
    zone: { tipDisabled: true },
    ...optionOverrides
  })
  const draw: any = {
    getOptions: () => options,
    getPosition: () => ({}),
    getZone: () => null,
    getHeight: () => 1123,
    getPageNo: () => 0,
    getMargins: () => [100, 120, 100, 120] as [number, number, number, number],
    getInnerWidth: () => 554,
    getPageGap: () => 20,
    getContainer: () => document.createElement('div'),
    getI18n: () => ({ t: (k: string) => k }),
    getRange: () => ({ clearRange: () => {} }),
    render: () => {},
    getListener: () => ({}),
    getEventBus: () => ({ isSubscribe: () => false }),
    getPageList: () => [] as HTMLCanvasElement[]
  }
  draw.getHeader = () => new Header(draw)
  draw.getFooter = () => new Footer(draw)
  const zone = new Zone(draw)
  return { draw, zone }
}

describe('Zone', () => {
  it('禁用页 getZoneByY 不返回页眉/页脚区域', () => {
    const { zone } = createMockDraw({
      header: { disabledPages: [0] },
      footer: { disabledPages: [0] }
    })

    expect(zone.getZoneByY(10, 0)).toBe(EditorZone.MAIN)
    expect(zone.getZoneByY(1100, 0)).toBe(EditorZone.MAIN)

    expect(zone.getZoneByY(10, 1)).toBe(EditorZone.HEADER)
    expect(zone.getZoneByY(1100, 1)).toBe(EditorZone.FOOTER)
  })

  it('setZone 在禁用页拒绝切换到页眉', () => {
    const { zone } = createMockDraw({
      header: { disabledPages: [0] }
    })

    expect(zone.getZone()).toBe(EditorZone.MAIN)
    zone.setZone(EditorZone.HEADER)
    expect(zone.getZone()).toBe(EditorZone.MAIN)
  })

  it('setZone 在非禁用页允许切换到页眉', () => {
    const { zone } = createMockDraw({
      header: { disabledPages: [1] }
    })

    zone.setZone(EditorZone.HEADER)
    expect(zone.getZone()).toBe(EditorZone.HEADER)
  })
})

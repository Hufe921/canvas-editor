import { describe, expect, it } from 'vitest'
import {
  ControlComponent,
  ControlType,
  ElementType
} from '../../../src/editor'
import { Control } from '../../../src/editor/core/draw/control/Control'
import type { IElement } from '../../../src/editor/interface/Element'

describe('empty TEXT control click into edit', () => {
  it('POSTFIX click with only placeholder snaps to PREFIX', () => {
    const controlMeta = {
      type: ControlType.TEXT,
      value: null,
      placeholder: '干预建议',
      prefix: '{',
      postfix: '}'
    }
    const elementList: IElement[] = [
      { value: '\u200B' },
      {
        value: '{',
        type: ElementType.CONTROL,
        controlId: 'tip',
        control: controlMeta,
        controlComponent: ControlComponent.PREFIX
      },
      {
        value: '干',
        type: ElementType.CONTROL,
        controlId: 'tip',
        control: controlMeta,
        controlComponent: ControlComponent.PLACEHOLDER
      },
      {
        value: '预',
        type: ElementType.CONTROL,
        controlId: 'tip',
        control: controlMeta,
        controlComponent: ControlComponent.PLACEHOLDER
      },
      {
        value: '建',
        type: ElementType.CONTROL,
        controlId: 'tip',
        control: controlMeta,
        controlComponent: ControlComponent.PLACEHOLDER
      },
      {
        value: '议',
        type: ElementType.CONTROL,
        controlId: 'tip',
        control: controlMeta,
        controlComponent: ControlComponent.PLACEHOLDER
      },
      {
        value: '}',
        type: ElementType.CONTROL,
        controlId: 'tip',
        control: controlMeta,
        controlComponent: ControlComponent.POSTFIX
      }
    ]
    const control = new Control({
      getOptions: () => ({ scale: 1, control: {} }),
      getRange: () => ({}),
      getListener: () => ({}),
      getEventBus: () => ({}),
      getOriginalElementList: () => elementList,
      getElementList: () => elementList,
      getTraceParticle: () => ({
        isTraceHidden: () => false
      }),
      isDesignMode: () => false
    } as any)

    const { newIndex, newElement } = control.moveCursor({
      index: 6
    })
    expect(newElement.controlComponent).toBe(ControlComponent.PREFIX)
    expect(newIndex).toBe(1)
  })
})
